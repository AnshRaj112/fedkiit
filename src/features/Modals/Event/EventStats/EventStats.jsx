"use client";

import React, { useState, useEffect, useContext } from "react";

import Skeleton from "react-loading-skeleton";
import { SkeletonTheme } from "react-loading-skeleton";
import { FaDownload } from "react-icons/fa";
import "react-loading-skeleton/dist/skeleton.css";
import { Alert, ComponentLoading } from "../../../../microInteraction";
import { X } from "lucide-react";
import Text from "../../../../components/Core/Text";
import defaultImg from "../../../../assets/images/defaultImg.jpg";
import { api } from "../../../../services";
import styles from "../EventModal/styles/EventModal.module.scss";
import AuthContext from "../../../../context/AuthContext";
import { useRouter, useParams } from "next/navigation";

const EventStats = ({ onClosePath }) => {
  const router = useRouter();
  const authCtx = useContext(AuthContext);
  const { eventId } = useParams();
  const [info, setInfo] = useState({});
  const [data, setData] = useState({});
  const [year, setYear] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [viewTeams, setViewTeams] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await api.get(
          `/api/form/getFormAnalytics/${eventId}`,
          {
            headers: {
              Authorization: `Bearer ${window.localStorage.getItem("token")}`,
            },
          }
        );
        if (response.status === 200) {
          setData(response.data.form.formAnalytics);
          setInfo(response.data.form.info);
          setYear(response.data.yearCounts);
        } else {
          setAlert({
            type: "error",
            message:
              "There was an error fetching event details. Please try again.",
            position: "bottom-right",
            duration: 3000,
          });
          throw new Error(response.data.message || "Error fetching event");
        }
      } catch (error) {
        console.error("Error fetching event:", error);
        setAlert({
          type: "error",
          message:
            error.response.data.message ||
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
      setAlert(null); // Reset alert after displaying it
    }
  }, [alert]);

  useEffect(() => {
    if (searchQuery) {
      setIsSearching(true);
      const timer = setTimeout(() => {
        setIsSearching(false);
      }, 500);

      return () => clearTimeout(timer);
    } else {
      setIsSearching(false);
    }
  }, [searchQuery]);

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
        const blob = new Blob([response.data], { type: response.data.type });
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `registration_data_${eventId}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
      } else {
        setAlert({
          type: "error",
          message: "There was an error downloading the file. Please try again.",
          position: "bottom-right",
          duration: 3000,
        });
        throw new Error(response.data.message || "Error downloading the file");
      }
    } catch (error) {
      console.error("Error downloading the file", error);
      setAlert({
        type: "error",
        message:
          error.response.data.message ||
          "There was an error downloading the file. Please try again.",
        position: "bottom-right",
        duration: 3000,
      });
    }
  };

  const filteredUsers = data[0]?.regUserEmails?.filter((user) =>
    user.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTeams = data[0]?.regTeamNames?.filter((team) =>
    team.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const yearCounts = year || {};

  return (
    <div
      style={{
        position: "fixed",
        width: "100%",
        height: "100%",
        zIndex: "10",
        left: 0,
        top: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "rgba(0, 0, 0, 0.5)",
          backdropFilter: "blur(4px)",
          zIndex: "5",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            zIndex: "10",
            borderRadius: "10px",
            padding: "2rem",
            position: "relative",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            marginTop: ".3rem",
          }}
        >
          {data && (
            <>
              <SkeletonTheme baseColor="#313131" highlightColor="#525252">
                <Skeleton height={180} style={{ marginBottom: "1rem" }} />
                <Skeleton
                  count={3}
                  height={20}
                  width="100%"
                  style={{ marginBottom: "0.5rem" }}
                />
              </SkeletonTheme>
              <div
                style={{
                  overflowY: "auto",
                }}
                className={styles.card}
              >
                {isLoading ? (
                  <ComponentLoading
                    customStyles={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      position: "relative",
                    }}
                  >
                    <button
                      className={styles.closeModal}
                      onClick={handleModalClose}
                      style={{ paddingTop: "42px", paddingRight: "20px" }}
                    >
                      <X />
                    </button>

                    <div className={styles.backbtn}>
                      <div
                        className={styles.eventname}
                        style={{ paddingTop: "15px" }}
                      >
                        {info.eventTitle}
                      </div>
                      {authCtx.user.access === "ADMIN" && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            marginTop: "1rem",
                            padding: "0.5rem",
                            borderRadius: "0.5rem",
                            cursor: "pointer",
                          }}
                          onClick={handleDownload}
                        >
                          <FaDownload
                            size={18}
                            style={{
                              marginRight: "2rem",
                              color: "#FF8A00",
                            }}
                          />
                        </div>
                      )}
                    </div>

                    <div style={{ display: "flex", justifyContent: "left" }}>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "1rem",
                          alignItems: "left",
                          textAlign: "left",
                        }}
                      >
                        {/* First column for the toggle switch and total count */}
                        <div
                          style={{ display: "flex", flexDirection: "column" }}
                        >
                          <div
                            className={styles.toggleSwitchContainer}
                            style={{
                              display: "flex",
                              flexDirection: "row",
                              alignItems: "center",
                              marginBottom: "1rem",
                            }}
                          >
                            <Text
                              style={{
                                color: "#fff",
                                fontSize: "1rem",
                                fontWeight: "500",
                                marginLeft: "2rem",
                                marginTop: "0.5rem",
                              }}
                            >
                              {viewTeams ? "Back to Users" : "Switch to Teams"}
                            </Text>
                            <label className={styles.switch}>
                              <input
                                type="checkbox"
                                checked={viewTeams}
                                onChange={() => setViewTeams(!viewTeams)}
                              />
                              <span className={styles.slider}></span>
                            </label>
                          </div>

                          <Text
                            style={{
                              color: "#fff",
                              fontSize: "1rem",
                              fontWeight: "500",
                              textAlign: "left",
                              marginBottom: "1rem",
                              marginLeft: "2rem",
                            }}
                          >
                            Total{" "}
                            {viewTeams
                              ? "Registered Teams"
                              : "Registered Users"}{" "}
                            :{" "}
                            <span
                              style={{
                                color: "#FF8A00",
                              }}
                            >
                              {viewTeams
                                ? data[0]?.regTeamNames?.length || 0
                                : data[0]?.totalRegistrationCount || 0}
                            </span>
                          </Text>
                        </div>

                        {/* Second column for year counts and download */}
                        <Text
                          style={{
                            color: "#fff",
                            fontSize: "1rem",
                            fontWeight: "500",
                            textAlign: "left",
                            marginBottom: "1rem",
                            marginLeft: "1.5rem",
                            marginTop: "0.5rem",
                          }}
                        >
                          Year Counts:
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "repeat(5, 1fr)",
                              gap: "0.5rem",
                              marginTop: "0.5rem",
                            }}
                          >
                            {Object.keys(yearCounts).length > 0 ? (
                              Object.entries(yearCounts).map(
                                ([year, count]) => (
                                  <div
                                    key={year}
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      color: "#FF8A00",
                                    }}
                                  >
                                    <span
                                      style={{
                                        color: "#fff",
                                        fontWeight: "bold",
                                        marginRight: "0.3rem",
                                      }}
                                    >
                                      {year}:
                                    </span>{" "}
                                    {count}
                                  </div>
                                )
                              )
                            ) : (
                              <span>No data available</span>
                            )}
                          </div>
                        </Text>
                      </div>
                    </div>

                    <input
                      type="text"
                      placeholder={`Search by ${viewTeams ? "team" : "email"}`}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={styles.searchInput}
                    />

                    <div className={styles.eventEmails}>
                      {isSearching ? (
                        <ComponentLoading
                          customStyles={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            marginTop: "-0.4rem",
                          }}
                        />
                      ) : viewTeams ? (
                        filteredTeams && filteredTeams.length > 0 ? (
                          filteredTeams.map((team, index) => (
                            <div key={index} className={styles.userCard}>
                              <img
                                src={defaultImg.src}
                                alt="Team"
                                className={styles.userImg}
                              />
                              <div className={styles.userEmail}>{team}</div>
                            </div>
                          ))
                        ) : (
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                              marginLeft: "25%",
                            }}
                          >
                            <text style={{ fontSize: "20px" }}>
                              No Teams found
                            </text>
                          </div>
                        )
                      ) : filteredUsers && filteredUsers.length > 0 ? (
                        filteredUsers.map((user, index) => (
                          <div key={index} className={styles.userCard}>
                            <img
                              src={defaultImg.src}
                              alt="User"
                              className={styles.userImg}
                            />
                            <div className={styles.userEmail}>{user}</div>
                          </div>
                        ))
                      ) : (
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            marginLeft: "25%",
                          }}
                        >
                          <text style={{ fontSize: "20px" }}>
                            No Users found
                          </text>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      <Alert />
    </div>
  );
};

export default EventStats;
