"use client";

import { useState, useEffect, useContext } from "react";
import AuthContext from "../../../context/AuthContext";
import styles from "./styles/EditProfile.module.scss";
import { Button, Input } from "../../../components";
import CloseButton from "../../../components/CloseButton/CloseButton";
import AOS from "aos";
import "aos/dist/aos.css";
import { Alert, MicroLoading } from "../../../microInteraction";
import { api } from "../../../services";

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
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="Edit profile"
    >
      <div className={styles.panel} data-aos="zoom-in-up" data-aos-duration="500">
        <div className={styles.heading}>
          <h2 className={styles.title}>Edit profile</h2>
          <CloseButton
            onClick={handleModalClose}
            label="Close edit profile"
            className={styles.closeModal}
          />
        </div>
        {authCtx.user && (
          <div className={styles.details}>
            <div className={styles.profileTable}>
              <div className={styles.table}>
                <h6 className={styles.dets}>Full Name</h6>
                <Input
                  style={{ width: "100%", margin: "0px", fontSize: "15px" }}
                  placeholder="Enter your name"
                  type="text"
                  value={data.name}
                  className={styles.vals}
                  onChange={(e) => setData({ ...data, name: e.target.value })}
                />
              </div>
              <div className={styles.table}>
                <h6 className={styles.dets}>Roll Number</h6>
                <Input
                  style={{ width: "100%", margin: "0px", fontSize: "15px" }}
                  placeholder="Enter your roll"
                  type="text"
                  value={data.rollNumber}
                  className={styles.vals}
                  onChange={(e) =>
                    setData({ ...data, rollNumber: e.target.value })
                  }
                />
              </div>
              <div className={styles.table}>
                <h6 className={styles.dets}>Year</h6>
                <Input
                  style={{ width: "100%", margin: "0px", fontSize: "15px" }}
                  type="select"
                  name={data.year}
                  className={styles.vals}
                  options={[
                    { label: "1st Year", value: "1st" },
                    { label: "2nd Year", value: "2nd" },
                    { label: "3rd Year", value: "3rd" },
                    { label: "4th Year", value: "4th" },
                    { label: "5th Year", value: "5th" },
                    { label: "Passout", value: "Passout" },
                  ]}
                  value={data.year}
                  onChange={(value) => setData({ ...data, year: value })}
                />
              </div>
              <div className={styles.table}>
                <h6 className={styles.dets}>School</h6>
                <Input
                  style={{ width: "100%", margin: "0px", fontSize: "15px" }}
                  placeholder="Enter your school"
                  type="text"
                  value={data.school}
                  className={styles.vals}
                  onChange={(e) => setData({ ...data, school: e.target.value })}
                />
              </div>
              <div className={styles.table}>
                <h6 className={styles.dets}>College</h6>
                <Input
                  style={{ width: "100%", margin: "0px", fontSize: "15px" }}
                  placeholder="Enter your college"
                  type="text"
                  value={data.college}
                  className={styles.vals}
                  onChange={(e) => setData({ ...data, college: e.target.value })}
                />
              </div>
              <div className={styles.table}>
                <h6 className={styles.dets}>Mobile No</h6>
                <Input
                  style={{ width: "100%", margin: "0px", fontSize: "15px" }}
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
                      style={{ width: "100%", margin: "0px", fontSize: "15px" }}
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
                      style={{ width: "100%", margin: "0px", fontSize: "15px" }}
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

              <div className={styles.actions}>
                {authCtx.user.access === "USER" && (
                  <p className={styles.note}>
                    You can only edit your profile{" "}
                    <strong>5 times.</strong> Total edits left:{" "}
                    <strong>{authCtx.user.editProfileCount}</strong>
                  </p>
                )}
                <Button
                  type="submit"
                  onClick={handleSave}
                  className={styles.submit}
                  style={{
                    backgroundColor: "var(--accent)",
                    borderColor: "transparent",
                    color: "var(--text-inverse)",
                  }}
                >
                  {isLoading ? <MicroLoading /> : "Update Changes"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
      <Alert />
    </div>
  );
};

export default EditProfile;
