import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const INK = "#1c3829";
const CREAM = "#f4ecd8";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: INK,
        }}
      >
        <svg width="164" height="164" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill={INK} />
          <circle cx="50" cy="50" r="40" fill={CREAM} stroke={INK} strokeWidth="1.5" />
          <g transform="translate(50 55)">
            <path
              d="M-15,-19 L15,-19 L12.5,17 a3,3 0 0 1 -3,2.6 L-9.5,19.6 a3,3 0 0 1 -3,-2.6 Z"
              fill={INK}
            />
            <path d="M-13.6,-19 L13.6,-19 L12.7,-9.5 L-12.7,-9.5 Z" fill={CREAM} />
            <path
              d="M15,-11 h5.5 a6.2,6.2 0 0 1 0,16 h-4.6"
              fill="none"
              stroke={INK}
              strokeWidth="3"
              strokeLinecap="round"
            />
          </g>
        </svg>
      </div>
    ),
    { ...size },
  );
}
