"use client";

import React, { useState, useEffect } from "react";
import { api } from "../../../services";
import styles from "./styles/Contact.module.scss";
import contactImg from "../../../assets/images/contact.png";
import Button from "../../../components/Core/Button";
import { AnimatedBox } from "../../../assets/animations/AnimatedBox";
import { Alert, MicroLoading } from "../../../microInteraction";

const ContactForm = () => {
  const [alert, setAlert] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (alert) {
      const { type, message, position, duration } = alert;
      Alert({ type, message, position, duration });
    }
  }, [alert]);

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
    } catch {
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
    <section id="Contact Us" className={styles.section} aria-labelledby="contact-heading">
      <div className={styles.contactFormContainer}>
        <header className={styles.heading}>
          <h2 id="contact-heading">
            GET <span className={styles.highlight}>IN</span> TOUCH
          </h2>
          <div className={styles.bottomLine} aria-hidden="true" />
          <p className={styles.subhead}>
            Questions, ideas, or partnerships — drop us a note.
          </p>
        </header>

        <div className={styles.formSection}>
          <form className={styles.contactForm} onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="contact-name">
                Name
              </label>
              <input
                id="contact-name"
                type="text"
                name="name"
                placeholder="Your name"
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="contact-email">
                Email
              </label>
              <input
                id="contact-email"
                type="email"
                name="email"
                placeholder="you@example.com"
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="contact-message">
                Message
              </label>
              <textarea
                id="contact-message"
                name="message"
                placeholder="How can we help?"
                required
              />
            </div>
            <Button
              type="submit"
              style={{
                width: "100%",
                background: "var(--primary)",
                color: "#fff",
                height: "2.5rem",
                marginTop: "0.35rem",
                fontSize: "0.9375rem",
                borderRadius: "var(--radius-md)",
                cursor: "pointer",
              }}
              disabled={isLoading}
            >
              {isLoading ? <MicroLoading /> : "Submit"}
            </Button>
          </form>

          <div className={styles.imageSection}>
            <AnimatedBox direction="right">
              <img src={contactImg.src} alt="" aria-hidden="true" />
            </AnimatedBox>
          </div>
        </div>
      </div>
      <Alert />
    </section>
  );
};

export default ContactForm;
