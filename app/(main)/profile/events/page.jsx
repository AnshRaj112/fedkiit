"use client";

import { useContext } from "react";

import AuthContext from "@/src/context/AuthContext";
import EventsView from "@/src/sections/Profile/General/EventsView/EventsView";
import ViewEvent from "@/src/sections/Profile/Admin/View/ViewEvent/VIewEvent";

/**
 * /profile/events
 *
 * App.jsx branched this route on access level: admins get the management view,
 * everyone else gets their own registrations.
 */
export default function Page() {
  const authCtx = useContext(AuthContext);
  return authCtx.user.access === "ADMIN" ? <ViewEvent /> : <EventsView />;
}
