"use client";

import { useState } from "react";
import styles from "./styles/AddEventForm.module.scss";
import {Button, Input} from "../../../../../components";

function AddEventForm() {
  const [eventName, setEventName] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [registrationType, setRegistrationType] = useState("");
  const [posterLink, setPosterLink] = useState("");

  const isFormValid = () => {
    if (
      eventName === "" ||
      eventDescription === "" ||
      registrationType === "" ||
      posterLink === ""
    ) {
      return false;
    }
    return true;
  };
  const isValidLink = posterLink.match(
    /(http(s?):)([/|.|\w|\s|-])*\.(?:jpg|gif|png)/g
  );

  const onAddEvent = (e) => {
    e.preventDefault();
    if (isFormValid()) {
      if (isValidLink) {
        alert("Event Added Successfully");
      } else {
        alert("Please enter valid link");
      }
    } else {
      alert("Please fill all the fields");
    }
  };

  return (
    <>
      <div className={styles.container}>
        <form className={styles.form}>
          <div className={styles.topSection}>
            <div className={styles.topSectionInputContainer}>
              <Input
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="Enter Event Name"
                label="Event Name"
                className={styles.EventInput}
              />
              <Input
                type="text"
                value={posterLink}
                onChange={(e) => setPosterLink(e.target.value)}
                placeholder="Poster Link"
                label="Event Poster"
                className={styles.EventInput}
              />
              <Input
                type="select"
                value={registrationType}
                onChange={(value) => setRegistrationType(value)}
                className={styles.EventInput}
                options={[
                  { label: "Free", value: "free" },
                  { label: "Paid", value: "paid" },
                ]}
                placeholder="Select Type"
                label="Registration Type"
              />
            </div>
            <div className={styles.topSectionInputContainer}>
              <Input
                type="textArea"
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                placeholder="Enter Event Description"
                label="Event Description"
                className={styles.EventInputArea}
              />
            </div>
          </div>

          {posterLink && isValidLink && (
            <div
              style={{
                marginBottom: "8px",
                overflow: "hidden",
                display: "flex",
                justifyContent: "center",
              }}
              className={styles.posterPreview}
            >
              <p>Poster Preview</p>
              <img
                src={posterLink}
                style={{
                  width: "100%",
                  height: "auto",
                  maxWidth: "300px",
                  objectFit: "contain",
                }}
                alt="Poster Preview"
              />
            </div>
          )}
        </form>
        <Button disabled={!isFormValid()} onClick={onAddEvent}>
          Add Event
        </Button>
      </div>
    </>
  );
}

export default AddEventForm;
