"use client";

import { useContext, useEffect, useState } from "react";
import styles from "./styles/EventsView.module.scss";
import AuthContext from "../../../../context/AuthContext";
// import eventsData from "../../../../data/FormData.json";

import { api } from "../../../../services";
import { ComponentLoading, MicroLoading } from "../../../../microInteraction";
import { accessOrCreateEventByFormId } from "../../Admin/Form/CertificatesForm/tools/certificateTools";
import Link from "next/link";

const Events = () => {
  const authCtx = useContext(AuthContext);
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [certMap, setCertMap] = useState({});
  const [loadingCerts, setLoadingCerts] = useState(true); // New state for certificate loading

  const viewPath = "/profile/Events";
  const analyticsPath = "/profile/events/Analytics";

  const analyticsAccessRoles = [
    "PRESIDENT",
    "VICEPRESIDENT",
    "DIRECTOR_CREATIVE",
    "DIRECTOR_TECHNICAL",
    "DIRECTOR_MARKETING",
    "DIRECTOR_OPERATIONS",
    "DIRECTOR_SPONSORSHIP",
    "ADMIN",
  ];

  useEffect(() => {
    const fetchEventsData = async () => {
      try {
        const response = await api.get("/api/form/getAllForms");
        const userEvents = authCtx.user.regForm;

        if (response.status === 200) {
          let fetchedEvents = response.data.events;
          if (authCtx.user.access !== "USER") {
            // Set events for non-users
            setEvents(sortEventsByDate(fetchedEvents));
          } else {
            // Filter and then sort events for users
            const filteredEvents = fetchedEvents.filter((event) =>
              userEvents.includes(event.id)
            );
            setEvents(sortEventsByDate(filteredEvents));
          }
        } else {
          console.error("Error fetching event data:", response.data.message);
          setError({
            message:
              "Sorry for the inconvenience, we are having issues fetching your Events",
          });
        }
      } catch (error) {
        setError({
          message:
            "Sorry for the inconvenience, we are having issues fetching your Events",
        });
        console.error("Error fetching team members:", error);

        // const userEvents = authCtx.user.regForm;
        // // using local JSON data
        // let localEvents = eventsData.events;
        // if (authCtx.user.access !== "USER") {
        //   setEvents(sortEventsByDate(localEvents));
        // } else {
        //   const filteredEvents = localEvents.filter((event) =>
        // userEvents.includes(event._id);
        //   );
        //   setEvents(sortEventsByDate(filteredEvents));
        // }
      } finally {
        setIsLoading(false);
      }
    };

    fetchEventsData();
  }, [authCtx.user.email]);

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        const response = await api.post(
          "/api/certificate/sendCertificatesAndEvents",
          {
            email: authCtx.user.email,
          },
          {
            headers: { Authorization: `Bearer ${authCtx.token}` },
          }
        );
        // console.log(response);
        if (response.status === 200) {
          setCertificates(response.data.certandevent); // This will be an array of { cert, event }
        }
      } catch (err) {
        console.error("Error fetching certificates:", err);
      }
    };

    fetchCertificates();
  }, [authCtx.user.email]);

  const getCertificateForEvent = async (eventId) => {
    const eid = await accessOrCreateEventByFormId(eventId, authCtx.token);
    // console.log(eid, certificates[0].cert.eventId);
    const found = certificates.find((item) => item.cert.eventId == eid.id);
    // console.log(found);
    return found ? found.cert : null;
  };

  const sortEventsByDate = (events) => {
    return events.sort(
      (a, b) => new Date(b.info.eventDate) - new Date(a.info.eventDate)
    );
  };

  const formatDate = (dateString) => {
    const options = { day: "2-digit", month: "2-digit", year: "numeric" };
    return new Date(dateString)
      .toLocaleDateString("en-GB", options)
      .replace(/\//g, "-");
  };

  useEffect(() => {
    const fetchAllCerts = async () => {
      setLoadingCerts(true); // Start loading
      const map = {};
      if (events.length > 0) {
        for (const event of events) {
          const cert = await getCertificateForEvent(event.id, authCtx.token);
          if (cert) {
            const link = `/verify/certificate?id=${cert.id}`;
            map[event.id] = link;
          }
        }
      }
      setCertMap(map);
      setLoadingCerts(false); // End loading
    };

    if (events.length > 0 && certificates.length > 0) {
      fetchAllCerts();
    } else if (events.length > 0 && !isLoading) {
      // If events are loaded but no certificates found
      setLoadingCerts(false);
    }
  }, [events, certificates]);

  return (
    <div className={styles.participatedEvents}>
      {authCtx.user.access !== "USER" ? (
        <div className={styles.proHeading}>
          <h3 className={styles.headInnerText}>
            <span>Events</span> Timeline
          </h3>
        </div>
      ) : (
        <div className={styles.proHeading}>
          <h3 className={styles.headInnerText}>
            <span>Participated</span> Events
          </h3>
        </div>
      )}

      {isLoading ? (
        <ComponentLoading />
      ) : (
        <>
          {error && <div className={styles.error}>{error.message}</div>}

          <div className={styles.tables}>
            {events.length > 0 ? (
              <table className={styles.eventsTable}>
                <thead>
                  <tr>
                    <th className={styles.mobilewidth}>Event Name</th>
                    <th className={styles.mobilewidth}>Event Date</th>
                    <th className={styles.mobilewidth}>Details</th>
                    <th className={styles.mobilewidth}>Certificate</th>
                    {(analyticsAccessRoles.includes(authCtx.user.access) ||
                      authCtx.user.email == "srex@fedkiit.com") && (
                      <th
                        className={styles.mobilewidth}
                        style={{ paddingTop: "1rem" }}
                      >
                        Registrations
                      </th>
                    )}
                  </tr>
                </thead>

                <tbody>
                  {events.map((event) => (
                    <tr key={event._id || event.id}>
                      <td
                        className={styles.mobilewidth}
                        style={{ fontWeight: "500", paddingRight: "10px" }}
                      >
                        {event.info.eventTitle}
                      </td>
                      <td style={{ fontWeight: "200" }}>
                        {formatDate(event.info.eventDate)}
                      </td>

                      {/* View Event Details - accessible to all */}
                      <td className={styles.mobilewidthtd}>
                        <Link href={`${viewPath}/${event.id}`}>
                          <button
                            className={styles.viewButton}
                            style={{
                              marginLeft: "auto",
                              whiteSpace: "nowrap",
                              height: "fit-content",
                              color: "orange",
                            }}
                          >
                            View
                          </button>
                        </Link>
                      </td>

                      {/* Certificate - only for USERS */}
                      {authCtx.user.access === "USER" && (
                        <td className={styles.mobilewidthtd}>
                          {loadingCerts ? (
                            <div className={styles.loadingContainer}>
                              <MicroLoading />
                            </div>
                          ) : certMap[event.id] ? (
                            <Link
                              href={certMap[event.id]}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <button className={styles.viewButton}>
                                View
                              </button>
                            </Link>
                          ) : (
                            <button
                              className={styles.viewButton}
                              disabled
                              style={{ opacity: 0.5 }}
                            >
                              Not Issued
                            </button>
                          )}
                        </td>
                      )}

                      {/* Analytics - only for admins and specific roles */}
                      {(analyticsAccessRoles.includes(authCtx.user.access) ||
                        authCtx.user.email === "srex@fedkiit.com") && (
                        <td className={styles.mobilewidthtd}>
                          <Link href={`${analyticsPath}/${event.id}`}>
                            <button
                              className={styles.viewButton}
                              style={{
                                marginLeft: "auto",
                                whiteSpace: "nowrap",
                                height: "fit-content",
                                color: "orange",
                              }}
                            >
                              View
                            </button>
                          </Link>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className={styles.noEvents}>Not participated in any Events</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Events;