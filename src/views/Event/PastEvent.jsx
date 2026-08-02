"use client";

import { useEffect, useState } from "react";

import style from "./styles/Event.module.scss";
import { EventCard } from "../../components";
import { api } from "../../services";
import FormData from "../../data/FormData.json";
import { ErrorArt, NoEventsArt } from "./components/Artwork";
import Link from "next/link";

const PastEvent = () => {
  const [pastEvents, setPastEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { events } = FormData;

  useEffect(() => {
    window.scrollTo(0, 0);

    const fetchPastEvents = async () => {
      const fallback = () =>
        events
          .filter((event) => event.info.isEventPast)
          .sort(
            (a, b) => new Date(b.info.eventDate) - new Date(a.info.eventDate)
          );

      try {
        const response = await api.get("/api/form/getAllForms");
        if (response.status === 200) {
          const sortedPastEvents = response.data.events
            .filter((event) => event.info.isEventPast)
            .sort(
              (a, b) => new Date(b.info.eventDate) - new Date(a.info.eventDate)
            );
          setPastEvents(sortedPastEvents);
        } else {
          setError({
            message:
              "Sorry for the inconvenience, we are having issues fetching our Events",
          });
          console.error("Error fetching events:", response.data.message);
          setPastEvents(fallback());
        }
      } catch (error) {
        setError({
          message:
            "Sorry for the inconvenience, we are having issues fetching our Events",
        });
        console.error("Error fetching events:", error);
        setPastEvents(fallback());
      } finally {
        setIsLoading(false);
      }
    };

    fetchPastEvents();
  }, [events]);

  const publicEvents = pastEvents.filter((event) => event.info.isPublic);

  return (
    <main className={style.page}>
      <div className={style.shell}>
        <Link href="/Events" className={style.backLink}>
          <svg
            width="15"
            height="15"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M10 3.5 5.5 8l4.5 4.5" />
          </svg>
          All events
        </Link>

        <header className={style.masthead}>
          <div className={style.mastheadText}>
            <p className={style.eyebrow}>Archive</p>
            <h1 className={style.title}>Past events</h1>
            <p className={style.lede}>
              Everything we&rsquo;ve hosted so far, newest first.
            </p>
          </div>
          <div className={style.mastheadArt} aria-hidden="true">
            <img src="/assets/design-2.png" alt="" />
          </div>
        </header>

        {isLoading ? (
          <section className={style.group} aria-busy="true">
            <div className={style.grid}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={style.skeleton}>
                  <div className={style.skeletonMedia} />
                  <div className={style.skeletonBody}>
                    <span className={style.skeletonLine} />
                    <span
                      className={style.skeletonLine}
                      style={{ width: "60%" }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <span className={style.srOnly}>Loading events</span>
          </section>
        ) : error && publicEvents.length === 0 ? (
          <div className={style.state} role="alert">
            <ErrorArt className={style.stateArt} />
            <h2 className={style.stateTitle}>We couldn&rsquo;t load events</h2>
            <p className={style.stateBody}>{error.message}</p>
          </div>
        ) : publicEvents.length > 0 ? (
          <section className={style.group}>
            <div className={style.groupHead}>
              <h2 className={style.groupTitle}>Archive</h2>
              <span className={style.count}>{publicEvents.length}</span>
            </div>
            <div className={style.grid}>
              {publicEvents.map((event) => (
                <EventCard
                  key={event.id}
                  data={event}
                  type="past"
                  modalpath="/pastEvents/"
                  isLoading={false}
                />
              ))}
            </div>
          </section>
        ) : (
          <div className={style.state}>
            <NoEventsArt className={style.stateArt} />
            <h2 className={style.stateTitle}>No past events yet</h2>
            <p className={style.stateBody}>
              Once an event wraps up it will show here.
            </p>
          </div>
        )}
      </div>
    </main>
  );
};

export default PastEvent;
