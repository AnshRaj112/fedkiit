"use client";

/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import { useState, useEffect, useContext } from "react";
import EventCardModal from "./styles/EventModal.module.scss";

import CloseButton from "../../../../components/CloseButton/CloseButton";
import Share from "../../../../features/Modals/Event/ShareModal/ShareModal";
import { PiClockCountdownDuotone } from "react-icons/pi";
import AuthContext from "../../../../context/AuthContext";
import { IoIosLock } from "react-icons/io";
import { Blurhash } from "react-blurhash";
import {
  MicroLoading,
  Alert,
  ComponentLoading,
} from "../../../../microInteraction";
import { api } from "../../../../services";
import { parse, differenceInMilliseconds } from "date-fns";
import { useRouter, useParams } from "next/navigation";

const EventModal = (props) => {
  const { onClosePath } = props;
  const router = useRouter();
  const [remainingTime, setRemainingTime] = useState("");
  const [btnTxt, setBtnTxt] = useState("Register Now");
  const authCtx = useContext(AuthContext);
  const [isMicroLoading, setIsMicroLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const { eventId } = useParams();
  const [shouldNavigate, setShouldNavigate] = useState(false);
  const [navigatePath, setNavigatePath] = useState("/");
  const [isLoading, setIsLoading] = useState(true);
  const [info, setInfo] = useState({});
  const [data, setData] = useState({});
  const [isRegisteredInRelatedEvents, setIsRegisteredInRelatedEvents] =
    useState(false);
  const [pastEvents, setPastEvents] = useState([]);
  const [ongoingEvents, setOngoingEvents] = useState([]);

  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await api.get("/api/form/getAllForms");
        if (response.status === 200) {
          const fetchedEvents = response.data.events;
          // Separate ongoing and past events
          const ongoing = fetchedEvents.filter(
            (event) => !event.info.isEventPast
          );
          const past = fetchedEvents.filter((event) => event.info.isEventPast);

          setOngoingEvents(ongoing);
          setPastEvents(past);

          const eventData = response.data?.events.find((e) => e.id === eventId);
          // console.log("fetched event modal test:", eventData);
          setData(eventData);
          setInfo(eventData?.info);
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
          message: "There was an error fetching event form. Please try again.",
          position: "bottom-right",
          duration: 3000,
        });
        // Fallback to local data
        // const { events } = FormData;
        // const data = events.find((event) => event.id === parseInt(eventId));
        // console.log(data);
        // const info = data.info;
        // setData(data);
        // setInfo(info);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvent();
  }, [eventId]);

  useEffect(() => {
    if (shouldNavigate) {
      router.push(navigatePath);
      setShouldNavigate(false); // Reset state after navigation
    }
  }, [shouldNavigate, navigatePath, router]);

  useEffect(() => {
    if (alert) {
      const { type, message, position, duration } = alert;
      Alert({ type, message, position, duration });
      setAlert(null); // Reset alert after displaying it
    }
  }, [alert]);

  useEffect(() => {
    if (info.regDateAndTime) {
      calculateRemainingTime();
      const intervalId = setInterval(calculateRemainingTime, 1000);
      return () => clearInterval(intervalId);
    }
  }, [info.regDateAndTime]);

  //Calculating data of event
  const dateStr = info.eventDate;
  const date = new Date(dateStr);

  const day = date.getDate();

  const getOrdinalSuffix = (day) => {
    if (day > 3 && day < 21) return "th"; // Handles 4-20
    switch (day % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  };

  const dayWithSuffix = day + getOrdinalSuffix(day);
  const month = date.toLocaleDateString("en-GB", { month: "long" });
  const year = date.getFullYear(); // Get the full year

  const formattedDate = `${dayWithSuffix} ${month} ${year}`;

  const calculateRemainingTime = () => {
    // Parse the regDateAndTime received from backend
    const regStartDate = parse(
      info.regDateAndTime,
      "MMMM do yyyy, h:mm:ss a",
      new Date()
    );
    const now = new Date();

    // Calculate the time difference in milliseconds
    const timeDifference = differenceInMilliseconds(regStartDate, now);

    if (timeDifference <= 0) {
      setRemainingTime(null);
      return;
    }

    // Calculate the days, hours, minutes, and seconds remaining
    const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDifference / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((timeDifference / (1000 * 60)) % 60);
    const seconds = Math.floor((timeDifference / 1000) % 60);

    let remaining;

    if (days > 0) {
      remaining = `${days} day${days > 1 ? "s" : ""} left`;
    } else {
      remaining = [
        hours > 0 ? `${hours}h ` : "",
        minutes > 0 ? `${minutes}m ` : "",
        seconds > 0 ? `${seconds}s` : "",
      ]
        .join("")
        .trim();
    }

    setRemainingTime(remaining);
  };

  // Update button text based on registration status and remaining time
  useEffect(() => {
    if (info.isRegistrationClosed || info.isEventPast) {
      setBtnTxt("Closed");
    } else if (remainingTime) {
      if (authCtx.user.access === "USER") {
        setBtnTxt("Locked");
      }
      setBtnTxt(remainingTime);
    } else {
      setBtnTxt("Register Now");
    }
  }, [info.isRegistrationClosed, remainingTime]);

  useEffect(() => {
    // Get registered event IDs from auth context
    const registeredEventIds = authCtx.user.regForm || [];

    // Collect related event IDs, filtering out null, undefined, and 'null'
    const relatedEventIds = ongoingEvents
      .map((event) => event.info.relatedEvent) // Extract relatedEvent IDs
      .filter((id) => id !== null && id !== undefined && id !== "null")
      .filter((id, index, self) => self.indexOf(id) === index);

    // Check if user is registered in any related events
    let isRegisteredInRelatedEvents = false;
    if (registeredEventIds.length > 0 && relatedEventIds.length > 0) {
      isRegisteredInRelatedEvents = relatedEventIds.some((relatedEventId) =>
        registeredEventIds.includes(relatedEventId)
      );
    }

    // console.log(
    //   "Is Registered in Related Events:",
    //   isRegisteredInRelatedEvents
    // );

    if (isRegisteredInRelatedEvents) {
      setIsRegisteredInRelatedEvents(true);
    }
  }, [ongoingEvents, authCtx.user.regForm]);

  useEffect(() => {
    if (authCtx.isLoggedIn && authCtx.user.regForm) {
      if (info.isRegistrationClosed) {
        setBtnTxt("Closed");
      }
      if (isRegisteredInRelatedEvents) {
        // console.log("checking for ", data?.id);
        if (data?.info?.relatedEvent === "null") {
          if (authCtx.user.regForm.includes(data.id)) {
            setBtnTxt("Already Registered");
          }
        } else {
          if (authCtx.user.regForm.includes(data?.id)) {
            setBtnTxt("Already Registered");
          } else {
            if (remainingTime) {
              setBtnTxt(remainingTime);
            } else if (data?.info?.isRegistrationClosed) {
              setBtnTxt("Closed");
            } else {
              setBtnTxt("Register Now");
            }
          }
        }
      } else {
        if (data?.info?.relatedEvent === "null") {
          if (authCtx.user.regForm.includes(data.id)) {
            setBtnTxt("Already Registered");
          } else {
            if (remainingTime) {
              setBtnTxt(remainingTime);
            } else if (data?.info?.isRegistrationClosed) {
              setBtnTxt("Closed");
            } else {
              setBtnTxt("Register Now");
            }
          }
        } else {
          // setBtnTxt("Locked");
          if (authCtx.user.access === "USER") {
            if (data?.info?.isRegistrationClosed) {
              setBtnTxt("Closed");
            } else {
              setBtnTxt("Locked");
            }
          }
        }
      }
    }
  }, [
    authCtx.isLoggedIn,
    authCtx.user.regForm,
    data,
    info.isRegistrationClosed,
    info.isEventPast,
    isRegisteredInRelatedEvents,
    remainingTime,
  ]);

  const handleModalClose = () => {
    router.push(onClosePath);
  };

  const [isOpen, setOpen] = useState(false);

  const handleShare = () => {
    setOpen(true);
  };

  const handleForm = () => {
    if (authCtx.isLoggedIn) {
      setIsMicroLoading(true);
      if (authCtx.user.access !== "USER" && authCtx.user.access !== "ADMIN") {
        setTimeout(() => {
          setIsMicroLoading(false);
          setBtnTxt("Already Member");
        }, 1000);

        setAlert({
          type: "info",
          message: "Team Members are not allowed to register for the Event",
          position: "bottom-right",
          duration: 3000,
        });
      } else {
        setNavigatePath("/Events/" + data?.id + "/Form");
        setTimeout(() => {
          setShouldNavigate(true);
        }, 3000);

        setTimeout(() => {
          setIsMicroLoading(false);
        }, 3000);

        setAlert({
          type: "info",
          message: "Opening Event Registration Form",
          position: "bottom-right",
          duration: 3000,
        });
      }
    } else {
      setIsMicroLoading(true);
      sessionStorage.setItem("prevPage", window.location.pathname);
      setNavigatePath("/login");

      setTimeout(() => {
        setShouldNavigate(true);
      }, 3000);

      setTimeout(() => {
        setIsMicroLoading(false);
      }, 3000);
    }
  };

  const url = typeof window === "undefined" ? "" : window.location.href;

  const status = info?.isEventPast
    ? { label: "Completed", tone: "neutral" }
    : info?.isRegistrationClosed
      ? { label: "Registration closed", tone: "closed" }
      : remainingTime
        ? { label: "Opening soon", tone: "soon" }
        : { label: "Open", tone: "open" };

  const isCtaDisabled =
    btnTxt === "Closed" ||
    btnTxt === "Already Registered" ||
    btnTxt === "Already Member" ||
    btnTxt === "Locked" ||
    btnTxt === `${remainingTime}`;

  const ctaContent = () => {
    if (btnTxt === "Closed") {
      return (
        <>
          <IoIosLock aria-hidden="true" />
          Registration closed
        </>
      );
    }
    if (btnTxt === "Already Registered") return "Already registered";
    if (btnTxt === "Locked") {
      return (
        <>
          <IoIosLock aria-hidden="true" />
          Locked
        </>
      );
    }
    if (isMicroLoading) return <MicroLoading />;
    if (remainingTime) {
      return (
        <>
          <PiClockCountdownDuotone aria-hidden="true" />
          {btnTxt}
        </>
      );
    }
    if (btnTxt === "Already Member") return "Already a member";
    return "Register now";
  };

  return (
    <div className={EventCardModal.overlay}>
      <article
        className={EventCardModal.sheet}
        role="dialog"
        aria-modal="true"
        aria-label={info?.eventTitle || "Event details"}
      >
        <CloseButton
          onClick={handleModalClose}
          label="Close event details"
          className={EventCardModal.close}
        />

        {isLoading ? (
          <div className={EventCardModal.loading}>
            <ComponentLoading
              customStyles={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            />
          </div>
        ) : (
          <>
            <div className={EventCardModal.hero}>
              {!imageLoaded && (
                <div className={EventCardModal.heroPlaceholder}>
                  <Blurhash
                    hash="LEG8_%els7NgM{M{RiNI*0IVog%L"
                    width="100%"
                    height="100%"
                    resolutionX={32}
                    resolutionY={32}
                    punch={1}
                  />
                </div>
              )}
              <img
                src={info?.eventImg}
                className={EventCardModal.heroImg}
                style={{ opacity: imageLoaded ? 1 : 0 }}
                alt=""
                onLoad={() => setImageLoaded(true)}
              />
              <span className={EventCardModal.badge} data-tone={status.tone}>
                {status.label}
              </span>
            </div>

            <div className={EventCardModal.content}>
              <p className={EventCardModal.date}>{formattedDate}</p>
              <h1 className={EventCardModal.title}>{info?.eventTitle}</h1>

              <ul className={EventCardModal.facts}>
                <li className={EventCardModal.fact}>
                  <span className={EventCardModal.factLabel}>Format</span>
                  <span className={EventCardModal.factValue}>
                    {info?.participationType === "Team"
                      ? `Team of ${info.minTeamSize}\u2013${info.maxTeamSize}`
                      : "Individual"}
                  </span>
                </li>
                <li className={EventCardModal.fact}>
                  <span className={EventCardModal.factLabel}>Entry</span>
                  <span className={EventCardModal.factValue}>
                    {info?.eventAmount ? `\u20b9${info.eventAmount}` : "Free"}
                  </span>
                </li>
                <li className={EventCardModal.fact}>
                  <span className={EventCardModal.factLabel}>Registration</span>
                  <span className={EventCardModal.factValue}>
                    {info?.isEventPast
                      ? "Closed"
                      : remainingTime
                        ? `Opens in ${remainingTime}`
                        : info?.isRegistrationClosed
                          ? "Closed"
                          : "Open now"}
                  </span>
                </li>
              </ul>

              {info?.eventdescription && (
                <div className={EventCardModal.prose}>
                  {info.eventdescription
                    .split("\n")
                    .filter((line) => line.trim())
                    .map((line, index) => (
                      <p key={index}>{line}</p>
                    ))}
                </div>
              )}
            </div>

            <div className={EventCardModal.actions}>
              {!info?.isEventPast && (
                <button
                  type="button"
                  className={EventCardModal.primary}
                  onClick={handleForm}
                  disabled={isCtaDisabled}
                >
                  {ctaContent()}
                </button>
              )}
              <button
                type="button"
                className={EventCardModal.secondary}
                onClick={handleShare}
              >
                Share
              </button>
            </div>
          </>
        )}

        {isOpen && <Share onClose={() => setOpen(false)} urlpath={url} />}
      </article>

      <Alert />
    </div>
  );
};

export default EventModal;
