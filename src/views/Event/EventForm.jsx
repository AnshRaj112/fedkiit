"use client";

import { useState, useEffect, useContext, useCallback } from "react";
import Link from "next/link";
import { MdArrowBackIos } from "react-icons/md";

import PreviewForm from "../../features/Modals/Profile/Admin/PreviewForm";
import AuthContext from "../../context/AuthContext";
import { api } from "../../services";
import { Alert, ComponentLoading } from "../../microInteraction";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import style from "./styles/EventForm.module.scss";

/**
 * /Events/:eventId/Form — registration, as a page.
 *
 * This used to render `PreviewForm` as a fixed full-screen overlay on top of
 * the still-mounted event listing. A multi-step form with file uploads and a
 * payment step is a destination, not a dialog: the overlay had its own inner
 * scroller, locked the page behind it, and gave the browser no URL-level notion
 * of "back" out of a half-filled form.
 */
const EventForm = () => {
  const [eventData, setEventData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const { eventId } = useParams();
  // Next returns the params object itself, not React Router's [params, setter]
  // pair. Destructuring it as an array yields undefined and crashes on `.get`.
  const searchParams = useSearchParams();
  const router = useRouter();
  const authCtx = useContext(AuthContext);

  // [v2] Extract teamCode from invite link
  const teamCode = searchParams.get("teamCode");

  // Ensure eventId is correctly parsed
  const id = eventId;

  useEffect(() => {
    if (alert) {
      const { type, message, position, duration } = alert;
      Alert({ type, message, position, duration });
      setAlert(null);
    }
  }, [alert]);

  // [v2] If user is already registered and has a teamCode, auto-join the team
  const handleAutoJoin = useCallback(async (formId, code) => {
    try {
      const response = await api.post("/api/form/joinTeam", {
        formId,
        teamCode: code,
      });
      if (response.data?.success) {
        Alert({
          type: "success",
          message: response.data.message || "Successfully joined the team!",
          position: "bottom-right",
          duration: 3000,
        });
        router.replace(`/Events/${formId}/team`);
        return true;
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to join team";
      Alert({
        type: "error",
        message: msg,
        position: "bottom-right",
        duration: 3000,
      });
      // If already on another team or error, redirect to team management
      router.replace(`/Events/${formId}/team`);
      return false;
    }
  }, [router]);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await api.get(`/api/form/getAllForms?id=${eventId}`);
        if (response.status === 200) {
          const fetchedEventData = response.data.events;
          setEventData(fetchedEventData);

          // [v2] Check if user is already registered for this form with a teamCode in URL
          if (teamCode && authCtx.isLoggedIn) {
            const isRegistered = authCtx.user?.regForm?.includes(fetchedEventData?.id || eventId);
            if (isRegistered) {
              // User is already registered — auto-join the team via invite link
              await handleAutoJoin(fetchedEventData?.id || eventId, teamCode);
              return; // Don't show the form
            }
          }
        } else {
          setAlert({
            type: "error",
            message: "There was an error fetching event form. Please try again.",
            position: "bottom-right",
            duration: 3000,
          });
          throw new Error(response.data.message || "Error fetching event");
        }
      } catch (error) {
        console.error("Error fetching event:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvent();
  }, [id, teamCode, authCtx.isLoggedIn]);

  // No body scroll lock any more. This is a route of its own rather than an
  // overlay, so locking the page would strand a long form with no way to reach
  // its own submit button.

  const backHref = `/Events/${eventId}`;

  return (
    <div className={style.page}>
      <Link href={backHref} className={style.back}>
        <MdArrowBackIos size={14} aria-hidden="true" />
        Back to event
      </Link>

      {isLoading ? (
        <ComponentLoading
          customStyles={{
            width: "100%",
            minHeight: "50vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        />
      ) : eventData ? (
        <PreviewForm
          open
          inline
          handleClose={() => router.push(backHref)}
          eventId={eventData?.id}
          sections={eventData?.sections || []}
          eventData={eventData?.info || {}}
          form={eventData || {}}
          showCloseBtn={false}
          teamCode={teamCode} // [v2] Pass teamCode to PreviewForm
        />
      ) : (
        <div className={style.missing}>
          <h1 className={style.missingTitle}>We couldn&rsquo;t load this form</h1>
          <p className={style.missingBody}>
            The event may have been removed, or registration may have closed.
          </p>
          <Link href="/Events" className={style.missingAction}>
            Back to events
          </Link>
        </div>
      )}

      <Alert />
    </div>
  );
};

export default EventForm;

