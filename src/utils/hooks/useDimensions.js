"use client";

import { useState, useEffect } from 'react';

const useDimensions = () => {
  // Starts at 0 and is filled in on mount — see useWindowWidth.
  const [viewportWidth, setViewportWidth] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
    };

    handleResize();

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const calculateInstagramWidth = () => {
    if (viewportWidth >= 1200) {
      return 338.45;
    } else if (viewportWidth >= 1024) {
      return 330;
    } else if (viewportWidth >= 768) {
      return 330;
    } else {
      return 315;
    }
  };

  const calculateInstagramHeight = () => {
    return 350;
  };

  const calculateInstagramReelWidth = () => {
    if (viewportWidth >= 1200) {
      return 426.61;
    } else if (viewportWidth >= 1024) {
      return 600;
    } else if (viewportWidth >= 768) {
      return 600;
    } else {
      return 315;
    }
  };

  const calculateInstagramReelHeight = () => {
    if (viewportWidth >= 1200) {
      return 730;
    } else if (viewportWidth >= 768) {
      return 730;
    } else {
      return 730;
    }
  };

  const calculateLinkedInWidth = () => {
    if (viewportWidth >= 1200) {
      return 376;
    } else if (viewportWidth >= 1024) {
      return 600;
    } else if (viewportWidth >= 768) {
      return 600;
    } else {
      return 315;
    }
  };

  const calculateLinkedInHeight = () => {
    return 730;
  };

  return {
    calculateInstagramWidth,
    calculateInstagramHeight,
    calculateInstagramReelWidth,
    calculateInstagramReelHeight,
    calculateLinkedInWidth,
    calculateLinkedInHeight
  };
};

export default useDimensions;
