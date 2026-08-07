"use client";

import React, { useState } from "react";
import styles from "./styles/Accordion.module.scss";
import data from "../../../../data/liveEvents/omega/Accordion.json";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

const Accordion = () => {
  const [activeIndex, setActiveIndex] = useState(null);
  const [visibleCount, setVisibleCount] = useState(3); // Initial number of visible items
  const [showAll, setShowAll] = useState(false); // Track if all items are shown

  const toggleAccordion = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  const showMoreItems = () => {
    setVisibleCount((prevCount) => {
      const newCount = Math.min(prevCount + 3, data.length);
      if (newCount >= data.length) {
        setShowAll(true);
      }
      return newCount;
    });
  };

  const hideItems = () => {
    setVisibleCount(3);
    setShowAll(false);
  };

  const itemsToShow = data.slice(0, visibleCount);

  const AccordionItem = ({ item, index, activeIndex, toggleAccordion }) => {
    const { ref, inView } = useInView({
      threshold: 0.1,
      triggerOnce: true,
    });

    return (
      <motion.div
        key={index}
        className={styles.card}
        ref={ref}
        initial={{ opacity: 0, y: 50, scale: 0.5 }}
        animate={
          inView
            ? { opacity: 1, y: 0, scale: 1 }
            : { opacity: 0, y: 50, scale: 0.5 }
        }
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div></div>
        <div className={styles["accordion-item"]}>
          <div
            className={styles["accordion-title"]}
            onClick={() => toggleAccordion(index)}
          >
            <p>{item.title}</p>
            <span>{activeIndex === index ? "-" : "+"}</span>
          </div>
          <div
            className={`${styles["accordion-content"]} ${
              activeIndex === index ? styles.active : ""
            }`}
          >
            {item.content}
          </div>
        </div>
        <div
          style={{ display: activeIndex === index ? "none" : "block" }}
        ></div>
      </motion.div>
    );
  };

  return (
    <div className={styles.accordion}>
      <div className={styles.title}>
        <h1>
          FREQUENTLY ASKED <span>QUESTION</span>
        </h1>
      </div>
      {Array.isArray(itemsToShow) &&
        itemsToShow.map((item, index) => (
          <AccordionItem
            key={index}
            item={item}
            index={index}
            activeIndex={activeIndex}
            toggleAccordion={toggleAccordion}
          />
        ))}
      <button
        style={{
          color: "white",
          border: "none",
          padding: "10px 20px",
          marginTop: "20px",
          cursor: "pointer",
        }}
        onClick={showAll ? hideItems : showMoreItems}
      >
        {showAll ? "Show Less" : "Show More"}
      </button>
    </div>
  );
};

export default Accordion;
