import React from "react";

export default function MainLoading() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "65vh",
        width: "100%",
        gap: "1.25rem",
      }}
    >
      <div
        style={{
          width: "44px",
          height: "44px",
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
          fontSize: "0.875rem",
          fontWeight: 500,
        }}
      >
        Loading page...
      </p>
    </div>
  );
}
