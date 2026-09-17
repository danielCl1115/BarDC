import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

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
          background: "#090d16",
        }}
      >
        <svg width="164" height="164" viewBox="0 0 100 100">
          <defs>
            <linearGradient id="g" x1="0" y1="0" x2="100" y2="100">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>
          <rect x="8" y="8" width="84" height="84" rx="20" fill="#0a0f1c" />
          <rect x="8" y="8" width="84" height="84" rx="20" fill="none" stroke="url(#g)" strokeWidth="2.5" />
          <rect x="37" y="30" width="26" height="9" rx="4.5" fill="url(#g)" />
          <rect x="29" y="45" width="42" height="9" rx="4.5" fill="url(#g)" opacity={0.82} />
          <rect x="21" y="60" width="58" height="9" rx="4.5" fill="url(#g)" opacity={0.62} />
        </svg>
      </div>
    ),
    { ...size },
  );
}
