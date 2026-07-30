"use client";

import { useState, useContext, useEffect } from "react";
import { useRouter } from "next/navigation";

import ProfileLayout from "@/src/layouts/Profile/ProfileLayout/ProfileLayout";
import Sidebar from "@/src/layouts/Profile/Sidebar/Sidebar";
import AuthContext from "@/src/context/AuthContext";
import { api } from "@/src/services";
import { Loading } from "@/src/microInteraction";
import style from "@/src/views/Profile/styles/Profile.module.scss";

/**
 * Profile shell — ported from FED-Frontend/src/pages/Profile/Profile.jsx.
 *
 * React Router's `<Outlet />` becomes the layout's `children`, so the nested
 * profile routes render in exactly the same slot.
 *
 * The unauthenticated redirect that lived in App.jsx's `ProtectedRoute` runs
 * here as well as in `proxy.ts` — the proxy is a fast gate at the edge, this
 * covers client-side navigations.
 */
export default function ProfileShell({
  children,
}) {
  const [activePage, setActivePage] = useState("Profile");
  const authCtx = useContext(AuthContext);
  const [isLoading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (authCtx.isLoading) return;

    if (!authCtx.isLoggedIn) {
      router.replace("/Login");
      return;
    }

    const fetchData = async () => {
      try {
        const token = window.localStorage.getItem("token");
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await api.post(
          "/api/user/fetchProfile",
          { email: authCtx.user.email },
          { headers: { Authorization: `Bearer ${token}` } },
        );

        if (response.status === 200) {
          const u = response.data.user;
          authCtx.update(
            u.name,
            u.email,
            u.img,
            u.rollNumber,
            u.school,
            u.college,
            u.contactNo,
            u.year,
            u.extra?.github,
            u.extra?.linkedin,
            u.extra?.designation,
            u.access,
            u.editProfileCount,
            u.regForm,
            u.blurhash,
            token,
          );
        }
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authCtx.isLoggedIn, authCtx.isLoading]);

  if (authCtx.isLoading || !authCtx.isLoggedIn) {
    return <Loading />;
  }

  return (
    <ProfileLayout>
      <div className={style.profile}>
        <Sidebar
          activepage={activePage}
          handleChange={(page) => {
            setActivePage(page);
          }}
        />
        {isLoading ? (
          <Loading />
        ) : (
          <div className={style.profile__content}>{children}</div>
        )}
      </div>
    </ProfileLayout>
  );
}
