"use client";

import React, { useState, useRef, useEffect } from "react";
import SponserImg from "../../../data/Sponser.json";
import styles from "./styles/Sponser.module.scss";

const SponserCard = ({ image }) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className={styles.sponser_card}>
      <img
        src={image.image}
        className={`${styles.SponserCard_image} ${"" /* .loaded is not defined by this module, as in the original */}`}
        alt={image.title || "Sponsor logo"}
        onLoad={() => setLoaded(true)}
        loading="lazy"
        draggable={false}
      />
    </div>
  );
};

const Sponser = () => {
  const trackRef = useRef(null);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return undefined;

    const pause = () => {
      el.style.animationPlayState = "paused";
    };
    const play = () => {
      el.style.animationPlayState = "running";
    };

    el.addEventListener("mouseenter", pause);
    el.addEventListener("mouseleave", play);
    el.addEventListener("focusin", pause);
    el.addEventListener("focusout", play);

    return () => {
      el.removeEventListener("mouseenter", pause);
      el.removeEventListener("mouseleave", play);
      el.removeEventListener("focusin", pause);
      el.removeEventListener("focusout", play);
    };
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth <= 768) {
      return undefined;
    }

    const track = trackRef.current;
    if (!track) return undefined;

    const container = track.parentElement;
    if (!container) return undefined;

    let animationFrameId;

    const updateScale = () => {
      const containerRect = container.getBoundingClientRect();
      const containerCenter = containerRect.left + containerRect.width / 2;

      const cards = track.children;
      const maxDistance = window.innerWidth <= 640 ? 110 : 160;

      for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        if (!card) continue;
        const cardRect = card.getBoundingClientRect();
        const cardCenter = cardRect.left + cardRect.width / 2;

        const distance = Math.abs(cardCenter - containerCenter);

        let scale = 1;
        let boxShadow = "";
        let zIndex = "";

        if (distance < maxDistance) {
          const factor = (maxDistance - distance) / maxDistance;
          scale = 1 + factor * 0.25;
          const glowOpacity = factor * 0.7;
          boxShadow = `0 0 ${12 + factor * 22}px rgba(255, 138, 0, ${glowOpacity}), 0 0 ${6 + factor * 10}px rgba(255, 138, 0, ${factor * 0.4})`;
          zIndex = "10";
        }

        card.style.transform = `scale(${scale})`;
        card.style.boxShadow = boxShadow;
        card.style.zIndex = zIndex;
      }

      animationFrameId = requestAnimationFrame(updateScale);
    };

    updateScale();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const logos = [...SponserImg, ...SponserImg];

  return (
    <section className={styles.section} aria-labelledby="sponsors-heading">
      <header className={styles.heading}>
        <h2 id="sponsors-heading" className={styles.sponser_title}>
          our <span className={styles.sponser_title2}>Sponsors</span>
        </h2>
        <div className={styles.bottom_line} aria-hidden="true" />
        <p className={styles.subhead}>Partners who back our community and events.</p>
      </header>

      <div className={styles.marqueeShell}>
        <div className={styles.marqueeFade} aria-hidden="true" />
        <div className={styles.sponser_container}>
          <div className={styles.track} ref={trackRef}>
            {logos.map((image, idx) => (
              <SponserCard key={`${image.image}-${idx}`} image={image} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Sponser;
