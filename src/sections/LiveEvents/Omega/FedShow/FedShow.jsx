"use client";

import React, { useEffect, useState } from "react";
import { Element } from "react-scroll";
import { useInView } from "react-intersection-observer";
import { motion } from "framer-motion";
import { FaCalendarAlt, FaClock, FaMapMarkerAlt } from "react-icons/fa";
import { parse, differenceInMilliseconds } from "date-fns";
import fedShowImg from "../../../../assets/images/fedShow.svg";
import styles from "./styles/FedShow.module.scss";
import speakersData from "../../../../data/liveEvents/omega/Speakers.json";


function FedShow() {
  const [remainingTime, setRemainingTime] = useState("");
  const [btnTxt, setBtnTxt] = useState("FREE PASS");

  const { ref: refImg1, inView: inViewImg1 } = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });
  const { ref: refImg2, inView: inViewImg2 } = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });
  const { ref: refImg3, inView: inViewImg3 } = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  useEffect(() => {
    const intervalId = setInterval(() => {
      calculateRemainingTime();
    }, 1000); // Update every second

    return () => clearInterval(intervalId);
  }, []);

  const calculateRemainingTime = () => {
    try {
      const regStartDate = parse(
        "August 16, 2025, 10:00:00 AM",
        "MMMM dd, yyyy, h:mm:ss a",
        new Date()
      );
      const endTime = parse(
        "August 17, 2025, 2:00:00 PM",
        "MMMM dd, yyyy, h:mm:ss a",
        new Date()
      );
      const now = new Date();

      if (now >= endTime) {
        setRemainingTime(null);
        setBtnTxt("SHOW ENDED");
        return;
      } else if (now >= regStartDate) {
        setRemainingTime(null);
        setBtnTxt("SHOW IS LIVE");
        return;
      }

      const timeDifference = differenceInMilliseconds(regStartDate, now);

      const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeDifference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((timeDifference / (1000 * 60)) % 60);
      const seconds = Math.floor((timeDifference / 1000) % 60);

      let remaining;

      if (days > 0) {
        remaining = `${days} day${days > 1 ? "s" : ""} left`;
      } else {
        remaining = [
          hours > 0 ? `${hours}h ` : "",
          minutes > 0 ? `${minutes}m ` : "",
          seconds > 0 ? `${seconds}s` : "",
        ]
          .join("")
          .trim();
      }

      setRemainingTime(remaining);
    } catch (error) {
      console.error("Date parsing error:", error);
      setRemainingTime(null);
    }
  };

  return (
    <div className={styles.fedShow}>
      <div></div>
      <div></div>

      <div className={styles.imageContainer}>
        
        <Element name="p">
          <p className={styles.head}>WHERE IDEAS MEET</p>
          <span className={styles.subHead}>INNOVATION</span>
          <motion.div
            ref={refImg2}
            initial={{ opacity: 0, y: -10, scale: 0.5 }}
            animate={{
              opacity: inViewImg2 ? 1 : 0,
              y: inViewImg2 ? 0 : -10,
              rotate: inViewImg2 ? 0 : 0,
              scale: inViewImg2 ? 1 : 0.5,
            }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{ perspective: 1000 }}
          >
            <div className={styles.showName}>
              <img
                className={styles.imgRight2}
                src={fedShowImg.src}
                alt="FED Show"
              />
            </div>
          </motion.div>

          <div className={styles.info}>
            <p>
              <FaCalendarAlt className={styles.icon} size={20} /> 16 th AUG ,
              2025
            </p>
            <div style={{ display: "flex", alignItems: "center" }}>
              <p>
                <FaClock className={styles.icon} /> 10:00 AM
              </p>
              <p style={{ marginLeft: "20px" }}>
                <FaMapMarkerAlt className={styles.icon} /> CAMPUS - 7
              </p>
            </div>
          </div>

          <button 
            className={styles.registerBtn}
            disabled={
              btnTxt === "SHOW ENDED" ||
              btnTxt === "SHOW IS LIVE" ||
              btnTxt === `${remainingTime}`
            }
            style={{ cursor: "not-allowed" }}
          >
            {remainingTime ? `${remainingTime}` : btnTxt}
          </button>
        </Element>
       
        
      </div>
      
                 <h2 className={styles.heading}>
        <span className={styles.our}>OUR</span> <span className={styles.speakers}>SPEAKERS</span>
      </h2>
       <div className={styles.speakersContainer}>

      {speakersData.map((speaker, index) => (
        <div key={index} className={styles.speakerCard}>
          <img
            src={speaker.image}
            alt={speaker.name}
            className={styles.speakerImage}
          />
          <h3 className={styles.speakerName}>{speaker.name}</h3>
          <p className={styles.speakerDesignation}>{speaker.designation}</p>
        </div>
      ))}
    </div>
    </div>
    
  );
}

export default FedShow;
