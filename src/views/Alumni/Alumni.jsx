"use client";

import { useState, useEffect } from "react";
import { api } from "../../services";
import styles from "./styles/Alumni.module.scss";
import { TeamCard } from "../../components";
import useWindowWidth from "../../utils/hooks/useWindowWidth"; // Import useWindowWidth hook
import { ComponentLoading } from "../../microInteraction";

const Alumni = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [alumni, setAlumni] = useState([]);
  const [Error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAlumni = async () => {
      try {
        const response = await api.get("/api/user/fetchAlumni");

        if (response.status === 200) {
          // Sort alumni alphabetically
          const sortedAlumni = response.data.data.sort((a, b) =>
            a.name.localeCompare(b.name)
          );
          setAlumni(sortedAlumni);
        } else {
          console.error("Error fetching our Alumnis:", response.data.message);
          // No local fallback: this used to list sample people out of
          // Team.json, which reads as a real alumni roster to a visitor.
          setError({
            message:
              "Sorry for the inconvenience, we are having issues fetching our Alumni",
          });
          setAlumni([]);
        }
      } catch (error) {
        setError({
          message:
            "Sorry for the inconvenience, we are having issues fetching our Alumni",
        });
        console.error("Error fetching our Alumnis:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAlumni();
  }, []);

  const AlumniSection = ({ alumni }) => {
    const windowWidth = useWindowWidth();
    const membersPerRow = windowWidth < 500 ? 2 : 4;
    const remainderMembersCount = alumni.length % membersPerRow;
    const lastRowMembers =
      remainderMembersCount > 0 ? alumni.slice(-remainderMembersCount) : [];
    const otherMembers =
      remainderMembersCount > 0
        ? alumni.slice(0, -remainderMembersCount)
        : alumni;

    return (
      <div className={styles.alumniSection}>
        <div className={styles.alumniGrid}>
          {otherMembers.map((member, idx) => (
            <TeamCard key={idx} member={member} />
          ))}
        </div>

        {lastRowMembers.length > 0 && (
          <div className={styles.lastRowCentered}>
            {lastRowMembers.map((member, idx) => (
              <TeamCard key={idx} member={member} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.Alumni}>
      <h2>
        Meet Our{" "}
        <span
          style={{
            background: "var(--primary)",
            WebkitBackgroundClip: "text",
            color: "transparent",
          }}
        >
          Alumni
        </span>
      </h2>
      {/* <div></div> */}
      {/* <div></div> */}
      {isLoading ? (
        <ComponentLoading
          customStyles={{
            width: "100%",
            height: "100%",
            display: "flex",
            marginTop: "5rem",
            marginBottom: "10rem",
            justifyContent: "center",
            alignItems: "center",
          }}
        />
      ) : (
        <>
          {Error && <div className={styles.error}>{Error.message}</div>}
          <AlumniSection alumni={alumni} />
        </>
      )}
    </div>
  );
};

export default Alumni;
