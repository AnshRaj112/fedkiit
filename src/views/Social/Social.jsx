"use client";

import { useEffect, useState } from "react";
import { SocialEmbed } from "../../components";
import linkedinlogo from "../../assets/images/SocialMedia/linkedinLogo.svg";
import instalogo from "../../assets/images/SocialMedia/instaLogo.svg";
import styles from "./styles/Social.module.scss";
import { ComponentLoading } from "../../microInteraction";

const Social = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);



  return (

    <div className={styles.socialMcontainer}>
      <div className={styles.text}>
        <p className={styles.content}>
          Welcome to the social media page of <br />
          <div className={styles.fed}>
            <div className={styles.box} id={styles.box1}>
              <img
                className={styles.instalogo}
                src={instalogo.src}
                alt="Instagram Logo"
              />
              <span
                style={{
                  background: "var(--primary)",
                  WebkitBackgroundClip: "text",
                  color: "transparent",
                }}
              >
                {" "}
                FED{" "}
              </span>
              <img
                className={styles.linkedinlogo}
                src={linkedinlogo.src}
                alt="LinkedIn Logo"
              />
            </div>
          </div>
          <br />
        </p>
      </div>
      <div className={styles.socialMedia}>
        <div className={styles.container}>
          <div className={styles.leftColumn}>
            <div className={styles.sidebyside}>
              <div className={styles.instagramfeed}>
                <SocialEmbed type="instagramTopPost" />
              </div>
              <div className={styles.instagramfeed2}>
                <SocialEmbed type="instagramBottomPost" />
              </div>
            </div>
          </div>
          <div className={styles.centerColumn}>
            <div className={styles.instagramreel}>
              <SocialEmbed type="instagramReel" />
            </div>
          </div>
          <div className={styles.rightColumn}>
            <div className={styles.linkedinfeed}>
              <SocialEmbed type="linkedInPost" />
            </div>
          </div>
        </div>
      </div>
    </div>

  );
};

export default Social;
