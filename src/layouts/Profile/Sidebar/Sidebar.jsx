"use client";

import React, { useContext, useEffect, useRef, useState } from "react";

import { MdLogout } from "react-icons/md";
import { TbUserEdit } from "react-icons/tb";
import { SlCalender } from "react-icons/sl";
import { SiReacthookform } from "react-icons/si";
import { FaRegNewspaper, FaCertificate } from "react-icons/fa";
import { LuClipboardList } from "react-icons/lu";
import AuthContext from "../../../context/AuthContext";
import styles from "./styles/Sidebar.module.scss";

import defaultImg from "../../../assets/images/defaultImg.jpg";
import camera from "../../../assets/images/camera.svg";
import { EditImage } from "../../../features";
import Link from "next/link";
import { useRouter } from "next/navigation";


const Sidebar = ({ activepage, handleChange }) => {
  const [designation, setDesignation] = useState("");
  const authCtx = useContext(AuthContext);
  const [imagePrv, setimagePrv] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const imgRef = useRef(null);
  const router = useRouter();
  const [openModal, setOpenModal] = useState(false);

  useEffect(() => {
    const access = authCtx.user.access;
    const email = authCtx.user.email; // Assuming email is available in authCtx.user
    
    if (email === "attendance@fedkiit.com") {
      setDesignation("Attendance Only");
    } else if (access === "ADMIN") {
      setDesignation("Admin");
    } else if (access === "ALUMNI") {
      setDesignation("Alumni");
    } else if (access === "USER") {
      setDesignation("User");
    } else {
      setDesignation("Member");
    }
  }, [authCtx.user.access, authCtx.user.email]);

  const handleLogout = () => {
    router.push("/");
    authCtx.logout();
  };

  const handleName = () => {
    const maxLength = 20;
    const name = authCtx.user.name || "";
    return name.length > maxLength ? `${name.slice(0, maxLength)}...` : name;
  };

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
    setOpenModal(true);
  };

  const closeModal = () => {
    setSelectedFile(null);
    setOpenModal(false);
  };

  const setImage = (url) => {
    setimagePrv(url);
  };

  // Check if user is attendance-only
  const isAttendanceOnly = authCtx.user.email === "attendance@fedkiit.com";

  // Modified: Now shows Attendance instead of Blogs in mobile view
  const renderBlogMenu = () => {
    const isMobile = window.innerWidth <= 768;

    if (isMobile) {
      return (
        <div
          onClick={() => handleChange("Attendance")}
          style={{
            background:
              activepage === "Attendance" ? "var(--primary)" : "transparent",
            WebkitBackgroundClip:
              activepage === "Attendance" ? "text" : "initial",
            backgroundClip: activepage === "Attendance" ? "text" : "initial",
            color: activepage === "Attendance" ? "transparent" : "inherit",
          }}
        >
          <LuClipboardList
            size={17}
            style={{
              color: activepage === "Attendance" ? "#FF8A00" : "white",
              marginRight: "10px",
            }}
          />{" "}
          <Link href={"/profile/attendance"}>Attendance</Link>
        </div>
      );
    }

    return (
      <div
        onClick={() => handleChange("Blogs")}
        style={{
          background: activepage === "Blogs" ? "var(--primary)" : "transparent",
          WebkitBackgroundClip: activepage === "Blogs" ? "text" : "initial",
          backgroundClip: activepage === "Blogs" ? "text" : "initial",
          color: activepage === "Blogs" ? "transparent" : "inherit",
        }}
      >
        <FaRegNewspaper
          size={17}
          style={{
            color: activepage === "Blogs" ? "#FF8A00" : "white",
            marginRight: "10px",
          }}
        />{" "}
        <Link href={"/profile/BlogForm"}>Blogs</Link>
      </div>
    );
  };

  const renderAdminMenu = () => (
    <>
      <div
        onClick={() => handleChange("Events")}
        style={{
          background: activepage === "Events" ? "var(--primary)" : "transparent",
          WebkitBackgroundClip: activepage === "Events" ? "text" : "initial",
          backgroundClip: activepage === "Events" ? "text" : "initial",
          color: activepage === "Events" ? "transparent" : "inherit",
        }}
      >
        <SlCalender
          size={17}
          style={{
            color: activepage === "events" ? "#FF8A00" : "white",
            marginRight: "10px",
          }}
        />{" "}
        <Link href="/profile/events">Event</Link>
      </div>

      <div
        onClick={() => handleChange("Form")}
        style={{
          background: activepage === "Form" ? "var(--primary)" : "transparent",
          WebkitBackgroundClip: activepage === "Form" ? "text" : "initial",
          backgroundClip: activepage === "Form" ? "text" : "initial",
          color: activepage === "Form" ? "transparent" : "inherit",
        }}
      >
        <SiReacthookform
          size={17}
          style={{
            color: activepage === "Form" ? "#FF8A00" : "white",
            marginRight: "10px",
          }}
        />{" "}
        <Link href={"/profile/Form"}>Form</Link>
      </div>

      <div
        onClick={() => handleChange("Members")}
        style={{
          background:
            activepage === "Members" ? "var(--primary)" : "transparent",
          WebkitBackgroundClip: activepage === "Members" ? "text" : "initial",
          backgroundClip: activepage === "Members" ? "text" : "initial",
          color: activepage === "Members" ? "transparent" : "inherit",
          marginLeft: "-6px",
        }}
      >
        <TbUserEdit
          size={17}
          style={{
            color: activepage === "Members" ? "#FF8A00" : "white",
            marginRight: "10px",
          }}
        />{" "}
        <Link href={"/profile/members"}> Members</Link>
      </div>

      <div
        onClick={() => handleChange("Attendance")}
        style={{
          background:
            activepage === "Attendance" ? "var(--primary)" : "transparent",
          WebkitBackgroundClip:
            activepage === "Attendance" ? "text" : "initial",
          backgroundClip: activepage === "Attendance" ? "text" : "initial",
          color: activepage === "Attendance" ? "transparent" : "inherit",
          marginLeft: "-6px",
        }}
      >
        <LuClipboardList
          size={17}
          style={{
            color: activepage === "Attendance" ? "#FF8A00" : "white",
            marginRight: "10px",
          }}
        />{" "}
        <Link href={"/profile/attendance"}> Attendance</Link>
      </div>

      <div
        onClick={() => handleChange("Social")}
        style={{
          background: activepage === "Social" ? "var(--primary)" : "transparent",
          WebkitBackgroundClip: activepage === "Social" ? "text" : "initial",
          backgroundClip: activepage === "Social" ? "text" : "initial",
          color: activepage === "Social" ? "transparent" : "inherit",
          marginLeft: "-6px",
        }}
      >
        <FaRegNewspaper
          size={17}
          style={{
            color: activepage === "Social" ? "#FF8A00" : "white",
            marginRight: "10px",
          }}
        />{" "}
        <Link href="/profile/social">Social Management</Link>
      </div>
    </>
  );

  // Render attendance-only menu
  const renderAttendanceOnlyMenu = () => (
    <div
      onClick={() => handleChange("Attendance")}
      style={{
        background: activepage === "Attendance" ? "var(--primary)" : "transparent",
        WebkitBackgroundClip: activepage === "Attendance" ? "text" : "initial",
        backgroundClip: activepage === "Attendance" ? "text" : "initial",
        color: activepage === "Attendance" ? "transparent" : "inherit",
      }}
    >
      <LuClipboardList
        size={17}
        style={{
          color: activepage === "Attendance" ? "#FF8A00" : "white",
          marginRight: "10px",
        }}
      />{" "}
      <Link href={"/profile/attendance"}>Attendance</Link>
    </div>
  );

  const renderCertificateMenu = () => (
    <div
      onClick={() => handleChange("Certificates")}
      style={{
        background: activepage === "Certificates" ? "var(--primary)" : "transparent",
        WebkitBackgroundClip: activepage === "Certificates" ? "text" : "initial",
        backgroundClip: activepage === "Certificates" ? "text" : "initial",
        color: activepage === "Certificates" ? "transparent" : "inherit",
      }}
    >
      <FaCertificate
        size={17}
        style={{
          color: activepage === "Certificates" ? "#FF8A00" : "white",
          marginRight: "10px",
        }}
      />{" "}
      <Link href={"/profile/certificates"}>Certificates</Link>
    </div>
  );

  return (
    <>
      <div className={styles.sidebar}>
        <div className={styles.profile}>
          <div
            style={{ width: "auto", position: "relative", cursor: "pointer" }}
            onClick={() => handleChange("Profile")}
          >
            <Link href={"/profile"}>
              <img
                src={authCtx.user.img || imagePrv || defaultImg.src}
                alt="Profile"
                className={styles.profilePhoto}
              />
            </Link>

            {selectedFile && (
              <EditImage
                selectedFile={selectedFile}
                closeModal={closeModal}
                setimage={setImage}
                updatePfp={true}
                setFile={setSelectedFile}
              />
            )}
            {authCtx.user.access !== "USER" && !isAttendanceOnly && (
              <>
                <div
                  style={{ position: "absolute", bottom: "5px", right: "5px" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    imgRef.current?.click();
                  }}
                >
                  <img src={camera.src} alt="camera" />
                </div>
                <input
                  style={{
                    display: "none",
                  }}
                  type="file"
                  ref={imgRef}
                  onChange={handleFileChange}
                />
              </>
            )}
          </div>

          <div className={styles.profileInfo}>
            <Link href={"/profile"}>
              <p className={styles.name}>{handleName()}</p>
            </Link>
            <p className={styles.role}>{designation}</p>
          </div>
        </div>
        
        <div className={styles.menu}>
          {isAttendanceOnly ? (
            // Show only Attendance menu for attendance@fedkiit.com
            renderAttendanceOnlyMenu()
          ) : (
            // Original menu logic for other users
            <>
              {designation === "Admin" && renderAdminMenu()}
              {(designation === "Admin" ||
                authCtx.user.access === "SENIOR_EXECUTIVE_CREATIVE") &&
                renderBlogMenu()}
              {designation !== "Admin" && (
                <div
                  onClick={() => handleChange("events")}
                  style={{ color: activepage === "events" ? "#FF8A00" : "white" }}
                >
                  <Link href={"/profile/events"}>
                    <SlCalender size={17} style={{ marginRight: "10px" }} /> Event
                  </Link>
                </div>
              )}
              {authCtx.user.access !== "USER" && renderCertificateMenu()}
            </>
          )}
          
          {/* Logout is always available for all users */}
          <div
            onClick={handleLogout}
            style={{ color: activepage === "Logout" ? "#FF8A00" : "white" }}
          >
            <MdLogout size={17} style={{ marginRight: "9px" }} /> Logout
          </div>
        </div>
        <div className={styles.divider} />
      </div>
    </>
  );
};

export default Sidebar;