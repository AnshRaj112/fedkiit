import { ImageResponse } from "next/og";

import { SITE } from "@/lib/site";

/**
 * Default social card, generated at the edge.
 *
 * The old site had no OG image, so every link shared to WhatsApp, LinkedIn or
 * Slack rendered as a bare text preview. Uses the brand gradient from design.md.
 */

export const alt = `${SITE.name} — ${SITE.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#1c1c1c",
          padding: "72px",
          position: "relative",
        }}
      >
        {/* Ambient brand glow, mirroring the hero treatment. */}
        <div
          style={{
            position: "absolute",
            width: 620,
            height: 620,
            borderRadius: 9999,
            background:
              "radial-gradient(circle, rgba(255,138,0,0.30) 0%, rgba(244,43,3,0.05) 70%)",
            top: 180,
            left: -180,
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 68,
              height: 68,
              borderRadius: 9999,
              background: "linear-gradient(260deg, #ffbe0b, #f42b03)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 34,
              fontWeight: 800,
              color: "#1c1c1c",
            }}
          >
            F
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 34, fontWeight: 700, color: "#ffffff" }}>
              FED KIIT
            </span>
            <span style={{ fontSize: 19, color: "#afafaf", marginTop: 2 }}>
              Federation of Entrepreneurship Development
            </span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <span
            style={{
              fontSize: 62,
              fontWeight: 800,
              color: "#ffffff",
              lineHeight: 1.1,
              letterSpacing: -1.5,
            }}
          >
            Nurturing Innovation
          </span>
          <span
            style={{
              fontSize: 62,
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: -1.5,
              // `background-clip: text` is unsupported in Satori, so the accent
              // line uses a flat brand colour instead of the gradient.
              color: "#ff8a00",
            }}
          >
            & Entrepreneurship
          </span>
          <span
            style={{
              fontSize: 25,
              color: "#cccccc",
              marginTop: 26,
              maxWidth: 900,
            }}
          >
            The student entrepreneurship body of KIIT TBI, Bhubaneswar
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: 22, color: "#afafaf" }}>fedkiit.com</span>
          <div
            style={{
              width: 210,
              height: 6,
              borderRadius: 9999,
              background: "linear-gradient(260deg, #ffbe0b, #f42b03)",
            }}
          />
        </div>
      </div>
    ),
    size,
  );
}
