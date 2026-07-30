"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { api } from "../../../services";
import { Alert } from "../../../microInteraction";
import { IoSearch, IoClose, IoPersonAdd, IoAdd } from "react-icons/io5";
import styles from "../styles/TeamManagement.module.scss";

const TeamlessState = ({ formId, eventTitle, maxTeamSize, onTeamJoined }) => {
    const [activeTab, setActiveTab] = useState("browse"); // "browse" | "create"
    const [searchQuery, setSearchQuery] = useState("");
    const [teams, setTeams] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [newTeamName, setNewTeamName] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [sendingRequestTo, setSendingRequestTo] = useState(null);
    const pollRef = useRef(null);

    // Fetch teams on mount and when search changes
    const fetchTeams = useCallback(async (query = "") => {
        setIsSearching(true);
        try {
            const url = query.trim()
                ? `/api/form/searchTeams/${formId}?search=${encodeURIComponent(query)}`
                : `/api/form/searchTeams/${formId}`;
            const response = await api.get(url);
            if (response.data?.success) {
                setTeams(response.data.data.teams || []);
            }
        } catch (err) {
            console.error("Error fetching teams:", err);
        } finally {
            setIsSearching(false);
        }
    }, [formId]);

    useEffect(() => {
        fetchTeams();
    }, [fetchTeams]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchTeams(searchQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, fetchTeams]);

    // [v2] Poll for join request updates (accepted/rejected/expired)
    const checkForUpdates = useCallback(async () => {
        try {
            const response = await api.get(`/api/form/joinRequestUpdates/${formId}`);
            if (!response.data?.success) return;

            const { updates } = response.data.data;
            if (!updates || updates.length === 0) return;

            for (const update of updates) {
                const teamLabel = update.teamName ? `"${update.teamName}"` : "the team";

                switch (update.status) {
                    case "ACCEPTED":
                        Alert({
                            type: "success",
                            message: `🎉 Your request to join ${teamLabel} was accepted!`,
                            position: "top-right",
                            duration: 5000,
                        });
                        // Refresh parent to show team view
                        setTimeout(() => onTeamJoined(), 1500);
                        return; // Stop processing — page will re-render
                    case "REJECTED":
                        Alert({
                            type: "error",
                            message: `Your request to join ${teamLabel} was declined. Try another team!`,
                            position: "top-right",
                            duration: 5000,
                        });
                        break;
                    case "AUTO_EXPIRED":
                    case "EXPIRED":
                        Alert({
                            type: "info",
                            message: `Your request to join ${teamLabel} has expired.`,
                            position: "top-right",
                            duration: 4000,
                        });
                        break;
                    default:
                        break;
                }
            }
            // Refresh team list to update pending statuses
            fetchTeams(searchQuery);
        } catch (err) {
            // Silent fail — polling shouldn't break the UI
            console.error("Error checking join request updates:", err);
        }
    }, [formId, fetchTeams, searchQuery, onTeamJoined]);

    // Poll on mount + every 15 seconds
    useEffect(() => {
        checkForUpdates(); // Check immediately on mount (covers offline → online scenario)
        pollRef.current = setInterval(checkForUpdates, 15000);
        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, [checkForUpdates]);

    // Create team handler
    const handleCreateTeam = async () => {
        const trimmed = newTeamName.trim();
        if (!trimmed) {
            Alert({ type: "error", message: "Team name cannot be empty", position: "top-right" });
            return;
        }

        setIsCreating(true);
        try {
            const response = await api.post("/api/form/createTeam", {
                formId,
                teamName: trimmed,
            });
            if (response.data?.success) {
                Alert({ type: "success", message: response.data.message, position: "top-right" });
                onTeamJoined(); // Refresh parent
            }
        } catch (err) {
            const msg = err.response?.data?.message || "Failed to create team";
            Alert({ type: "error", message: msg, position: "top-right" });
        } finally {
            setIsCreating(false);
        }
    };

    // Send join request handler
    const handleSendRequest = async (teamRegId) => {
        setSendingRequestTo(teamRegId);
        try {
            const response = await api.post("/api/form/sendJoinRequest", {
                formId,
                teamRegistrationId: teamRegId,
            });
            if (response.data?.success) {
                Alert({
                    type: "success",
                    message: "Request sent! Check your email for the team leader's decision.",
                    position: "top-right",
                    duration: 5000,
                });
                // Refresh to show "Pending" status
                fetchTeams(searchQuery);
            }
        } catch (err) {
            const msg = err.response?.data?.message || "Failed to send join request";
            Alert({ type: "error", message: msg, position: "top-right" });
        } finally {
            setSendingRequestTo(null);
        }
    };

    return (
        <div className={styles.teamlessContainer}>
            <div className={styles.teamlessHeader}>
                <h2>🏆 {eventTitle}</h2>
                <p>You’re registered! Now create or join a team to participate.</p>
            </div>

            {/* Tab Switcher */}
            <div className={styles.tabSwitcher}>
                <button
                    className={`${styles.tab} ${activeTab === "browse" ? styles.tabActive : ""}`}
                    onClick={() => setActiveTab("browse")}
                >
                    <IoSearch /> Browse Teams
                </button>
                <button
                    className={`${styles.tab} ${activeTab === "create" ? styles.tabActive : ""}`}
                    onClick={() => setActiveTab("create")}
                >
                    <IoAdd /> Create Team
                </button>
            </div>

            {/* Browse Tab */}
            {activeTab === "browse" && (
                <div className={styles.browseSection}>
                    <div className={styles.searchBar}>
                        <IoSearch className={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder="Search teams by name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={styles.searchInput}
                        />
                        {searchQuery && (
                            <button
                                className={styles.clearSearch}
                                onClick={() => setSearchQuery("")}
                            >
                                <IoClose />
                            </button>
                        )}
                    </div>

                    {isSearching ? (
                        <div className={styles.loadingTeams}>Searching teams...</div>
                    ) : teams.length === 0 ? (
                        <div className={styles.noTeams}>
                            <p>No teams found. Be the first to create one!</p>
                        </div>
                    ) : (
                        <div className={styles.teamList}>
                            {teams.map((team) => (
                                <div key={team.teamRegistrationId} className={styles.teamCard}>
                                    <div className={styles.teamCardInfo}>
                                        <h4 className={styles.teamCardName}>{team.teamName}</h4>
                                        <span className={styles.teamCardMeta}>
                                            {team.teamSize}/{team.maxTeamSize} members · Led by {team.leaderName}
                                        </span>
                                        <span className={styles.teamCardSpots}>
                                            {team.spotsRemaining} {team.spotsRemaining === 1 ? "spot" : "spots"} remaining
                                        </span>
                                    </div>
                                    <div className={styles.teamCardAction}>
                                        {team.hasPendingRequest ? (
                                            <button className={styles.pendingButton} disabled>
                                                Pending ⏳
                                            </button>
                                        ) : (
                                            <button
                                                className={styles.requestButton}
                                                onClick={() => handleSendRequest(team.teamRegistrationId)}
                                                disabled={sendingRequestTo === team.teamRegistrationId}
                                            >
                                                {sendingRequestTo === team.teamRegistrationId
                                                    ? "Sending..."
                                                    : "Request →"}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Create Tab */}
            {activeTab === "create" && (
                <div className={styles.createSection}>
                    <p className={styles.createHint}>
                        Create your own team and invite others to join.
                        Max team size: <strong>{maxTeamSize}</strong>.
                    </p>
                    <div className={styles.createForm}>
                        <input
                            type="text"
                            placeholder="Enter team name"
                            value={newTeamName}
                            onChange={(e) => setNewTeamName(e.target.value)}
                            className={styles.createInput}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleCreateTeam();
                            }}
                            disabled={isCreating}
                        />
                        <button
                            className={styles.createButton}
                            onClick={handleCreateTeam}
                            disabled={isCreating || !newTeamName.trim()}
                        >
                            {isCreating ? "Creating..." : "Create Team"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamlessState;

