"use client";

import { useState, useEffect, useContext } from "react";

import { Button } from "../../../../../components";
import { Input } from "../../../../../components";
import { api } from "../../../../../services";
import styles from "./styles/CertificatePreview.module.scss";
import { getCertificatePreview } from "../../Form/CertificatesForm/tools/certificateTools";
import { MicroLoading } from "../../../../../microInteraction";
import { accessOrCreateEventByFormId } from "../../Form/CertificatesForm/tools/certificateTools";
import AuthContext from "../../../../../context/AuthContext";
import { useRouter, useParams } from "next/navigation";

const CertificatesPreview = () => {
  const authCtx = useContext(AuthContext);
  const { eventId, eventTitle } = useParams();
  const router = useRouter();
  const [certificateData, setCertificateData] = useState({});
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("Lorem");
  const [description, setDescription] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [certificatePreview, setCertificatePreview] = useState(
    "https://via.placeholder.com/600x300/ff6347/ffffff?text=Certificate+Preview"
  );

  useEffect(() => {
    const fetchCertificatePreview = async () => {
      setPreviewLoading(true);

      try {
        // console.log(authCtx);
        const preview = await getCertificatePreview(eventId, authCtx.token);
        if (preview) {
          setCertificatePreview(preview);
          setCertificateData({
            subject: "",
            description: "",
            recipientEmail: "",
            name: "",
          });
        }
      } catch (error) {
        console.error("Failed to load certificate preview:", error);
      } finally {
        setPreviewLoading(false);
      }
    };

    fetchCertificatePreview();
  }, [eventId]);

  const handleSendTestMail = async () => {
    if (!recipientEmail) {
      alert("Please enter a recipient email.");
      return;
    }

    setLoading(true);
    try {
      const eventData = await accessOrCreateEventByFormId(
        eventId,
        authCtx.token
      );
      const response = await api.post(
        "/api/certificate/testCertificateSending",
        {
          eventId: eventData.id,
          name,
          subject,
          email: recipientEmail,
        },
        {
          headers: { Authorization: `Bearer ${authCtx.token}` },
        }
      );

      alert(response.data.message);
    } catch (error) {
      console.error("Error sending test mail:", error);
      alert("Failed to send test mail.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>
        {eventTitle || "Event Name"} Certificate <span>Preview</span>
      </h1>

      <div className={styles.body}>
        {previewLoading ? (
          <div className={styles.previewLoading}>
            <MicroLoading />
          </div>
        ) : (
          <img
            src={certificatePreview}
            alt="Certificate Preview"
            className={styles.previewImage}
          />
        )}

        <div className={styles.form}>
          <label className={styles.label}>Recipient Name:</label>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={styles.control}
            style={{ width: "100%", marginBottom: "20px", marginTop: "-10px" }}
          />

          <label className={styles.label}>Subject:</label>
          <Input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className={styles.control}
            style={{ width: "100%", marginBottom: "20px", marginTop: "-10px" }}
          />

          <div className={styles.info}>
            <div>
              <label className={styles.label}>Description:</label>
              <Input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{
                  width: "100%",
                  marginBottom: "20px",
                  marginTop: "-10px",
                }}
              />
            </div>
            <div>
              <label className={styles.label}>Recipient’s Email ID:</label>
              <Input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                style={{
                  width: "100%",
                  marginTop: "-10px",
                }}
              />
            </div>
          </div>
        </div>

        <Button
          onClick={handleSendTestMail}
          className={styles.submit}
          style={{ marginTop: "-10px" }}
          disabled={loading}
        >
          {loading ? "Sending..." : "Send Test Mail"}
        </Button>
      </div>
    </div>
  );
};

export default CertificatesPreview;
