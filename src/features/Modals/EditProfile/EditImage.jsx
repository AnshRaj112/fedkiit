"use client";

import React, { useContext, useState, useRef, useEffect } from "react";
import AvatarEditor from "react-avatar-editor";
import { FaUpload } from "react-icons/fa";
import style from "./styles/editImage.module.scss";
import AuthContext from "../../../context/AuthContext";
import { Button } from "../../../components";
import CloseButton from "../../../components/CloseButton/CloseButton";
import { Alert, MicroLoading } from "../../../microInteraction";
import { api } from "../../../services";
import camera from "../../../assets/images/camera.svg";
// import { RecoveryContext } from '../../../context/RecoveryContext';

const EditImage = (props) => {
  const {
    selectedFile,
    closeModal,
    setimage,
    updatePfp,
    setimgprv,
    setFile,
    fileName,
  } = props;
  // const [scale, setScale] = useState(1);
  const [errorMsg, setMsg] = useState(null);
  const [alert, setAlert] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const authCtx = useContext(AuthContext);
  const imgRef = useRef(null);

  // const editorRef = useRef(null);

  useEffect(() => {
    if (alert) {
      const { type, message, position, duration } = alert;
      Alert({ type, message, position, duration });
    }
  }, [alert]);

  // const handleScaleChange = (e) => {
  //   const scaleValue = parseFloat(e.target.value);
  //   setScale(scaleValue);
  // };

  const MAX_FILE_SIZE_MB = 0.70; // 750 KB
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

  const checkFileSize = (file) => file.size <= MAX_FILE_SIZE_BYTES;

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
    setMsg(null);
  };

  const handleSave = async () => {
    if (selectedFile) {
      if (!checkFileSize(selectedFile)) {
        setAlert({
          type: "error",
          message: "File size should not exceed 700 KB.",
          position: "bottom-right",
          duration: 3000,
        });
        setMsg("File Size should not exceed 700 KB");
        return;
      }

      setIsLoading(true);
      // const canvas = editorRef.current.getImageScaledToCanvas();
      // canvas.toBlob(async (blob) => {
      // const imageFile = new File([blob], "profile.jpg", { type: "image/jpeg" });

      if (updatePfp) {
        try {
          const formData = new FormData();
          formData.append("email", authCtx.user.email);
          // formData.append('image', imageFile);
          formData.append("image", selectedFile);

          const response = await api.post(
            "/api/user/editProfileImage",
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
                Authorization: `Bearer ${window.localStorage.getItem("token")}`,
              },
            }
          );

          if (response.status === 200 || response.status === 201) {
            if (response.data.url) {
              authCtx.update(
                authCtx.user.name,
                authCtx.user.email,
                response.data.url,
                authCtx.user.rollNumber,
                authCtx.user.school,
                authCtx.user.college,
                authCtx.user.contactNo,
                authCtx.user.year,
                authCtx.user.extra.github,
                authCtx.user.extra.linkedin,
                authCtx.user.extra.designation,
                authCtx.user.access,
                authCtx.user.editProfileCount,
                authCtx.user.regForm
              );
            }
            setimage(selectedFile);
            // setimage(response.data.url)
            setAlert({
              type: "success",
              message: "Profile image updated successfully.",
              position: "bottom-right",
              duration: 3000,
            });
            setTimeout(() => {
              closeModal();
              // window.location.reload();
            }, 2000);
          } else {
            setAlert({
              type: "error",
              message:
                "There was an error updating your profile image. Please try again.",
              position: "bottom-right",
              duration: 3000,
            });
          }
        } catch (error) {
          console.error("Error updating profile image:", error);
          setAlert({
            type: "error",
            message:
              "There was an error updating your profile image. Please try again.",
            position: "bottom-right",
            duration: 3000,
          });
        } finally {
          setIsLoading(false);
        }
      } else {
        // For AddMemberForm: Just update the preview image
        // setimage(URL.createObjectURL(blob));
        // setimgprv(imageFile,URL.createObjectURL(blob));
        // setFile(imageFile);
        closeModal();
      }
      // }, "image/jpeg");
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      if (!checkFileSize(selectedFile)) {
        setAlert({
          type: "error",
          message: "File size should not exceed 700 KB.",
          position: "bottom-right",
          duration: 3000,
        });
        setMsg("File Size should not exceed 700 KB");
        return;
      }
      // const canvas = editorRef.current.getImageScaledToCanvas();
      // canvas.toBlob(async (blob) => {
      // const imageFile = new File([blob], fileName, { type: "image/jpeg" });
      // console.log("imagefile after crop", imageFile);
      authCtx.croppedImageFile = selectedFile;
      // console.log("file stored in context:",authCtx.croppedImageFile);
      // console.log("selected file :", selectedFile);
      setimgprv(URL.createObjectURL(selectedFile));
      closeModal();
      // }, "image/jpeg");
    }
  };

  return (
    <div
      className={style.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="Image preview"
    >
      <div className={style.container}>
        <header className={style.header}>
          <h2 className={style.imageTitle}>Image preview</h2>
          <CloseButton
            onClick={closeModal}
            label="Close image preview"
            className={style.closeModal}
          />
        </header>
        <div className={style.imageFrame}>
          <img
            className={style.imagePreview}
            src={URL.createObjectURL(selectedFile)}
            alt=""
          />
        </div>
        {errorMsg && (
          <div className={style.errorRow}>
            <span className={style.errMsg}>{errorMsg}</span>
            <button
              type="button"
              className={style.repick}
              aria-label="Choose another image"
              onClick={(e) => {
                e.stopPropagation();
                imgRef.current?.click();
              }}
            >
              <img src={camera.src} alt="" />
            </button>
            <input
              className={style.fileInput}
              type="file"
              ref={imgRef}
              onChange={handleFileChange}
            />
          </div>
        )}
        {/* <AvatarEditor
              ref={editorRef}
              image={selectedFile}
              width={150}
              height={150}
              border={50}
              style={{ borderRadius: "2rem" }}
              borderRadius={125}
              // scale={scale}
            /> */}
        {updatePfp ? (
          <Button
            type="button"
            onClick={handleSave}
            className={style.submit}
            style={{
              backgroundColor: "var(--accent)",
              borderColor: "transparent",
              color: "var(--text-inverse)",
            }}
          >
            {isLoading ? (
              <MicroLoading />
            ) : (
              <>
                <FaUpload /> Update image
              </>
            )}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleUpload}
            className={style.submit}
            style={{
              backgroundColor: "var(--accent)",
              borderColor: "transparent",
              color: "var(--text-inverse)",
            }}
          >
            {isLoading ? (
              <MicroLoading />
            ) : (
              <>
                <FaUpload /> Upload image
              </>
            )}
          </Button>
        )}
      </div>
      <Alert />
    </div>
  );
};

export default EditImage;
