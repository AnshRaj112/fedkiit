"use client";

import React, { useState, useEffect, useContext, useCallback } from "react";

import AuthContext from "../../context/AuthContext";
import { api } from "../../services";
import { Alert, ComponentLoading } from "../../microInteraction";
import { Button } from "../../components/Core";
import MemberCard from "./components/MemberCard";
import InviteSection from "./components/InviteSection";
import ConfirmDialog from "./components/ConfirmDialog";
import TeamlessState from "./components/TeamlessState";
import styles from "./styles/TeamManagement.module.scss";
import { IoArrowBack, IoCopyOutline, IoCheckmark } from "react-icons/io5";
import { FiEdit2, FiCheck, FiX } from "react-icons/fi";
import { useRouter, useParams, useSearchParams } from "next/navigation";

const TeamManagement = () => {
    const { eventId: formId } = useParams();
    const router = useRouter();
    // Not `const [searchParams] = useSearchParams()`: that is React Router's
    // shape. Next returns a ReadonlyURLSearchParams directly, and because it is
    // iterable the array destructuring silently took the first [key, value]
    // entry — `undefined` when the URL has no query string, hence
    // "Cannot read properties of undefined (reading 'get')".
    const searchParams = useSearchParams();
    const authCtx = useContext(AuthContext);

    const [teamData, setTeamData] = useState(null);
    const [isTeamless, setIsTeamless] = useState(false);
    const [teamlessInfo, setTeamlessInfo] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Rename state
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState("");
    const [renameLoading, setRenameLoading] = useState(false);

    // Copy state
    const [codeCopied, setCodeCopied] = useState(false);

    // Confirm dialog state
    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        title: "",
        message: "",
        confirmText: "",
        onConfirm: () => { },
    });

    const isLeader = teamData?.leaderEmail === authCtx.user?.email;
    const isRegistrationOpen = !teamData?.isRegistrationClosed && !teamData?.isEventPast;
    const spotsRemaining = teamData ? teamData.maxTeamSize - teamData.teamSize : 0;

    // [v2] Handle toast params from email action redirects
    useEffect(() => {
        const toast = searchParams.get("toast");
        const name = searchParams.get("name");
        const reason = searchParams.get("reason");
        if (toast) {
            const toastMessages = {
                joined: { type: "success", message: `${name || "User"} has been added to the team! 🎉` },
                rejected: { type: "info", message: `${name || "User"}'s join request was declined.` },
                expired: { type: "warning", message: "This request has expired." },
                already_accepted: { type: "info", message: "This request was already accepted." },
                already_rejected: { type: "info", message: "This request was already declined." },
                already_joined: { type: "info", message: `${name || "This user"} has already joined another team.` },
                team_full: { type: "warning", message: `Team is full. ${name || "The user"} could not be added.` },
                invalid: { type: "error", message: "Invalid request." },
                // Set by PreviewForm when an invite link's auto-join fails after
                // registration. `reason` is the API's own message ("This team is
                // full", "Invalid team code", ...) so the user is told why they
                // are looking at the team search instead of their invited team.
                join_failed: {
                    type: "warning",
                    message: reason
                        ? `${reason} You can join another team below.`
                        : "Couldn't join that team. You can join another team below.",
                },
            };
            const t = toastMessages[toast];
            if (t) {
                Alert({ type: t.type, message: t.message, position: "top-right" });
            }
            // Clean URL params after showing toast.
            //
            // The original mutated the params object and handed it back to
            // React Router's setter. Next's is a *read-only* view with no
            // setter, so the equivalent is a copy plus a replace — same result:
            // the toast does not fire again on refresh, and no history entry is
            // added.
            const next = new URLSearchParams(searchParams.toString());
            next.delete("toast");
            next.delete("name");
            next.delete("reason");
            const query = next.toString();
            router.replace(
                `${window.location.pathname}${query ? `?${query}` : ""}`,
                { scroll: false },
            );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run once on mount

    const fetchTeamDetails = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await api.get(`/api/form/teamDetails/${formId}`);
            if (response.data?.success) {
                const data = response.data.data;
                // [v2] Check if teamless
                if (data.isTeamless) {
                    setIsTeamless(true);
                    setTeamlessInfo(data);
                    setTeamData(null);
                } else {
                    setIsTeamless(false);
                    setTeamlessInfo(null);
                    setTeamData(data);
                    setEditName(data.teamName);
                }
            }
        } catch (err) {
            console.error("Error fetching team details:", err);
            const msg = err.response?.data?.message || "Failed to load team details";
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    }, [formId]);

    useEffect(() => {
        fetchTeamDetails();
    }, [fetchTeamDetails]);

    // Copy team code
    const handleCopyCode = async () => {
        try {
            await navigator.clipboard.writeText(teamData.teamCode);
            setCodeCopied(true);
            setTimeout(() => setCodeCopied(false), 2000);
        } catch {
            Alert({ type: "error", message: "Failed to copy", position: "top-right" });
        }
    };

    // Rename team
    const handleRenameSubmit = async () => {
        const trimmed = editName.trim();
        if (!trimmed) {
            Alert({ type: "error", message: "Team name cannot be empty", position: "top-right" });
            return;
        }
        if (trimmed.toUpperCase() === teamData.teamName) {
            setIsEditing(false);
            return;
        }

        setRenameLoading(true);
        try {
            const response = await api.patch("/api/form/renameTeam", {
                formId,
                newTeamName: trimmed,
            });
            if (response.data?.success) {
                Alert({ type: "success", message: `Team renamed to "${response.data.data.teamName}"`, position: "top-right" });
                setIsEditing(false);
                fetchTeamDetails();
            }
        } catch (err) {
            const msg = err.response?.data?.message || "Failed to rename team";
            Alert({ type: "error", message: msg, position: "top-right" });
        } finally {
            setRenameLoading(false);
        }
    };

    const handleRenameCancel = () => {
        setEditName(teamData.teamName);
        setIsEditing(false);
    };

    // Leave team
    const handleLeaveTeam = () => {
        const isSoloLeader = isLeader && teamData.teamSize === 1;

        setConfirmDialog({
            isOpen: true,
            title: isSoloLeader ? "Dissolve Team" : "Leave Team",
            message: isSoloLeader
                ? `Dissolve "${teamData.teamName}"? You'll remain registered but can create or join another team.`
                : `Leave "${teamData.teamName}"? You'll remain registered and can create or join another team.`,
            confirmText: isSoloLeader ? "Dissolve Team" : "Leave Team",
            onConfirm: async () => {
                try {
                    const response = await api.post("/api/form/leaveTeam", { formId });
                    if (response.data?.success) {
                        Alert({ type: "success", message: response.data.message, position: "top-right" });
                        // Refresh to show TeamlessState
                        fetchTeamDetails();
                    }
                } catch (err) {
                    const msg = err.response?.data?.message || "Failed to leave team";
                    Alert({ type: "error", message: msg, position: "top-right" });
                }
                setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
            },
        });
    };

    // Remove member
    const handleRemoveMember = (memberEmail, memberName) => {
        setConfirmDialog({
            isOpen: true,
            title: "Remove Team Member",
            message: `Remove ${memberName} from the team?`,
            confirmText: "Remove Member",
            onConfirm: async () => {
                try {
                    const response = await api.post("/api/form/removeTeamMember", { formId, memberEmail });
                    if (response.data?.success) {
                        Alert({ type: "success", message: response.data.message, position: "top-right" });
                        fetchTeamDetails();
                    }
                } catch (err) {
                    const msg = err.response?.data?.message || "Failed to remove member";
                    Alert({ type: "error", message: msg, position: "top-right" });
                }
                setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
            },
        });
    };

    // Invite email
    const handleInviteEmail = async (inviteeEmail) => {
        try {
            const response = await api.post("/api/form/inviteTeamMember", {
                formId,
                inviteeEmail,
            });
            if (response.data?.success) {
                Alert({ type: "success", message: response.data.message, position: "top-right" });
            }
        } catch (err) {
            const msg = err.response?.data?.message || "Failed to send invitation";
            Alert({ type: "error", message: msg, position: "top-right" });
            throw err; // Re-throw to let InviteSection handle UI updates
        }
    };

    // Get invite link
    const handleGetInviteLink = async () => {
        try {
            const response = await api.get(`/api/form/inviteLink/${formId}`);
            return response.data?.data;
        } catch (err) {
            const msg = err.response?.data?.message || "Failed to get invite link";
            Alert({ type: "error", message: msg, position: "top-right" });
            return null;
        }
    };

    if (isLoading) {
        return (
            <ComponentLoading
                customStyles={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    marginTop: "10rem",
                    marginBottom: "10rem",
                    justifyContent: "center",
                    alignItems: "center",
                }}
            />
        );
    }

    if (error) {
        return (
            <div className={styles.container}>
                <div className={styles.errorState}>
                    <h2>Unable to load team</h2>
                    <p>{error}</p>
                    <Button onClick={() => router.back()} variant="primary">
                        Go Back
                    </Button>
                </div>
            </div>
        );
    }

    if (!teamData && !isTeamless) return null;

    // [v2] Teamless state — show create/browse UI
    if (isTeamless && teamlessInfo) {
        return (
            <div className={styles.container}>
                <button className={styles.backButton} onClick={() => router.back()}>
                    <IoArrowBack /> Back to Event
                </button>
                <TeamlessState
                    formId={formId}
                    eventTitle={teamlessInfo.eventTitle}
                    maxTeamSize={teamlessInfo.maxTeamSize}
                    onTeamJoined={fetchTeamDetails}
                />
            </div>
        );
    }

    if (!teamData) return null;

    return (
        <div className={styles.container}>
            {/* Back Navigation */}
            <button className={styles.backButton} onClick={() => router.back()}>
                <IoArrowBack /> Back to Event
            </button>

            {/* Header Card */}
            <div className={styles.headerCard}>
                <div className={styles.headerTop}>
                    <h1 className={styles.eventTitle}>{teamData.eventTitle}</h1>
                    {!isRegistrationOpen && (
                        <span className={styles.closedBadge}>Registration Closed</span>
                    )}
                </div>

                <div className={styles.teamInfo}>
                    <div className={styles.teamNameRow}>
                        {isEditing ? (
                            <div className={styles.editNameGroup}>
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className={styles.editNameInput}
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") handleRenameSubmit();
                                        if (e.key === "Escape") handleRenameCancel();
                                    }}
                                    disabled={renameLoading}
                                />
                                <button
                                    className={styles.editAction}
                                    onClick={handleRenameSubmit}
                                    disabled={renameLoading}
                                    title="Save"
                                >
                                    <FiCheck />
                                </button>
                                <button
                                    className={styles.editActionCancel}
                                    onClick={handleRenameCancel}
                                    disabled={renameLoading}
                                    title="Cancel"
                                >
                                    <FiX />
                                </button>
                            </div>
                        ) : (
                            <>
                                <h2 className={styles.teamName}>Team: {teamData.teamName}</h2>
                                {isLeader && isRegistrationOpen && (
                                    <button
                                        className={styles.editButton}
                                        onClick={() => setIsEditing(true)}
                                        title="Rename team"
                                    >
                                        <FiEdit2 />
                                    </button>
                                )}
                            </>
                        )}
                    </div>

                    <div className={styles.teamMeta}>
                        <div className={styles.metaItem}>
                            <span className={styles.metaLabel}>Team Code</span>
                            <button className={styles.codeBadge} onClick={handleCopyCode} title="Copy team code">
                                <span>{teamData.teamCode}</span>
                                {codeCopied ? <IoCheckmark /> : <IoCopyOutline />}
                            </button>
                        </div>
                        <div className={styles.metaItem}>
                            <span className={styles.metaLabel}>Members</span>
                            <span className={styles.metaValue}>
                                {teamData.teamSize}/{teamData.maxTeamSize}
                            </span>
                        </div>
                        <div className={styles.metaItem}>
                            <span className={styles.metaLabel}>Min Required</span>
                            <span className={styles.metaValue}>{teamData.minTeamSize}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Members Section */}
            <div className={styles.section}>
                <h3 className={styles.sectionTitle}>
                    Team Members ({teamData.teamSize})
                </h3>
                <div className={styles.memberGrid}>
                    {teamData.members.map((member) => (
                        <MemberCard
                            key={member.email}
                            member={member}
                            isCurrentUserLeader={isLeader} // Use derived isLeader for the current user to show remove buttons
                            isCardLeader={member.email === teamData.leaderEmail} // To show the crown badge
                            isCurrentUser={member.email === authCtx.user?.email}
                            onRemove={handleRemoveMember}
                            isRegistrationOpen={isRegistrationOpen}
                        />
                    ))}
                </div>
            </div>

            {/* Invite Section — Leader Only, Team Not Full, Registration Open */}
            {isLeader && spotsRemaining > 0 && isRegistrationOpen && (
                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>
                        Add Team Members ({spotsRemaining} {spotsRemaining === 1 ? "spot" : "spots"} remaining)
                    </h3>
                    <InviteSection
                        onInviteEmail={handleInviteEmail}
                        onGetInviteLink={handleGetInviteLink}
                        teamCode={teamData.teamCode}
                    />
                </div>
            )}

            {/* Action Footer */}
            <div className={styles.actionFooter}>
                {/* Non-leader: Leave Team */}
                {!isLeader && isRegistrationOpen && (
                    <button className={styles.dangerButton} onClick={handleLeaveTeam}>
                        Leave Team
                    </button>
                )}

                {/* Leader, sole member: Dissolve Team */}
                {isLeader && teamData.teamSize === 1 && isRegistrationOpen && (
                    <button className={styles.dangerButton} onClick={handleLeaveTeam}>
                        Dissolve Team
                    </button>
                )}

                {/* Leader with members: Info message */}
                {isLeader && teamData.teamSize > 1 && isRegistrationOpen && (
                    <p className={styles.leaderNote}>
                        As the team leader, you must remove all members before you can leave the team.
                    </p>
                )}

                {!isRegistrationOpen && (
                    <p className={styles.closedNote}>
                        Registration is closed. Team changes are no longer allowed.
                    </p>
                )}
            </div>

            {/* Confirm Dialog */}
            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title={confirmDialog.title}
                message={confirmDialog.message}
                confirmText={confirmDialog.confirmText}
                onConfirm={confirmDialog.onConfirm}
                onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
};

export default TeamManagement;
