"use client";

import { useState, useRef, useEffect } from "react";
import styles from "./styles/Feedback.module.scss";
import feedbackData from "../../../data/Feedback.json";
import quoteImg from "../../../assets/images/quote.png";

const Feedback = () => {
  const feedbacksRef = useRef(null);
  const containerRef = useRef(null);

  const FeedbackCard = ({ quote }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const long = quote.quote.length > 160;
    const truncatedQuote = long
      ? `${quote.quote.substring(0, 150)}…`
      : quote.quote;

    return (
      <article className={styles.feedbackCard}>
        <button
          type="button"
          className={styles.FeedbackMsg}
          onClick={() => long && setIsExpanded(!isExpanded)}
          aria-expanded={long ? isExpanded : undefined}
        >
          <p className={styles.feedbackText}>
            {isExpanded || !long ? quote.quote : truncatedQuote}
            {long && !isExpanded && (
              <span className={styles.readMore}> read more</span>
            )}
          </p>
        </button>

        <div className={styles.meta}>
          <p className={styles.feedbackAuthor}>{quote.title}</p>
          <p className={styles.feedbackEv}>{quote.post}</p>
        </div>
      </article>
    );
  };

  useEffect(() => {
    const el = feedbacksRef.current;
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
    const container = containerRef.current;
    const track = feedbacksRef.current;
    if (!container || !track) return undefined;

    const handleMouseMove = (e) => {
      const containerRect = container.getBoundingClientRect();
      const containerX = e.clientX - containerRect.left;
      const containerY = e.clientY - containerRect.top;
      container.style.setProperty("--grid-mouse-x", `${containerX}px`);
      container.style.setProperty("--grid-mouse-y", `${containerY}px`);
      container.style.setProperty("--grid-spotlight-opacity", "1");

      const cards = track.children;
      const maxDist = 380;

      for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        if (!card) continue;
        const rect = card.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const dist = Math.hypot(e.clientX - centerX, e.clientY - centerY);

        const localX = e.clientX - rect.left;
        const localY = e.clientY - rect.top;

        card.style.setProperty("--mouse-x", `${localX}px`);
        card.style.setProperty("--mouse-y", `${localY}px`);

        if (dist < maxDist) {
          const intensity = Math.pow((maxDist - dist) / maxDist, 1.2);
          card.style.setProperty("--spotlight-opacity", intensity.toFixed(3));
          card.style.borderColor = `rgba(255, 138, 0, ${(0.15 + intensity * 0.55).toFixed(2)})`;
          card.style.boxShadow = `0 0 ${Math.round(intensity * 24)}px rgba(255, 138, 0, ${(intensity * 0.35).toFixed(2)})`;
        } else {
          card.style.setProperty("--spotlight-opacity", "0");
          card.style.borderColor = "";
          card.style.boxShadow = "";
        }
      }
    };

    const handleMouseLeave = () => {
      container.style.setProperty("--grid-spotlight-opacity", "0");

      const cards = track.children;
      for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        if (!card) continue;
        card.style.setProperty("--spotlight-opacity", "0");
        card.style.borderColor = "";
        card.style.boxShadow = "";
      }
    };

    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <section
      ref={containerRef}
      className={styles.feedbackContainer}
      aria-labelledby="testimonials-heading"
    >
      <img className={styles.upQuote} src={quoteImg.src} alt="" aria-hidden="true" />
      <header className={styles.heading}>
        <h2 id="testimonials-heading">
          TESTIMO<span>NIALS</span>
        </h2>
        <div className={styles.bottomLine} aria-hidden="true" />
      </header>
      <div className={styles.feedbacksContainer}>
        <div className={styles.feedbacks} ref={feedbacksRef}>
          {feedbackData.concat(feedbackData).map((quote, index) => (
            <FeedbackCard key={`${quote.title}-${index}`} quote={quote} />
          ))}
        </div>
      </div>
      <img className={styles.downQuote} src={quoteImg.src} alt="" aria-hidden="true" />
    </section>
  );
};

export default Feedback;
