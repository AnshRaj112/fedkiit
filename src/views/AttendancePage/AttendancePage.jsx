"use client";

import React, { useState, useEffect, useContext, useRef } from "react";
import { EventCard } from "../../components";
import { Button } from "../../components/Core";
import AuthContext from "../../context/AuthContext";
import { api } from "../../services";
import styles from "./styles/AttendancePage.module.scss";
import { IoClose } from "react-icons/io5";
import { FaDownload } from "react-icons/fa";
import { Alert, ComponentLoading } from "../../microInteraction";
import { Html5QrcodeScanner, Html5QrcodeScanType } from "html5-qrcode";

const AttendancePage = () => {
  const [ongoingEvents, setOngoingEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [scanner, setScanner] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [attendedUser, setAttendedUser] = useState(null);
  const [hasShownAlert, setHasShownAlert] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const authCtx = useContext(AuthContext);
  const processingRef = useRef(false);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await api.get("/api/form/getAllForms");
        if (response.status === 200) {
          const fetchedEvents = response.data.events;

          // sort events by priority, date, and title
          const sortedEvents = fetchedEvents.sort((a, b) => {
            const priorityA = parseInt(a.info.eventPriority, 10);
            const priorityB = parseInt(b.info.eventPriority, 10);
            const dateA = new Date(a.info.eventDate);
            const dateB = new Date(b.info.eventDate);
            const titleA = a.info.eventTitle || "";
            const titleB = b.info.eventTitle || "";

            if (priorityA !== priorityB) return priorityA - priorityB;
            if (dateA.getTime() !== dateB.getTime()) return dateA - dateB;
            return titleA.localeCompare(titleB);
          });

          const ongoing = sortedEvents.filter(e => !e.info.isEventPast);
          const past = sortedEvents
            .filter(e => e.info.isEventPast)
            .sort((a, b) => new Date(b.info.eventDate) - new Date(a.info.eventDate));

          setOngoingEvents(ongoing);
          setPastEvents(past);
        } else {
          setError("Error fetching events");
        }
      } catch (err) {
        console.error("Error fetching events:", err);
        setError("Error fetching events");
      } finally {
        setIsLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const initializeScanner = () => {
    try {
      const qrScanner = new Html5QrcodeScanner(
        "qr-reader",
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
          supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA]
        },
        false
      );

      qrScanner.render(onScanSuccess, onScanFailure);
      setScanner(qrScanner);
    } catch (error) {
      console.error("Error initializing scanner:", error);
      if (!hasShownAlert) {
        Alert({
          type: "error",
          message: "Failed to initialize QR scanner",
          position: "top-right",
        });
        setHasShownAlert(true);
      }
      setShowScanner(false);
    }
  };

  const onScanSuccess = async (decodedText) => {
    if (processingRef.current) return;
    processingRef.current = true;
    setIsScanning(true);
    console.log("QR Code scanned successfully:", decodedText);
    console.log("Selected Event ID:", selectedEventId);
    
    try {
      // jwt token from qr code
      const response = await api.post(
        `/api/form/markAttendance`,
        {
          formId: selectedEventId,
          token: decodedText,
        },
        {
          headers: {
            Authorization: `Bearer ${authCtx.token}`,
          },
        }
      );

      if (response.status === 200) {
        // A 200 only ever means "newly marked". A second scan of the same QR
        // comes back as 400 "Attendance already marked." and is handled in the
        // catch below — the API has no success-with-a-flag form.
        //
        // The response is `{ message, attendance }`; there is no `user` key, so
        // this keeps the whole body. The success modal only checks that it is
        // truthy.
        setAttendedUser(response.data.user || response.data);
        setIsSuccess(true);
        if (scanner) {
          scanner.clear();
        }
        setShowSuccessModal(true);
        setIsScanning(false);
        
        // show success alert
        Alert({
          type: "success",
          message: "Attendance marked successfully!",
          position: "top-right",
        });
        
        return; // exit early
      }
    } catch (error) {
      console.error("Error marking attendance:", error);

      // "Already marked" is the expected outcome of scanning the same QR twice,
      // not a failure — the volunteer at the door needs to know the person is
      // already through, not see a red error. The API signals it exactly as the
      // Express controller does (markAttendance.js:154): a 400 carrying this
      // message, with no machine-readable code to key off, so the message is
      // what has to be matched.
      const apiMessage = error.response?.data?.message;
      if (
        error.response?.status === 400 &&
        typeof apiMessage === "string" &&
        apiMessage.toLowerCase().includes("already marked")
      ) {
        if (scanner) {
          try {
            scanner.clear();
          } catch (clearError) {
            console.error("Error clearing scanner:", clearError);
          }
        }
        setShowScanner(false);
        setScanner(null);
        Alert({
          type: "info",
          message: apiMessage,
          position: "top-right",
        });
        return;
      }

      let errorMessage = "Failed to verify QR code";

      if (error.response?.status === 401) {
        // 401 covers two different things: a bad or expired QR ("Invalid or
        // expired QR.") and the *scanner's* own session having lapsed ("Token
        // is required"). Showing the API's wording keeps a signed-out volunteer
        // from blaming the participant's QR code.
        errorMessage = apiMessage || "Invalid or expired QR code";
      } else if (error.response?.status === 400) {
        errorMessage = error.response?.data?.message || "Invalid request";
      } else if (error.response?.status === 404) {
        errorMessage = "Attendance record not found";
      } else if (error.response?.status === 403) {
        errorMessage = "You don't have permission to mark attendance";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      // show error alert
      if (!hasShownAlert) {
        Alert({
          type: "error",
          message: errorMessage,
          position: "top-right",
        });
        setHasShownAlert(true);
      }
    } finally {
      setIsScanning(false);
      processingRef.current = false;
    }
  };

  const onScanFailure = (error) => {
    console.warn(`QR Code scanning failed: ${error}`);
  };

  const handleScanQR = (eventId) => {
    setSelectedEventId(eventId);
    setShowScanner(true);
    setHasShownAlert(false); // reset alert state
    setIsSuccess(false); // reset success state
    processingRef.current = false;
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    setAttendedUser(null);
    // auto open scanner for next scan
    setTimeout(() => {
      setShowScanner(true);
      setHasShownAlert(false); // reset alert state
      setIsSuccess(false); // reset success state
    }, 100);
  };



  const handleDownloadAttendance = async (eventId) => {
    try {
      const response = await api.get(`/api/form/export-attendance/${eventId}?format=xlsx`, {
        headers: { Authorization: `Bearer ${authCtx.token}` },
        responseType: "blob",
      });
      const blob = new Blob([response.data], { type: "text/xlsx" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `attendance_${eventId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      Alert({
        type: "success",
        message: "Attendance file downloaded successfully!",
        position: "top-right",
      });
    } catch (error) {
      let errorMessage = "Failed to download attendance file";
      
      if (error.response?.status === 403) {
        errorMessage = "You don't have permission to download attendance data";
      } else if (error.response?.status === 404) {
        errorMessage = "Attendance data not found for this event";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      // show error alert
      if (!isSuccess && !hasShownAlert) {
        Alert({
          type: "error",
          message: errorMessage,
          position: "top-right",
        });
        setHasShownAlert(true);
      }
      console.error("Download error:", error);
    }
  };

  const renderOngoingActions = (event) => (
    <div className={styles.actionButtons}>
      <Button onClick={() => handleScanQR(event.id)} variant="primary">
        Scan QR
      </Button>
      <Button
        onClick={() => handleDownloadAttendance(event.id)}
        variant="secondary"
        style={{
          padding: "8px 16px",
          backgroundColor: "rgba(255, 138, 0, 0.9)",
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        <FaDownload size={18} />
        Attendance
      </Button>

    </div>
  );

  const renderPastActions = (event) => (
    <div className={styles.actionButtons}>
      <Button
        onClick={() => handleDownloadAttendance(event.id)}
        variant="secondary"
        style={{ padding: "8px 16px", backgroundColor: "rgba(255, 138, 0, 0.9)" }}
      >
        <FaDownload size={18} />
         Attendance
      </Button>
    </div>
  );

  useEffect(() => {
    if (showScanner) {
      initializeScanner();
    }
    return () => {
      if (scanner) {
        try {
          scanner.clear();
        } catch (error) {
          console.error("Error clearing scanner in cleanup:", error);
        }
      }
    };
  }, [showScanner]);

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
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.container}>
      <h2>Event Attendance</h2>

      {showScanner && (
        <div className={styles.scannerModal}>
          <div className={styles.scannerContent}>
            <button
              className={styles.closeButton}
              onClick={() => {
                if (scanner) {
                  try {
                    scanner.clear();
                  } catch (error) {
                    console.error("Error clearing scanner:", error);
                  }
                }
                setShowScanner(false);
                setScanner(null);
              }}
            >
              <IoClose />
            </button>
            <h3 className={styles.scannerTitle}>Scan QR Code</h3>
            <div className={styles.scannerArea}>
              {isScanning && (
                <div className={styles.scanningOverlay}>
                  <div className={styles.scanningText}>Processing QR Code...</div>
                </div>
              )}
              <div id="qr-reader"></div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && attendedUser && (
        <div className={styles.scannerModal}>
          <div className={styles.scannerContent}>
            <button
              className={styles.closeButton}
              onClick={handleCloseSuccessModal}
            >
              <IoClose />
            </button>
            <div className={styles.successContent}>
              <div className={styles.successIcon}>✓</div>
              <h3 className={styles.successTitle}>Attendance Marked Successfully!</h3>
              
              <div className={styles.buttonGroup}>
                <Button 
                  onClick={handleCloseSuccessModal} 
                  variant="primary"
                  style={{ padding: "10px 20px" }}
                >
                  OK
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ongoing Events */}
      {ongoingEvents.length > 0 && (
        <>
          <h3>Ongoing Events</h3>
          <div className={styles.eventGrid}>
            {ongoingEvents.map((event) => (
              <div key={event.id} className={styles.eventWrapper}>
                <EventCard
                  data={event}
                  type="ongoing"
                  modalpath="/Events/"
                  isLoading={false}
                  showRegisterButton={false}
                  showShareButton={false}
                  additionalContent={renderOngoingActions(event)}
                  onOpen={() => { }} // fixed
                  customStyles={{
                    eventname: { fontSize: "1.2rem" },
                    registerbtn: { width: "8rem", fontSize: ".721rem" },
                    eventnamep: { fontSize: "0.7rem" },
                  }}
                />
              </div>
            ))}
          </div>
        </>
      )}

      {/* Past Events */}
      {pastEvents.length > 0 && (
        <>
          <h3 style={{ marginTop: "2rem" }}>Past Events</h3>
          <div className={styles.eventGrid}>
            {pastEvents.map((event) => (
              <div key={event.id} className={styles.eventWrapper}>
                <EventCard
                  data={event}
                  type="past"
                  modalpath="/Events/pastEvents/"
                  isLoading={false}
                  showRegisterButton={false}
                  showShareButton={false}
                  additionalContent={renderPastActions(event)}
                  onOpen={() => { }} // fixed
                  customStyles={{
                    eventname: { fontSize: "1.2rem" },
                    registerbtn: { width: "8rem", fontSize: ".721rem" },
                    eventnamep: { fontSize: "0.7rem" },
                  }}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default AttendancePage;