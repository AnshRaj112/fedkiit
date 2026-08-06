"use client";

/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import { Check, Copy } from "lucide-react";
import {
  FacebookShareButton,
  TwitterShareButton,
  LinkedinShareButton,
  WhatsappShareButton,
  FacebookIcon,
  TwitterIcon,
  LinkedinIcon,
  WhatsappIcon,
} from "react-share";
import styles from "./styles/ShareTeamData.module.scss";
import CloseButton from "../../../../components/CloseButton/CloseButton";
import JSConfetti from "js-confetti";

// Constructed lazily rather than at module scope: JSConfetti touches `document`
// in its constructor, which runs during server rendering under Next.js.
let jsConfettiInstance = null;
const getJsConfetti = () => {
  if (typeof document === "undefined") return null;
  jsConfettiInstance ??= new JSConfetti();
  return jsConfettiInstance;
};

const ShareTeamData = ({ onClose, teamData, successMessage }) => {
  const { teamName, teamCode } = teamData;
  const [copied, setCopied] = useState(false);

  const message = `Congratulations! Your team \"${teamName}\" with code \"${teamCode}\" has been successfully registered!🎉🎉`;
  // Read after mount - `window` does not exist during server rendering.
  const [websiteUrl, setWebsiteUrl] = useState("");
  useEffect(() => setWebsiteUrl(window.location.href), []);

  useEffect(() => {
    // Trigger confetti effect when the modal opens
    getJsConfetti()?.addConfetti({
      confettiColors: ["#FF8A00", "#FFD700", "#FF4500", "#FF69B4"],
    });
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleCopy = () => {
    const textToCopy = `Team Name: ${teamName}\nTeam Code: ${teamCode}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 4000); // Reset button text after 4 seconds
  };

  const handleClose = () => {
    document.body.style.overflow = ""; // Re-enable scrolling
    onClose();
  };

  const heading = successMessage ? "Registration successful" : "Your team info";

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label={heading}>
      <div className={styles.panel}>
        <header className={styles.header}>
          <h2 className={styles.title}>{heading}</h2>
          <CloseButton
            onClick={handleClose}
            label="Close team details"
            className={styles.closebtn}
          />
        </header>

        {teamName && teamCode && (
          <div>
            <div className={styles.teamCard}>
              <dl className={styles.teamFields}>
                <div className={styles.field}>
                  <dt className={styles.fieldLabel}>Team</dt>
                  <dd className={styles.fieldValue}>{teamName}</dd>
                </div>
                <div className={styles.field}>
                  <dt className={styles.fieldLabel}>Code</dt>
                  <dd className={`${styles.fieldValue} ${styles.teamCode}`}>
                    {teamCode}
                  </dd>
                </div>
              </dl>
              <button
                type="button"
                onClick={handleCopy}
                className={styles.copyButton}
              >
                {copied ? (
                  <Check size={15} aria-hidden="true" />
                ) : (
                  <Copy size={15} aria-hidden="true" />
                )}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>

            <p className={styles.shareLabel}>Share the news</p>
            <ul className={styles.networks}>
              <li>
                <WhatsappShareButton
                  url={websiteUrl}
                  title={message}
                  separator=":: "
                  className={styles.network}
                >
                  <WhatsappIcon size={40} round />
                  <span className={styles.networkLabel}>WhatsApp</span>
                </WhatsappShareButton>
              </li>
              <li>
                <TwitterShareButton
                  url={websiteUrl}
                  title={message}
                  hashtags={["TeamSuccess"]}
                  className={styles.network}
                >
                  <TwitterIcon size={40} round />
                  <span className={styles.networkLabel}>X</span>
                </TwitterShareButton>
              </li>
              <li>
                <LinkedinShareButton
                  url={websiteUrl}
                  title="Team Success"
                  summary={message}
                  source="YourApp"
                  className={styles.network}
                >
                  <LinkedinIcon size={40} round />
                  <span className={styles.networkLabel}>LinkedIn</span>
                </LinkedinShareButton>
              </li>
              <li>
                <FacebookShareButton
                  url={websiteUrl}
                  quote={message}
                  hashtag="#TeamSuccess"
                  className={styles.network}
                >
                  <FacebookIcon size={40} round />
                  <span className={styles.networkLabel}>Facebook</span>
                </FacebookShareButton>
              </li>
            </ul>
          </div>
        )}

        {successMessage && (
          <p className={styles.message}>
            {successMessage.successMessage
              .trim()
              .split(/\s+/)
              .map((word, index) => {
                const urlPattern = /(https?:\/\/[^\s]+)/;
                const match = word.match(urlPattern);

                if (match) {
                  return (
                    <React.Fragment key={index}>
                      <br />
                      <br />
                      <a
                        href={match[0]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.messageLink}
                      >
                        {match[0]}
                      </a>
                      <br />
                      <br />
                    </React.Fragment>
                  );
                }
                return <React.Fragment key={index}>{word} </React.Fragment>;
              })}
          </p>
        )}
      </div>
    </div>
  );
};

export default ShareTeamData;
