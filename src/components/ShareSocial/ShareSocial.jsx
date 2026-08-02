"use client";

import { useState } from "react";
import {
  FacebookShareButton,
  FacebookIcon,
  TwitterShareButton,
  TwitterIcon,
  WhatsappShareButton,
  WhatsappIcon,
  RedditShareButton,
  RedditIcon,
  LinkedinShareButton,
  LinkedinIcon,
  TelegramShareButton,
  TelegramIcon,
  EmailShareButton,
  EmailIcon,
} from "react-share";

/**
 * Drop-in replacement for `react-share-social`'s <ShareSocial />.
 *
 * The original package is unmaintained, predates React 19 (it had to be
 * installed with --legacy-peer-deps) and bundles an ancient jest toolchain that
 * accounted for roughly half of this project's high-severity npm advisories.
 *
 * The props and the `style` object are kept identical — `{ root, copyContainer,
 * copyUrl, title }` — so ShareModal only had to change its import, and the
 * rendered panel keeps the same dark card, orange accent and round social
 * icons the original produced.
 */

const BUTTONS = {
  facebook: { Button: FacebookShareButton, Icon: FacebookIcon },
  twitter: { Button: TwitterShareButton, Icon: TwitterIcon },
  whatsapp: { Button: WhatsappShareButton, Icon: WhatsappIcon },
  reddit: { Button: RedditShareButton, Icon: RedditIcon },
  linkedin: { Button: LinkedinShareButton, Icon: LinkedinIcon },
  telegram: { Button: TelegramShareButton, Icon: TelegramIcon },
  email: { Button: EmailShareButton, Icon: EmailIcon },
};

export function ShareSocial({
  url = "",
  title,
  style = {},
  socialTypes = ["facebook", "twitter", "whatsapp", "reddit", "linkedin"],
  onSocialButtonClicked,
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      // `navigator.clipboard` needs a secure context; fall back to the legacy
      // execCommand path so copying still works over plain http in dev.
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
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div style={style.root}>
      {title ? <div style={style.title}>{title}</div> : null}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.75rem",
          flexWrap: "wrap",
        }}
      >
        {socialTypes
          .map((type) => [type, BUTTONS[type]])
          .filter(([, entry]) => entry)
          .map(([type, { Button, Icon }]) => (
            <Button
              key={type}
              url={url}
              onClick={() => onSocialButtonClicked?.({ social: type, url })}
              // react-share renders a <button>; strip the UA styling so the
              // icons sit flush like the original widget's did.
              style={{
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
              }}
            >
              <Icon size={40} round />
            </Button>
          ))}
      </div>

      <div style={style.copyContainer}>
        <div
          style={{
            ...style.copyUrl,
            whiteSpace: "nowrap",
            overflowX: "auto",
            fontSize: "0.85rem",
          }}
          title={url}
        >
          {url}
        </div>
        <button
          type="button"
          onClick={copy}
          style={{
            marginTop: "0.5rem",
            width: "100%",
            padding: "0.35rem",
            borderRadius: "4px",
            border: "1px solid #f97507",
            background: "transparent",
            color: "#f97507",
            cursor: "pointer",
            fontSize: "0.8rem",
          }}
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );
}

export default ShareSocial;
