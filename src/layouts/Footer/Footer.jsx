"use client";

import React from "react";
import {
  FaLinkedin,
  FaInstagram,
  FaYoutube,
} from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import Link from "next/link";
import { usePathname } from "next/navigation";
import logo from "../../assets/images/Logo/logo.svg";
import styles from "./styles/Footer.module.scss";

const EXPLORE = [
  { label: "Home", href: "/" },
  { label: "Events", href: "/Events" },
  { label: "Team", href: "/Team" },
  { label: "Alumni", href: "/Alumni" },
];

const COMMUNITY = [
  { label: "Contact", href: "/#Contact" },
  { label: "Blog", href: "http://medium.com/@fedkiit", external: true },
  { label: "Partners", href: "/#Sponser" },
];

const ABOUT = [
  { label: "Manifesto", href: "/Manifesto" },
  { label: "Team", href: "/Team" },
];

const LEGAL = [
  { label: "Terms", href: "/TermsAndConditions" },
  { label: "Privacy", href: "/PrivacyPolicy" },
];

const SOCIAL = [
  {
    key: "linkedin",
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/fedkiit/",
    Icon: FaLinkedin,
  },
  {
    key: "instagram",
    label: "Instagram",
    href: "https://www.instagram.com/fedkiit?igsh=amNpM3UxMjE1d3Iy",
    Icon: FaInstagram,
  },
  {
    key: "x",
    label: "X",
    href: "http://twitter.com/federation_kiit",
    Icon: FaXTwitter,
  },
  {
    key: "youtube",
    label: "YouTube",
    href: "https://youtube.com/@federationkiit",
    Icon: FaYoutube,
  },
];

function Column({ title, links, isOmega }) {
  return (
    <div className={styles.column}>
      <h4 className={styles.columnTitle}>{title}</h4>
      <ul className={styles.columnList}>
        {links.map((item) => (
          <li key={item.label}>
            {item.external ? (
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`${styles.link} ${isOmega ? styles.omegaLink : ""}`}
              >
                {item.label}
              </a>
            ) : (
              <Link
                href={item.href}
                className={`${styles.link} ${isOmega ? styles.omegaLink : ""}`}
              >
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function MarqueeMark() {
  return (
    <span className={styles.marqueeItem}>
      <img src="/fedkiit-logo.png" alt="" />
      <span>FED KIIT</span>
    </span>
  );
}

export default function Footer() {
  const pathname = usePathname() || "";
  const isOmega = pathname.includes("/Omega");
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.top}>
          <div className={styles.brand}>
            <Link href="/" className={styles.brandLockup}>
              <img
                className={styles.brandLogo}
                src="/fedkiit-logo.png"
                alt="FED KIIT"
              />
              <span className={styles.brandName}>FED KIIT</span>
            </Link>
            <p className={styles.tagline}>
              Federation of Entrepreneurship Development - building founders
              and ventures at KIIT.
            </p>
            <div className={styles.socials}>
              {SOCIAL.map(({ key, label, href, Icon }) => (
                <a
                  key={key}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  data-network={key}
                  className={`${styles.social} ${
                    isOmega ? styles.omegaSocialLink : ""
                  }`}
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>

          <nav className={styles.columns} aria-label="Footer">
            <Column title="Explore" links={EXPLORE} isOmega={isOmega} />
            <Column title="Community" links={COMMUNITY} isOmega={isOmega} />
            <Column title="About" links={ABOUT} isOmega={isOmega} />
            <Column title="Legal" links={LEGAL} isOmega={isOmega} />
          </nav>
        </div>

        <div className={styles.bottom}>
          <p className={styles.copy}>
            © {year} FED KIIT · Federation of Entrepreneurship Development
          </p>
          <p className={styles.built}>Built for founders.</p>
        </div>
      </div>

      <div className={styles.marquee} aria-hidden="true">
        <div className={styles.marqueeTrack}>
          {Array.from({ length: 8 }).map((_, i) => (
            <MarqueeMark key={i} />
          ))}
        </div>
      </div>
    </footer>
  );
}
