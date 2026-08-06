"use client";

import React, { useState, useEffect, useContext, useMemo } from "react";
import { FaDownload } from "react-icons/fa";
import { Alert, ComponentLoading } from "../../../../microInteraction";
import CloseButton from "../../../../components/CloseButton/CloseButton";
import defaultImg from "../../../../assets/images/defaultImg.jpg";
import { api } from "../../../../services";
import styles from "./styles/EventStats.module.scss";
import AuthContext from "../../../../context/AuthContext";
import { useRouter, useParams } from "next/navigation";

const EventStats = ({ onClosePath = "/profile/events" }) => {
  const router = useRouter();
  const authCtx = useContext(AuthContext);
  const params = useParams();
  const eventId = params?.eventId;

  const [info, setInfo] = useState({});
  const [analytics, setAnalytics] = useState(null);
  const [yearCounts, setYearCounts] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewTeams, setViewTeams] = useState(false);

  useEffect(() => {
    if (!eventId) return undefined;

    const fetchEvent = async () => {
      setIsLoading(true);
      try {
        const response = await api.get(`/api/form/getFormAnalytics/${eventId}`, {
          headers: {
            Authorization: `Bearer ${window.localStorage.getItem("token")}`,
          },
        });

        if (response.status === 200) {
          const body = response.data;
          const formAnalytics =
            body?.form?.formAnalytics?.[0] || body?.data || null;
          setAnalytics(formAnalytics);
          setInfo(body?.form?.info || body?.data?.info || {});
          setYearCounts(body?.yearCounts || body?.data?.yearCounts || {});
        } else {
          setAlert({
            type: "error",
            message:
              "There was an error fetching event details. Please try again.",
            position: "bottom-right",
            duration: 3000,
          });
        }
      } catch (error) {
        console.error("Error fetching event:", error);
        setAlert({
          type: "error",
          message:
            error?.response?.data?.message ||
            "There was an error fetching event details. Please try again.",
          position: "bottom-right",
          duration: 3000,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvent();
  }, [eventId]);

  useEffect(() => {
    if (alert) {
      const { type, message, position, duration } = alert;
      Alert({ type, message, position, duration });
      setAlert(null);
    }
  }, [alert]);

  const handleModalClose = () => {
    router.push(onClosePath);
  };

  const handleDownload = async () => {
    try {
      const response = await api.get(`/api/form/download/${eventId}`, {
        responseType: "blob",
        headers: {
          Authorization: `Bearer ${window.localStorage.getItem("token")}`,
        },
      });

      if (response.status === 200) {
        setAlert({
          type: "success",
          message: "File downloaded successfully",
          position: "bottom-right",
          duration: 3000,
        });
        const blob = new Blob([response.data], {
          type: response.headers?.["content-type"] || "text/csv",
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `registration_data_${eventId}.csv`);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        setAlert({
          type: "error",
          message: "There was an error downloading the file. Please try again.",
          position: "bottom-right",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error("Error downloading the file", error);
      setAlert({
        type: "error",
        message:
          error?.response?.data?.message ||
          "There was an error downloading the file. Please try again.",
        position: "bottom-right",
        duration: 3000,
      });
    }
  };

  const filteredUsers = useMemo(() => {
    const emails = analytics?.regUserEmails || [];
    const query = searchQuery.trim().toLowerCase();
    if (!query) return emails;
    return emails.filter((user) => user.toLowerCase().includes(query));
  }, [analytics, searchQuery]);

  const filteredTeams = useMemo(() => {
    const teams = analytics?.regTeamNames || [];
    const query = searchQuery.trim().toLowerCase();
    if (!query) return teams;
    return teams.filter((team) => team.toLowerCase().includes(query));
  }, [analytics, searchQuery]);

  const totalCount = viewTeams
    ? analytics?.regTeamNames?.length || 0
    : analytics?.totalRegistrationCount ||
      analytics?.regUserEmails?.length ||
      0;

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <div>
          <p className={styles.eyebrow}>Event analytics</p>
          <h1 className={styles.title}>
            {info?.eventTitle || "Registration stats"}
          </h1>
        </div>
        <div className={styles.toolbarActions}>
          {authCtx.user.access === "ADMIN" && (
            <button
              type="button"
              className={styles.downloadBtn}
              onClick={handleDownload}
            >
              <FaDownload size={14} aria-hidden="true" />
              Download CSV
            </button>
          )}
          <CloseButton
            onClick={handleModalClose}
            label="Back to events"
            className={styles.close}
          />
        </div>
      </div>

      {isLoading ? (
        <div className={styles.loading}>
          <ComponentLoading />
        </div>
      ) : (
        <div className={styles.card}>
          <div className={styles.metaRow}>
            <div className={styles.toggleBlock}>
              <label className={styles.switchLabel}>
                <span>{viewTeams ? "Showing teams" : "Showing users"}</span>
                <span className={styles.switch}>
                  <input
                    type="checkbox"
                    checked={viewTeams}
                    onChange={() => setViewTeams((v) => !v)}
                  />
                  <span className={styles.slider} />
                </span>
              </label>
              <p className={styles.total}>
                Total {viewTeams ? "registered teams" : "registered users"}:{" "}
                <span>{totalCount}</span>
              </p>
            </div>

            <div className={styles.yearBlock}>
              <p className={styles.yearHeading}>Year counts</p>
              <div className={styles.yearGrid}>
                {Object.keys(yearCounts).length > 0 ? (
                  Object.entries(yearCounts).map(([year, count]) => (
                    <div key={year} className={styles.yearItem}>
                      <span className={styles.yearLabel}>{year}</span>
                      <span className={styles.yearValue}>{count}</span>
                    </div>
                  ))
                ) : (
                  <span className={styles.emptyMeta}>No year data</span>
                )}
              </div>
            </div>
          </div>

          <input
            type="search"
            placeholder={`Search by ${viewTeams ? "team" : "email"}`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />

          <div className={styles.list}>
            {viewTeams ? (
              filteredTeams.length > 0 ? (
                filteredTeams.map((team, index) => (
                  <div key={`${team}-${index}`} className={styles.userCard}>
                    <img
                      src={defaultImg.src}
                      alt=""
                      className={styles.userImg}
                    />
                    <div className={styles.userEmail}>{team}</div>
                  </div>
                ))
              ) : (
                <p className={styles.empty}>No teams found</p>
              )
            ) : filteredUsers.length > 0 ? (
              filteredUsers.map((user, index) => (
                <div key={`${user}-${index}`} className={styles.userCard}>
                  <img src={defaultImg.src} alt="" className={styles.userImg} />
                  <div className={styles.userEmail}>{user}</div>
                </div>
              ))
            ) : (
              <p className={styles.empty}>No users found</p>
            )}
          </div>
        </div>
      )}

      <Alert />
    </div>
  );
};

export default EventStats;
