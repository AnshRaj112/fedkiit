"use client";

import React, { useContext, useEffect, useState } from "react";
import { Element } from "react-scroll";
import { motion } from "framer-motion";

import AuthContext from "../../../../context/AuthContext";
import styles from "./styles/Hero.module.scss";
import { parse, differenceInMilliseconds } from "date-fns";
import { Alert, MicroLoading } from "../../../../microInteraction";
import { useRouter } from "next/navigation";

function Hero({ ongoingEvents, isRegisteredInRelatedEvents, eventName }) {
  const authCtx = useContext(AuthContext);
  const [alert, setAlert] = useState(null);
  const [remainingTime, setRemainingTime] = useState("");
  const [info, setInfo] = useState({});
  const [isRegistrationClosed, setIsRegistrationClosed] = useState(false);
  const router = useRouter();
  const [isMicroLoading, setIsMicroLoading] = useState(false);
  const [relatedEventId, setRelatedEventId] = useState(null);
  const [btnTxt, setBtnTxt] = useState("REGISTER NOW");

  useEffect(() => {
    if (alert) {
      const { type, message, position, duration } = alert;
      Alert({ type, message, position, duration });
      setAlert(null);
    }
  }, [alert]);

  const calculateRemainingTime = () => {
    try {
      const regStartDate = parse(
        info.regDateAndTime,
        "MMMM do yyyy, h:mm:ss a",
        new Date()
      );

      const now = new Date();

      if (info.isRegistrationClosed) {
        setRemainingTime(null);
        setIsRegistrationClosed(true);
        return;
      }

      const timeDifference = differenceInMilliseconds(regStartDate, now);

      if (now < regStartDate) {
        const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeDifference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((timeDifference / (1000 * 60)) % 60);
        const seconds = Math.floor((timeDifference / 1000) % 60);

        const remaining =
          days > 0
            ? `${days} day${days > 1 ? "s" : ""} left`
            : `${hours}h ${minutes}m ${seconds}s`;

        setRemainingTime(remaining);
        setBtnTxt(remaining);
      } else {
        setRemainingTime(null);
      }
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

  const handleButtonClick = () => {
    if (isRegistrationClosed) return;

    if (!authCtx.isLoggedIn) {
      setIsMicroLoading(true);
      sessionStorage.setItem("prevPage", window.location.pathname);
      router.push("/login");
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
        return;
      }

      if (authCtx.user.regForm?.includes(relatedEventId)) {
        setAlert({
          type: "info",
          message: "You have already registered for this event",
          position: "bottom-right",
          duration: 3000,
        });
        setIsMicroLoading(false);
        return;
      }

      router.push(`/Events/${relatedEventId}/Form`);
    }
  };

  useEffect(() => {
    const updateButtonText = () => {
      setIsMicroLoading(true);
      setBtnTxt(
        isRegistrationClosed
          ? authCtx.user?.regForm?.includes(relatedEventId)
            ? "ALREADY REGISTERED"
            : "REGISTRATION CLOSED"
          : !authCtx.isLoggedIn
          ? remainingTime || "REGISTER NOW"
          : authCtx.user.access !== "USER"
          ? "ALREADY MEMBER"
          : authCtx.user?.regForm?.includes(relatedEventId)
          ? "ALREADY REGISTERED"
          : remainingTime || "REGISTER NOW"
      );

      setTimeout(() => setIsMicroLoading(false), 2500);
    };

    updateButtonText();
  }, [
    isRegistrationClosed,
    authCtx.isLoggedIn,
    authCtx.user?.access,
    authCtx.user?.regForm,
    relatedEventId,
  ]);

  return (
    <div className={styles.hero}>
      <div className={styles.circle}></div>
      <div className={styles.circle2}></div>
      <Element name="p">
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.5 }}
          animate={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{ perspective: 1000 }}
        >
          <p className={styles.head}>FED PRESENTS</p>
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
            src="https://res.cloudinary.com/dsh3wfn9h/image/upload/v1742324861/image_2025-03-19_00-35-55_1_dslca0.png"
            alt="PixelHack Hero"
          />
        </motion.div>
      </Element>
      <div className={styles.text}>
        <p>Design, Develop & Innovate with AI at PixelHack!</p>
        <button
          onClick={handleButtonClick}
          disabled={
            isMicroLoading ||
            isRegistrationClosed ||
            btnTxt === "REGISTRATION CLOSED" ||
            btnTxt === "ALREADY REGISTERED" ||
            btnTxt === "ALREADY MEMBER" ||
            btnTxt === `${remainingTime}`
          }
          style={{
            cursor:
              isMicroLoading ||
              isRegistrationClosed ||
              btnTxt === "REGISTRATION CLOSED" ||
              btnTxt === "ALREADY REGISTERED" ||
              btnTxt === "ALREADY MEMBER" ||
              btnTxt === `${remainingTime}`
                ? "not-allowed"
                : "pointer",
          }}
        >
          {isMicroLoading ? <MicroLoading color="#ffffff" /> : btnTxt}
        </button>
      </div>
      <Alert />
    </div>
  );
}

export default Hero;
