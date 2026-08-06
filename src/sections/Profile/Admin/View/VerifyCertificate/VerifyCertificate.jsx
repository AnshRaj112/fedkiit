"use client";

import { useEffect, useState } from "react";

import { api } from "../../../../../services";
import { ComponentLoading } from "../../../../../microInteraction";
import styles from "./styles/VerifyCertificate.module.scss";
import { CheckCircle } from "lucide-react";
import Share from "../../../../../features/Modals/Event/ShareModal/ShareModal";
import shareOutline from "../../../../../assets/images/shareOutline.svg";
import { useParams, useSearchParams } from "next/navigation";

const VerifyCertificate = () => {
  // Next returns the params object itself, not React Router's [params, setter]
  // pair. Destructuring it as an array yields undefined and crashes on `.get`.
  const searchParams = useSearchParams();
  const certificateId = searchParams.get("id");
  const { issuedCertificateId } = useParams();
  const [certificateData, setCertificateData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // Get current URL for sharing
  const currentUrl = window.location.href;

  useEffect(() => {
    if (!certificateId) {
      setError("No certificate ID provided.");
      setLoading(false);
      return;
    }

    const fetchCertificate = async () => {
      try {
        const response = await api.post("/api/certificate/verifyCertificate", {
          id: certificateId,
        });

        if (
          response.data &&
          response.data.imageSrc &&
          response.data.certificate
        ) {
          setCertificateData({
            imageSrc: response.data.imageSrc,
            certificateId: response.data.certificate.certificateId,
            name: response.data.certificate.fieldValues?.name || "N/A",
            email: response.data.certificate.email || "N/A",
            event: response.data.event?.name || "N/A",
            date: response.data.event?.createdAt || "N/A",
          });
        } else {
          setError("Invalid certificate data.");
        }
      } catch (err) {
        console.error("Error fetching certificate:", err);
        setError("Failed to fetch certificate.");
      } finally {
        setLoading(false);
      }
    };

    fetchCertificate();
  }, [certificateId]);

  const handleDownload = () => {
    if (certificateData?.imageSrc) {
      const link = document.createElement("a");
      link.href = certificateData.imageSrc;
      link.download = `Certificate_${certificateData.certificateId}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(currentUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // revert back after 2 seconds
    });
  };

  const openShareModal = () => {
    setShowShareModal(true);
  };

  const closeShareModal = () => {
    setShowShareModal(false);
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <ComponentLoading />
        <p>Verifying certificate...</p>
      </div>
    );
  }

  if (error) {
    return <div className={styles.errorContainer}>{error}</div>;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        Certificate <span>Verification</span>
      </h1>

      <div className={styles.contentWrapper}>
        <div className={styles.imageContainer}>
          <img src={certificateData.imageSrc} alt="Verified Certificate" />
        </div>

        <div className={styles.detailsContainer}>
          <table className={styles.detailsTable}>
            <tbody>
              <tr>
                <th>Certificate ID:</th>
                <td>{certificateId}</td>
              </tr>
              <tr>
                <th>Name:</th>
                <td>{certificateData.name}</td>
              </tr>
              <tr>
                <th>Event:</th>
                <td>{certificateData.event}</td>
              </tr>
              <tr>
                <th>Email:</th>
                <td>{certificateData.email}</td>
              </tr>
              {/* <tr>
                <th>Event Date:</th>
                <td>
                  {new Date(certificateData.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </td>
              </tr> */}
            </tbody>
          </table>

          <div className={styles.bottomRow}>
            <div className={styles.actionButtons}>
              <div className={styles.verifiedTag}>
                <CheckCircle />
                <span style={{ color: "white" }}>Verified by FEDKIIT</span>
              </div>
              <div className={styles.buttonGroup}>
                <button className={styles.downloadBtn} onClick={handleDownload}>
                  Download
                </button>
                {/* <button className={styles.shareBtn} onClick={openShareModal}>
                  <img style={{ width: "20px", height: "20px" }} src={shareOutline.src} alt="Share" />
                  Share
                </button> */}
                <button className={styles.downloadBtn} onClick={copyLink}>
                  {copied ? "Copied..." : "Copy Link"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showShareModal && (
        <Share onClose={closeShareModal} urlpath={currentUrl} />
      )}
    </div>
  );
};

export default VerifyCertificate;
