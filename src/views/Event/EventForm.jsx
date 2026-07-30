"use client";

import { useState, useEffect, useContext, useCallback } from "react";

import FormData from "../../data/FormData.json";
import PreviewForm from "../../features/Modals/Profile/Admin/PreviewForm";
import AuthContext from "../../context/AuthContext";
import { api } from "../../services";
import { Alert, ComponentLoading } from "../../microInteraction";
import { useRouter, useParams, useSearchParams } from "next/navigation";

const EventForm = () => {
  const [showPreview, setShowPreview] = useState(true);
  const [eventData, setEventData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const { eventId } = useParams();
  const [searchParams] = useSearchParams();
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

  // Add scroll lock effect when form opens
  useEffect(() => {
    if (showPreview) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showPreview]);

  return (
    <div>
      {!isLoading && showPreview && (
        <PreviewForm
          open={showPreview}
          handleClose={() => setShowPreview(false)}
          eventId={eventData?.id}
          sections={eventData?.sections || []}
          eventData={eventData?.info || {}}
          form={eventData || {}}
          showCloseBtn={true}
          teamCode={teamCode} // [v2] Pass teamCode to PreviewForm
        />
      )}
      <Alert />
    </div>
  );
};

export default EventForm;

