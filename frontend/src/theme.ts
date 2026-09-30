import { createTheme, alpha } from "@mui/material/styles";

/**
 * MUI theme — brand colors, dark-first, with light variants.
 * Kept in TS (not CSS) so components can use `theme.palette.*` directly.
 */
const dark = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#2563EB", light: "#3B82F6", dark: "#1D4ED8" },
    secondary: { main: "#7C3AED", light: "#8B5CF6", dark: "#6D28D9" },
    success: { main: "#22C55E" },
    warning: { main: "#F59E0B" },
    error: { main: "#EF4444" },
    info: { main: "#0EA5E9" },
    background: { default: "#0F172A", paper: "#1E293B" },
    text: { primary: "#F8FAFC", secondary: "#94A3B8" },
    divider: "rgba(148, 163, 184, 0.14)",
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: '"Inter", "Roboto", "Segoe UI", system-ui, sans-serif',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
    button: { textTransform: "none", fontWeight: 600 },
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
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
    },
    MuiTextField: {
      defaultProps: { size: "small" },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600 },
      },
    },
  },
});

const light = createTheme(dark, {
  palette: {
    mode: "light",
    background: { default: "#F1F5F9", paper: "#FFFFFF" },
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
  },
});

export const themes = { dark, light };
export const glass = (theme: typeof dark) =>
  ({
    background: alpha(theme.palette.background.paper, 0.55),
    backdropFilter: "blur(14px)",
    border: `1px solid ${theme.palette.divider}`,
  }) as const;
