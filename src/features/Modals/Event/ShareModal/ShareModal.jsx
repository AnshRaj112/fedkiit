"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";
import { Check, Copy, Share2 } from "lucide-react";
import {
  FacebookShareButton,
  FacebookIcon,
  TwitterShareButton,
  TwitterIcon,
  WhatsappShareButton,
  WhatsappIcon,
  LinkedinShareButton,
  LinkedinIcon,
  TelegramShareButton,
  TelegramIcon,
} from "react-share";
import CloseButton from "../../../../components/CloseButton/CloseButton";
import style from "./styles/ShareModal.module.scss";

const NETWORKS = [
  { key: "whatsapp", label: "WhatsApp", Button: WhatsappShareButton, Icon: WhatsappIcon },
  { key: "twitter", label: "X", Button: TwitterShareButton, Icon: TwitterIcon },
  { key: "linkedin", label: "LinkedIn", Button: LinkedinShareButton, Icon: LinkedinIcon },
  { key: "telegram", label: "Telegram", Button: TelegramShareButton, Icon: TelegramIcon },
  { key: "facebook", label: "Facebook", Button: FacebookShareButton, Icon: FacebookIcon },
];

/**
 * Share sheet.
 *
 * The previous version carried `data-aos` attributes but never ran AOS.init(),
 * so aos.css held the panel at opacity: 0 - the overlay swallowed clicks and
 * the sheet looked broken. There is no AOS here, and the panel renders through
 * a portal so a card's `overflow: hidden` can never clip it.
 */
const Share = ({ onClose, urlpath, teamData }) => {
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  const value = urlpath || teamData?.teamCode || "";
  const heading = urlpath ? "Share this event" : teamData?.teamName || "Share";

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  const copy = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(value);
      } else {
        const area = document.createElement("textarea");
        area.value = value;
        area.style.position = "fixed";
        area.style.opacity = "0";
        document.body.appendChild(area);
        area.select();
        document.execCommand("copy");
        area.remove();
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const shareNative = async () => {
    try {
      await navigator.share({ title: heading, url: value });
    } catch {
      /* dismissed by the user */
    }
  };

  if (!mounted) return null;

  const canShareNatively =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  return createPortal(
    <div
      className={style.overlay}
      role="dialog"
      aria-modal="true"
      aria-label={heading}
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div className={style.panel}>
        <header className={style.header}>
          <h2 className={style.heading}>{heading}</h2>
          <CloseButton onClick={onClose} label="Close share sheet" />
        </header>

        <ul className={style.networks}>
          {NETWORKS.map(({ key, label, Button, Icon }) => (
            <li key={key}>
              <Button url={value} className={style.network}>
                <Icon size={40} round />
                <span className={style.networkLabel}>{label}</span>
              </Button>
            </li>
          ))}
        </ul>

        <div className={style.linkRow}>
          <span className={style.link} title={value}>
            {value}
          </span>
          <button type="button" className={style.copy} onClick={copy}>
            {copied ? (
              <Check size={15} aria-hidden="true" />
            ) : (
              <Copy size={15} aria-hidden="true" />
            )}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>

        {canShareNatively && (
          <button type="button" className={style.native} onClick={shareNative}>
            <Share2 size={16} aria-hidden="true" />
            More sharing options
          </button>
        )}
      </div>
    </div>,
    document.body
  );
};

Share.propTypes = {
  onClose: PropTypes.func,
  urlpath: PropTypes.string,
  teamData: PropTypes.object,
};

export default Share;
