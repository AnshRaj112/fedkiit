"use client";

import React from "react";
import styles from "../styles/TeamManagement.module.scss";
import { FaCrown, FaTrash } from "react-icons/fa";

const MemberCard = ({ member, isCurrentUserLeader, isCardLeader, isCurrentUser, onRemove, isRegistrationOpen }) => {
    // Generate initials for avatar fallback
    const initials = member.name
        ? member.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
        : "?";

    return (
        <div
            className={`${styles.memberCard} ${isCurrentUser ? styles.currentUser : ""}`}
        >
            <div className={styles.memberAvatar}>
                {member.img ? (
                    <img src={member.img} alt={member.name} />
                ) : (
                    <div className={styles.avatarFallback}>{initials}</div>
                )}
                {isCardLeader && (
                    <span className={styles.leaderBadge} title="Team Leader">
                        <FaCrown />
                    </span>
                )}
            </div>

            <div className={styles.memberInfo}>
                <div className={styles.memberNameRow}>
                    <span className={styles.memberName}>{member.name || "Unknown"}</span>
                    {isCurrentUser && <span className={styles.youBadge}>You</span>}
                </div>
                <span className={styles.memberEmail}>{member.email}</span>
                {(member.college || member.year) && (
                    <span className={styles.memberMeta}>
                        {[member.year, member.college].filter(Boolean).join(" • ")}
                    </span>
                )}
            </div>

            {isCurrentUserLeader && !isCurrentUser && isRegistrationOpen && onRemove && (
                <button
                    className={styles.removeMemberButton}
                    onClick={() => onRemove(member.email, member.name)}
                    title="Remove member"
                >
                    <FaTrash />
                </button>
            )}
        </div>
    );
};

export default MemberCard;
