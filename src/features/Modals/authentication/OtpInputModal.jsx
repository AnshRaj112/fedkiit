"use client";

import React from "react";
import OtpInput from "../../../components/OtpInput/OtpInput";
import { X } from "lucide-react";

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
          background: "rgba(0, 0, 0, 0.5)",
          backdropFilter: "blur(4px)",
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
