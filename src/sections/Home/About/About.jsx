"use client";

import { useEffect, useRef } from "react";
import styles from "./styles/About.module.scss";

const blocks = [
  {
    key: "why",
    accent: "Why",
    title: "one should join FED?",
    body: "We aim to empower the next generation of entrepreneurs to innovate, lead, and transform the future.",
    image:
      "https://uploads-ssl.webflow.com/663d299655b46de106de40d7/665730072a5e426c487dd8da_Frame%201000001327.svg",
    alt: "Illustration of community and growth",
    reverse: false,
  },
  {
    key: "how",
    accent: "How",
    title: "we stay ahead?",
    body: "Efficient leadership, strategic planning, and sustainable collaborations keep us at the foremost tiers.",
    image:
      "https://uploads-ssl.webflow.com/663d299655b46de106de40d7/6657309f141df2159c9ffd32_vecteezy_3d-masculino-personaje-brazo-cruzado_24387905%202%20(1).svg",
    alt: "Illustration of a confident leader",
    reverse: true,
  },
  {
    key: "what",
    accent: "What",
    title: "we do in FED?",
    body: "We help startups and organize events that promote entrepreneurship and real business opportunities.",
    image:
      "https://uploads-ssl.webflow.com/663d299655b46de106de40d7/66573007b67d2331b166edba_image%20526.svg",
    alt: "Illustration of collaboration and events",
    reverse: false,
  },
];

/*
  Sequential one-at-a-time panel stages.
  Each has: enter rise-in, hold fully visible, exit fly-out upward.
  Panel 2 is the last – it never exits.

  Fractions of total sticky scroll progress (0 → 1):
    0.00 → 0.15  Panel 0 enters from below
    0.15 → 0.32  Panel 0 fully visible
    0.32 → 0.44  Panel 0 exits upward
    0.44 → 0.58  Panel 1 enters from below
    0.58 → 0.73  Panel 1 fully visible
    0.73 → 0.84  Panel 1 exits upward
    0.84 → 0.95  Panel 2 enters from below
    0.95 → 1.00  Panel 2 fully visible (stays)
*/
const STAGES = [
  { enterAt: 0.00, fullAt: 0.15, exitAt: 0.32, goneAt: 0.44 },
  { enterAt: 0.44, fullAt: 0.58, exitAt: 0.73, goneAt: 0.84 },
  { enterAt: 0.84, fullAt: 0.95, exitAt: 1.00, goneAt: 1.00 }, // last – stays
];

function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

function getPanelStyle(stage, progress) {
  const { enterAt, fullAt, exitAt, goneAt } = stage;

  if (progress < enterAt) {
    // Hidden below
    return { opacity: 0, ty: 56, pe: "none" };
  }
  if (progress < fullAt) {
    // Entering from below
    const v = easeOut((progress - enterAt) / (fullAt - enterAt));
    return { opacity: v, ty: (1 - v) * 56, pe: "none" };
  }
  if (progress <= exitAt) {
    // Fully visible
    return { opacity: 1, ty: 0, pe: "auto" };
  }
  if (progress < goneAt) {
    // Exiting upward
    const v = easeOut((progress - exitAt) / (goneAt - exitAt));
    return { opacity: 1 - v, ty: -(v * 48), pe: "none" };
  }
  // Gone (above)
  return { opacity: 0, ty: -48, pe: "none" };
}

export default function About() {
  const outerRef  = useRef(null);
  const innerRef  = useRef(null);
  const panelRefs = useRef([]);
  const rafId     = useRef(null);

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile       = window.innerWidth < 720;

    // ── Static fallback ───────────────────────────────────────────────
    if (prefersReduced || isMobile) {
      inner.style.visibility = "visible";
      panelRefs.current.forEach((p) => {
        if (!p) return;
        p.style.opacity       = "1";
        p.style.transform     = "none";
        p.style.pointerEvents = "auto";
      });
      return;
    }

    // ── Desktop sticky scroll ─────────────────────────────────────────
    // Panels start invisible; heading is always visible naturally
    panelRefs.current.forEach((p) => {
      if (!p) return;
      p.style.opacity       = "0";
      p.style.transform     = "translateY(56px)";
      p.style.pointerEvents = "none";
    });

    const applyPanels = (progress) => {
      panelRefs.current.forEach((p, i) => {
        if (!p) return;
        const { opacity, ty, pe } = getPanelStyle(STAGES[i], progress);
        p.style.opacity       = opacity.toFixed(3);
        p.style.transform     = `translateY(${ty.toFixed(1)}px)`;
        p.style.pointerEvents = pe;
      });
    };

    // Pinning is CSS's job now (`position: sticky` on .stickyInner), so this
    // only measures how far through the section we are and hands that to the
    // panels. No layout is written per frame, only opacity and transform,
    // both of which the compositor can animate without a reflow.
    const tick = () => {
      rafId.current = null;
      const rect   = outer.getBoundingClientRect();
      const vh     = window.innerHeight;
      const travel = outer.offsetHeight - vh;

      const progress =
        travel > 0 ? Math.min(1, Math.max(0, -rect.top / travel)) : 0;

      applyPanels(progress);
    };

    const onEvent = () => {
      if (!rafId.current) rafId.current = requestAnimationFrame(tick);
    };

    window.addEventListener("scroll", onEvent, { passive: true });
    window.addEventListener("resize", onEvent, { passive: true });
    requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("scroll", onEvent);
      window.removeEventListener("resize", onEvent);
      if (rafId.current) cancelAnimationFrame(rafId.current);
      if (inner) {
        inner.style.cssText = "";
      }
    };
  }, []);

  return (
    <div ref={outerRef} className={styles.stickyOuter} aria-label="About Us">
      <div ref={innerRef} className={styles.stickyInner}>
        <div className={styles.innerWrap}>
          <header className={styles.heading}>
            <h2 id="about-heading" className={styles.head}>
              ABOUT <span className={styles.accent}>US</span>
            </h2>
            <div className={styles.bottomLine} aria-hidden="true" />
            <p className={styles.subhead}>
              Who we are, how we lead, and what we build together.
            </p>
          </header>

          <div className={styles.stack}>
            {blocks.map((block, index) => (
              <article
                key={block.key}
                ref={(el) => { panelRefs.current[index] = el; }}
                className={`${styles.row} ${block.reverse ? styles.rowReverse : ""}`}
                aria-labelledby={`about-${block.key}`}
              >
                <div className={styles.media}>
                  <img src={block.image} alt={block.alt} loading="lazy" />
                </div>
                <div className={styles.copy}>
                  <span className={styles.index}>0{index + 1}</span>
                  <h3 id={`about-${block.key}`} className={styles.boxhead}>
                    <span className={styles.accent}>{block.accent}</span>{" "}
                    {block.title}
                  </h3>
                  <p className={styles.body}>{block.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
