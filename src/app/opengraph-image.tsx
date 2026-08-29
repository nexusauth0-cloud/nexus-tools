import { ImageResponse } from "next/og"
import { siteConfig } from "@/lib/site"

export const alt = "NEXUS Tools — Fast, private online tools"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        backgroundColor: "#0a0a0c",
        color: "#f5f5f4",
        padding: "72px 84px",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: "-180px",
          right: "-180px",
          width: "560px",
          height: "560px",
          borderRadius: "9999px",
          backgroundColor: "rgba(232,182,76,0.16)",
        }}
      />
      <div
        style={{
          display: "flex",
          position: "absolute",
          bottom: "-260px",
          left: "-140px",
          width: "520px",
          height: "520px",
          borderRadius: "9999px",
          backgroundColor: "rgba(154,109,255,0.14)",
        }}
      />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          fontSize: "26px",
          fontWeight: 700,
          letterSpacing: "0.18em",
          color: "#f5f5f4",
        }}
      >
        <svg width="40" height="40" viewBox="0 0 32 32" style={{ display: "flex" }}>
          <path
            d="M16 2.5 27.5 9.25v13.5L16 29.5 4.5 22.75V9.25L16 2.5Z"
            stroke="#e8b64c"
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M16 7.5 22.5 11.375v8.25L16 23.5l-6.5-3.875v-8.25L16 7.5Z"
            stroke="#e8b64c"
            strokeWidth="2"
            fill="none"
          />
        </svg>
        <span>NEXUS</span>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          justifyContent: "center",
          gap: "18px",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: "76px",
            lineHeight: 1.04,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: "#f5f5f4",
          }}
        >
          Every online tool,
        </div>
        <div
          style={{
            display: "flex",
            fontSize: "76px",
            lineHeight: 1.04,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: "#e8b64c",
          }}
        >
          crafted for speed.
        </div>
        <div
          style={{
            display: "flex",
            marginTop: "8px",
            fontSize: "26px",
            fontWeight: 400,
            color: "#9d9da3",
          }}
        >
          55 fast, private tools. No uploads, no accounts, no friction.
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: "18px",
          color: "#6f6f76",
        }}
      >
        <span>{siteConfig.url}</span>
        <span>Privacy-first by design</span>
      </div>
    </div>,
    size
  )
}
