"use client";

import React, { useState, useEffect } from "react";
import styles from "./styles/TabBar.module.scss";

const TabBar = ({ headings }) => {
  const [activeTab, setActiveTab] = useState(null);

  const handleScrollTo = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setActiveTab(id); 
  };

  useEffect(() => {
    const onScroll = () => {
      
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className={styles.tabBar}>
      <h3 className={styles.title}>Contents</h3>
      <ul>
        {headings.map((heading, index) => (
          <li
            key={index}
            onClick={() => handleScrollTo(heading.id)}
            onKeyDown={(e) => e.key === "Enter" && handleScrollTo(heading.id)}
            className={`${styles.tabItem} ${activeTab === heading.id ? styles.active : ""}`}
          >
            {heading.text}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TabBar;