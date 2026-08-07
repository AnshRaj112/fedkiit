"use client";

import React, { useEffect } from "react";
import styles from "./styles/ProfileLayout.module.scss";

const Layout = ({ children, title }) => {
    
  useEffect(() => {
    document.title = title ? title + " | FED" : "FED KIIT";
  }, []);

  return (
    <div className={styles.main}>
      <div className={styles.frameMiddle} />
      <div>{children}</div>
      <div className={styles.frameBottom} />
    </div>
  );
};

export default Layout;
