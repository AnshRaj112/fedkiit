"use client";

import React, { useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const getBoxVariant = () => {
  return {
    visible: { opacity: 1, y: 0, transition: { duration: 1.2 } },
    hidden: { opacity: 0, y: 50 }
  };
};

const AnimatedBox = ({ children }) => {
  const control = useAnimation();
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.3,
  });

  useEffect(() => {
    control.start('visible');
  }, [control]);

  useEffect(() => {
    if (inView) {
      control.start('visible');
    } else {
      control.start('hidden');
    }
  }, [control, inView]);

  return (
    <motion.div
      ref={ref}
      variants={getBoxVariant()}
      initial="hidden"
      animate={control}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedBox;