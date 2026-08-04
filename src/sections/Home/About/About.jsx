"use client";

import React, { useRef, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import styles from "./styles/About.module.scss";

const ABOUT_PARTS = [
  {
    id: "why",
    keyword: "Why",
    title: "one should join FED?",
    descLine1: "We aim to empower the next generation of entrepreneurs",
    descLine2: "to innovate, lead, and transform the future.",
    img: "https://uploads-ssl.webflow.com/663d299655b46de106de40d7/665730072a5e426c487dd8da_Frame%201000001327.svg",
  },
  {
    id: "how",
    keyword: "How",
    title: "we are still on top?",
    descLine1: "Efficient leaderships, strategic planning and sustainable",
    descLine2: "executive collaborations keeps us at foremost tiers.",
    img: "https://uploads-ssl.webflow.com/663d299655b46de106de40d7/6657309f141df2159c9ffd32_vecteezy_3d-masculino-personaje-brazo-cruzado_24387905%202%20(1).svg",
  },
  {
    id: "what",
    keyword: "What",
    title: "we do in FED?",
    descLine1: "We help startups and organise events to promote",
    descLine2: "entrepreneurships and business opportunities.",
    img: "https://uploads-ssl.webflow.com/663d299655b46de106de40d7/66573007b67d2331b166edba_image%20526.svg",
  },
];

const NAVBAR_H   = 80;   // px — lock when section top hits this
const STEP_DELTA = 320;  // px of wheel delta needed to advance one step

export default function About() {
  const sectionRef = useRef(null);
  const [step, setStep]   = useState(0);
  const [isMobile, setMobile] = useState(false);

  // All mutable engine state in refs (no stale closures)
  const locked   = useRef(false);
  const stepRef  = useRef(0);
  const acc      = useRef(0);
  const cooling  = useRef(false); // true during cooldown after unlock — prevents immediate re-lock
  const done     = useRef(false); // true once user has scrolled past all 3 cards forward

  /* ── Mobile detection ── */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const check = () => setMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check, { passive: true });
    return () => window.removeEventListener("resize", check);
  }, []);

  /* ── Scroll-lock engine ── */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const section = sectionRef.current;
    if (!section) return;

    function startCooldown(ms = 1200) {
      cooling.current = true;
      setTimeout(() => { cooling.current = false; }, ms);
    }

    function tryLock() {
      if (locked.current) return;
      if (cooling.current) return;   // in cooldown — don't re-lock
      if (done.current) return;      // already completed forward — never re-lock

      const rect = section.getBoundingClientRect();
      // Lock when the section's top edge reaches just below the navbar
      if (rect.top <= NAVBAR_H && rect.top > -40) {
        locked.current = true;
        acc.current    = 0;
        stepRef.current = 0;
        setStep(0);
      }
    }

    function unlockBackward() {
      locked.current = false;
      acc.current    = 0;
      startCooldown(1200); // prevent immediate re-lock for 1.2s
    }

    function unlockForward() {
      locked.current = false;
      done.current   = true;
      acc.current    = 0;
      startCooldown(1200);
      // Gently scroll the user just past the section
      window.scrollBy({ top: window.innerHeight * 0.6, behavior: "smooth" });
    }

    function advance(dir) {
      const next = stepRef.current + dir;

      if (next < 0) {
        unlockBackward();
        return;
      }
      if (next >= ABOUT_PARTS.length) {
        unlockForward();
        return;
      }

      stepRef.current = next;
      setStep(next);
    }

    /* ── Wheel ── */
    function onWheel(e) {
      if (!locked.current) {
        tryLock();
        if (!locked.current) return;
      }

      e.preventDefault();

      acc.current += e.deltaY;

      if (acc.current >= STEP_DELTA) {
        acc.current = 0;
        advance(1);
      } else if (acc.current <= -STEP_DELTA) {
        acc.current = 0;
        advance(-1);
      }
    }

    /* ── Keyboard ── */
    function onKeyDown(e) {
      const SCROLL_KEYS = ["ArrowDown", "ArrowUp", "PageDown", "PageUp", " "];
      if (!SCROLL_KEYS.includes(e.key)) return;

      if (!locked.current) {
        tryLock();
        if (!locked.current) return;
      }

      e.preventDefault();
      const dir = ["ArrowDown", "PageDown", " "].includes(e.key) ? 1 : -1;
      acc.current += dir * STEP_DELTA;
      if (acc.current >= STEP_DELTA)  { acc.current = 0; advance(1);  }
      if (acc.current <= -STEP_DELTA) { acc.current = 0; advance(-1); }
    }

    /* ── Touch ── */
    let touchY = 0;
    function onTouchStart(e) { touchY = e.touches[0].clientY; }
    function onTouchMove(e) {
      if (!locked.current) { tryLock(); if (!locked.current) return; }
      e.preventDefault();
      const dy = touchY - e.touches[0].clientY;
      touchY    = e.touches[0].clientY;
      acc.current += dy * 3;
      if (acc.current >= STEP_DELTA)  { acc.current = 0; advance(1);  }
      if (acc.current <= -STEP_DELTA) { acc.current = 0; advance(-1); }
    }

    /* ── Scroll (only for detecting lock entry) ── */
    function onScroll() {
      if (!locked.current) tryLock();

      // When user scrolls back UP far enough to bring section into view again,
      // reset `done` so they can re-enter the experience
      if (done.current && !cooling.current) {
        const rect = section.getBoundingClientRect();
        if (rect.top > NAVBAR_H + 80) {
          // Section scrolled well back into view from above — reset for next pass
          done.current = false;
          stepRef.current = 0;
          setStep(0);
        }
      }
    }

    window.addEventListener("scroll",     onScroll,     { passive: true });
    window.addEventListener("wheel",      onWheel,      { passive: false });
    window.addEventListener("keydown",    onKeyDown);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove",  onTouchMove,  { passive: false });

    return () => {
      window.removeEventListener("scroll",     onScroll);
      window.removeEventListener("wheel",      onWheel);
      window.removeEventListener("keydown",    onKeyDown);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove",  onTouchMove);
      // Safety: always unlock on unmount
      locked.current = false;
    };
  }, []); // runs once — engine state is in refs

  const part      = ABOUT_PARTS[step];
  const isReverse = step % 2 === 1;

  const variants = {
    enter:  (dir) => ({ opacity: 0, y: dir > 0 ? 70 : -70 }),
    center: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
    exit:   (dir) => ({ opacity: 0, y: dir > 0 ? -70 : 70, transition: { duration: 0.4, ease: [0.55, 0, 1, 0.45] } }),
  };

  return (
    <section ref={sectionRef} id="About" className={styles.aboutSection}>

      {/* Heading */}
      <div className={styles.heading}>
        <p className={styles.head}>
          ABOUT <span className={styles.highlight}>US</span>
        </p>
        <div className={styles.bottomLine} />
      </div>

      {/* Card Stage */}
      <div className={styles.cardStage}>
        {isMobile ? (
          ABOUT_PARTS.map((p, i) => (
            <div
              key={p.id}
              className={`${styles.cardWrapper} ${i % 2 === 1 ? styles.reverseLayout : ""}`}
            >
              <div className={styles.imageContainer}>
                <img src={p.img} alt={p.id} className={styles.cardImage} />
              </div>
              <div className={styles.box}>
                <p className={styles.boxhead}>
                  <span className={styles.highlight}>{p.keyword}</span> {p.title}
                </p>
                <div className={styles.boxinnertext}>
                  <p>{p.descLine1}</p>
                  <p>{p.descLine2}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <AnimatePresence mode="wait" custom={1}>
            <motion.div
              key={part.id}
              custom={1}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              className={`${styles.cardWrapper} ${isReverse ? styles.reverseLayout : ""}`}
            >
              <div className={styles.imageContainer}>
                <img src={part.img} alt={part.id} className={styles.cardImage} />
              </div>
              <div className={styles.box}>
                <p className={styles.boxhead}>
                  <span className={styles.highlight}>{part.keyword}</span>{" "}
                  {part.title}
                </p>
                <div className={styles.boxinnertext}>
                  <p>{part.descLine1}</p>
                  <p>{part.descLine2}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>

    </section>
  );
}
