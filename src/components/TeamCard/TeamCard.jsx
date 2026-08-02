"use client";

import React, { useContext, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { FaLinkedin, FaGithub } from "react-icons/fa";
import styles from "./styles/TeamCard.module.scss";
import { Button } from "../Core";
import AuthContext from "../../context/AuthContext";

const ACCESS_LABELS = {
  PRESIDENT: "President",
  VICEPRESIDENT: "Vice President",
};

const formatAccess = (access = "") => {
  if (ACCESS_LABELS[access]) return ACCESS_LABELS[access];
  return access
    .replace(/^SENIOR_EXECUTIVE_/, "")
    .replace(/^DEPUTY_DIRECTOR_/, "Deputy Director · ")
    .replace(/^DIRECTOR_/, "Director · ")
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ")
    .replace("Pr And Finance", "PR & Finance")
    .replace("Human Resource", "Human Resources");
};

const initialsFor = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const withProtocol = (url = "") => {
  const value = typeof url === "string" ? url.trim() : "";
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
};

const readExtra = (raw) => {
  if (!raw) return {};
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) || {};
    } catch {
      return {};
    }
  }
  return raw;
};

const TeamCard = ({ member, customStyles = {}, onUpdate, onRemove }) => {
  const authCtx = useContext(AuthContext);
  const [imgFailed, setImgFailed] = useState(false);

  const extra = readExtra(member?.extra);
  const photo = member?.img?.trim?.() || "";
  const showPhoto = Boolean(photo) && !imgFailed;
  const role =
    extra.designation?.trim?.() || formatAccess(member?.access || "");
  const initials = useMemo(() => initialsFor(member?.name), [member?.name]);
  const linkedin = withProtocol(extra.linkedin);
  const github = withProtocol(extra.github);
  const bio = extra.know?.trim?.() || "";
  const isAdmin = authCtx?.user?.access === "ADMIN";
  const hasSocials = Boolean(linkedin || github);

  const socialLinks = (
    <div className={styles.socials}>
      {linkedin ? (
        <a
          href={linkedin}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${member?.name} on LinkedIn`}
          data-network="linkedin"
          className={styles.social}
        >
          <FaLinkedin />
        </a>
      ) : (
        <span
          className={`${styles.social} ${styles.socialMuted}`}
          data-network="linkedin"
          title="LinkedIn not added"
          aria-hidden="true"
        >
          <FaLinkedin />
        </span>
      )}
      {github ? (
        <a
          href={github}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${member?.name} on GitHub`}
          data-network="github"
          className={styles.social}
        >
          <FaGithub />
        </a>
      ) : (
        <span
          className={`${styles.social} ${styles.socialMuted}`}
          data-network="github"
          title="GitHub not added"
          aria-hidden="true"
        >
          <FaGithub />
        </span>
      )}
    </div>
  );

  return (
    <article className={`${styles.card} ${customStyles.teamMember || ""}`}>
      <div className={styles.media}>
        {showPhoto ? (
          <img
            src={photo}
            alt=""
            className={styles.photo}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className={styles.fallback} aria-hidden="true">
            <span>{initials}</span>
          </div>
        )}

        <div className={styles.overlay}>
          {bio ? (
            <p className={styles.bio}>{bio}</p>
          ) : (
            <p className={styles.bioEmpty}>
              {hasSocials
                ? `Connect with ${member?.name?.split(" ")[0] || "them"}`
                : "Bio and socials coming soon"}
            </p>
          )}
          {socialLinks}
        </div>
      </div>

      <div className={styles.body}>
        <h3 className={styles.name} title={member?.name}>
          {member?.name || "Member"}
        </h3>
        {role && <p className={styles.role}>{role}</p>}

        {isAdmin && (onUpdate || onRemove) && (
          <div className={styles.adminRow}>
            {onUpdate && (
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  authCtx.memberData = member;
                  onUpdate();
                }}
              >
                Update
              </Button>
            )}
            {onRemove && (
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  const ok = window.confirm(
                    `Remove member "${member?.name}"?`
                  );
                  if (ok) {
                    authCtx.memberData = member;
                    onRemove();
                  }
                }}
              >
                Remove
              </Button>
            )}
          </div>
        )}
      </div>
    </article>
  );
};

TeamCard.propTypes = {
  member: PropTypes.object.isRequired,
  customStyles: PropTypes.object,
  onUpdate: PropTypes.func,
  onRemove: PropTypes.func,
};

export default TeamCard;
