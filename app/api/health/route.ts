import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";

/**
 * GET|HEAD /api/health
 *
 * Liveness/readiness probe for uptime monitors and container orchestrators.
 * There was no equivalent in the Express backend — monitors were pointed at
 * `/api/form/getAllForms`, which reads the whole forms collection on every
 * poll and returns 200 even when the database is unreachable but cached.
 *
 *   200  { status: "ok" }        every dependency answered
 *   503  { status: "unhealthy" } at least one did not
 *
 * A monitor only needs the status code; the body is for a human reading it
 * after an alert fires.
 */

// Never prerendered or cached: a health check answering from the build output
// would report "ok" for a process that is not actually serving.
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * A hung TCP connection to Atlas does not reject — it hangs until the driver's
 * own (much longer) timeout. A probe that hangs reads as a timeout to the
 * monitor rather than a clean 503, so the check is bounded here.
 */
const DB_TIMEOUT_MS = 3000;

type CheckResult = {
  status: "ok" | "error";
  latencyMs: number;
  error?: string;
};

async function checkDatabase(): Promise<CheckResult> {
  const startedAt = Date.now();
  let timer: NodeJS.Timeout | undefined;

  try {
    // `ping` is the cheapest command the MongoDB driver exposes: it touches no
    // collection and reads no documents, so polling it every few seconds costs
    // nothing. A `findFirst` against a real collection would also exercise the
    // schema, but it puts load on a production database on every poll.
    await Promise.race([
      prisma.$runCommandRaw({ ping: 1 }),
      new Promise((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`timed out after ${DB_TIMEOUT_MS}ms`)),
          DB_TIMEOUT_MS,
        );
      }),
    ]);

    return { status: "ok", latencyMs: Date.now() - startedAt };
  } catch (error) {
    // The message can carry the connection string, which holds the Atlas
    // password. `/api/health` is unauthenticated, so only the error's class and
    // a fixed message are exposed; the detail goes to the server log.
    console.error("[health] database check failed:", error);

    const message =
      error instanceof Error && error.message.startsWith("timed out")
        ? error.message
        : "unreachable";

    return { status: "error", latencyMs: Date.now() - startedAt, error: message };
  } finally {
    clearTimeout(timer);
  }
}

async function runChecks() {
  const database = await checkDatabase();
  const healthy = database.status === "ok";

  return {
    healthy,
    body: {
      status: healthy ? ("ok" as const) : ("unhealthy" as const),
      timestamp: new Date().toISOString(),
      // Seconds this Node process has been up. On serverless this resets with
      // every cold start and is expected to be small — it is a signal about the
      // instance answering, not about the deployment's age.
      uptime: Math.round(process.uptime()),
      // Set by Vercel; absent elsewhere. A commit SHA is not a secret and makes
      // "which build is actually live" answerable from the probe itself.
      version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
      environment: process.env.NODE_ENV,
      checks: { database },
    },
  };
}

const NO_STORE = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
} as const;

export async function GET() {
  const { healthy, body } = await runChecks();

  return NextResponse.json(body, {
    status: healthy ? 200 : 503,
    headers: NO_STORE,
  });
}

/**
 * Uptime monitors commonly poll with HEAD to avoid transferring a body. Next
 * does not derive HEAD from GET for route handlers, so without this a monitor
 * configured for HEAD gets 405 and reports the site as down.
 */
export async function HEAD() {
  const { healthy } = await runChecks();

  return new Response(null, {
    status: healthy ? 200 : 503,
    headers: NO_STORE,
  });
}
