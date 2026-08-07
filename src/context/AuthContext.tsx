"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";

/**
 * Auth context — ported from FED-Frontend/src/context/AuthContext.jsx.
 *
 * The API surface (token, isLoggedIn, user, login(), logout(), update(),
 * settarget()) is preserved exactly so every ported component works unchanged.
 *
 * One necessary difference: the original called `retrieveStoredToken()` during
 * render, which reads `localStorage`. That runs on the server under Next.js and
 * would either crash or produce a hydration mismatch, so the stored session is
 * now restored in an effect after mount and `isLoading` covers the first paint.
 */

export type FedUser = {
  name: string;
  img: string;
  email: string;
  rollNumber: string;
  school: string;
  college: string;
  contactNo: string;
  year: string;
  extra: {
    github: string;
    linkedin: string;
    designation: string;
  };
  access: string;
  editProfileCount: number | string;
  regForm: string[];
  blurhash: string;
  token: string;
};

const EMPTY_USER: FedUser = {
  name: "",
  img: "",
  email: "",
  rollNumber: "",
  school: "",
  college: "",
  contactNo: "",
  year: "",
  extra: { github: "", linkedin: "", designation: "" },
  access: "",
  editProfileCount: "",
  regForm: [],
  blurhash: "",
  token: "",
};

type AuthContextValue = {
  token: string | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  user: FedUser;
  target: string;
  isAdmin: boolean;
  login: (...args: LoginArgs) => void;
  logout: () => Promise<void>;
  settarget: (t: string) => void;
  update: (...args: UpdateArgs) => void;
  eventData: unknown;
  memberData: unknown;
  croppedImageFile: unknown;
};

type LoginArgs = [
  name: string,
  email: string,
  img: string,
  rollNumber: string,
  school: string,
  college: string,
  contactNo: string,
  year: string,
  github: string,
  linkedin: string,
  designation: string,
  access: string,
  editProfileCount: number | string,
  regForm: string[],
  blurhash: string,
  token: string,
  expirationTime: number,
];

type UpdateArgs = [
  name: string,
  email: string,
  img: string,
  rollNumber: string,
  school: string,
  college: string,
  contactNo: string,
  year: string,
  github: string,
  linkedin: string,
  designation: string,
  access: string,
  editProfileCount: number | string,
  regForm: string[],
  blurhash: string,
  token: string,
];

const AuthContext = React.createContext<AuthContextValue>({
  token: "",
  isLoggedIn: false,
  isLoading: true,
  user: EMPTY_USER,
  target: "",
  isAdmin: false,
  login: () => {},
  logout: async () => {},
  settarget: () => {},
  update: () => {},
  eventData: null,
  memberData: null,
  croppedImageFile: null,
});

/**
 * How long a restored client session stays valid, in milliseconds.
 *
 * This MUST match the JWT's lifetime in lib/auth/session.ts (7 hours). A session
 * has two halves — the httpOnly `token` cookie the proxy reads, and the
 * localStorage copy this context reads — and they are the sole authority for
 * their own side. When their clocks disagree the app deadlocks: proxy.ts sees a
 * live cookie and bounces /Login to /profile, while ProtectedRoute sees no
 * localStorage and bounces /profile back to /Login, so the Login button stops
 * working entirely.
 *
 * It was 9600000 (2h40m), inherited from the Express frontend, against a 7 hour
 * cookie — so every visitor who closed the tab and came back between those two
 * marks hit exactly that deadlock.
 */
export const SESSION_TTL_MS = 7 * 60 * 60 * 1000;

const calculateRemainingTime = (expirationTime: number) =>
  expirationTime - new Date().getTime();

/**
 * Drops the httpOnly cookie the client half can't reach.
 *
 * Whenever this context concludes there is no session, the server has to be told
 * as well, or it keeps redirecting on the strength of a cookie the UI no longer
 * knows about.
 */
export async function clearServerSession() {
  try {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
  } catch {
    // Offline or the route is unreachable — the local session is cleared either
    // way, and the cookie expires on its own.
  }
}

function retrieveStoredToken() {
  if (typeof window === "undefined") return null;

  const storedToken = localStorage.getItem("token");
  const userdata = localStorage.getItem("user");
  const storedExpirationDate = localStorage.getItem("expirationTime");

  if (!storedToken || !userdata || !storedExpirationDate) return null;

  const remainingTime = calculateRemainingTime(Number(storedExpirationDate));

  if (remainingTime <= 3600) {
    localStorage.removeItem("token");
    localStorage.removeItem("expirationTime");
    localStorage.removeItem("user");
    // Reported so the caller can drop the cookie too. Reaching here means the
    // tab was closed over the expiry instead of being open for the logout timer
    // to fire, which is the common way the two halves drift apart.
    return "expired" as const;
  }

  try {
    return {
      token: storedToken,
      duration: remainingTime,
      user: JSON.parse(userdata) as FedUser,
    };
  } catch {
    return null;
  }
}

export const AuthContextProvider = (props: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<FedUser>(EMPTY_USER);
  const [target, setTarget] = useState("");
  const [userIsLoggedIn, setUserIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const logoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const targetHandler = useCallback((t: string) => setTarget(t), []);

  const logoutHandler = useCallback(async () => {
    try {
      // Same-origin now — the Next.js route handler clears the httpOnly cookie.
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout API error:", error);
    }

    setToken(null);
    setUser(EMPTY_USER);
    setUserIsLoggedIn(false);
    setIsAdmin(false);

    localStorage.removeItem("token");
    localStorage.removeItem("expirationTime");
    localStorage.removeItem("user");

    if (logoutTimer.current) clearTimeout(logoutTimer.current);
  }, []);

  const loginHandler = useCallback(
    (...args: LoginArgs) => {
      const [
        name,
        email,
        img,
        rollNumber,
        school,
        college,
        contactNo,
        year,
        github,
        linkedin,
        designation,
        access,
        editProfileCount,
        regForm,
        blurhash,
        tok,
        expirationTime,
      ] = args;

      localStorage.setItem("token", tok);

      const setuserdata: FedUser = {
        name,
        img,
        email,
        rollNumber,
        school,
        college,
        contactNo,
        year,
        extra: { github, linkedin, designation },
        access,
        editProfileCount,
        regForm,
        blurhash,
        token: tok,
      };

      localStorage.setItem("user", JSON.stringify(setuserdata));

      const exptime = new Date().getTime() + expirationTime;
      localStorage.setItem("expirationTime", String(exptime));

      if (logoutTimer.current) clearTimeout(logoutTimer.current);
      logoutTimer.current = setTimeout(
        logoutHandler,
        calculateRemainingTime(exptime),
      );

      setUser(setuserdata);
      setToken(tok);
      setUserIsLoggedIn(true);
      setIsAdmin(access === "ADMIN");
    },
    [logoutHandler],
  );

  const updateHandler = useCallback((...args: UpdateArgs) => {
    const [
      name,
      email,
      img,
      rollNumber,
      school,
      college,
      contactNo,
      year,
      github,
      linkedin,
      designation,
      access,
      editProfileCount,
      regForm,
      blurhash,
      tok,
    ] = args;

    const setuserdata: FedUser = {
      name,
      img,
      email,
      rollNumber,
      school,
      college,
      contactNo,
      year,
      extra: { github, linkedin, designation },
      access,
      editProfileCount,
      regForm,
      blurhash,
      token: tok,
    };

    localStorage.setItem("user", JSON.stringify(setuserdata));
    setUser(setuserdata);
    setIsAdmin(access === "ADMIN");
  }, []);

  // Restore the stored session after mount — never during render, so the server
  // and client agree on the first paint.
  useEffect(() => {
    const tokenData = retrieveStoredToken();
    if (tokenData === "expired") {
      // The stored session lapsed while the tab was closed, so the logout timer
      // never ran and the cookie is still sitting there. Drop it, or the proxy
      // goes on treating this browser as signed in and /Login is unreachable.
      void clearServerSession();
    } else if (tokenData) {
      setToken(tokenData.token);
      setUser(tokenData.user ?? EMPTY_USER);
      setUserIsLoggedIn(true);
      setIsAdmin(tokenData.user?.access === "ADMIN");
      logoutTimer.current = setTimeout(logoutHandler, tokenData.duration);
    }
    setIsLoading(false);

    return () => {
      if (logoutTimer.current) clearTimeout(logoutTimer.current);
    };
  }, [logoutHandler]);

  const contextValue = useMemo<AuthContextValue>(
    () => ({
      token,
      isLoggedIn: userIsLoggedIn,
      isLoading,
      user,
      target,
      isAdmin,
      login: loginHandler,
      logout: logoutHandler,
      settarget: targetHandler,
      update: updateHandler,
      eventData: null,
      memberData: null,
      croppedImageFile: null,
    }),
    [
      token,
      userIsLoggedIn,
      isLoading,
      user,
      target,
      isAdmin,
      loginHandler,
      logoutHandler,
      targetHandler,
      updateHandler,
    ],
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {props.children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
