import React from "react";

export default function Loading() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "70vh",
        width: "100%",
        gap: "1.25rem",
      }}
    >
      <div
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "50%",
          border: "3px solid rgba(255, 85, 0, 0.2)",
          borderTopColor: "#ff5500",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <p
        style={{
          color: "#a0a0a0",
          fontSize: "0.9rem",
          fontWeight: 500,
          letterSpacing: "0.02em",
        }}
      >
        Loading FED KIIT...
      </p>
    </div>
  );
}
