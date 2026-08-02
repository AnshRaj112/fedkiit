"use client";

/* eslint-disable react/no-unescaped-entities */
import React, { useState, useContext, useEffect } from "react";
import style from "./styles/Login.module.scss";
import Input from "../../components/Core/Input";
import Button from "../../components/Core/Button";
import Text from "../../components/Core/Text";
import { api } from "../../services";
import AuthContext from "../../context/AuthContext";
import { RecoveryContext } from "../../context/RecoveryContext";
import GoogleLogin from "./GoogleLogin";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Alert, MicroLoading } from "../../microInteraction";
import Link from "next/link";
import { useRouter } from "next/navigation";
import postAuthRedirect from "../../utils/postAuthRedirect";

const Login = () => {
  const router = useRouter();
  const { setEmail } = useContext(RecoveryContext);
  const authCtx = useContext(AuthContext);
  const [alert, setAlert] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [shouldNavigate, setShouldNavigate] = useState(false);
  const [navigatePath, setNavigatePath] = useState("/");
  const [email, setemail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (alert) {
      const { type, message, position, duration } = alert;
      Alert({ type, message, position, duration });
    }
  }, [alert]);

  useEffect(() => {
    if (shouldNavigate) {
      router.replace(navigatePath);
      setShouldNavigate(false);
    }
  }, [shouldNavigate, navigatePath, router]);

  const handleLogin = async (event) => {
    event.preventDefault();
    setIsLoading(true);

    if (email === "" || password === "") {
      setAlert({
        type: "error",
        message: "Please fill all the fields",
        position: "bottom-right",
        duration: 3000,
      });
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.post("/api/auth/login", {
        email: email.toLowerCase(),
        password,
      });

      if (response.status === 200 || response.status === 201) {
        const user = response.data.user;

        setAlert({
          type: "success",
          message: "Login successful",
          position: "bottom-right",
          duration: 2800,
        });

        setNavigatePath(postAuthRedirect());

        setTimeout(() => {
          localStorage.setItem("token", response.data.token);
          authCtx.login(
            user.name,
            user.email,
            user.img,
            user.rollNumber,
            user.school,
            user.college,
            user.contactNo,
            user.year,
            user.extra?.github,
            user.extra?.linkedin,
            user.extra?.designation,
            user.access,
            user.editProfileCount,
            user.regForm,
            user.blurhash,
            response.data.token,
            9600000
          );
          setShouldNavigate(true);
        }, 800);
      } else {
        setAlert({
          type: "error",
          message: response.data.message || "Invalid email or password",
          position: "bottom-right",
          duration: 3000,
        });
      }
    } catch (error) {
      setAlert({
        type: "error",
        message:
          error?.response?.data?.message ||
          "There was an error logging in. Please try again.",
        position: "bottom-right",
        duration: 3000,
      });
      console.error("Error logging in:", error?.response?.data?.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgot = () => {
    setEmail(email);
    router.push("/ForgotPassword");
  };

  return (
    <div className={style.page}>
      <Link href="/" className={style.ArrowBackIcon} aria-label="Go back">
        <ArrowBackIcon />
      </Link>
      <div className={style.stage}>
        <div className={style.container}>
          <div className={style.login}>
            <h1 style={{ paddingTop: "10px", width: "100%", textAlign: "left" }}>
              Login
            </h1>
            
            <div style={{ width: "100%", marginTop: "1rem" }}>
              <GoogleLogin />
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "1rem",
                width: "100%",
                margin: "1.25rem 0",
              }}
            >
              <div className={style.divider} style={{ flex: 1 }} />
              <p
                style={{
                  color: "var(--text-secondary)",
                  textAlign: "center",
                  margin: 0,
                  fontSize: "0.875rem",
                }}
              >
                or
              </p>
              <div className={style.divider} style={{ flex: 1 }} />
            </div>

            <form 
              className={style.form} 
              onSubmit={handleLogin}
              style={{ 
                width: "100%", 
                display: "flex", 
                flexDirection: "column", 
                gap: "1rem" 
              }}
            >
              <Input
                type="text"
                placeholder="eg:something@gmail.com"
                label="Email"
                name="email"
                value={email}
                onChange={(e) => setemail(e.target.value)}
                required
                style={{ width: "100%" }}
              />
              
              <div>
                <Input
                  type="password"
                  placeholder="Enter your password"
                  label="Password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ width: "100%" }}
                />
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.4rem" }}>
                  <Text
                    onClick={handleForgot}
                    variant="secondary"
                    style={{
                      fontSize: "0.75rem",
                      cursor: "pointer",
                      color: "var(--accent)",
                      userSelect: "none",
                    }}
                  >
                    Forgot Password?
                  </Text>
                </div>
              </div>

              <Button
                type="submit"
                style={{
                  width: "100%",
                  backgroundColor: "var(--accent)",
                  borderColor: "transparent",
                  borderRadius: "var(--radius-pill)",
                  boxShadow: "var(--depth)",
                  color: "var(--text-inverse)",
                  minHeight: "44px",
                  marginTop: "0.5rem",
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
                disabled={isLoading}
              >
                {isLoading ? <MicroLoading /> : "Login"}
              </Button>

              <Text
                style={{
                  fontSize: "0.85rem",
                  textAlign: "center",
                  marginTop: "0.5rem",
                }}
              >
                Don't have an account?{" "}
                <Link
                  href="/signup"
                  onClick={() => {
                    sessionStorage.setItem("prevPage", window.location.pathname);
                  }}
                  style={{
                    color: "var(--accent)",
                    fontWeight: 600,
                  }}
                >
                  Sign Up
                </Link>
              </Text>
            </form>
          </div>
        </div>
        <div className={style.sideArt} aria-hidden="true">
          <img src="/assets/design-3.png" alt="" />
        </div>
      </div>
      <Alert />
    </div>
  );
};

export default Login;