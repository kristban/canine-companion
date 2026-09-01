import { ImageResponse } from "next/og";

export const alt = "Canine Companion — Find Your Perfect Dog Breed";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#fbf6ea",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: 1000,
            height: 460,
            background: "#ffffff",
            border: "6px solid #17130f",
            borderRadius: 48,
            boxShadow: "16px 16px 0 0 #17130f",
          }}
        >
          <div style={{ display: "flex", fontSize: 140 }}>🐾</div>
          <div
            style={{
              display: "flex",
              fontSize: 76,
              fontWeight: 700,
              color: "#17130f",
              marginTop: 16,
            }}
          >
            Canine Companion
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 34,
              fontWeight: 600,
              color: "#aa4308",
              marginTop: 12,
            }}
          >
            Find your perfect dog breed
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
