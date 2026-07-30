"use client";

import React from 'react';
import styles from './styles/Sponser.module.scss';

const SponserSkeleton = () => {
  return (
    <div className={styles.skeletonBack}>
    <div className={styles.skeleton_card}></div>
    </div>
  );
};

export default SponserSkeleton;
