"use client";

import React, { useState } from "react";
import styles from "../styles/TeamManagement.module.scss";
import { IoMailOutline, IoLinkOutline, IoKeyOutline, IoCopyOutline, IoCheckmark, IoLogoWhatsapp } from "react-icons/io5";

const InviteSection = ({ onInviteEmail, onGetInviteLink, teamCode }) => {
    const [activeTab, setActiveTab] = useState("email");
    const [inviteEmail, setInviteEmail] = useState("");
    const [sendingEmail, setSendingEmail] = useState(false);

    // Link state
    const [inviteLinkData, setInviteLinkData] = useState(null);
    const [linkLoading, setLinkLoading] = useState(false);
    const [linkCopied, setLinkCopied] = useState(false);

    // [v2] Team Code tab commented out — users now join via browse/request flow
    // const [codeCopied, setCodeCopied] = useState(false);

    const handleSendEmail = async (e) => {
        e.preventDefault();
        if (!inviteEmail.trim()) return;

        setSendingEmail(true);
        try {
            await onInviteEmail(inviteEmail.trim());
            setInviteEmail("");
        } catch {
            // Error already handled in parent
        } finally {
            setSendingEmail(false);
        }
    };

    const handleGetLink = async () => {
        setLinkLoading(true);
        const data = await onGetInviteLink();
        if (data) {
            setInviteLinkData(data);
        }
        setLinkLoading(false);
    };

    const handleCopyLink = async () => {
        if (!inviteLinkData) return;
        try {
            await navigator.clipboard.writeText(inviteLinkData.inviteLink);
            setLinkCopied(true);
            setTimeout(() => setLinkCopied(false), 2000);
        } catch {
            // Fallback
        }
    };

    const handleShareWhatsApp = () => {
        if (!inviteLinkData) return;
        const text = encodeURIComponent(inviteLinkData.shareText);
        window.open(`https://wa.me/?text=${text}`, "_blank");
    };

    // [v2] Team Code copy handler commented out
    // const handleCopyCode = async () => {
    //     try {
    //         await navigator.clipboard.writeText(teamCode);
    //         setCodeCopied(true);
    //         setTimeout(() => setCodeCopied(false), 2000);
    //     } catch {
    //         // Fallback
    //     }
    // };

    const tabs = [
        { id: "email", label: "Email Invite", icon: <IoMailOutline /> },
        { id: "link", label: "Share Link", icon: <IoLinkOutline /> },
        // [v2] Team Code tab removed — users join via browse/request flow
        // { id: "code", label: "Team Code", icon: <IoKeyOutline /> },
    ];

    return (
        <div className={styles.inviteSection}>
            {/* Tabs */}
            <div className={styles.inviteTabs}>
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        className={`${styles.inviteTab} ${activeTab === tab.id ? styles.activeTab : ""}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.icon}
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className={styles.inviteContent}>
                {/* Email Tab */}
                {activeTab === "email" && (
                    <form onSubmit={handleSendEmail} className={styles.emailForm}>
                        <input
                            type="email"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            placeholder="teammate@kiit.ac.in"
                            className={styles.emailInput}
                            required
                            disabled={sendingEmail}
                        />
                        <button
                            type="submit"
                            className={styles.sendButton}
                            disabled={sendingEmail || !inviteEmail.trim()}
                        >
                            {sendingEmail ? "Sending..." : "Send Invite"}
                        </button>
                    </form>
                )}

                {/* Link Tab */}
                {activeTab === "link" && (
                    <div className={styles.linkContent}>
                        {!inviteLinkData ? (
                            <button
                                className={styles.generateLinkButton}
                                onClick={handleGetLink}
                                disabled={linkLoading}
                            >
                                {linkLoading ? "Generating..." : "Generate Invite Link"}
                            </button>
                        ) : (
                            <div className={styles.linkDisplay}>
                                <div className={styles.linkText}>{inviteLinkData.inviteLink}</div>
                                <div className={styles.linkActions}>
                                    <button
                                        className={styles.copyLinkButton}
                                        onClick={handleCopyLink}
                                    >
                                        {linkCopied ? (
                                            <>
                                                <IoCheckmark /> Copied!
                                            </>
                                        ) : (
                                            <>
                                                <IoCopyOutline /> Copy Link
                                            </>
                                        )}
                                    </button>
                                    <button
                                        className={styles.whatsappButton}
                                        onClick={handleShareWhatsApp}
                                    >
                                        <IoLogoWhatsapp /> WhatsApp
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* [v2] Code Tab commented out — users join via browse/request flow
                {activeTab === "code" && (
                    <div className={styles.codeContent}>
                        <p className={styles.codeLabel}>
                            Share this code with your teammates. They can enter it when selecting "Join Team" during registration.
                        </p>
                        <div className={styles.codeDisplay}>
                            <span className={styles.codeText}>{teamCode}</span>
                            <button className={styles.copyCodeButton} onClick={handleCopyCode}>
                                {codeCopied ? (
                                    <>
                                        <IoCheckmark /> Copied!
                                    </>
                                ) : (
                                    <>
                                        <IoCopyOutline /> Copy
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
                */}
            </div>
        </div>
    );
};

export default InviteSection;
