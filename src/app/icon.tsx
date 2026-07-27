import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#151816",
          background: "#20E6A4",
          fontSize: 220,
          fontWeight: 800,
          letterSpacing: "-0.12em",
          paddingRight: 26,
        }}
      >
        R7
      </div>
    ),
    size,
  );
}
