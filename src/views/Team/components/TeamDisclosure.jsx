"use client";

import { useId, useState } from "react";
import PropTypes from "prop-types";
import { ChevronDown } from "lucide-react";
import styles from "../styles/Team.module.scss";

const TeamDisclosure = ({
  eyebrow,
  title,
  count,
  action,
  defaultOpen = false,
  children,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <section className={styles.section}>
      <div className={styles.sectionHead}>
        <button
          type="button"
          className={styles.sectionToggle}
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls={panelId}
        >
          <ChevronDown
            size={15}
            className={styles.chevron}
            data-open={open || undefined}
            aria-hidden="true"
          />
          <span className={styles.sectionHeadText}>
            {eyebrow ? (
              <span className={styles.sectionEyebrow}>{eyebrow}</span>
            ) : null}
            <span className={styles.sectionTitle}>{title}</span>
          </span>
          {typeof count === "number" && (
            <span className={styles.countBadge}>{count}</span>
          )}
        </button>
        {action}
      </div>

      {open ? <div id={panelId}>{children}</div> : null}
    </section>
  );
};

TeamDisclosure.propTypes = {
  eyebrow: PropTypes.string,
  title: PropTypes.string.isRequired,
  count: PropTypes.number,
  action: PropTypes.node,
  defaultOpen: PropTypes.bool,
  children: PropTypes.node,
};

export default TeamDisclosure;
