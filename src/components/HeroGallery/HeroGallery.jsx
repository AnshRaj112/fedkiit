"use client";

import React, { useEffect, useState, useCallback } from "react";
import PropTypes from "prop-types";
import styles from "./styles/HeroGallery.module.scss";

const INTERVAL_MS = 3200;

function getSlot(offset) {
  if (offset === 0) return "active";
  if (offset === -1) return "prev";
  if (offset === 1) return "next";
  if (offset < 0) return "farPrev";
  return "farNext";
}

function HeroGallery({ images }) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = images.length;

  const goTo = useCallback(
    (index) => {
      setCurrent(((index % count) + count) % count);
    },
    [count]
  );

  useEffect(() => {
    if (paused || count <= 1) return undefined;
    const id = setTimeout(() => {
      setCurrent((prev) => (prev + 1) % count);
    }, INTERVAL_MS);
    return () => clearTimeout(id);
  }, [current, paused, count]);

  if (!count) return null;

  return (
    <div
      className={styles.gallery}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className={styles.stage} aria-live="polite" aria-atomic="true">
        {images.map((image, index) => {
          let offset = index - current;
          if (offset > count / 2) offset -= count;
          if (offset < -count / 2) offset += count;

          const slot = Math.abs(offset) <= 2 ? getSlot(offset) : "hidden";

          return (
            <button
              key={image.image}
              type="button"
              className={`${styles.card} ${styles[slot]}`}
              onClick={() => {
                if (offset !== 0 && Math.abs(offset) <= 2) goTo(index);
              }}
              tabIndex={offset === 0 || Math.abs(offset) > 2 ? -1 : 0}
              aria-hidden={slot === "hidden" ? "true" : undefined}
              aria-label={
                offset === 0
                  ? `Current photo ${index + 1} of ${count}`
                  : `Show photo ${index + 1}`
              }
              aria-current={offset === 0 ? "true" : undefined}
            >
              <img
                src={image.image}
                alt={image.title || `Gallery photo ${index + 1}`}
                draggable={false}
              />
            </button>
          );
        })}
      </div>

      <div className={styles.controls}>
        <button
          type="button"
          className={styles.navBtn}
          onClick={() => goTo(current - 1)}
          aria-label="Previous photo"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.navIcon}>
            <path
              d="M14.5 5.5 8 12l6.5 6.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <div className={styles.rail} role="tablist" aria-label="Gallery slides">
          {images.map((_, index) => (
            <button
              key={index}
              type="button"
              role="tab"
              aria-selected={index === current}
              className={`${styles.railDot} ${
                index === current ? styles.railDotActive : ""
              }`}
              onClick={() => goTo(index)}
              aria-label={`Go to photo ${index + 1}`}
            />
          ))}
        </div>

        <button
          type="button"
          className={styles.navBtn}
          onClick={() => goTo(current + 1)}
          aria-label="Next photo"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.navIcon}>
            <path
              d="M9.5 5.5 16 12l-6.5 6.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

HeroGallery.propTypes = {
  images: PropTypes.arrayOf(
    PropTypes.shape({
      image: PropTypes.string.isRequired,
      title: PropTypes.string,
    })
  ).isRequired,
};

export default HeroGallery;
