"use client";

import { useState } from "react";
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
import { Copy, Check } from "lucide-react";

const XIconCustom = ({ size = 44, round = true }) => {
  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: round ? "50%" : "0px",
        backgroundColor: "#000000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#ffffff"
      }}
    >
      <svg
        viewBox="0 0 24 24"
        width={`${size * 0.5}px`}
        height={`${size * 0.5}px`}
        fill="currentColor"
      >
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    </div>
  );
};

const BUTTONS = {
  whatsapp: { Button: WhatsappShareButton, Icon: WhatsappIcon, label: "WhatsApp" },
  twitter: { Button: TwitterShareButton, Icon: XIconCustom, label: "X" },
  telegram: { Button: TelegramShareButton, Icon: TelegramIcon, label: "Telegram" },
  linkedin: { Button: LinkedinShareButton, Icon: LinkedinIcon, label: "LinkedIn" },
  facebook: { Button: FacebookShareButton, Icon: FacebookIcon, label: "Facebook" },
};

export function ShareSocial({
  url = "",
  title,
  socialTypes = ["whatsapp", "twitter", "telegram", "linkedin"],
  onSocialButtonClicked,
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
      } else {
        const area = document.createElement("textarea");
        area.value = url;
        area.style.position = "fixed";
        area.style.opacity = "0";
        document.body.appendChild(area);
        area.select();
        document.execCommand("copy");
        area.remove();
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", width: "100%" }}>
      {title ? (
        <div style={{ color: "#a0a0a0", fontSize: "0.875rem", marginBottom: "-0.5rem" }}>
          {title}
        </div>
      ) : null}

      {/* Social Media Buttons */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
          gap: "0.75rem",
          padding: "0.5rem 0",
        }}
      >
        {socialTypes
          .map((type) => [type, BUTTONS[type]])
          .filter(([, entry]) => entry)
          .map(([type, { Button, Icon, label }]) => (
            <Button
              key={type}
              url={url}
              onClick={() => onSocialButtonClicked?.({ social: type, url })}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.35rem",
                transition: "transform 0.2s ease",
              }}
              title={`Share on ${label}`}
            >
              <Icon size={44} round />
              <span style={{ fontSize: "0.7rem", color: "#888888", fontWeight: 500 }}>
                {label}
              </span>
            </Button>
          ))}
      </div>

      {/* Copy URL Input Box */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          background: "rgba(255, 255, 255, 0.04)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: "12px",
          padding: "0.4rem 0.4rem 0.4rem 0.85rem",
          gap: "0.5rem",
        }}
      >
        <div
          style={{
            flex: 1,
            fontSize: "0.85rem",
            color: "#e0e0e0",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            userSelect: "all",
          }}
          title={url}
        >
          {url}
        </div>
        <button
          type="button"
          onClick={copy}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            padding: "0.55rem 1rem",
            borderRadius: "8px",
            border: "none",
            background: copied ? "#22c55e" : "#ff5500",
            color: "#ffffff",
            fontWeight: 600,
            fontSize: "0.8125rem",
            cursor: "pointer",
            transition: "all 0.2s ease",
            whiteSpace: "nowrap",
            boxShadow: copied
              ? "0 4px 12px rgba(34, 197, 94, 0.3)"
              : "0 4px 12px rgba(255, 85, 0, 0.3)",
          }}
        >
          {copied ? (
            <>
              <Check size={14} /> Copied!
            </>
          ) : (
            <>
              <Copy size={14} /> Copy Link
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default ShareSocial;
