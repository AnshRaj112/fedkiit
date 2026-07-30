"use client";

import { useEffect, useState } from "react";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import style from "./styles/PastEvent.module.scss";
import { EventCard } from "../../components";
import { api } from "../../services";
import FormData from "../../data/FormData.json";
import { ComponentLoading } from "../../microInteraction";
import Link from "next/link";

const PastEvent = () => {
  const [pastEvents, setPastEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { events } = FormData;

  useEffect(() => {
    window.scrollTo(0, 0);

    const fetchPastEvents = async () => {
      try {
        const response = await api.get("/api/form/getAllForms");
        if (response.status === 200) {
          const allEvents = response.data.events;
          // Filter and sort past events
          const sortedPastEvents = allEvents
            .filter((event) => event.info.isEventPast)
            .sort((a, b) => new Date(b.info.eventDate) - new Date(a.info.eventDate));
          setPastEvents(sortedPastEvents);
        } else {
          setError({
            message: "Sorry for the inconvenience, we are having issues fetching our Events",
          });
          console.error("Error fetching events:", response.data.message);

          const sortedPastEvents = events
            .filter((event) => event.info.isEventPast)
            .sort((a, b) => new Date(b.info.eventDate) - new Date(a.info.eventDate));
          setPastEvents(sortedPastEvents);
        }
      } catch (error) {
        setError({
          message: "Sorry for the inconvenience, we are having issues fetching our Events",
        });
        console.error("Error fetching events:", error);
        // Fallback to local JSON data
        const sortedPastEvents = events
          .filter((event) => event.info.isEventPast)
          .sort((a, b) => new Date(b.info.eventDate) - new Date(a.info.eventDate));
        setPastEvents(sortedPastEvents);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPastEvents();
  }, [events]);

  const customStyles = {
    eventname: {
      fontSize: "1.2rem",
    },
    registerbtn: {
      width: "8rem",
      fontSize: ".721rem",
    },
    eventnamep: {
      fontSize: "0.7rem",
    },
  };

  return (
    <>
      <div className={style.main}>
        <Link href={"/Events"}>
          <div className={style.ArrowBackIcon}>
            <ArrowBackIcon />
          </div>
        </Link>
        <div className={style.whole}>
          <div className={style.eventwhole}>
            {isLoading ? (
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
            ) : error ? (
              <div className={style.error}>{error.message}</div>
            ) : (
              <div className={style.pasteventCard}>
                <div className={style.name}>
                  <span className={style.w1}>Past</span>
                  <span className={style.w2}>Events</span>
                </div>
                <div className={style.Outcard}>
                  <div className={style.cardone}>
                    {pastEvents.map((event, index) => (
                      event.info.isPublic ? (
                        <div
                          style={{ height: "auto", width: "22rem" }}
                          key={index}
                        >
                          <EventCard
                            data={event}
                            type="past"
                            customStyles={customStyles}
                            modalpath="/pastEvents/"
                            aosDisable={false}
                          />
                        </div>
                      ) : null
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className={style.circle}></div>
          <div className={style.circleone}></div>
          <div className={style.circletwo}></div>
          <div className={style.circlethree}></div>
        </div>
      </div>
    </>
  );
};

export default PastEvent;
