"use client";

import React, { useEffect, useState } from "react";
import styles from "./styles/Hero.module.scss";
import CarouselImg from "../../../data/Carousel.json";
import Carousel from "../../../components/Carousel/Carousel";
import { AnimatedBox } from "../../../assets/animations/AnimatedBox";

const titles = [
  "Entrepreneurship.",
  "Innovation.",
  "Leadership.",
  "Collaboration.",
  "Community.",
  "Impact.",
  "Opportunity.",
  "Development.",
  "Transformation.",
  "Inspiration.",
  "Motivation.",
];

function Hero() {
  const [currentTitle, setCurrentTitle] = useState("");
  const [titleIndex, setTitleIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const title = titles[titleIndex];
    const typingSpeed = isDeleting ? 50 : 150;

    const interval = setInterval(() => {
      if (isDeleting) {
        setCurrentTitle(title.substring(0, charIndex - 1));
        setCharIndex(charIndex - 1);
      } else {
        setCurrentTitle(title.substring(0, charIndex + 1));
        setCharIndex(charIndex + 1);
      }

      if (!isDeleting && charIndex === title.length) {
        setIsDeleting(true);
      } else if (isDeleting && charIndex === 0) {
        setIsDeleting(false);
        setTitleIndex((titleIndex + 1) % titles.length);
      }
    }, typingSpeed);

    return () => clearInterval(interval);
  }, [charIndex, isDeleting, titleIndex]);

  return (
    <div className={styles.main}>
      <div className={styles.hero}>
        <div className={styles.heroTextContainer}>
          <AnimatedBox direction="left">
            <div className={styles.largeContent}>
              {/*
                A <div>, not the <p> the original used: it contains the animated
                <h3>, which the HTML parser will not keep inside a <p>. That was
                harmless client-rendered and a hydration mismatch once
                server-rendered. `.tagline` is listed alongside `.largeContent p`
                in the stylesheet, so the text is styled exactly as before, and
                the <h3> stays an <h3> rather than being downgraded to a span.
              */}
              <div className={styles.tagline}>
                Nurturing Using Innovative & Creative strategies{" "}
                <span
                  className={styles.dynamicText}
                  style={{
                    background: "var(--primary)",
                    WebkitBackgroundClip: "text",
                    color: "transparent",
                  }}
                >
                  <h3 className={styles.typing}>{currentTitle}</h3>
                </span>{" "}
              </div>
            </div>
            <div className={styles.smallContainer}>
              <div className={styles.smallContent}>
                <p>
                  Inspiring{" "}
                  <span
                    style={{
                      background: "var(--primary)",
                      WebkitBackgroundClip: "text",
                      color: "transparent",
                    }}
                  >
                    visionaries
                  </span>{" "}
                  towards cultivating excellence and enrouting future
                  generations towards growth.
                </p>
              </div>
            </div>
          </AnimatedBox>
        </div>
        <div className={styles.heroCarousel}>
          <Carousel images={CarouselImg} />
        </div>
        <div className={styles.circle}></div>
      </div>
    </div>
  );
}

export default Hero;
