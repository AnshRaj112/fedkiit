"use client";

import React, { useContext, useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { FaLinkedin, FaGithub } from "react-icons/fa";
import { Blurhash } from "react-blurhash";
import styles from "./styles/TeamCard.module.scss";
import TeamCardSkeleton from "../../layouts/Skeleton/TeamCard/TeamCard";
import { Button } from "../Core";
import AuthContext from "../../context/AuthContext";

const TeamCard = ({
  member,
  blurhash,
  customStyles = {},
  onUpdate,
  onRemove,
}) => {
  const [showMore, setShowMore] = useState(false);
  const [contentLoaded, setContentLoaded] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const extraData = member?.extra || {
    linkedin: "",
    github: "",
    know: "",
    designation: "",
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSkeleton(false);
    }, 500); // Show skeleton for 2 seconds

    return () => clearTimeout(timer);
  }, []);

  const authCtx = useContext(AuthContext);

  const isDirectorRole =
    ["PRESIDENT", "VICEPRESIDENT"].includes(member?.access) ||
    member?.access?.startsWith("DIRECTOR_");

  const handleImageLoad = () => {
    setIsImageLoaded(true);
  };

  const handleLink = (url) => {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    } else {
      return "https://" + url;
    }
  };

  const isExtraDataEmpty = () => {
    return (
      !extraData?.designation &&
      !extraData?.linkedin &&
      !extraData?.github &&
      !extraData.know
    );
  };

  
  //for name overflow

  const nameRef = useRef(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    if (nameRef.current) {
      setIsOverflowing(nameRef.current.scrollWidth > nameRef.current.clientWidth);
    }
  }, [member.name]);

  return (
    <div className={`${styles.teamMember} ${customStyles.teamMember || ""}`}>
      {showSkeleton && <TeamCardSkeleton customStyles={customStyles} />}
      <div
        className={styles.teamMemberInner}
        style={{ display: showSkeleton ? "none" : "block" }}
      >
        <div
          className={`${styles.teamMemberFront} ${
            customStyles.teamMemberFront || ""
          }`}
        >
          <div className={styles.ImgDiv}>
            {!isImageLoaded && (
              <Blurhash
                hash="LEG8_%els7NgM{M{RiNI*0IVog%L"
                width={"100%"}
                height={"100%"}
                resolutionX={32}
                resolutionY={32}
                punch={1}
              />
            )}
            <img
              src={member?.img}
              alt={`Profile of ${member?.name}`}
              className={styles.teamMemberImg}
              onLoad={handleImageLoad}
              style={{ display: isImageLoaded ? "block" : "none" }}
            />
          </div>
          <div
            className={`${styles.teamMemberInfo} ${
              customStyles.teamMemberInfo || ""
            }`}
          >
            <h4
              ref={nameRef}
              className={`${styles.memName} ${isOverflowing ? styles.responsive : ""}`}
              style={{ color: "#000" }}
            >
              {member?.name}
            </h4>
          </div>
        </div>
        <div
          className={`${styles.teamMemberBack} ${
            customStyles.teamMemberBack || ""
          }`}
        >
          {!showMore ? (
            <>
              {extraData.designation && (
                <h5
                  className={`${
                    customStyles.teamMemberBackh5 || ""
                  }`}
                  style={{ color: "#fff" }}
                >
                  {extraData.designation}
                </h5>
              )}
              <div
                className={`${styles.socialLinks} ${
                  customStyles.socialLinks || ""
                }`}
              >
                {extraData?.linkedin && (
                  <a
                    href={handleLink(extraData?.linkedin)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${
                      customStyles.socialLinksa || ""
                    }`}
                  >
                    <FaLinkedin />
                  </a>
                )}
                {extraData?.github && (
                  <a
                    href={handleLink(extraData?.github)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${
                      customStyles.socialLinksa || ""
                    }`}
                  >
                    <FaGithub />
                  </a>
                )}
              </div>
              {!isExtraDataEmpty() && isDirectorRole && (
                <button
                  onClick={() => setShowMore(true)}
                  aria-expanded={showMore}
                  className={`${customStyles.button || ""}`}
                >
                  Know More
                </button>
              )}
              {isExtraDataEmpty() ? (
                <div
                  className={`${styles.knowPara} ${
                    customStyles.knowPara || ""
                  }`}
                >
                  <p>Nothing to show</p>
                </div>
              ) : null}
              {onUpdate && authCtx.user.access === "ADMIN" && (
                <div
                  className={`${styles.updatebtn} ${
                    customStyles.updatebtn || ""
                  }`}
                >
                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      if (onUpdate) {
                        // console.log(member);
                        authCtx.memberData = member;
                        onUpdate();
                      }
                    }}
                  >
                    Update
                  </Button>

                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      const isConfirmed = window.confirm(
                        `Do you really want to remove this member "${member?.name}"?`
                      );
                      if (isConfirmed && onRemove) {
                        // console.log(member);
                        authCtx.memberData = member;
                        onRemove();
                      }
                    }}
                  >
                    Remove
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div
              className={`${styles.knowMoreContent} ${
                customStyles.knowMoreContent || ""
              }`}
            >
              {extraData.know && (
                <div
                  className={`${styles.knowPara} ${
                    customStyles.knowPara || ""
                  }`}
                >
                  <p>{extraData.know}</p>
                </div>
              )}
              <button
                onClick={() => setShowMore(false)}
                aria-expanded={showMore}
                className={`${customStyles.button || ""}`}
              >
                Back
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

TeamCard.propTypes = {
  name: PropTypes.string.isRequired,
  image: PropTypes.string.isRequired,
  social: PropTypes.shape({
    linkedin: PropTypes.string,
    github: PropTypes.string,
  }).isRequired,
  title: PropTypes.string.isRequired,
  role: PropTypes.string.isRequired,
  know: PropTypes.string.isRequired,
  blurhash: PropTypes.string, // Add this line
  customStyles: PropTypes.object,
  onUpdate: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
};

export default TeamCard;
