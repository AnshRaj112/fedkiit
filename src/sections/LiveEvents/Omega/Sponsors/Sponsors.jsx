"use client";

/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
import sponsorsData from '../../../../data/liveEvents/omega/Sponsor.json';
import styles from './styles/Sponsors.module.scss';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

function Sponsors() {
  const [sponsors, setSponsors] = useState([]);
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  useEffect(() => {
    setSponsors(sponsorsData);
  }, []);

  return (
    <div className={styles.sponsorsSection}>
      <h1>OUR &nbsp;</h1>
      <h1 className={styles.heading}>SPONSORS</h1>
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 50, scale: 0.5 }}
        animate={inView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 50, scale: 0.5 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div className={styles.sponsorsLogos}>
          {sponsors.map((sponsor, index) => (
            <div key={index} className={styles.sponsor}>
              <img src={sponsor.image} />
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export default Sponsors;
