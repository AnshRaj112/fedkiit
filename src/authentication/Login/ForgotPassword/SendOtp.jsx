"use client";

import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { RecoveryContext } from "../../../context/RecoveryContext";
import Input from "../../../components/Core/Input";
import Button from "../../../components/Core/Button";
import style from "./styles/forgotPassword.module.scss";
import styles from "../../SignUp/style/Signup.module.scss";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import { api } from "../../../services";
import { Alert,MicroLoading } from "../../../microInteraction";
import { useRouter } from "next/navigation";


export default function Login() {
  const { setEmail, email, setOTP, setPage } = useContext(RecoveryContext);
  const [loading, setLoading] = useState(false);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const router = useRouter();
  const [alert,setAlert]=useState(null);
  const [shouldNavigate, setShouldNavigate] = useState(false);
  const [navigatePath, setNavigatePath] = useState("/");


  useEffect(() => {
    if (alert) {
      const { type, message, position, duration } = alert;
      Alert({ type, message, position, duration });
    }
  }, [alert]);

  useEffect(() => {
    if (shouldNavigate) {
      router.push(navigatePath);
      setShouldNavigate(false); // Reset state after navigation
    }
  }, [shouldNavigate, navigatePath, router]);
  

  async function navigateToOtp(e) {
    e.preventDefault(); 
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

      const response = await api.post("api/auth/forgotPassword", { email: email });
      if(response.status===201||response.status===200){
        setAlert({
          type: "success",
          message: "otp is sent to your email",
          position: "bottom-right",
          duration: 2800,
        });
        setNavigatePath('/otp');

        setTimeout(() => {
          setShouldNavigate(true);
        }, 1500);
      }else{
          setAlert({
            type: "error",
            message: "error in sending otp",
            position: "bottom-right",
            duration: 2800,
          });
        }
   } catch (error) {
    console.log(error);
    // toast.error(response.error);
    setAlert({
      type: "error",
      message: error?.response?.data?.message,
      position: "bottom-right",
      duration: 2800,
    });
    
   }finally{
    setLoading(false);
   }

    } else {
      setAlert({
        type: "error",
        message: "Please Enter valid Otp",
        position: "bottom-right",
        duration: 2800,
      });
    }
  }

  return (
    <div>
      <section>
        <div>
          <div className={style.fullScreen}>

         
          <div onClick={()=>router.push("/Login")} className={styles.ArrowBackIcon}>
            <ArrowBackIcon />
          </div>
  
            <div className={style.circle}><div></div></div>
            <div className={style.circle1}></div>
            <div  className={style.primaryBox}>
              <form>
                <div className={style.boxTitle}>
                  <p className={style.emailTitle}>Reset Password</p>
                </div>
                <div style={{
                  marginbottom:"1.5rem"
                }}>
                  <Input
                    type="text"
                    placeholder="eg:something@gmail.com"
                    label="Enter email to reset password"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{ width: "98%" }}
                  />
                </div>
                {/* Change <a> tag to <button> for better accessibility */}
                <Button
                  onClick={navigateToOtp}
                  disabled={loading}
                  style={{
                    width: "100%",
                    background: "var(--primary)",
                    color: "#fff",
                    height: "40px",
                    marginTop: "20px",
                    fontSize: "1rem",
                    cursor: "pointer",
                    zIndex:"100"
                  }}
                >
                  {loading ? <MicroLoading/> : "Send OTP"}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>
      <Alert />
    </div>
  );
}
