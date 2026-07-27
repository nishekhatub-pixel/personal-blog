import { ImageResponse } from "next/og";

export const alt = "R7，在代码与生活之间持续生长";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          color: "#F3F1EA",
          background: "#151816",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ color: "#20E6A4", fontSize: 42, fontWeight: 800 }}>R7</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ fontSize: 76, fontWeight: 760, letterSpacing: "-0.04em" }}>
            在代码与生活之间，
          </div>
          <div style={{ fontSize: 76, fontWeight: 760, letterSpacing: "-0.04em" }}>
            持续生长。
          </div>
          <div style={{ fontSize: 28, color: "#A8B0AA" }}>
            软件技术学习 · 项目实践 · 生活记录
          </div>
        </div>
      </div>
    ),
    size,
  );
}
