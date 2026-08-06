"use client";

import React from "react";
import OtpInput from "../../../components/OtpInput/OtpInput";

const OtpInputModal = (props) => {
  const { onVerify, handleClose } = props;
  return (
    <div
      style={{
        position: "fixed",
        width: "100%",
        height: "100%",

        zIndex: "10",

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
          backgroundColor: "rgba(0, 0, 0, 0.72)",
          zIndex: "5",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "auto",
            height: "27rem",
            borderRadius: "20px",
            marginTop: "5rem",
            position: "relative",
          }}
        >
          <OtpInput
            isSignUp={true}
            onHandleVerfiy={onVerify}
            handleClose={handleClose}
          />
        </div>
      </div>
    </div>
  );
};

export default OtpInputModal;
