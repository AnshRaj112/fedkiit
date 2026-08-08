"use client";

import React from "react";
import { ShareSocial } from "../../../../components/ShareSocial/ShareSocial";
import style from "./styles/ShareModal.module.scss";
import { X } from "lucide-react";

const Share = ({ onClose, urlpath, teamData }) => {
  const shareUrl = urlpath || teamData?.teamCode || "";
  const title = teamData?.teamName ? `Share ${teamData.teamName}` : "Share Event";

  return (
    <div className={style.shareContainer}>
      <div className={style.overlay} onClick={onClose} aria-hidden="true" />
      <div className={style.maindiv}>
        <div className={style.modalHeader}>
          <h3>{title}</h3>
          <button
            type="button"
            className={style.closebtn}
            onClick={onClose}
            aria-label="Close share dialog"
          >
            <X size={18} />
          </button>
        </div>

        <ShareSocial
          url={shareUrl}
          socialTypes={["whatsapp", "twitter", "telegram", "linkedin"]}
        />
      </div>
    </div>
  );
};

export default Share;
