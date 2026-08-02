"use client";

import { ColorRing } from "react-loader-spinner";

/** Inline button spinner — ported from microInteraction/Load/MicroLoad.jsx. */
export default function MicroLoading({
  color = "white",
  style = {},
}: {
  color?: string;
  style?: React.CSSProperties;
}) {
  return (
    <ColorRing
      visible={true}
      height="40"
      width="40"
      ariaLabel="color-ring-loading"
      wrapperStyle={{
        marginTop: "-1rem",
        marginBottom: "-0.8rem",
        backgroundColor: "transparent",
        transition: ".2s linear",
        ...style,
      }}
      wrapperClass="containerLoading"
      colors={[color, color, color, color, color]}
    />
  );
}
