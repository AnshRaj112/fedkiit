"use client";

import { useState, useEffect } from "react";
import { api } from "../../services";
import styles from "./styles/Team.module.scss";
import { TeamCard } from "../../components";
import { ArrowUpRight } from "lucide-react";
import { ComponentLoading } from "../../microInteraction";
import Link from "next/link";
import TeamDisclosure from "./components/TeamDisclosure";

const BOARD_ACCESS = [
  "PRESIDENT",
  "VICEPRESIDENT",
  "DIRECTOR_TECHNICAL",
  "DIRECTOR_CREATIVE",
  "DIRECTOR_MARKETING",
  "DIRECTOR_OPERATIONS",
  "DIRECTOR_PR_AND_FINANCE",
  "DIRECTOR_HUMAN_RESOURCE",
  "DEPUTY_DIRECTOR_TECHNICAL",
  "DEPUTY_DIRECTOR_CREATIVE",
  "DEPUTY_DIRECTOR_MARKETING",
  "DEPUTY_DIRECTOR_OPERATIONS",
  "DEPUTY_DIRECTOR_PR_AND_FINANCE",
  "DEPUTY_DIRECTOR_HUMAN_RESOURCE",
];

const TEAM_ORDER = [
  "Technical",
  "Creative",
  "Marketing",
  "Operations",
  "PR And Finance",
  "Human Resource",
];

const extractTeamFromAccess = (access) =>
  access.startsWith("SENIOR_EXECUTIVE_")
    ? access.replace("SENIOR_EXECUTIVE_", "")
    : access;

const getDisplayRole = (access) => {
  let role = extractTeamFromAccess(access)
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

  if (role.toLowerCase() === "pr and finance") role = "PR And Finance";
  if (role.toLowerCase() === "human resource") role = "Human Resource";
  return role;
};

const Team = () => {
  const [teamMembers, setTeamMembers] = useState([]);
  const [access, setAccess] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const response = await api.get("/api/user/fetchTeam");
        if (response.status === 200) {
          const validMembers = response.data.data
            .filter((member) => member.name)
            .sort((a, b) => {
              if (b.year !== a.year) return b.year - a.year;
              return a.name.localeCompare(b.name);
            });
          setTeamMembers(validMembers);
        } else {
          setError(
            "Sorry for the inconvenience - we could not load the team."
          );
        }
      } catch {
        setError(
          "Sorry for the inconvenience - we could not load the team."
        );
      } finally {
        setIsLoading(false);
      }
    };

    const fetchAccessTypes = async () => {
      try {
        const response = await api.get("/api/user/fetchAccessTypes");
        if (response.status === 200) {
          setAccess(
            response.data.data.filter(
              (type) =>
                !["ADMIN", "USER", "ALUMNI", "EX_MEMBER"].includes(type)
            )
          );
        }
      } catch {
        /* board sections still render from member access codes */
      }
    };

    fetchAccessTypes();
    fetchTeamMembers();
  }, []);

  const directorsAndAbove = teamMembers
    .filter((member) => BOARD_ACCESS.includes(member.access))
    .sort(
      (a, b) =>
        BOARD_ACCESS.indexOf(a.access) - BOARD_ACCESS.indexOf(b.access)
    );

  const otherMembers = teamMembers.filter(
    (member) => !BOARD_ACCESS.includes(member.access)
  );

  const roleMap = access.reduce((map, code) => {
    if (BOARD_ACCESS.includes(code)) return map;
    const displayRole = getDisplayRole(code);
    if (!map[displayRole]) map[displayRole] = [];
    map[displayRole].push(code);
    return map;
  }, {});

  const teamByRole = Object.keys(roleMap)
    .map((role) => {
      const members = otherMembers.filter((member) =>
        roleMap[role].includes(member.access)
      );
      const seniors = members.filter((m) =>
        m.access.startsWith("SENIOR_EXECUTIVE_")
      );
      const rest = members.filter(
        (m) => !m.access.startsWith("SENIOR_EXECUTIVE_")
      );
      return { role, members: [...seniors, ...rest] };
    })
    .filter((group) => group.members.length > 0)
    .sort((a, b) => TEAM_ORDER.indexOf(a.role) - TEAM_ORDER.indexOf(b.role));

  return (
    <div className={styles.page}>
      <header className={styles.masthead}>
        <div className={styles.mastheadText}>
          <p className={styles.eyebrow}>FED KIIT</p>
          <h1 className={styles.title}>
            Meet the <span>team</span>
          </h1>
          <p className={styles.lede}>
            A tight-knit community of builders devoted to entrepreneurship at
            KIIT - from board to every vertical.
          </p>
        </div>
        <div className={styles.mastheadArt} aria-hidden="true">
          <img src="/assets/design-4.png" alt="" />
        </div>
      </header>

      {isLoading ? (
        <div className={styles.loading}>
          <ComponentLoading />
        </div>
      ) : (
        <>
          <section className={styles.fic}>
            <div className={styles.ficPhoto}>
              <img
                src="https://cdn.prod.website-files.com/663d1907e337de23e83c30b2/692c37f9ff87b3d30a302905_IMG-20251129-WA0016.jpg"
                alt="Dr. Vishal Pradhan"
                loading="lazy"
              />
            </div>
            <div className={styles.ficBody}>
              <p className={styles.ficEyebrow}>Faculty in charge</p>
              <h2 className={styles.ficName}>Dr. Vishal Pradhan</h2>
              <blockquote className={styles.ficQuote}>
                As FIC of FED, my vision is to ignite curiosity, nurture
                confidence, and inspire students to rise beyond limits - so they
                walk into KIIT as learners and grow into innovators who shape
                the world.
              </blockquote>
            </div>
          </section>

          {error && <p className={styles.error}>{error}</p>}

          {directorsAndAbove.length > 0 && (
            <TeamDisclosure
              eyebrow="Leadership"
              title="Board of directors"
              count={directorsAndAbove.length}
              defaultOpen
              action={
                <Link href="/Alumni" className={styles.alumniLink}>
                  Our alumni
                  <ArrowUpRight size={16} aria-hidden="true" />
                </Link>
              }
            >
              <div className={styles.grid}>
                {directorsAndAbove.map((member) => (
                  <TeamCard
                    key={member.email || member._id || member.name}
                    member={member}
                  />
                ))}
              </div>
            </TeamDisclosure>
          )}

          {teamByRole.map((group, index) => (
            <TeamDisclosure
              key={group.role}
              eyebrow="Vertical"
              title={`Team ${group.role}`}
              count={group.members.length}
              defaultOpen={index === 0}
            >
              <div className={styles.grid}>
                {group.members.map((member) => (
                  <TeamCard
                    key={member.email || member._id || member.name}
                    member={member}
                  />
                ))}
              </div>
            </TeamDisclosure>
          ))}
        </>
      )}
    </div>
  );
};

export default Team;
