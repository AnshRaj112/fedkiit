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
        <div className={styles.circleCenter}></div>
        {/*
          A <div>, not a <p>: it wraps `div.fed`, which the parser will not keep
          inside a <p>. `.content` had no rule in the stylesheet — so this
          className resolved to `undefined` and did nothing — and now carries the
          same declarations as `.text p`, which is what actually styled it.
        */}
        <div className={styles.content}>
          Welcome to the social media page of <br />
          <div className={styles.fed}>
            <div className={styles.box} id={styles.box1}>
              <img
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
                src={linkedinlogo.src}
                alt="LinkedIn Logo"
              />
            </div>
          </div>
          <br />
        </div>
      </div>
      <div className={styles.socialMedia}>
        <div className={styles.container}>
          <div className={styles.leftColumn}>
            <div className={styles.sidebyside}>
              <div className={styles.instagramfeed}>
                <SocialEmbed type="instagramTopPost" />
              </div>
              <div>
                <SocialEmbed type="instagramBottomPost" />
                <div className={styles.circle}></div>
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
              <div className={styles.circle1}></div>
              <SocialEmbed type="linkedInPost" />
            </div>
          </div>
        </div>
      </div>
    </div>

  );
};

export default Social;
