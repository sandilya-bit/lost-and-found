import { createTheme, alpha } from "@mui/material/styles";

/**
 * MUI theme — premium "quiet luxury" system:
 * deep midnight palette, gilded hairlines, editorial serif
 * display headings and softly glowing interactive elements.
 * Kept in TS (not CSS) so components can use `theme.palette.*` directly.
 */

const displayFont = '"Fraunces", "Georgia", "Times New Roman", serif';
const bodyFont = '"Inter", "Roboto", "Segoe UI", system-ui, sans-serif';

const dark = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#3B82F6", light: "#60A5FA", dark: "#2563EB" },
    secondary: { main: "#8B5CF6", light: "#A78BFA", dark: "#7C3AED" },
    success: { main: "#22C55E" },
    warning: { main: "#F59E0B" },
    error: { main: "#EF4444" },
    info: { main: "#0EA5E9" },
    background: { default: "#0B1120", paper: "#111A2E" },
    text: { primary: "#F8FAFC", secondary: "#94A3B8" },
    divider: "rgba(148, 163, 184, 0.14)",
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: bodyFont,
    h1: { fontFamily: displayFont, fontWeight: 800 },
    h2: { fontFamily: displayFont, fontWeight: 800, letterSpacing: "-0.015em" },
    h3: { fontFamily: displayFont, fontWeight: 700 },
    h4: { fontFamily: displayFont, fontWeight: 700, letterSpacing: "-0.01em" },
    h5: { fontFamily: displayFont, fontWeight: 700 },
    h6: { fontFamily: displayFont, fontWeight: 600, letterSpacing: "0" },
    button: { textTransform: "none", fontWeight: 600, letterSpacing: "0.01em" },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: "none" },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          border: "1px solid rgba(148, 163, 184, 0.14)",
          transition: "border-color 240ms cubic-bezier(0.22, 1, 0.36, 1)",
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        containedPrimary: {
          background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)",
          boxShadow: "0 4px 18px rgba(37, 99, 235, 0.35)",
          "&:hover": {
            background: "linear-gradient(135deg, #1D4ED8 0%, #6D28D9 100%)",
            boxShadow: "0 6px 24px rgba(37, 99, 235, 0.45)",
          },
        },
        outlined: {
          borderColor: "rgba(148, 163, 184, 0.28)",
          "&:hover": {
            borderColor: "rgba(96, 165, 250, 0.55)",
            backgroundColor: "rgba(59, 130, 246, 0.06)",
          },
        },
        root: { borderRadius: 10 },
      },
    },
    MuiTextField: {
      defaultProps: { size: "small" },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          transition: "box-shadow 240ms cubic-bezier(0.22, 1, 0.36, 1)",
          "&.Mui-focused": {
            boxShadow: "0 0 0 4px rgba(59, 130, 246, 0.14)",
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600 },
      },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0 },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { backgroundColor: "rgba(15, 23, 42, 0.92)", backdropFilter: "blur(6px)", fontWeight: 500 },
      },
    },
  },
});

const light = createTheme(dark, {
  palette: {
    mode: "light",
    background: { default: "#F4F6FB", paper: "#FFFFFF" },
    text: { primary: "#0F172A", secondary: "#475569" },
    divider: "rgba(15, 23, 42, 0.10)",
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          border: "1px solid rgba(15, 23, 42, 0.08)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        containedPrimary: {
          background: "linear-gradient(135deg, #2563EB 0%, #6D28D9 100%)",
          boxShadow: "0 4px 18px rgba(37, 99, 235, 0.28)",
          "&:hover": {
            background: "linear-gradient(135deg, #1D4ED8 0%, #5B21B6 100%)",
            boxShadow: "0 6px 24px rgba(37, 99, 235, 0.36)",
          },
        },
        outlined: {
          "&:hover": {
            borderColor: alpha("#2563EB", 0.5),
            backgroundColor: alpha("#2563EB", 0.05),
          },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { backgroundColor: "rgba(15, 23, 42, 0.88)" },
      },
    },
  },
});

export const themes = { dark, light };
export const glass = (theme: typeof dark) =>
  ({
    background: alpha(theme.palette.background.paper, 0.55),
    backdropFilter: "blur(18px) saturate(150%)",
    border: `1px solid ${theme.palette.divider}`,
  }) as const;
