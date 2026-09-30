import { useState } from "react";
import { Outlet, NavLink, Link as RouterLink, useNavigate } from "react-router-dom";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Container,
  Divider,
  Drawer,
  IconButton,
  Link,
  ListItemIcon,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import DarkModeIcon from "@mui/icons-material/DarkModeOutlined";
import LightModeIcon from "@mui/icons-material/LightModeOutlined";
import MenuIcon from "@mui/icons-material/Menu";
import PersonIcon from "@mui/icons-material/PersonOutline";
import LogoutIcon from "@mui/icons-material/Logout";
import SearchIcon from "@mui/icons-material/Search";
import { useAuth } from "../contexts/AuthContext";
import { useThemeMode } from "../contexts/ThemeModeContext";

const navLinks = [
  { to: "/browse?tab=lost", label: "Lost Items" },
  { to: "/browse?tab=found", label: "Found Items" },
  { to: "/about", label: "About" },
];

const drawerWidth = 260;

export default function PublicLayout() {
  const navigate = useNavigate();
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("md"));
  const { user, logout } = useAuth();
  const { mode, toggle } = useThemeMode();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = async () => {
    setAnchorEl(null);
    await logout();
    navigate("/");
  };

  const navStack = (
    <Stack
      direction={{ xs: "column", md: "row" }}
      spacing={{ xs: 1.5, md: 3 }}
      onClick={() => setDrawerOpen(false)}
    >
      {navLinks.map((l) => (
        <Link
          key={l.to}
          component={NavLink}
          to={l.to}
          underline="none"
          sx={(t) => ({
            fontWeight: 600,
            fontSize: "0.95rem",
            color: t.palette.text.secondary,
            "&:hover": { color: t.palette.primary.main },
            "&.active": { color: t.palette.primary.main },
          })}
        >
          {l.label}
        </Link>
      ))}
    </Stack>
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <div className="app-aurora" aria-hidden="true" />

      <AppBar
        position="sticky"
        elevation={0}
        sx={(t) => ({
          bgcolor: t.palette.mode === "dark" ? "rgba(15,23,42,0.78)" : "rgba(255,255,255,0.82)",
          backdropFilter: "blur(14px)",
          borderBottom: `1px solid ${t.palette.divider}`,
          color: t.palette.text.primary,
        })}
      >
        <Toolbar sx={{ gap: 1 }}>
          {isMobile && (
            <IconButton edge="start" onClick={() => setDrawerOpen(true)} aria-label="Open navigation menu">
              <MenuIcon />
            </IconButton>
          )}

          <Box
            component={RouterLink}
            to="/"
            sx={{ display: "flex", alignItems: "center", gap: 1.25, textDecoration: "none", mr: 4 }}
          >
            <Box
              aria-hidden="true"
              sx={(t) => ({
                width: 38,
                height: 38,
                borderRadius: "12px",
                background: `linear-gradient(135deg, ${t.palette.primary.main}, ${t.palette.secondary.main})`,
                display: "grid",
                placeItems: "center",
                color: "#fff",
                boxShadow: t.shadows[4],
              })}
            >
              <SearchIcon fontSize="small" />
            </Box>
            <Typography sx={(t) => ({ color: t.palette.text.primary, fontWeight: 800, letterSpacing: "-0.02em", fontSize: "1.15rem", lineHeight: 1.1 })}>
              Lost<span className="gradient-text">&Found</span>
              <Typography
                component="span"
                sx={(t) => ({
                  display: "block",
                  fontSize: "0.62rem",
                  fontWeight: 700,
                  color: t.palette.text.secondary,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                })}
              >
                Portal
              </Typography>
            </Typography>
          </Box>

          {!isMobile && (
            <Box sx={{ flexGrow: 1 }}>
              {navStack}
            </Box>
          )}
          {isMobile && <Box sx={{ flexGrow: 1 }} />}

          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Tooltip title={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
              <IconButton onClick={toggle} aria-label="Toggle color scheme">
                {mode === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Tooltip>

            {user ? (
              <>
                <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} aria-label="Open account menu">
                  <Avatar
                    sx={(t) => ({
                      width: 34,
                      height: 34,
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      background: `linear-gradient(135deg, ${t.palette.primary.main}, ${t.palette.secondary.main})`,
                    })}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </Avatar>
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={() => setAnchorEl(null)}
                  transformOrigin={{ horizontal: "right", vertical: "top" }}
                  anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
                >
                  <Box sx={{ px: 2, py: 1 }}>
                    <Typography variant="subtitle2">{user.name}</Typography>
                    <Typography variant="caption" sx={(t) => ({ color: t.palette.text.secondary })}>
                      {user.email} · {user.role}
                    </Typography>
                  </Box>
                  <Divider />
                  <MenuItem
                    onClick={() => {
                      setAnchorEl(null);
                      navigate(user.role === "ADMIN" ? "/admin" : "/dashboard");
                    }}
                  >
                    <ListItemIcon>
                      <PersonIcon fontSize="small" />
                    </ListItemIcon>
                    Dashboard
                  </MenuItem>
                  <MenuItem onClick={handleLogout}>
                    <ListItemIcon>
                      <LogoutIcon fontSize="small" />
                    </ListItemIcon>
                    Sign out
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <>
                <Link
                  component={RouterLink}
                  to="/login"
                  underline="none"
                  sx={{ fontWeight: 600, mx: 1, display: { xs: "none", sm: "inline" } }}
                >
                  Sign in
                </Link>
                <Button component={RouterLink} to="/register" variant="contained" size="small" sx={{ borderRadius: "10px" }}>
                  Get started
                </Button>
              </>
            )}
          </Stack>
        </Toolbar>
      </AppBar>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: drawerWidth, pt: 2 } }}
      >
        <Box sx={{ px: 2 }}>
          <Typography variant="overline" sx={(t) => ({ color: t.palette.text.secondary })}>
            Navigate
          </Typography>
          {navStack}
        </Box>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1 }}>
        <Outlet />
      </Box>

      <Box
        component="footer"
        sx={(t) => ({
          mt: "auto",
          py: 4,
          px: 3,
          borderTop: `1px solid ${t.palette.divider}`,
          bgcolor: t.palette.mode === "dark" ? "rgba(19,28,49,0.6)" : "rgba(255,255,255,0.6)",
        })}
      >
        <Container
          maxWidth="lg"
          sx={{ display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center", justifyContent: "space-between" }}
        >
          <Typography variant="body2" sx={(t) => ({ color: t.palette.text.secondary })}>
            © {new Date().getFullYear()} Lost & Found Management System
          </Typography>
          <Stack direction="row" spacing={3}>
            <Link component={RouterLink} to="/about" underline="hover" variant="body2">
              About
            </Link>
            <Link href="/api-docs" target="_blank" rel="noreferrer" underline="hover" variant="body2">
              API Docs
            </Link>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}
