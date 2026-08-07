"use client";

import { useContext, useEffect, useState } from "react";
import styles from "./styles/CertificatesView.module.scss";
import AuthContext from "../../../../context/AuthContext";

import { api } from "../../../../services";
import { ComponentLoading } from "../../../../microInteraction";
import { Send } from "lucide-react";
import Link from "next/link";

const Events = () => {
  const authCtx = useContext(AuthContext);
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const viewPath = "/profile/Events";
  const SendCertificatePath = "/profile/events/SendCertificate";
  const analyticsPath = "/profile/events/Analytics";
  const createCertificatesPath = "/profile/events/createCertificates";
  const viewCertificatesPath = "/profile/events/viewCertificates";
  

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
             userEvents.includes(event._id)
        //   );
        //   setEvents(sortEventsByDate(filteredEvents));
        // }
      } finally {
        setIsLoading(false);
      }
    };

    fetchEventsData();
  }, [authCtx.user.email]);

  const sortEventsByDate = (events) => {
    return events.sort((a, b) => new Date(b.info.eventDate) - new Date(a.info.eventDate));
  };

  const formatDate = (dateString) => {
    const options = { day: "2-digit", month: "2-digit", year: "numeric" };
    return new Date(dateString)
      .toLocaleDateString("en-GB", options)
      .replace(/\//g, "-");
  };

  // console.log("Event Access",authCtx.user.access);
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
                    <th className={styles.mobilewidth}>Certificates</th>
                    {(analyticsAccessRoles.includes(authCtx.user.access) || authCtx.user.email == "srex@fedkiit.com") && (
                        <>
                      <th className={styles.mobilewidth}>Manage Mail</th>
                      <th className={styles.mobilewidth}>Create/Edit</th>
                      </>
                    )}
                    {/* Add more headers */}
                  </tr>
                </thead>

                <tbody>
                  {events.map((event) => (
                    <tr key={event._id}>
                      <td className={styles.mobilewidth} style={{fontWeight:"500",paddingRight:"10px"}}>
                        {event.info.eventTitle}
                      </td>
                      <td style={{ fontWeight: "200" }}>
                        {formatDate(event.info.eventDate)}
                      </td>

                      <td>
                        <Link href={`${viewCertificatesPath}/${event.id}`}>
                          <button
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
                      {(analyticsAccessRoles.includes(authCtx.user.access) || authCtx.user.email == "srex@fedkiit.com") && (
                        <td>
                          <Link href={`${SendCertificatePath}/${event.id}`}>
                            <button
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
                      {(analyticsAccessRoles.includes(authCtx.user.access) || authCtx.user.email == "srex@fedkiit.com") && (
                        <td>
                          <Link href={`${createCertificatesPath}/${event.id}`}>
                            <button
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
