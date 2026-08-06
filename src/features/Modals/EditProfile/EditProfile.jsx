"use client";

import { useState, useEffect, useContext } from "react";
import AuthContext from "../../../context/AuthContext";
import styles from "./styles/EditProfile.module.scss";
import { Button, Input } from "../../../components";
import { X } from "lucide-react";
import AOS from "aos";
import "aos/dist/aos.css";
import { Alert, MicroLoading } from "../../../microInteraction";
import { api } from "../../../services";
import { YEAR_OPTIONS } from "../../../data/yearOptions";

const EditProfile = ({ handleModalClose }) => {
  const authCtx = useContext(AuthContext);
  const [alert, setAlert] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [data, setData] = useState({
    name: authCtx.user.name,
    rollNumber: authCtx.user.rollNumber,
    year: authCtx.user.year,
    school: authCtx.user.school,
    college: authCtx.user.college,
    contactNo: authCtx.user.contactNo,
    github: authCtx.user.extra.github,
    linkedin: authCtx.user.extra.linkedin,
  });

  useEffect(() => {
    if (alert) {
      const { type, message, position, duration } = alert;
      Alert({ type, message, position, duration });
    }
  }, [alert]);

  useEffect(() => {
    AOS.init({ duration: 2000 });
  }, []);

  const validate = () => {
    const newErrors = {};
    if (!data.rollNumber) newErrors.rollNumber = "Roll Number is required";
    if (!data.school) newErrors.school = "School is required";
    if (!data.college) newErrors.college = "college is required";
    if (!data.contactNo || !/^\d{10}$/.test(data.contactNo))
      newErrors.contactNo = "Enter a valid 10-digit Mobile Number";
    if (!data.year) newErrors.year = "Year is required";

    const keys = Object.keys(newErrors);

    if (keys.length > 0) {
      setAlert({
        type: "error",
        message: newErrors[Object.keys(newErrors)[0]],
        position: "bottom-right",
        duration: 3000,
      });
      setErrors(newErrors);
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      let { linkedin, github, ...modifiedData } = data;
      modifiedData.extra = {
        github: data.github,
        linkedin: data.linkedin,
      };

      const response = await api.put("/api/user/editDetails", modifiedData, {
        headers: {
          Authorization: `Bearer ${window.localStorage.getItem("token")}`,
        },
      });

      if (response.status === 200 || response.status === 201) {
        setIsLoading(false);
        setErrors({});
        authCtx.update(
          data.name,
          authCtx.user.email,
          authCtx.user.img,
          data.rollNumber,
          data.school,
          data.college,
          data.contactNo,
          data.year,
          data.github,
          data.linkedin,
          authCtx.user.extra.designation,
          authCtx.user.access,
          authCtx.user.editProfileCount - 1,
          authCtx.user.regForm
        );
        setTimeout(() => {
          handleModalClose();
        }, 2000);
        setAlert({
          type: "success",
          message: "Profile updated successfully.",
          position: "bottom-right",
          duration: 3000,
        });
      } else {
        setIsLoading(false);
        setAlert({
          type: "error",
          message:
            "There was an error updating your profile. Please try again.",
          position: "bottom-right",
          duration: 3000,
        });
      }
    } catch (error) {
      setIsLoading(false);
      console.error("Error updating profile:", error);
      setAlert({
        type: "error",
        message: "There was an error updating your profile. Please try again.",
        position: "bottom-right",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        width: "100%",
        height: "100%",
        zIndex: "20",
        left: "0",
        top: "0",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "0",
          left: "0",
          width: "100%",
          height: "100%",
          background: "rgba(0, 0, 0, 0.5)",
          backdropFilter: "blur(4px)",
          zIndex: "15",
        }}
      >
        <div
          style={{
            zIndex: "10",
            borderRadius: "10px",
            position: "relative",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            scale: "0.8",
          }}
        >
          <>
            <div className={styles.flex}>
              <div
                id={styles.profile}
                data-aos="zoom-in-up"
                data-aos-duration="500"
              >
                <div className={styles.heading}>
                  <div className={styles.proHeading}>
                    <h3 className={styles.headInnerText}>
                      <span>Edit</span> Profile
                    </h3>
                  </div>
                  <button
                    className={styles.closeModal}
                    onClick={handleModalClose}
                  >
                    <X />
                  </button>
                </div>
                {authCtx.user && (
                  <div className={styles.details}>
                    <div>
                      <div className={styles.table}>
                        <h6 className={styles.dets}>Full Name</h6>
                        <Input
                          style={{
                            width: "17rem",
                            margin: "0px",
                            fontSize: "15px",
                          }}
                          placeholder="Enter your name"
                          type="text"
                          value={data.name}
                          className={styles.vals}
                          onChange={(e) =>
                            setData({ ...data, name: e.target.value })
                          }
                        />
                      </div>
                      <div className={styles.table}>
                        <h6 className={styles.dets}>Roll Number</h6>
                        <Input
                          style={{
                            width: "17rem",
                            margin: "0px",
                            fontSize: "15px",
                          }}
                          placeholder="Enter your roll"
                          type="text"
                          value={data.rollNumber}
                          className={styles.vals}
                          onChange={(e) =>
                            setData({ ...data, rollNumber: e.target.value })
                          }
                        />
                      </div>
                      {/* Editable, and never recomputed on save: a lateral-entry
                          student's year does not follow from their roll number,
                          and anyone repeating a year can correct it here. */}
                      <div className={styles.table}>
                        <h6 className={styles.dets}>Year</h6>
                        <Input
                          style={{
                            width: "17rem",
                            margin: "0px",
                            fontSize: "15px",
                          }}
                          type="select"
                          name="year"
                          className={styles.vals}
                          options={YEAR_OPTIONS}
                          value={data.year}
                          onChange={(value) =>
                            setData({ ...data, year: value })
                          }
                        />
                      </div>
                      <div className={styles.table}>
                        <h6 className={styles.dets}>School</h6>
                        <Input
                          style={{
                            width: "17rem",
                            margin: "0px",
                            fontSize: "15px",
                          }}
                          placeholder="Enter your school"
                          type="text"
                          value={data.school}
                          className={styles.vals}
                          onChange={(e) =>
                            setData({ ...data, school: e.target.value })
                          }
                        />
                      </div>
                      <div className={styles.table}>
                        <h6 className={styles.dets}>College</h6>
                        <Input
                          style={{
                            width: "17rem",
                            margin: "0px",
                            fontSize: "15px",
                          }}
                          placeholder="Enter your college"
                          type="text"
                          value={data.college}
                          className={styles.vals}
                          onChange={(e) =>
                            setData({ ...data, college: e.target.value })
                          }
                        />
                      </div>
                      <div className={styles.table}>
                        <h6 className={styles.dets}>Mobile No</h6>
                        <Input
                          style={{
                            width: "17rem",
                            margin: "0px",
                            fontSize: "15px",
                          }}
                          placeholder="Enter Phone number"
                          type="tel"
                          maxLength={12}
                          value={data.contactNo}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (/^\d*$/.test(value) && value.length <= 10) {
                              setData({ ...data, contactNo: value });
                            }
                          }}
                          className={styles.vals}
                          error={errors.contactNo}
                        />
                      </div>
                      {authCtx.user.access !== "USER" && (
                        <>
                          <div className={styles.table}>
                            <h6 className={styles.dets}>Github</h6>
                            <Input
                              style={{
                                width: "17rem",
                                margin: "0px",
                                fontSize: "15px",
                              }}
                              placeholder="Enter your Github"
                              type="text"
                              value={data.github}
                              className={styles.vals}
                              onChange={(e) =>
                                setData({ ...data, github: e.target.value })
                              }
                            />
                          </div>
                          <div className={styles.table}>
                            <h6 className={styles.dets}>LinkedIn</h6>
                            <Input
                              style={{
                                width: "17rem",
                                margin: "0px",
                                fontSize: "15px",
                              }}
                              placeholder="Enter your LinkedIn"
                              type="text"
                              value={data.linkedin}
                              className={styles.vals}
                              onChange={(e) =>
                                setData({ ...data, linkedin: e.target.value })
                              }
                            />
                          </div>
                        </>
                      )}

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          flexDirection: "column",
                          alignItems: "center",
                        }}
                      >
                        {authCtx.user.access === "USER" && (
                          <p
                            className={styles.vals}
                            style={{
                              marginTop: "15px",
                              textAlign: "center",
                              width: "100%",
                              fontSize: "1rem",
                            }}
                          >
                            You can only edit your profile{" "}
                            <span style={{ fontWeight: 600 }}>5 times. </span>{" "}
                            Total Edits left:{" "}
                            <span style={{ fontWeight: 600 }}>
                              {authCtx.user.editProfileCount}
                            </span>
                          </p>
                        )}
                        <Button
                          type="submit"
                          onClick={handleSave}
                          className={styles.submit}
                        >
                          {isLoading ? <MicroLoading /> : "Update Changes"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        </div>
      </div>
      <Alert />
    </div>
  );
};

export default EditProfile;
