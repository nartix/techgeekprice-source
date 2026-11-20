import { createTheme } from "@mantine/core";

export const adminTheme = createTheme({
  primaryColor: "adminBlue",
  primaryShade: { light: 7, dark: 4 },
  defaultRadius: "sm",
  fontFamily: "var(--font-geist-sans), Arial, sans-serif",
  fontFamilyMonospace: "var(--font-geist-mono), monospace",
  respectReducedMotion: true,
  colors: {
    adminBlue: [
      "#eef6ff",
      "#d9eaff",
      "#b5d6ff",
      "#8fc0ff",
      "#69a8fa",
      "#488ff0",
      "#2f78dd",
      "#1f65c7",
      "#18529f",
      "#123f7c",
    ],
    adminNeutral: [
      "#f8fafc",
      "#f1f5f9",
      "#e2e8f0",
      "#cbd5e1",
      "#94a3b8",
      "#64748b",
      "#334155",
      "#1e293b",
      "#0f172a",
      "#020617",
    ],
  },
});
