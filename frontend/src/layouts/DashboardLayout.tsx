import { useState } from "react";
import type { ReactNode } from "react";
import { Outlet, NavLink, useNavigate, Navigate } from "react-router-dom";
import {
  AppBar, Avatar, Box, Chip, Drawer, IconButton, List, ListItemButton, ListItemIcon,
  ListItemText, Toolbar, Tooltip, Typography, useMediaQuery, useTheme,
} from "@mui/material";
import DarkModeIcon from "@mui/icons-material/DarkModeOutlined";
import LightModeIcon from "@mui/icons-material/LightModeOutlined";
import MenuIcon from "@mui/icons-material/Menu";
import HomeIcon from "@mui/icons-material/HomeOutlined";
import DashboardIcon from "@mui/icons-material/DashboardOutlined";
import SearchIcon from "@mui/icons-material/Search";
import LostIcon from "@mui/icons-material/ReportProblemOutlined";
import FoundIcon from "@mui/icons-material/Inventory2Outlined";
import ClaimIcon from "@mui/icons-material/GavelOutlined";
import ProfileIcon from "@mui/icons-material/PersonOutline";
import AdminIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import LogoutIcon from "@mui/icons-material/Logout";
import { useAuth } from "../contexts/AuthContext";
import { useThemeMode } from "../contexts/ThemeModeContext";

const DRAWER_W = 264;

interface NavItem {
  label: string;
  to: string;
  icon: ReactNode;
  adminOnly?: boolean;
}

const items: NavItem[] = [
  { label: "Home", to: "/", icon: <HomeIcon /> },
  { label: "Dashboard", to: "/dashboard", icon: <DashboardIcon /> },
  { label: "My Lost Items", to: "/dashboard/lost", icon: <LostIcon /> },
  { label: "My Found Items", to: "/dashboard/found", icon: <FoundIcon /> },
  { label: "My Claims", to: "/dashboard/claims", icon: <ClaimIcon /> },
  { label: "Browse All", to: "/browse?tab=lost", icon: <SearchIcon /> },
  { label: "Profile", to: "/dashboard/profile", icon: <ProfileIcon /> },
  { label: "Admin Panel", to: "/admin", icon: <AdminIcon />, adminOnly: true },
];

export default function DashboardLayout() {
  const { user, loading, logout } = useAuth();
  const { mode, toggle } = useThemeMode();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (loading) return <FullPageLoader />;
  if (!user) return <Navigate to="/login" replace />;

  const drawerContent = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Box
        component={NavLink}
        to="/dashboard"
        style={{ textDecoration: "none" }}
        sx={{ display: "flex", alignItems: "center", gap: 1.25, px: 2.5, py: 2.5 }}
      >
        <Box
          aria-hidden="true"
          sx={(t) => ({
            width: 38, height: 38, borderRadius: "12px",
            background: `linear-gradient(135deg, ${t.palette.primary.main}, ${t.palette.secondary.main})`,
            display: "grid", placeItems: "center", color: "#fff",
          })}
        >
          <SearchIcon fontSize="small" />
        </Box>
        <Typography sx={(t) => ({ color: t.palette.text.primary, fontWeight: 800, fontSize: "1.05rem" })}>
          Lost&Found
        </Typography>
      </Box>

      <List sx={{ px: 1.5, flexGrow: 1 }} onClick={() => setMobileOpen(false)}>
        {items
          .filter((i) => !i.adminOnly || user.role === "ADMIN")
          .map((item) => (
            <ListItemButton
              key={item.to}
              component={NavLink}
              to={item.to}
              sx={(t) => ({
                borderRadius: 2,
                mb: 0.5,
                "&.active": {
                  background: `linear-gradient(90deg, ${t.palette.primary.main}22, ${t.palette.secondary.main}18)`,
                  border: `1px solid ${t.palette.primary.main}55`,
                  "& .MuiListItemIcon-root": { color: t.palette.primary.main },
                  "& .MuiTypography-root": { color: t.palette.text.primary, fontWeight: 700 },
                },
              })}
            >
              <ListItemIcon sx={{ minWidth: 40, color: "text.secondary" }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: "0.92rem", fontWeight: 600 }} />
            </ListItemButton>
          ))}
      </List>

      <Box sx={{ p: 2 }}>
        <Box className="glass-panel" sx={{ p: 1.5, display: "flex", alignItems: "center", gap: 1.5 }}>
          <Avatar sx={(t) => ({ background: `linear-gradient(135deg, ${t.palette.primary.main}, ${t.palette.secondary.main})`, fontWeight: 700 })}>
            {user.name.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ minWidth: 0, flexGrow: 1 }}>
            <Typography variant="subtitle2" noWrap>{user.name}</Typography>
            <Typography variant="caption" sx={(t) => ({ color: t.palette.text.secondary })} noWrap>
              {user.email}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <div className="app-aurora" aria-hidden="true" />

      {!isMobile && (
        <Drawer
          variant="permanent"
          open
          sx={(t) => ({
            width: DRAWER_W,
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              width: DRAWER_W,
              boxSizing: "border-box",
              borderRight: `1px solid ${t.palette.divider}`,
              bgcolor: t.palette.mode === "dark" ? "rgba(19,28,49,0.85)" : "rgba(255,255,255,0.9)",
              backdropFilter: "blur(12px)",
            },
          })}
        >
          {drawerContent}
        </Drawer>
      )}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { xs: "block", md: "none" }, "& .MuiDrawer-paper": { width: DRAWER_W } }}
      >
        {drawerContent}
      </Drawer>

      <Box sx={{ flexGrow: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <AppBar
          position="sticky"
          elevation={0}
          sx={(t) => ({
            bgcolor: t.palette.mode === "dark" ? "rgba(15,23,42,0.78)" : "rgba(255,255,255,0.85)",
            backdropFilter: "blur(14px)",
            borderBottom: `1px solid ${t.palette.divider}`,
            color: t.palette.text.primary,
          })}
        >
          <Toolbar sx={{ gap: 1 }}>
            {isMobile && (
              <IconButton edge="start" onClick={() => setMobileOpen(true)} aria-label="Open menu">
                <MenuIcon />
              </IconButton>
            )}
            <Typography variant="h6" sx={{ fontWeight: 700, flexGrow: 1, fontSize: { xs: "1.05rem", md: "1.2rem" } }}>
              <Box component="span" className="gradient-text">Dashboard</Box>
            </Typography>
            {user.role === "ADMIN" && (
              <Chip label="ADMIN" size="small" color="secondary" variant="outlined" sx={{ mr: 1, fontWeight: 800 }} />
            )}
            <Tooltip title={mode === "dark" ? "Light mode" : "Dark mode"}>
              <IconButton onClick={toggle} aria-label="Toggle theme">{mode === "dark" ? <LightModeIcon /> : <DarkModeIcon />}</IconButton>
            </Tooltip>
            <Tooltip title="Sign out">
              <IconButton
                onClick={async () => {
                  await logout();
                  navigate("/");
                }}
                aria-label="Sign out"
              >
                <LogoutIcon />
              </IconButton>
            </Tooltip>
          </Toolbar>
        </AppBar>

        <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 3 }, maxWidth: 1280, width: "100%", mx: "auto" }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}

function FullPageLoader() {
  return (
    <Box sx={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>
      <div className="skeleton" style={{ width: 160, height: 14 }} />
    </Box>
  );
}
