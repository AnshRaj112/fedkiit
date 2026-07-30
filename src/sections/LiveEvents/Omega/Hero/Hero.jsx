"use client";

import React, { useContext, useEffect, useState } from "react";
import { Element } from "react-scroll";
import { motion } from "framer-motion";

import AuthContext from "../../../../context/AuthContext";
import styles from "./styles/Hero.module.scss";
import { parse, differenceInMilliseconds } from "date-fns";
import { Alert, MicroLoading } from "../../../../microInteraction"; // Ensure this import path is correct
import { useRouter } from "next/navigation";

function Hero({ ongoingEvents, isRegisteredInRelatedEvents, eventName }) {
  const authCtx = useContext(AuthContext);
  const [alert, setAlert] = useState(null);
  const [remainingTime, setRemainingTime] = useState("");
  const [info, setInfo] = useState({});
  const [isRegistrationClosed, setIsRegistrationClosed] = useState(false);
  const router = useRouter();
  const [shouldNavigate, setShouldNavigate] = useState(false);
  const [navigatePath, setNavigatePath] = useState("/");
  const [isMicroLoading, setIsMicroLoading] = useState(true);
  const [relatedEventId, setRelatedEventId] = useState(null);
  const [btnTxt, setBtnTxt] = useState("REGISTER NOW");

  useEffect(() => {
    if (alert) {
      const { type, message, position, duration } = alert;
      Alert({ type, message, position, duration });
      setAlert(null); // Reset alert after displaying it
    }
  }, [alert]);

  useEffect(() => {
    if (shouldNavigate) {
      router.push(navigatePath);
      setShouldNavigate(false); // Reset state after navigation
    }
  }, [shouldNavigate, navigatePath, router]);

  const handleButtonClick = () => {
    if (!authCtx.isLoggedIn) {
      setIsMicroLoading(true);
      sessionStorage.setItem("prevPage", window.location.pathname);
      setNavigatePath("/login");
      setShouldNavigate(true);
    } else {
      handleForm();
    }
  };

  const handleForm = () => {
    if (authCtx.isLoggedIn) {
      setIsMicroLoading(true);
      if (authCtx.user.access !== "USER" && authCtx.user.access !== "ADMIN") {
        setTimeout(() => {
          setIsMicroLoading(false);
          setAlert({
            type: "info",
            message: "Team Members are not allowed to register for the Event",
            position: "bottom-right",
            duration: 3000,
          });
        }, 1500);
      } else {
        const relatedEventId = ongoingEvents.find(
          (e) => e.info.relatedEvent === "null"
        )?.id;
        if (relatedEventId) {
          setNavigatePath(`/Events/6890fd2b2ee5496826b3a5a9/Form`); //hardcoded path for Omega 5.0
          setShouldNavigate(true);
        }
        setTimeout(() => {
          setIsMicroLoading(false);
        }, 3000);
      }
    }
  };

  const calculateRemainingTime = () => {
    if (!info?.regDateAndTime) {
      setRemainingTime(null);
      return;
    }

    // Parse the regDateAndTime received from backend
    try {
      const regStartDate = parse(
        info.regDateAndTime,
        "MMMM do yyyy, h:mm:ss a",
        new Date()
      );
      const now = new Date();

      // Calculate the time difference in milliseconds
      const timeDifference = differenceInMilliseconds(regStartDate, now);

      if (timeDifference <= 0) {
        setRemainingTime(null);
        return;
      }

      // Calculate the days, hours, minutes, and seconds remaining
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

      console.log(remaining);
      setRemainingTime(remaining);
    } catch (error) {
      console.error("Date parsing error:", error);
      setRemainingTime(null);
    }
  };

  useEffect(() => {
    const ongoingInfo = ongoingEvents.find(
      (e) => e.info.relatedEvent === "null"
    )?.info;

    setInfo(ongoingInfo);
    setIsRegistrationClosed(ongoingInfo?.isRegistrationClosed || false);

    const relatedId = ongoingEvents.find(
      (e) => e.info.relatedEvent === "null"
    )?.id;
    setRelatedEventId(relatedId);

    if (ongoingInfo?.regDateAndTime) {
      calculateRemainingTime();
      const intervalId = setInterval(calculateRemainingTime, 1000);
      return () => clearInterval(intervalId);
    }
  }, [info?.regDateAndTime, ongoingEvents]);

  useEffect(() => {
    const updateButtonText = () => {
      if (isRegistrationClosed) {
        setIsMicroLoading(false);
        setBtnTxt("CLOSED");
      } else if (!authCtx.isLoggedIn) {
        setIsMicroLoading(false);
        setBtnTxt(remainingTime || "REGISTER NOW");
      } else {
        setIsMicroLoading(false);
        if (authCtx.user.access !== "USER") {
          if (remainingTime) {
            setBtnTxt(remainingTime);
          } else {
            setBtnTxt("ALREADY MEMBER");
          }
        } else if (isRegisteredInRelatedEvents) {
          if (authCtx.user.regForm.includes(relatedEventId)) {
            setIsMicroLoading(false);
            setBtnTxt("ALREADY REGISTERED");
          }
        } else {
          setIsMicroLoading(false);
          setBtnTxt(remainingTime || "REGISTER NOW");
        }
      }
    };

    updateButtonText();
  }, [
    isRegistrationClosed,
    authCtx.isLoggedIn,
    authCtx.user?.access,
    remainingTime,
    isRegisteredInRelatedEvents,
    relatedEventId,
  ]);

  return (
    
    <div className={styles.hero}>

   
      <Element name="p">
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.5 }}
          animate={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{ perspective: 1000 }}
        >

          <p className={styles.head}> FEDKIIT PRESENTS</p>
        </motion.div>
      </Element>
      <Element name="img">
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.5 }}
          animate={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{ perspective: 1000 }}
        >
          <img
            src="https://cdn.prod.website-files.com/6891df87cfba687a7fd80202/6891e0b089a56fcddcf969e2_omega5.png"
            alt="Hero"
          />
              
<div style={{ 
  display: "flex", 
  flexDirection: "column", 
  alignItems: "center", 
  textAlign: "center"
}}>
  

  <span style={{ 
    fontSize: "12px", 
    fontWeight: "500", 
    marginBottom: "4px", 
    color: "#9d9b9bff" 
  }}>
    POWERED BY
  </span>


  <div style={{ 
    display: "flex", 
    alignItems: "center", 
    justifyContent: "center",
    gap: "6px", 
    flexWrap: "wrap",
    transform: "translateX(15px)" 
  }}>
    <img
      src="https://cdn.prod.website-files.com/6898a84f39288fa31fb19eb3/6898a87e80f51af6ea827159_e6160607db8448dd75eaa46ae28afe7c717b1adc%20(1).png"
      alt="Remax Logo"
      style={{ width: "30px", height: "30px", objectFit: "contain"}}
      
    />

    
   
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", lineHeight: "1.1" }}>
      <strong style={{ fontSize: "16px", fontWeight: "bold" }}>REMAX</strong>
      <span style={{ fontSize: "12px", fontWeight: "500" }}>TEMPLE CITY</span>
    </div>
  </div>

</div>





        </motion.div>
        
      </Element>
      <div className={styles.text}>
        <p>Empowering Entrepreneurs, Energizing the Future</p>
        <button
          onClick={handleButtonClick}
          disabled={
            isMicroLoading ||
            isRegistrationClosed ||
            btnTxt === "CLOSED" ||
            btnTxt === "ALREADY REGISTERED" ||
            btnTxt === "ALREADY MEMBER" ||
            btnTxt === remainingTime
          }
          style={{
            cursor:
              isRegistrationClosed ||
              btnTxt === "CLOSED" ||
              btnTxt === "ALREADY REGISTERED" ||
              btnTxt === "ALREADY MEMBER" ||
              remainingTime
                ? "not-allowed"
                : "pointer",
          }}
        >
          {isMicroLoading ? (
            <MicroLoading color="#38ccff" />
          ) : (
            btnTxt
          )}
        </button>
      </div>
      <Alert />
    </div>
  );
}

export default Hero;
