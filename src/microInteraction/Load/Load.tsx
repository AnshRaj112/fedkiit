"use client";

import { useEffect } from "react";
import { Commet } from "react-loading-indicators";

import styles from "./styles/load.module.scss";

/** Full-page loader — ported from microInteraction/Load/Load.jsx. */
export default function Loading() {
  useEffect(() => {
    document.body.classList.add(styles.noScroll!);
    return () => document.body.classList.remove(styles.noScroll!);
  }, []);

  return (
    <div className={styles.pageLoad}>
      <Commet color="#FF5C00" size="large" />
    </div>
  );
}
