"use client";

import React, { useState, useRef, useContext, useEffect } from "react";
import axios from "axios";
import { RecoveryContext } from "../../context/RecoveryContext";
import Button from "../Core/Button";
import Input from "../Core/Input";
import style from "./style/otpinput.module.scss";

import { X } from "lucide-react";
import { api } from "../../services";
import { Alert, MicroLoading } from "../../microInteraction";
import { useRouter } from "next/navigation";

// `NEXT_PUBLIC_OTP_LENGTH` is the same variable `lib/services/otp.ts` generates
// codes from. Next inlines it at build time, so it must be referenced by its
// full literal name rather than looked up dynamically.
const OTP_LENGTH = Number(process.env.NEXT_PUBLIC_OTP_LENGTH) || 4;

const OtpInput = (props) => {
  const { email } = useContext(RecoveryContext);
  const [timerCount, setTimer] = useState(60);
  // Driven by the same variable the server generates codes from, so the number
  // of boxes always matches the number of digits emailed. Hardcoding four here
  // is what let a six-digit code arrive at a four-box screen.
  const [OTPinput, setOTPinput] = useState(() =>
    Array(OTP_LENGTH).fill(""),
  );
  const [disable, setDisable] = useState(true);
  const inputRefs = useRef([]);
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [cnfPassword, setCnfPassword] = useState("");
  const [error, setError] = useState("");
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const { isSignUp, onHandleVerfiy, handleClose } = props;

  useEffect(() => {
    if (alert) {
      const { type, message, position, duration } = alert;
      Alert({ type, message, position, duration });
    }
  }, [alert]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((lastTimerCount) => {
        if (lastTimerCount <= 1) {
          clearInterval(interval);
          setDisable(false);
        }
        return lastTimerCount <= 0 ? lastTimerCount : lastTimerCount - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [disable]);

  const handleChange = (e, index) => {
    const value = e.target.value;
    if (/^\d$/.test(value) || value === "") {
      const newOTPinput = [...OTPinput];
      newOTPinput[index] = value;
      setOTPinput(newOTPinput);
      if (value !== "" && index < inputRefs.current.length - 1) {
        inputRefs.current[index + 1].focus();
      }
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !OTPinput[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const resendOTP = async () => {
    // console.log("inside resendOtp");
    if (disable) return;
    // console.log("email", email);

    if (email) {
      if (!emailRegex.test(email)) {
        setAlert({
          type: "error",
          message: "Invalid Email Address",
          position: "bottom-right",
          duration: 2800,
        });
        return;
      }

      try {
        setLoading(true);

        const response = await api.post("api/auth/forgotPassword", {
          email: email,
        });
        // console.log(response);
        if (response.status === 201 || response.status === 200) {
          // console.log("entering if");
          setDisable(true);
          setAlert({
            type: "success",
            message: "otp is sent to your email",
            position: "bottom-right",
            duration: 2800,
          });
          setTimer(60);
        } else {
          // toast.error("error in sending otp");
          setAlert({
            type: "error",
            message: "error in sending otp",
            position: "bottom-right",
            duration: 2800,
          });
          setError(response.data.message);
        }
      } catch (error) {
        console.log("error in input field:", error);
        // toast.error(response.error);
        setAlert({
          type: "error",
          message: error?.response?.message || "Error in generating otp",
          position: "bottom-right",
          duration: 2800,
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const verifyOTP = () => {
    const enteredOTP = OTPinput.join("");
    if (enteredOTP === String(otp)) {
      router.push("/reset");
    } else {
      alert("Incorrect OTP, please try again or resend.");
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    const enteredOTP = OTPinput.join("");
    // console.log("enteredOtp:", enteredOTP);

    if (!password || !cnfPassword) {
      setAlert({
        type: "error",
        message: "Please fill all the fields",
        position: "bottom-right",
        duration: 2800,
      });
      return;
    }
    try {
      setLoading(true);
      const response = await api.post("/api/auth/changePassword", {
        newPassword: password,
        confirmPassword: cnfPassword,
        otp: enteredOTP,
        email: email,
      });
      if (response.status === 200 || response.status === 201) {
        setAlert({
          type: "success",
          message: "reset Password Successfully",
          position: "bottom-right",
          duration: 2800,
        });

        router.push("/Login");
      }

      if (response.status === 404) {
        setAlert({
          type: "error",
          message: response.data.message,
          position: "bottom-right",
          duration: 2800,
        });
      }
    } catch (error) {
      setAlert({
        type: "error",
        message: error?.response?.data?.message || "Changing Password Failed",
        position: "bottom-right",
        duration: 2800,
      });
    } finally {
      setLoading(false);
    }

    // alert("Password reset successfully");
  };

  const handleVerifySignUp = () => {
    // console.log("hello");
    const enteredOTP = OTPinput.join("");
    // console.log(enteredOTP);
    // console.log(password);
    onHandleVerfiy(enteredOTP);
  };

  return (
    <div
      className={style.innerBox1}
      style={{ background: isSignUp ? "#1c1c1c" : "" }}
    >
      {isSignUp && (
        <div
          onClick={handleClose}
          style={{
            position: "absolute",
            top: "1rem",
            right: "1rem",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          <X />
        </div>
      )}
      <div className={style.innerBox2}>
        <div className={style.innerTitle}>
          <div className={style.innerTitlediv}>
            <p className={style.verifyTitle}>Email Verification</p>
          </div>
          <div className={style.innerTitle2}>
            <p>We have sent a code to {email}</p>
          </div>
        </div>
        <div>
          <form>
            <div className={style.formdiv1}>
              <div className={style.otpcontainer}>
                {OTPinput.map((_, index) => (
                  <div className={style.otpBox} key={index}>
                    <input
                      ref={(el) => (inputRefs.current[index] = el)}
                      maxLength="1"
                      className={style.singleInput}
                      type="text"
                      value={OTPinput[index]}
                      onChange={(e) => handleChange(e, index)}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className={style.innerdiv3}>
              <span className={style.emailTitle}>Didn’t receive code?</span>
              <button
                type="button"
                className={style.button}
                style={{
                  color: disable ? "gray" : "white",
                  cursor: disable ? "none" : "pointer",
                  textDecorationLine: disable ? "none" : "underline",
                }}
                onClick={resendOTP}
                disabled={disable}
              >
                {disable ? `Resend OTP in ${timerCount}s` : "Resend OTP"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {isSignUp ? (
        <>
          {error && <p style={{ color: "red" }}>{error}</p>}
          <div className={style.buttondiv}>
            <div>
              <Button
                onClick={handleVerifySignUp}
                style={{
                  width: "100%",
                  background: "var(--primary)",
                  color: "#fff",
                  height: "45px",
                  fontSize: "1rem",
                  cursor: "pointer",
                }}
              >
                Verify Email
              </Button>
            </div>
          </div>
        </>
      ) : (
        <form className={style.formdiv} onSubmit={changePassword}>
          <div
            style={{ width: "97%", marginLeft: "auto", marginRight: "auto" }}
          >
            <Input
              type="password"
              placeholder="Enter your password"
              label="New Password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: "100%" }}
            />
          </div>
          <div
            style={{ width: "97%", marginLeft: "auto", marginRight: "auto" }}
          >
            <Input
              type="password"
              placeholder="Confirm your password"
              label="Confirm Password"
              name="cnfPassword"
              value={cnfPassword}
              onChange={(e) => setCnfPassword(e.target.value)}
              required
              style={{ width: "100%" }}
            />
          </div>
          {/* {error && <p style={{ color: "red" }}>{error}</p>} */}
          <div className={style.buttondiv}>
            <div>
              <Button
                onClick={changePassword}
                style={{
                  width: "100%",
                  background: "var(--primary)",
                  color: "#fff",
                  height: "45px",
                  fontSize: "1rem",
                  cursor: "pointer",
                }}
              >
                {loading ? <MicroLoading /> : "Verify Email"}
              </Button>
            </div>
          </div>
        </form>
      )}
      <Alert />
    </div>
  );
};

export default OtpInput;
