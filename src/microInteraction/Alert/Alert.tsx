"use client";

import { Toaster, toast } from "react-hot-toast";

/**
 * Toast helper — ported from FED-Frontend/src/microInteraction/Alert/Alert.jsx.
 *
 * Kept callable both as a component (`<Alert type=… message=… />`) and as a
 * plain function (`Alert({ type, message })`), because the original codebase
 * used both forms — App.jsx calls it directly and discards the returned JSX,
 * relying on `notify()` running as a side effect.
 *
 * Colours and borders are byte-for-byte the originals.
 */

export type AlertProps = {
  type?: string;
  message?: string;
  position?: string;
  duration?: number;
  style?: React.CSSProperties;
};

const Alert = ({ type, message, position, duration, style }: AlertProps) => {
  const notify = () => {
    const defaultStyle: React.CSSProperties = {
      borderRadius: "5px",
      padding: "10px",
      boxShadow: "0px 0px 10px rgba(0, 0, 0, 0.1)",
      fontSize: "16px",
    };

    const mobileStyle: React.CSSProperties =
      typeof window !== "undefined" && window.innerWidth <= 768
        ? { marginBottom: "2rem" }
        : {};

    const options = {
      duration: duration || 5000,
      style: { ...defaultStyle, ...style, ...mobileStyle },
      position: (position || "top-right") as never,
    };

    switch (type) {
      case "success":
        toast.success(message!, {
          ...options,
          style: {
            ...defaultStyle,
            ...style,
            ...mobileStyle,
            border: "1.5px solid green",
            backgroundColor: "#d3f9d3",
            color: "#198754",
          },
        });
        break;
      case "error":
        toast.error(message!, {
          ...options,
          style: {
            ...defaultStyle,
            ...style,
            ...mobileStyle,
            border: "1.5px solid red",
            backgroundColor: "#FADADD",
            color: "red",
          },
        });
        break;
      case "info":
      case "warning":
        toast(message!, {
          ...options,
          style: {
            ...defaultStyle,
            ...style,
            ...mobileStyle,
            border: "1.5px solid orange",
            backgroundColor: "#fff3cd",
            color: "#856404",
          },
        });
        break;
      case "infoOmega":
        toast(message!, {
          ...options,
          style: {
            ...defaultStyle,
            ...style,
            ...mobileStyle,
            border: "1.5px solid #0171e3d6",
            backgroundColor: "white",
            color: "#0171e3d6",
          },
        });
        break;
      default:
        toast(message!, {
          ...options,
          style: { ...defaultStyle, ...style, ...mobileStyle },
        });
        break;
    }
  };

  if (message) {
    notify();
  }

  return <Toaster position={(position || "top-right") as never} />;
};

export default Alert;
