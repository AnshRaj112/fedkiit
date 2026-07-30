"use client";

import { motion, useAnimation } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useEffect } from 'react'; 

const getBoxVariant = (direction) => {
  return {
    visible: { opacity: 1, x: 0, transition: { duration: 0.5 } },
    hidden: { opacity: 0, x: direction === 'left' ? -100 : 100 }
  };
};

export const AnimatedBox = ({ children, direction }) => {
  const control = useAnimation();
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.3,
  });

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
      variants={getBoxVariant(direction)}
      initial="hidden"
      animate={control}
    >
      {children}
    </motion.div>
  );
};
