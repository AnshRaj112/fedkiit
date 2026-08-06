"use client";

import { useContext, useEffect, useState } from "react";

import { api } from "../../services";
import style from "./styles/Event.module.scss";
import AuthContext from "../../context/AuthContext";
import { EventCard } from "../../components";
import { ErrorArt, NoEventsArt } from "./components/Artwork";
import Disclosure from "./components/Disclosure";
import { RecoveryContext } from "../../context/RecoveryContext";
import ShareTeamData from "../../features/Modals/Event/ShareModal/ShareTeamData";
import Link from "next/link";

const PAST_PREVIEW_COUNT = 4;

const Event = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const authCtx = useContext(AuthContext);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setOpenModal] = useState(false);
  const [pastEvents, setPastEvents] = useState([]);
  const [ongoingEvents, setOngoingEvents] = useState([]);
  const recoveryCtx = useContext(RecoveryContext);
  const [isRegisteredInRelatedEvents, setIsRegisteredInRelatedEvents] =
    useState(false);
  const [eventName, setEventName] = useState("");
  const [parentEventCount, setParentEventCount] = useState([]);

  useEffect(() => {
    if (
      (recoveryCtx.teamCode && recoveryCtx.teamName) ||
      recoveryCtx.successMessage
    ) {
      if (!isOpen) {
        setOpenModal(true);
      }
    }
  }, [recoveryCtx.teamCode, recoveryCtx.successMessage]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await api.get("/api/form/getAllForms");
        if (response.status === 200) {
          const fetchedEvents = response.data.events;
          const sortedEvents = fetchedEvents.sort((a, b) => {
            const priorityA = parseInt(a.info.eventPriority, 10);
            const priorityB = parseInt(b.info.eventPriority, 10);
            const dateA = new Date(a.info.eventDate);
            const dateB = new Date(b.info.eventDate);
            const titleA = a.info.eventTitle || "";
            const titleB = b.info.eventTitle || "";

            // compare by priority (lower priority first)
            if (priorityA !== priorityB) {
              return priorityA - priorityB;
            }

            // If priorities are the same, compare by date (earliest date first)
            if (dateA.getTime() !== dateB.getTime()) {
              return dateA.getTime() - dateB.getTime();
            }

            // If both priority and date are the same, compare alphabetically by title
            return titleA.localeCompare(titleB);
          });

          const ongoing = sortedEvents.filter(
            (event) => !event.info.isEventPast
          );
          const past = sortedEvents.filter((event) => event.info.isEventPast);
          const sortedPastEvents = past.sort((a, b) => {
            return new Date(b.info.eventDate) - new Date(a.info.eventDate);
          });

          setOngoingEvents(ongoing);
          setPastEvents(sortedPastEvents);
        } else {
          setError({
            message:
              "Sorry for the inconvenience, we are having issues fetching our Events",
          });
        }
      } catch (error) {
        setError({
          message:
            "Sorry for the inconvenience, we are having issues fetching our Events",
        });
        console.error("Error fetching events:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const handleShare = () => {
    if (
      (recoveryCtx.teamCode && recoveryCtx.teamName) ||
      recoveryCtx.successMessage
    ) {
      const { setTeamCode, setTeamName, setSuccessMessage } = recoveryCtx;
      setTeamCode(null);
      setTeamName(null);
      setSuccessMessage(null);
      setOpenModal(false);
    }
  };

  useEffect(() => {
    const eventWithNullRelated = ongoingEvents.find(
      (event) => event.info.relatedEvent === "null"
    );

    setEventName(
      eventWithNullRelated ? eventWithNullRelated.info.eventTitle : ""
    );
  }, [ongoingEvents]);

  useEffect(() => {
    const registeredEventIds = authCtx.user.regForm || [];

    // Looked up against the events actually fetched from the API. This used to
    // search the bundled FormData.json sample, so the count reflected mock
    // records rather than what the member is really registered for.
    const allEvents = [...ongoingEvents, ...pastEvents];

    const parentEvents = registeredEventIds
      .map((id) => allEvents.find((event) => event.id === id))
      .filter(
        (event) =>
          event?.info?.relatedEvent == null ||
          event.info.relatedEvent === "null"
      );

    setParentEventCount(parentEvents.length);

    const relatedEventIds = ongoingEvents
      .map((event) => event.info.relatedEvent)
      .filter((id) => id !== null && id !== undefined && id !== "null")
      .filter((id, index, self) => self.indexOf(id) === index);

    let registeredInRelated = false;
    if (registeredEventIds.length > 0 && relatedEventIds.length > 0) {
      registeredInRelated = relatedEventIds.some((relatedEventId) =>
        registeredEventIds.includes(relatedEventId)
      );
    }

    if (registeredInRelated) {
      setIsRegisteredInRelatedEvents(true);
    }
  }, [ongoingEvents, pastEvents, authCtx.user.regForm]);

  const teamCodeAndName = {
    teamCode: recoveryCtx.teamCode,
    teamName: recoveryCtx.teamName,
  };

  const successMessage = { successMessage: recoveryCtx.successMessage };

  const openEvents = ongoingEvents.filter((event) => event.info.isPublic);
  const publicPastEvents = pastEvents.filter((event) => event.info.isPublic);
  const displayedPastEvents = publicPastEvents.slice(0, PAST_PREVIEW_COUNT);

  // Registration can stay open on events whose date has already passed, so the
  // spotlight picks the soonest event that is genuinely still ahead of us and
  // only falls back to the priority order when nothing upcoming is left.
  const upcoming = openEvents
    .filter((event) => new Date(event.info.eventDate).getTime() >= Date.now())
    .sort((a, b) => new Date(a.info.eventDate) - new Date(b.info.eventDate));

  const spotlight = upcoming[0] || openEvents[0];
  const remainingOpen = openEvents.filter((event) => event.id !== spotlight?.id);

  // Spelling out how far away the event is makes "upcoming" concrete in a way
  // that a bare date never does.
  const countdown = (() => {
    if (!upcoming[0]) return null;
    const start = new Date(upcoming[0].info.eventDate);
    const midnight = (d) =>
      new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const days = Math.round(
      (midnight(start) - midnight(new Date())) / 86400000
    );
    if (days <= 0) return "Today";
    if (days === 1) return "Tomorrow";
    if (days < 30) return `In ${days} days`;
    const months = Math.round(days / 30);
    return `In ${months} month${months > 1 ? "s" : ""}`;
  })();

  const showPrerequisiteNotice =
    !isRegisteredInRelatedEvents &&
    parentEventCount === 0 &&
    authCtx.isLoggedIn &&
    authCtx.user.access === "USER" &&
    Boolean(eventName);

  return (
    <>
      {isOpen && (
        <ShareTeamData
          onClose={handleShare}
          teamData={teamCodeAndName}
          successMessage={successMessage}
        />
      )}

      <main className={style.page}>
        <div className={style.shell}>
        

          {isLoading ? (
            <section className={style.group} aria-busy="true">
              <div className={style.groupHead}>
                <h2 className={style.groupTitle}>Happening next</h2>
              </div>
              <div className={`${style.skeleton} ${style.skeletonFeatured}`}>
                <div className={style.skeletonMedia} />
                <div className={style.skeletonBody}>
                  <span className={style.skeletonLine} style={{ width: "35%" }} />
                  <span className={style.skeletonLine} style={{ width: "55%" }} />
                  <span className={style.skeletonLine} style={{ width: "70%" }} />
                  <span className={style.skeletonLine} style={{ width: "90%" }} />
                  <span className={style.skeletonCta} />
                </div>
              </div>
              <div className={style.grid} style={{ marginTop: "1.5rem" }}>
                {Array.from({ length: 3 }).map((_, i) => (
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
          ) : error ? (
            <div className={style.state} role="alert">
              <ErrorArt className={style.stateArt} />
              <h2 className={style.stateTitle}>We couldn&rsquo;t load events</h2>
              <p className={style.stateBody}>{error.message}</p>
              <button
                type="button"
                className={style.stateAction}
                onClick={() => window.location.reload()}
              >
                Try again
              </button>
            </div>
          ) : (
            <>
              {showPrerequisiteNotice && (
                <aside className={style.notice}>
                  <span className={style.noticeDot} aria-hidden="true" />
                  <p className={style.noticeText}>
                    Register for <strong>{eventName}</strong> to unlock the
                    remaining events.
                  </p>
                </aside>
              )}

              {spotlight ? (
                <section className={style.group}>
                  <div className={style.groupHead}>
                    <h2 className={style.groupTitle}>
                      {upcoming[0] ? "Happening next" : "Featured"}
                    </h2>
                    {countdown && (
                      <span className={style.countdown}>{countdown}</span>
                    )}
                  </div>
                  <EventCard
                    key={spotlight.id}
                    data={spotlight}
                    onOpen={() => {}}
                    type="ongoing"
                    variant="featured"
                    modalpath="/Events/"
                    isLoading={false}
                    isRegisteredInRelatedEvents={isRegisteredInRelatedEvents}
                    eventName={eventName}
                  />
                </section>
              ) : (
                <section className={style.group}>
                  <div className={style.groupHead}>
                    <h2 className={style.groupTitle}>Open for registration</h2>
                  </div>
                  <div className={style.state}>
                    <NoEventsArt className={style.stateArt} />
                    <h3 className={style.stateTitle}>Nothing open right now</h3>
                    <p className={style.stateBody}>
                      New events are announced here. Browse what we&rsquo;ve run
                      before in the meantime.
                    </p>
                  </div>
                </section>
              )}

              {remainingOpen.length > 0 && (
                <Disclosure
                  title="Also open"
                  count={remainingOpen.length}
                  defaultOpen
                >
                  <div className={style.grid}>
                    {remainingOpen.map((event) => (
                      <EventCard
                        key={event.id}
                        data={event}
                        onOpen={() => {}}
                        type="ongoing"
                        modalpath="/Events/"
                        isLoading={false}
                        isRegisteredInRelatedEvents={isRegisteredInRelatedEvents}
                        eventName={eventName}
                      />
                    ))}
                  </div>
                </Disclosure>
              )}

              {displayedPastEvents.length > 0 && (
                <Disclosure
                  title="Past events"
                  count={publicPastEvents.length}
                  action={
                    publicPastEvents.length > PAST_PREVIEW_COUNT ? (
                      <Link href="/Events/pastEvents" className={style.groupLink}>
                        View all
                      </Link>
                    ) : null
                  }
                >
                  <div className={style.grid}>
                    {displayedPastEvents.map((event) => (
                      <EventCard
                        key={event.id}
                        data={event}
                        onOpen={() => {}}
                        type="past"
                        modalpath="/Events/pastEvents/"
                        isLoading={false}
                      />
                    ))}
                  </div>
                </Disclosure>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
};

export default Event;
