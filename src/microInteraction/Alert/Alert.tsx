"use client";

import { Toaster, toast } from "react-hot-toast";

/**
 * Toast helper - ported from FED-Frontend/src/microInteraction/Alert/Alert.jsx.
 *
 * Kept callable both as a component (`<Alert type=… message=… />`) and as a
 * plain function (`Alert({ type, message })`), because the original codebase
 * used both forms - App.jsx calls it directly and discards the returned JSX,
 * relying on `notify()` running as a side effect.
 */

export type AlertProps = {
  type?: string;
  message?: string;
  position?: string;
  duration?: number;
  style?: React.CSSProperties;
};

const baseStyle: React.CSSProperties = {
  borderRadius: "999px",
  padding: "12px 18px",
  border: "1px solid var(--border-strong)",
  backgroundColor: "var(--surface-2)",
  boxShadow: "var(--depth)",
  color: "var(--text-primary)",
  fontFamily: "var(--font-sans)",
  fontSize: "0.875rem",
  fontWeight: 600,
  letterSpacing: "-0.02em",
};

const toneStyles: Record<string, React.CSSProperties> = {
  success: {
    border: "1px solid rgba(63, 191, 103, 0.4)",
    backgroundColor: "rgba(63, 191, 103, 0.12)",
    color: "var(--positive)",
  },
  error: {
    border: "1px solid rgba(244, 82, 59, 0.4)",
    backgroundColor: "rgba(244, 82, 59, 0.12)",
    color: "var(--negative)",
  },
  info: {
    border: "1px solid rgba(255, 138, 0, 0.4)",
    backgroundColor: "var(--accent-quiet)",
    color: "var(--accent)",
  },
  warning: {
    border: "1px solid rgba(255, 138, 0, 0.4)",
    backgroundColor: "var(--accent-quiet)",
    color: "var(--accent)",
  },
  infoOmega: {
    border: "1px solid rgba(255, 138, 0, 0.4)",
    backgroundColor: "var(--accent-quiet)",
    color: "var(--accent)",
  },
};

const Alert = ({ type, message, position, duration, style }: AlertProps) => {
  const notify = () => {
    const mobileStyle: React.CSSProperties =
      typeof window !== "undefined" && window.innerWidth <= 768
        ? { marginBottom: "2rem" }
        : {};

    const tone = toneStyles[type || ""] || {};
    const options = {
      duration: duration || 5000,
      style: { ...baseStyle, ...tone, ...style, ...mobileStyle },
      position: (position || "top-right") as never,
    };

    switch (type) {
      case "success":
        toast.success(message!, options);
        break;
      case "error":
        toast.error(message!, options);
        break;
      case "info":
      case "warning":
      case "infoOmega":
        toast(message!, options);
        break;
      default:
        toast(message!, options);
        break;
    }
  };

  if (message) {
    notify();
  }

  return <Toaster position={(position || "top-right") as never} />;
};

export default Alert;
