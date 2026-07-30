"use client";

import React, { useState, useRef, useContext, useEffect } from "react";
import style from "./styles/OTPInput.module.scss"
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import OtpInput from "../../../components/OtpInput/OtpInput";
import { useRouter } from "next/navigation";

export default function OTPInput() {
  const router = useRouter();
  return (
    <div className={style.outerBox}>
      <div className={style.circle}>
        <div></div>
      </div>
      <div className={style.circle1}></div>
      <div onClick={()=>router.push('/ForgotPassword')} className={style.ArrowBackIcon}>
            <ArrowBackIcon />
          </div>
       <OtpInput/>

    </div>
  );
}
