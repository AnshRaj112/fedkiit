"use client";

import React, { useState } from 'react';
import SponserImg from '../../../data/Sponser.json';
import styles from './styles/Sponser.module.scss';

const SponserCard = ({ image }) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  return (
    <div className={styles.sponser_card}>
      <img
        src={image.image}
        className={styles.SponserCard_image}
        alt={image.title || "Sponsor"}
        loading="lazy"
        onLoad={() => setIsImageLoaded(true)}
        onError={(e) => {
          // Fallback image if remote url fails
          e.target.onerror = null;
          e.target.src = "/fedkiit-logo.png";
        }}
      />
    </div>
  );
};

const Sponser = () => {
  // Duplicate array so marquee scrolls continuously in 1 single line
  const marqueeItems = [...SponserImg, ...SponserImg];

  return (
    <section id="Sponsors">
      <div className={styles.sponser_title}>
        our <span className={styles.sponser_title2}>Sponsors</span>
      </div>
      <div className={styles.bottom_line}></div>
      <div className={styles.sponser_container}>
        <div className={styles.sponser_div}>
          <div className={styles.marquee_track}>
            {marqueeItems.map((item, idx) => (
              <SponserCard key={`${item.title || 'sponsor'}-${idx}`} image={item} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Sponser;
