"use client";

import { useState, useEffect } from 'react';

const useWindowWidth = () => {
  // Starts at 0 and is filled in on mount: reading `window` in the initialiser
  // runs during server rendering, where it is undefined.
  const [windowWidth, setWindowWidth] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    handleResize();

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return windowWidth;
};

export default useWindowWidth;
