// Set mínimo de iconos de línea (24x24, stroke=currentColor). Sin dependencias externas.
const PATHS: Record<string, string> = {
  home: "M3 11.5 12 4l9 7.5M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9",
  receipt:
    "M6 3h12v18l-3-2-3 2-3-2-3 2V3Z M9 8h6 M9 12h6",
  box: "M3.5 7.5 12 3l8.5 4.5-8.5 4.5-8.5-4.5Z M3.5 7.5v9L12 21l8.5-4.5v-9 M12 12v9",
  truck:
    "M3 6h11v9H3V6Z M14 10h4l3 3v2h-7v-5Z M6.5 18.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z M16.5 18.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z",
  layers: "M12 2 3 7l9 5 9-5-9-5Z M3 12l9 5 9-5 M3 17l9 5 9-5",
  chart: "M4 20V10 M10 20V4 M16 20v-7 M4 20h16",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M12 7v5l3.5 2",
  users:
    "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z M2.5 20c.6-3.4 3.2-5.5 6.5-5.5s5.9 2.1 6.5 5.5 M16.5 8a2.75 2.75 0 1 0 0-5.5 M17 14.6c2.5.5 4.2 2.3 4.7 5.4",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9",
  plus: "M12 5v14M5 12h14",
  bell: "M12 22a2 2 0 0 0 2-2H10a2 2 0 0 0 2 2Z M5 17h14l-1.6-2.1A6 6 0 0 1 16 11.2V10a4 4 0 0 0-8 0v1.2c0 1.6-.5 3.2-1.4 4.5L5 17Z",
  trend: "M3 17l6-6 4 4 8-8 M15 7h6v6",
  arrowLeft: "M19 12H5 M11 18l-6-6 6-6",
  close: "M18 6 6 18 M6 6l12 12",
  pencil:
    "M4 20h4L18.5 9.5a2.121 2.121 0 0 0-3-3L5 17v3Z M13.5 6.5l4 4",
  trash:
    "M4 7h16 M9 7V4h6v3 M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13 M10 11v6 M14 11v6",
  check: "M5 13l4 4L19 7",
  alert:
    "M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z",
  download: "M12 3v12 M7.5 10.5 12 15l4.5-4.5 M4 20h16",
};

export type IconName = keyof typeof PATHS;

export function Icon({
  name,
  size = 18,
  className = "",
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
