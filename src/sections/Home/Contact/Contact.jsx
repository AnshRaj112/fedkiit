"use client";

/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { api } from "../../../services";
import styles from "./styles/Contact.module.scss";
import contactImg from "../../../assets/images/contact.png";
import { Button } from "../../../components";
import { AnimatedBox } from "../../../assets/animations/AnimatedBox";
import { Alert, MicroLoading } from "../../../microInteraction";

const ContactForm = () => {
  const [alert, setAlert] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  // Resolved on mount; `window` does not exist during server rendering.
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (alert) {
      const { type, message, position, duration } = alert;
      Alert({ type, message, position, duration });
    }
  }, [alert]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    handleResize();

    window.addEventListener('resize', handleResize);

    // Cleanup the event listener on component unmount
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.target);
    const data = {
      name: formData.get("name"),
      email: formData.get("email"),
      message: formData.get("message"),
    };

    try {
      const response = await api.post("/api/form/contact", data);

      if (response.status === 200 || response.status === 201) {
        setAlert({
          type: "success",
          message:
            "Your message has been submitted! We will get back to you soon.",
          position: "bottom-right",
          duration: 3000,
        });
        event.target.reset();
      } else {
        setAlert({
          type: "error",
          message:
            "There was an error submitting your message. Please try again.",
          position: "bottom-right",
          duration: 3000,
        });
      }
    } catch (error) {
      setAlert({
        type: "error",
        message:
          "There was an error submitting your message. Please try again.",
        position: "bottom-right",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section id="Contact Us">
      <div className={styles.contactFormContainer}>
        <h2>
          GET <span className={styles.highlight}>IN</span> TOUCH
        </h2>
        <div className={styles.bottomLine}></div>
        <div className={styles.formSection}>
          <form className={styles.contactForm} onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <input type="text" name="name" placeholder="Name" required />
            </div>
            <div className={styles.formGroup}>
              <input type="email" name="email" placeholder="Email" required />
            </div>
            <div className={styles.formGroup}>
              <textarea
                name="message"
                placeholder="Message"
                required
              ></textarea>
            </div>
            <Button
              type="submit"
              style={{
                width: "100%",
                background: "var(--primary)",
                color: "#fff",
                height: "40px",
                marginTop: "20px",
                fontSize: "1rem",
                borderRadius: "15px",
                cursor: "pointer",
              }}
              disabled={isLoading}
            >
              {isLoading ? <MicroLoading /> : "Submit"}
            </Button>
          </form>

          {!isMobile && (
            <div className={styles.imageSection}>
              <div className={styles.backCircle}></div>
              <AnimatedBox direction="right">
                <img src={contactImg.src} alt="Contact" />
              </AnimatedBox>
              <div className={styles.circle}></div>
            </div>
          )}
          <div className={styles.circle}></div>
        </div>
      </div>
      <Alert />
    </section>
  );
};

export default ContactForm;
