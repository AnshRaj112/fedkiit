#!/usr/bin/env node
/**
 * Regenerates the Prisma client when, and only when, the schema has changed.
 *
 * Why this exists: the generated client lives in `node_modules/.prisma/client`,
 * which is gitignored, so it never travels with a commit. Pulling a branch that
 * changed `schema.prisma` leaves everyone with a client that does not match it.
 * `@prisma/client` has its own postinstall hook, but npm only fires that during
 * an install — and a schema change on its own does not touch `package.json`, so
 * nobody has a reason to reinstall. The result is a pull that looks fine and
 * then throws `Unknown argument` at runtime, on whichever request happens to
 * touch the new field.
 *
 * So the check runs where it cannot be skipped: `npm run dev`, `build` and
 * `start` all go through `with-env.mjs`, which calls this first.
 *
 * "Only when changed" matters. Generating unconditionally would add seconds to
 * every dev start; hashing one file costs about a millisecond, so the common
 * case — schema untouched — is free.
 *
 * The stamp lives inside the generated client directory on purpose: deleting
 * `node_modules` takes the stamp with it, so a wiped install can never look
 * up to date.
 */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");

const SCHEMA = resolve(root, "prisma", "schema.prisma");
const CLIENT_DIR = resolve(root, "node_modules", ".prisma", "client");
// index.d.ts is what the type checker reads, so its absence is the honest test
// of "no usable client", rather than merely an empty directory.
const CLIENT_MARKER = resolve(CLIENT_DIR, "index.d.ts");
const STAMP = resolve(CLIENT_DIR, ".schema-hash");
const PRISMA_CLI = resolve(root, "node_modules", "prisma", "build", "index.js");

function schemaHash() {
  return createHash("sha256").update(readFileSync(SCHEMA)).digest("hex");
}

function readStamp() {
  try {
    return readFileSync(STAMP, "utf8").trim();
  } catch {
    return null;
  }
}

/**
 * @param {NodeJS.ProcessEnv} env Environment to hand the Prisma CLI. `generate`
 *   does not open a connection, but the schema interpolates env("DATABASE_URL")
 *   and Prisma reads it while parsing.
 * @param {{ optional?: boolean }} [opts] `optional` tolerates a missing CLI
 *   instead of failing. Set from the postinstall hook: `prisma` is a
 *   devDependency, so `npm install --omit=dev` on a deploy host legitimately has
 *   no CLI, and failing there would break the install. Running a dev server
 *   without one is not legitimate, so that path leaves it off.
 * @returns {boolean} true when the client is usable and current.
 */
export function ensurePrismaClient(env = process.env, opts = {}) {
  if (!existsSync(SCHEMA)) {
    console.error(`[prisma] schema not found at ${SCHEMA}`);
    return false;
  }

  if (!existsSync(PRISMA_CLI)) {
    if (opts.optional) {
      console.log("[prisma] CLI not installed (production install) — skipping.");
      return true;
    }
    console.error("[prisma] CLI not installed — run `npm install` first.");
    return false;
  }

  const hash = schemaHash();
  const haveClient = existsSync(CLIENT_MARKER);

  if (haveClient && readStamp() === hash) return true;

  console.log(
    haveClient
      ? "[prisma] schema.prisma changed since the client was generated — regenerating…"
      : "[prisma] no generated client found — generating…",
  );

  const result = spawnSync(process.execPath, [PRISMA_CLI, "generate"], {
    cwd: root,
    env,
    stdio: "inherit",
  });

  if (result.status !== 0) {
    console.error(
      "\n[prisma] `prisma generate` failed.\n" +
        "         If this is EPERM/EBUSY on Windows, a dev server is probably\n" +
        "         still running and holding the query engine — stop it and retry.",
    );
    return false;
  }

  // Written only after a success, so a failed run retries next time instead of
  // marking a client that was never produced as current.
  try {
    writeFileSync(STAMP, hash);
  } catch (error) {
    // A missing stamp only costs a redundant generate next time.
    console.warn(`[prisma] could not write ${STAMP}: ${error.message}`);
  }

  return true;
}

// Also usable on its own: `node scripts/ensure-prisma.mjs [--optional]`.
// The postinstall hook passes --optional; see the note on `opts.optional`.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const optional = process.argv.includes("--optional");
  process.exit(ensurePrismaClient(process.env, { optional }) ? 0 : 1);
}
