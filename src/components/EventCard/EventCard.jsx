"use client";

import React, { useState, useEffect, useContext } from "react";
import PropTypes from "prop-types";
import style from "./styles/EventCard.module.scss";
import AOS from "aos";
import "aos/dist/aos.css";

import Share from "../../features/Modals/Event/ShareModal/ShareModal";
import QRCodeModal from "../../features/Modals/Event/QRCodeModal";
import shareOutline from "../../assets/images/shareOutline.svg";
import { PiClockCountdownDuotone } from "react-icons/pi";
import { IoIosLock, IoIosStats } from "react-icons/io";
import { MdGroups } from "react-icons/md";

import { FaUser, FaRupeeSign, FaEye } from "react-icons/fa";
import { QrCode } from "lucide-react";
import { parse, differenceInMilliseconds, formatDistanceToNow } from "date-fns";
import { Button } from "../Core";
import AuthContext from "../../context/AuthContext";
import EventCardSkeleton from "../../layouts/Skeleton/EventCard/EventCardSkeleton";
import { Blurhash } from "react-blurhash";
import { Alert, MicroLoading } from "../../microInteraction";
import Link from "next/link";
import { useRouter } from "next/navigation";

// import useUnixTimestamp from "../../utils/hooks/useUnixTimeStamp";

const EventCard = (props) => {
  const {
    data,
    onOpen,
    type,
    modalpath,
    customStyles = {},
    showShareButton = true,
    showRegisterButton = true,
    additionalContent,
    aosDisable,
    onEdit,
    onDelete,
    enableEdit,
    isLoading,
    isRegisteredInRelatedEvents,
    eventName,
  } = props;

  const { info } = data;
  const authCtx = useContext(AuthContext);
  const [isOpen, setOpen] = useState(false);
  const [isQRModalOpen, setQRModalOpen] = useState(false);
  const [isHovered, setisHovered] = useState(false);
  const [remainingTime, setRemainingTime] = useState("");
  const [btnTxt, setBtnTxt] = useState("Register Now");
  const router = useRouter();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [isMicroLoading, setIsMicroLoading] = useState(false);
  const [shouldNavigate, setShouldNavigate] = useState(false);
  const [navigatePath, setNavigatePath] = useState("/");
  const [isLocked, setIsLocked] = useState(false);
  const [alert, setAlert] = useState(null);


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
    if (aosDisable) {
      AOS.init({ disable: true });
    } else {
      AOS.init({ duration: 2000 });
    }
  }, [aosDisable]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSkeleton(false);
    }, 500); // Show skeleton for 2 seconds

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (info.regDateAndTime) {
      calculateRemainingTime();
      const intervalId = setInterval(calculateRemainingTime, 1000);
      return () => clearInterval(intervalId);
    }
  }, [info.regDateAndTime]);

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

  const modifyDateFormat = (dateStr) => {
    // Remove the ordinal suffix from the day
    const ordinalSuffixes = ["st", "nd", "rd", "th"];
    ordinalSuffixes.forEach((suffix) => {
      dateStr = dateStr.replace(suffix, "");
    });

    // Parse the date string to a JavaScript Date object
    const regDate = new Date(Date.parse(dateStr));

    // Convert the date to the desired ISO format (UTC)
    const isoDateStr = regDate.toISOString();

    return isoDateStr;
  };

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

  // Example usage in a React component with useEffect to update every second
  useEffect(() => {
    calculateRemainingTime(); // Initial calculation
    const intervalId = setInterval(calculateRemainingTime, 1000); // Update every second

    return () => clearInterval(intervalId); // Cleanup on component unmount
  }, []);

  useEffect(() => {
    if (info.isRegistrationClosed) {
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
    if (authCtx.isLoggedIn && authCtx.user.regForm) {
      // console.log("Inside Card", isRegisteredInRelatedEvents);

      if (isRegisteredInRelatedEvents) {

        console.log("checking for ", data.id);
        if (data?.info?.relatedEvent === "null") {
          if (authCtx.user.regForm.includes(data.id)) {
            setBtnTxt("Already Registered");
          }
        } else {
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
    isRegisteredInRelatedEvents,
    remainingTime,
  ]);

  const handleShare = () => {
    setOpen(!isOpen);
  };

  const handleCloseShare = () => {
    setOpen(false);
  };

  const handleQRCode = () => {
    if (authCtx.isLoggedIn && authCtx.user.regForm && authCtx.user.regForm.includes(data.id)) {
      setQRModalOpen(!isQRModalOpen);
    } else if (!authCtx.isLoggedIn) {
      setAlert({
        type: "info",
        message: "Please login to access attendance QR code.",
        position: "bottom-right",
        duration: 3000,
      });
    } else {
      setAlert({
        type: "info",
        message: "You need to register for this event first to get the attendance QR code.",
        position: "bottom-right",
        duration: 3000,
      });
    }
  };

  const handleCloseQRModal = () => {
    setQRModalOpen(false);
  };

  const isValiedState = () => {
    if (
      btnTxt === "Closed" ||
      btnTxt === "Already Registered" ||
      btnTxt === "Already Member" ||
      btnTxt === `${remainingTime}`
    ) {
      return false;
    }
    if (
      btnTxt === "Locked" &&
      authCtx.isLoggedIn &&
      authCtx.user.access === "USER"
    ) {
      setAlert({
        type: "info",
        message: `You need to register for ${eventName} first`,
        position: "bottom-right",
        duration: 3000,
      });
      return false;
    }
    return true;
  };

  const handleForm = () => {
    if (!isValiedState()) {
      return null;
    }

    if (authCtx.isLoggedIn) {
      setIsMicroLoading(true);
      if (authCtx.user.access !== "USER" && authCtx.user.access !== "ADMIN") {
        setTimeout(() => {
          setIsMicroLoading(false);
          setBtnTxt("Already Member");
        }, 1500);
        setAlert({
          type: "info",
          message: "Team Members are not allowed to register for the Event",
          position: "bottom-right",
          duration: 3000,
        });
      } else {
        setNavigatePath("/Events/" + data.id + "/Form");
        setTimeout(() => {
          setShouldNavigate(true);
        }, 1000);

        setTimeout(() => {
          setIsMicroLoading(false);
        }, 3000);
      }
    } else {
      setIsMicroLoading(true);
      sessionStorage.setItem("prevPage", window.location.pathname);
      setNavigatePath("/login");

      setTimeout(() => {
        setShouldNavigate(true);
      }, 1000);

      setTimeout(() => {
        setIsMicroLoading(false);
      }, 3000);
    }
  };

  const url = window.location.href;

  if (isLoading || showSkeleton) {
    return <EventCardSkeleton />;
  }

  return (
    <div>
      <div
        onMouseEnter={() => setisHovered(true)}
        onMouseLeave={() => setisHovered(false)}
        className={style.card}
        style={customStyles.card}
      // data-aos={aosDisable ? "" : "fade-up"}
      >
        <div
          className={style.backimg}
          style={customStyles.backimg}
          onClick={onOpen}
        >
          {!imageLoaded && (
            <Blurhash
              hash="LEG8_%els7NgM{M{RiNI*0IVog%L"
              width={"100%"}
              height={200}
              resolutionX={32}
              resolutionY={32}
              punch={1}
            />
          )}
          <img
            srcSet={info.eventImg}
            className={style.img}
            style={{
              ...customStyles.img,
              display: imageLoaded ? "block" : "none",
            }}
            alt="Event"
            onLoad={() => setImageLoaded(true)}
          />
          <div className={style.date} style={customStyles.date}>
            {formattedDate}
          </div>
          {type === "ongoing" && showShareButton && (
            <div
              className={style.share}
              style={customStyles.share}
              onClick={handleShare}
            >
              <img
                className={style.shareIcon}
                style={customStyles.shareIcon}
                src={shareOutline.src}
                alt="Share"
              />
            </div>
          )}
          {type === "ongoing" && authCtx.isLoggedIn && authCtx.user.regForm && authCtx.user.regForm.includes(data.id) && (
            <div
              className={style.qrCode}
              style={customStyles.qrCode}
              onClick={handleQRCode}
              title="View Attendance QR Code"
            >
              <QrCode
                className={style.qrIcon}
                style={customStyles.qrIcon}
                size={20}
                color="#f97507"
              />
            </div>
          )}
        </div>
        <div className={style.backbtn} style={customStyles.backbtn}>
          <div className={style.eventname} style={customStyles.eventname}>
            <span className={style.eventTitle}>
              {info.eventTitle && info.eventTitle.length > 14
                ? `${info.eventTitle.substring(0, 14)}...`
                : info.eventTitle || "No title available"}
            </span>

            {type === "ongoing" && (
              <p>
                {info.participationType === "Team" ? (
                  <>
                    <MdGroups color="#f97507" size={25} />
                    <span
                      style={{
                        color: "white",
                        paddingRight: "2px",
                        paddingLeft: "3px",
                      }}
                    >
                      {" "}
                      Team size:
                    </span>{" "}
                    {info.minTeamSize} - {info.maxTeamSize} {" | "}
                  </>
                ) : (
                  <>
                    <FaUser color="#f97507" size={13} />
                    <span
                      style={{
                        color: "white",
                        paddingRight: "2px",
                        paddingLeft: "3px",
                      }}
                    >
                      Individual
                    </span>
                    {" | "}
                  </>
                )}

                <div className={style.price} style={customStyles.price}>
                  {info.eventAmount ? (
                    <p style={{ font: "2rem" }}>
                      <FaRupeeSign color="#f97507" size={15} />
                      {info.eventAmount}
                    </p>
                  ) : (
                    <p style={{ color: "white", marginTop: "-1px" }}>Free</p>
                  )}
                </div>
              </p>
            )}
          </div>
          {type === "ongoing" && showRegisterButton && (
            <div
              style={{ fontSize: ".9rem", color: "white" }}
            // onMouseEnter={() => {
            //   if (
            //     btnTxt === "Locked" &&
            //     authCtx.isLoggedIn &&
            //     authCtx.user.access === "USER"
            //   ) {
            //   }
            // }}
            >

              <button
                className={style.registerbtn}
                style={{
                  ...customStyles.registerbtn,
                  cursor: btnTxt === "Register Now" ? "pointer" : "not-allowed",
                }}
                onClick={handleForm}
              // disabled={
              //   btnTxt === "Closed" ||
              //   btnTxt === "Locked" ||
              //   btnTxt === "Already Registered" ||
              //   btnTxt === "Already Member" ||
              //   btnTxt === `${remainingTime}`
              // }
              >
                {btnTxt === "Closed" ? (
                  <>
                    <div style={{ fontSize: "0.9rem" }}>Closed</div>
                    <IoIosLock
                      alt=""
                      style={{ marginLeft: "0px", fontSize: "1rem" }}
                    />
                  </>
                ) : btnTxt === "Already Registered" ? (
                  info.participationType === "Team" ? ( // Navigate to Team Management page
                    <>
                      <div
                        style={{ fontSize: "0.9rem", cursor: "pointer" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/Events/${data.id}/team`);
                        }}
                      >
                        Team Details
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: "0.9rem" }}>Registered</div>
                    </>
                  )


                ) : btnTxt === "Locked" ? (
                  <>
                    <div style={{ fontSize: "0.9rem" }}>Locked</div>
                    <IoIosLock
                      alt=""
                      style={{ marginLeft: "0px", fontSize: "1rem" }}
                    />
                  </>
                ) : isMicroLoading ? (
                  <div style={{ fontSize: "0.9rem" }}>
                    <MicroLoading />
                  </div>
                ) : (
                  <>
                    {remainingTime ? (
                      <>
                        <PiClockCountdownDuotone size={20} />
                        <div style={{ fontSize: "0.8rem" }}>{btnTxt}</div>
                      </>
                    ) : btnTxt === "Already Member" ? (
                      <>
                        <div style={{ fontSize: "0.8rem" }}>Already Member</div>
                      </>
                    ) : (
                      <div style={{ fontSize: "0.9rem" }}>Register Now</div>
                    )}
                  </>
                )}
              </button>
            </div>
          )}


        </div>
        <div className={style.backtxt} style={customStyles.backtxt}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div className={style.EventDesc} style={customStyles.EventDesc}>
              {info.eventdescription}
            </div>
            <Link href={modalpath + data.id}>
              <span
                onClick={handleCloseShare}
                className={style.seeMore}
                style={{
                  ...customStyles.seeMore,
                  marginLeft: "auto",
                  whiteSpace: "nowrap",
                  height: "fit-content",
                }}
              >
                See More
              </span>
            </Link>
          </div>
          {additionalContent && <div>{additionalContent}</div>}
        </div>
      </div>
      {isOpen && type === "ongoing" && (
        <Share onClose={handleShare} urlpath={url + "/" + data.id} />
      )}
      {isQRModalOpen && type === "ongoing" && (
        <QRCodeModal onClose={handleCloseQRModal} eventId={data.id} />
      )}
      {enableEdit && isHovered && authCtx.user.access === "ADMIN" && (
        <div
          onMouseEnter={() => setisHovered(true)}
          onMouseLeave={() => setisHovered(false)}
          className={style.hovered}
        >
          <Button
            onClick={(e) => {
              e.preventDefault();
              if (onEdit) {
                authCtx.eventData = data;
                onEdit();
              }
            }}
            variant="secondary"
          >
            Edit Event
          </Button>
          <Button
            onClick={(e) => {
              e.preventDefault();
              const isConfirmed = window.confirm(
                `Do you really want to delete this event "${info.eventTitle}"?`
              );
              if (isConfirmed && onDelete) {
                authCtx.eventData = data;
                onDelete();
              }
            }}
            variant="secondary"
          >
            Delete Event
          </Button>
          <IoIosStats
            size={20}
            style={{ cursor: "pointer", color: "white" }}
            onClick={() => {
              router.push("/profile/Events/Analytics/" + data.id);
            }}
          />
        </div>
      )}



      <Alert />
    </div>
  );
};

EventCard.propTypes = {
  data: PropTypes.object.isRequired,
  onOpen: PropTypes.func.isRequired,
  type: PropTypes.string.isRequired,
  modalpath: PropTypes.string.isRequired,
  customStyles: PropTypes.object,
  showShareButton: PropTypes.bool,
  showRegisterButton: PropTypes.bool,
  additionalContent: PropTypes.node,
  aosDisable: PropTypes.bool,
  onEdit: PropTypes.func,
  enableEdit: PropTypes.bool,
  isLoading: PropTypes.bool.isRequired,
};

export default EventCard;