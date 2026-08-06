"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "../../../services";
import styles from "./styles/EventsSection.module.scss";

/** Shown when an event carries no image of its own. */
const EVENT_BANNER_FALLBACK = "/fedkiit-logo.png";

export default function HomeEventsSection() {
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUpcomingEvents = async () => {
      let eventList = [];

      try {
        const response = await api.get("/api/form/getAllForms");
        if (response.status === 200 && response.data?.events?.length > 0) {
          eventList = response.data.events;
        }
      } catch (err) {
        console.error("Error fetching events:", err);
      }

      // No local fallback. This used to drop back to the bundled FormData.json
      // sample, so an API failure put test records on the home page. When there
      // is nothing to show, the section renders its empty state instead.
      eventList = eventList || [];

      // Separate upcoming/live vs past events
      const liveOrUpcoming = eventList.filter((ev) => !ev.info?.isEventPast);
      const pastEvents = eventList.filter((ev) => ev.info?.isEventPast);

      let sortedEvents = [];

      if (liveOrUpcoming.length > 0) {
        // Sort upcoming/live events by date ascending (soonest / imminent dates first)
        sortedEvents = [...liveOrUpcoming].sort((a, b) => {
          const timeA = new Date(a.info?.eventDate || a.date || 0).getTime();
          const timeB = new Date(b.info?.eventDate || b.date || 0).getTime();
          return (isNaN(timeA) ? Infinity : timeA) - (isNaN(timeB) ? Infinity : timeB);
        });
      } else {
        // Sort past events by date descending (most recent / newest past dates first)
        sortedEvents = [...pastEvents].sort((a, b) => {
          const timeA = new Date(a.info?.eventDate || a.date || 0).getTime();
          const timeB = new Date(b.info?.eventDate || b.date || 0).getTime();
          return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
        });
      }

      // Pick top 3 latest events
      const displayEvents = sortedEvents.slice(0, 3);

      const formatted = displayEvents.map((ev) => {
        const info = ev.info || {};

        // Format Date string cleanly
        let formattedDate = "Upcoming";
        if (info.eventDate) {
          try {
            const d = new Date(info.eventDate);
            if (!isNaN(d.getTime())) {
              formattedDate = d.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });
            } else {
              formattedDate = String(info.eventDate);
            }
          } catch {
            formattedDate = String(info.eventDate);
          }
        }

        const tag = info.participationType || info.eventType || info.relatedEvent || "Event";
        // Local asset on purpose. This fell back to a cdn.builder.io URL that
        // carried an `apiKey` query parameter belonging to a third-party
        // Builder.io account — GitGuardian flags it as a hardcoded secret, and
        // the host is not in `next.config.ts` remotePatterns either.
        const banner = info.eventImg || info.bannerImage || EVENT_BANNER_FALLBACK;

        return {
          id: ev._id || info._id,
          title: info.eventTitle || "FED Event",
          tag: tag,
          description: info.eventdescription || info.eventDescription || "Join us for an exciting event by FED KIIT.",
          date: formattedDate,
          banner: banner,
          link: "/Events",
        };
      });

      setUpcomingEvents(formatted);
      setLoading(false);
    };

    fetchUpcomingEvents();
  }, []);

  return (
    <section id="EventsSection" className={styles.eventsSection}>
      <div className={styles.heading}>
        <h2>
          LIVE <span className={styles.highlight}>& UPCOMING</span> EVENTS
        </h2>
        <div className={styles.bottomLine}></div>
      </div>

      <div className={styles.eventsContainer}>
        {loading ? (
          <div className={styles.loadingGrid}>
            {[1, 2, 3].map((i) => (
              <div key={i} className={styles.skeletonCard}></div>
            ))}
          </div>
        ) : (
          <div className={styles.eventsGrid}>
            {upcomingEvents.map((ev, idx) => (
              <Link href={ev.link} key={ev.id || `event-${idx}`} className={styles.eventCardLink}>
                <div className={styles.eventCard}>
                  {/* Top Image Banner with Tag Overlay */}
                  <div className={styles.cardImageWrapper}>
                    <img src={ev.banner} alt={ev.title} className={styles.cardImage} />
                    <span className={styles.tagBadge}>{ev.tag}</span>
                  </div>

                  {/* Card Content Body */}
                  <div className={styles.cardBody}>
                    <h3 className={styles.eventTitle}>{ev.title}</h3>
                    <p className={styles.eventDescription}>{ev.description}</p>

                    {/* Date Line at Bottom */}
                    <div className={styles.dateFooter}>
                      <svg
                        className={styles.calendarIcon}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span>{ev.date}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className={styles.viewAllWrapper}>
          <Link href="/Events" className={styles.viewAllBtn}>
            View All Events →
          </Link>
        </div>
      </div>
    </section>
  );
}
