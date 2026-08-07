"use client";

import React, { useState, useEffect, useContext } from "react";

import { FaDownload } from "react-icons/fa";
import "react-loading-skeleton/dist/skeleton.css";
import { Alert, ComponentLoading } from "../../../../microInteraction";
import { X } from "lucide-react";
import Text from "../../../../components/Core/Text";
import defaultImg from "../../../../assets/images/defaultImg.jpg";
import { api } from "../../../../services";
import styles from "../EventModal/styles/EventModal.module.scss";
import sheet from "./styles/EventStats.module.scss";
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
  // Payment proof, fetched separately and only for paid events — a free event
  // has no payment step, so the request would come back empty every time.
  const [payments, setPayments] = useState([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);
  const [zoomedProof, setZoomedProof] = useState(null);

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
    if (info?.eventType !== "Paid") return;

    let cancelled = false;
    const fetchPayments = async () => {
      setIsLoadingPayments(true);
      try {
        const response = await api.get(`/api/form/payments/${eventId}`, {
          headers: {
            Authorization: `Bearer ${window.localStorage.getItem("token")}`,
          },
        });
        if (!cancelled && response.status === 200) {
          setPayments(response.data.payments || []);
        }
      } catch (error) {
        console.error("Error fetching payment proofs:", error);
      } finally {
        if (!cancelled) setIsLoadingPayments(false);
      }
    };

    fetchPayments();
    return () => {
      cancelled = true;
    };
  }, [eventId, info?.eventType]);

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
        link.setAttribute("download", `registration_data_${eventId}.csv`);
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
    <div className={sheet.overlay}>
      <div className={sheet.backdrop}>
          {data && (
            <>
              <div className={sheet.panel}>
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
                      className={sheet.close}
                      onClick={handleModalClose}
                      aria-label="Close"
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

                    <div className={sheet.list}>
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
                            <div key={index} className={sheet.userCard}>
                              <img
                                src={defaultImg.src}
                                alt="Team"
                                className={sheet.userImg}
                              />
                              <div className={sheet.userEmail}>{team}</div>
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
                          <div key={index} className={sheet.userCard}>
                            <img
                              src={defaultImg.src}
                              alt="User"
                              className={sheet.userImg}
                            />
                            <div className={sheet.userEmail}>{user}</div>
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

                    {info?.eventType === "Paid" && (
                      <div style={{ marginTop: "1.5rem" }}>
                        <Text
                          style={{
                            color: "#fff",
                            fontSize: "1rem",
                            fontWeight: "500",
                            marginBottom: "0.75rem",
                          }}
                        >
                          Payment Proofs{" "}
                          <span style={{ color: "#FF8A00" }}>
                            ({payments.length})
                          </span>
                        </Text>

                        {isLoadingPayments ? (
                          <ComponentLoading
                            customStyles={{
                              display: "flex",
                              justifyContent: "center",
                              padding: "1rem 0",
                            }}
                          />
                        ) : payments.length === 0 ? (
                          <Text style={{ color: "#aaa", fontSize: ".85rem" }}>
                            No payment details submitted yet.
                          </Text>
                        ) : (
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns:
                                "repeat(auto-fill, minmax(180px, 1fr))",
                              gap: "0.75rem",
                            }}
                          >
                            {payments.map((payment) => (
                              <div
                                key={`${payment.registrationId}-${payment.userEmail}`}
                                style={{
                                  border: "1px solid #333",
                                  borderRadius: "8px",
                                  padding: "0.6rem",
                                  background: "rgba(255,255,255,0.03)",
                                }}
                              >
                                {payment.screenshot ? (
                                  <img
                                    src={payment.screenshot}
                                    alt={`Payment proof from ${payment.userEmail}`}
                                    onClick={() =>
                                      setZoomedProof(payment.screenshot)
                                    }
                                    style={{
                                      width: "100%",
                                      height: 120,
                                      objectFit: "cover",
                                      borderRadius: "4px",
                                      cursor: "zoom-in",
                                    }}
                                  />
                                ) : (
                                  <div
                                    style={{
                                      width: "100%",
                                      height: 120,
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      borderRadius: "4px",
                                      background: "rgba(255,255,255,0.05)",
                                      color: "#888",
                                      fontSize: ".75rem",
                                      textAlign: "center",
                                    }}
                                  >
                                    No screenshot
                                  </div>
                                )}
                                <div
                                  style={{
                                    color: "#fff",
                                    fontSize: ".75rem",
                                    marginTop: "0.5rem",
                                    wordBreak: "break-all",
                                  }}
                                >
                                  {payment.userEmail}
                                </div>
                                <div
                                  style={{ color: "#aaa", fontSize: ".7rem" }}
                                >
                                  UTR: {payment.utr || "—"}
                                </div>
                                <div
                                  style={{
                                    color: "#FF8A00",
                                    fontSize: ".7rem",
                                  }}
                                >
                                  &#8377;{payment.amount}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
      </div>

      {zoomedProof && (
        <div
          onClick={() => setZoomedProof(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
            cursor: "zoom-out",
          }}
        >
          <img
            src={zoomedProof}
            alt="Payment proof"
            style={{
              maxWidth: "90vw",
              maxHeight: "90vh",
              objectFit: "contain",
            }}
          />
        </div>
      )}

      <Alert />
    </div>
  );
};

export default EventStats;
