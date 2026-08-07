"use client";

/* eslint-disable react/prop-types */
import React, { useEffect, useState, useContext } from "react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

import { parse, differenceInMilliseconds } from "date-fns";
import AuthContext from "../../../../context/AuthContext";
import styles from "./styles/Event.module.scss";
import { Alert, MicroLoading } from "../../../../microInteraction"; // Ensure this import path is correct
import { useRouter } from "next/navigation";

function EventCard({ data, isRegisteredInRelatedEvents, ongoingEvents }) {
  const authCtx = useContext(AuthContext);
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });
  const router = useRouter();

  const [btnTxt, setBtnTxt] = useState("Register Now");
  const [isMicroLoading, setIsMicroLoading] = useState(false);
  const [remainingTime, setRemainingTime] = useState(null);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    if (alert) {
      const { type, message, position, duration } = alert;
      Alert({ type, message, position, duration });
      setAlert(null); // Reset alert after displaying it
    }
  }, [alert]);

  useEffect(() => {
    calculateRemainingTime(); // Initial calculation
    const intervalId = setInterval(calculateRemainingTime, 1000); // Update every second

    return () => clearInterval(intervalId); // Cleanup on component unmount
  }, []);

  const calculateRemainingTime = () => {
    // Parse the regDateAndTime received from backend
    const regStartDate = parse(
      data.info.regDateAndTime,
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

    setRemainingTime(remaining);
  };

  useEffect(() => {
    if (data.info.isRegistrationClosed) {
      setBtnTxt("Closed");
    } else if (authCtx.isLoggedIn && authCtx.user.regForm) {
      if (isRegisteredInRelatedEvents) {
        if (data.info.relatedEvent === "null") {
          setBtnTxt("Registered");
        } else {
          if (authCtx.user.regForm.includes(data.id)) {
            setBtnTxt("Registered");
          } else {
            setBtnTxt(remainingTime || "Register Now");
          }
        }
      } else {
        if (data.info.relatedEvent === "null") {
          if (remainingTime) {
            setBtnTxt(remainingTime);
          } else {
            if (authCtx.user.access === "USER") {
              setBtnTxt("Register Now");
            } else {
              setBtnTxt("Already Member");
            }
          }
        } else {
          if (authCtx.user.access === "USER") {
            setBtnTxt("Locked");
          } else {
            if (remainingTime) {
              setBtnTxt(remainingTime);
            } else {
              setBtnTxt("Already Member");
            }
          }
        }
      }
    } else {
      setBtnTxt(remainingTime || "Register Now");
    }
  }, [
    authCtx.isLoggedIn,
    authCtx.user.regForm,
    data,
    isRegisteredInRelatedEvents,
    remainingTime,
  ]);

  const isValiedState = () => {
    if (
      btnTxt === "Closed" ||
      btnTxt === "Registered" ||
      btnTxt === "Already Member" ||
      btnTxt === `${remainingTime}`
    ) {
      return false;
    }
    if (
      btnTxt === "Locked" &&
      authCtx.isLoggedIn &&
      authCtx.user.access === "USER"
    ) {
      setAlert({
        type: "infoOmega",
        message: `You need to register for Omega4.0 first`,
        position: "bottom-right",
        duration: 3000,
      });
      return false;
    }
    return true;
  };

  const handleRegisterClick = () => {
    if (!isValiedState()) {
      return null;
    }
    if (!authCtx.isLoggedIn) {
      sessionStorage.setItem("prevPage", window.location.pathname);
      router.push("/login");
    } else if (btnTxt === "Register Now") {
      setIsMicroLoading(true);
      setTimeout(() => {
        setIsMicroLoading(false);
        router.push(`/Events/${data.id}/Form`);
      }, 1500);
    } else if (btnTxt === "Registered") {
      setAlert({
        type: "info",
        message: "You are already registered for this event.",
        position: "bottom-right",
        duration: 3000,
      });
    } else if (btnTxt === "Locked") {
      setAlert({
        type: "warning",
        message: "This event is locked for registration.",
        position: "bottom-right",
        duration: 3000,
      });
    }
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50, scale: 0.5 }}
      animate={
        inView
          ? { opacity: 1, y: 0, scale: 1 }
          : { opacity: 0, y: 50, scale: 0.5 }
      }
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={styles.card}
    >
      <div></div>
      <div className={styles.card_img}>
        <img src={data.info.eventImg} alt="Event" />
      </div>
      <div className={styles.card_content}>
        <h2>{data.info.eventTitle}</h2>
        <p>{data.info.eventdescription}</p>
        <div style={{ fontSize: ".9rem", color: "white" }}>
          <button
            onClick={handleRegisterClick}
            disabled={btnTxt === "Closed" || btnTxt === "Registered" || btnTxt === "Already Member" || btnTxt === remainingTime}
            style={{
              cursor: btnTxt === "Register Now" ? "pointer" : "not-allowed",
            }}
          >
            {isMicroLoading ? <MicroLoading color="#38ccff" /> : btnTxt}
          </button>
        </div>
        <div></div>
      </div>
    </motion.div>
  );
}

function Event({ ongoingEvents, isRegisteredInRelatedEvents }) {
  return (
    <>
      <div className={styles.eventBox}>
        <div className={styles.eventHeading}>
          <h1>
            YOUR NEXT BIG IDEA DESERVES A <br /> GRAND STAGE!
          </h1>
        </div>
        <div className={styles.eventCards}>
          <div className={styles.cardItem}>
            {ongoingEvents
              .filter((event) => event.info.relatedEvent !== "null") // Filter out events with relatedEvent set to null
              .map((event, index) => (
                <EventCard
                  key={index}
                  data={event}
                  isRegisteredInRelatedEvents={isRegisteredInRelatedEvents}
                />
              ))}
          </div>
        </div>
      </div>
      <Alert />
    </>
  );
}

export default Event;
