"use client";

import { useEffect, useState } from "react";
import { Riple } from "react-loading-indicators";

/**
 * Section-level loader — ported from microInteraction/Load/ComponentLoad.jsx.
 *
 * The original read `window.innerWidth` in the `useState` initialiser, which
 * throws during server rendering. It starts at the desktop value and corrects
 * after mount instead.
 */
const ComponentLoading = ({
  customStyles = {},
}: {
  customStyles?: React.CSSProperties;
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const baseStyles: React.CSSProperties = {
    height: "50%",
    padding: "3rem",
    marginTop: "3rem",
    marginBottom: "3rem",
    display: "flex",
    justifyContent: "center",
    ...customStyles,
    marginLeft: isMobile ? "0rem" : customStyles.marginLeft,
  };

  return (
    <div style={baseStyles}>
      <Riple color="#FF5C00" size="large" text="" textColor="" />
    </div>
  );
};

export default ComponentLoading;
