"use client";

import { api } from "../../../../../../services";
// import AuthContext from "../../../../../../context/AuthContext";
// import { useContext } from "react";

// This function retrieves or creates an event based on the provided formId
const accessOrCreateEventByFormId = async (formId, token) => {
  try {
    let res = await api.post(
      "/api/certificate/getEventByFormId",
      { formId },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (res.status !== 200) {
      const form = await api.get("/api/form/getAllForms", {
        params: { id: formId },
        headers: { Authorization: `Bearer ${token}` },
      });

      if (form.status === 200) {
        res = await api.post(
          "/api/certificate/createOrganisationEvent",
          {
            name: form.data.events.info.eventTitle,
            description: form.data.events.info.eventdescription,
            organisationId: process.env.NEXT_PUBLIC_CERT_ORG,
            formId: form.data.events.id,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }
    }

    return res.data;
  } catch (error) {
    console.error("Error fetching event by form ID:", error);
  }
};

const getCertificatePreview = async (formId, token) => {
  try {
    const event = await accessOrCreateEventByFormId(formId, token);
    const certificate = event.certificates[0].template;
    const fields = event.certificates[0].fields;

    const cert = await api.post(
      "/api/certificate/dummyCertificate",
      {
        imageLink: certificate,
        fields,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    return cert.data.imageSrc;
  } catch (error) {
    console.error("Error fetching certificate preview:", error);
  }
};

const sendBatchMail = async ({ formId, subject, htmlContent, token }) => {
  try {
    const response = await api.post(
      "/api/certificate/sendBatchMails",
      {
        batchSize: 10,
        formId,
        subject,
        htmlContent,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    console.log(response.data);
  } catch (error) {
    console.error("Error sending batch mail:", error);
  }
};

const generatedAndSendCertificate = async ({
  eventId,
  attendees,
  subject,
  body,
  token,
}) => {
  try {
    const response = await api.post(
      "/api/certificate/sendCertViaEmail",
      {
        eventId,
        attendees,
        subject,
        body,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (response.status === 200) {
      console.log("Certificates generated and sent successfully!");
    } else {
      console.error("Error:", response.data);
    }
    return response;
  } catch (error) {
    console.error("Failed to generate and send certificates:", error);
    return error.response;
  }
};

const testCertificateSending = async ({ eventId, email, name, subject, token }) => {
  try {
    const response = await api.post(
      "/api/certificate/testCertificateSending",
      {
        eventId,
        email,
        name,
        subject,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response;
  } catch (error) {
    console.error("Error sending test certificate:", error);
    return error.response;
  }
};

export {
  accessOrCreateEventByFormId,
  getCertificatePreview,
  sendBatchMail,
  generatedAndSendCertificate,
  testCertificateSending,
};
