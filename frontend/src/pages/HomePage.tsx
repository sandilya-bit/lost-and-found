import { useEffect, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Box, Button, Chip, Container, Grid, InputAdornment, Link, Paper, Skeleton, Stack, TextField, Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import TrendingUpIcon from "@mui/icons-material/TrendingUpOutlined";
import GroupsIcon from "@mui/icons-material/GroupsOutlined";
import InventoryIcon from "@mui/icons-material/Inventory2Outlined";
import CheckCircleIcon from "@mui/icons-material/CheckCircleOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { motion } from "framer-motion";
import { api } from "../api/client";
import type { PublicStats } from "../types";
import ItemCard from "../components/ItemCard";
import StatCard from "../components/StatCard";
import { useAuth } from "../contexts/AuthContext";

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    api
      .get<{ data: PublicStats }>("/stats/public")
      .then((res) => setStats(res.data.data))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  const submitSearch = () => {
    navigate(`/browse?tab=lost${query ? `&q=${encodeURIComponent(query)}` : ""}`);
  };

  return (
    <Box>
      {/* ------------------------------ Hero ------------------------------ */}
      <Container maxWidth="lg" sx={{ pt: { xs: 6, md: 12 }, pb: 4 }}>
        <motion.div initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
          <Chip
            label="✨ Campus Lost & Found, modernized"
            size="small"
            sx={(t) => ({
              mb: 2.5,
              fontWeight: 700,
              borderColor: `${t.palette.primary.main}55`,
              color: t.palette.primary.light,
            })}
            variant="outlined"
          />
          <Typography
            variant="h2"
            className="display-serif"
            sx={{
              fontWeight: 900,
              letterSpacing: "-0.02em",
              fontSize: { xs: "2.6rem", sm: "3.6rem", md: "4.2rem" },
              lineHeight: 1.06,
              maxWidth: 840,
            }}
          >
            Lost something? <span className="gradient-text">We help it find you.</span>
          </Typography>
          <Typography variant="h6" sx={{ color: "text.secondary", mt: 2, maxWidth: 640, fontWeight: 400 }}>
            Report lost or found items in seconds, search a live campus-wide database, and submit
            ownership claims — no paperwork, no waiting in line.
          </Typography>

          <Paper
            className="glass-panel"
            component="form"
            onSubmit={(e) => {
              e.preventDefault();
              submitSearch();
            }}
            sx={{ mt: 4, p: 1, display: "flex", gap: 1, maxWidth: 620, borderRadius: "16px" }}
          >
            <TextField
              placeholder="Search items, locations… e.g. iPhone, Library"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              sx={{ flexGrow: 1, "& .MuiOutlinedInput-root": { boxShadow: "none" } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: "text.secondary" }} />
                  </InputAdornment>
                ),
                "aria-label": "Search items",
              }}
            />
            <Button type="submit" variant="contained" sx={{ borderRadius: "12px", px: 3 }}>
              Search
            </Button>
          </Paper>

          <Stack direction="row" spacing={2} sx={{ mt: 3, flexWrap: "wrap" }}>
            <Button component={RouterLink} to="/dashboard/lost/new" variant="outlined" endIcon={<ArrowForwardIcon />}>
              I lost something
            </Button>
            <Button component={RouterLink} to="/dashboard/found/new" variant="outlined" color="secondary" endIcon={<ArrowForwardIcon />}>
              I found something
            </Button>
          </Stack>
          {!user && (
            <Typography variant="caption" sx={{ display: "block", mt: 1, color: "text.secondary" }}>
              You&apos;ll be asked to sign in before submitting a report.
            </Typography>
          )}
        </motion.div>
      </Container>

      {/* --------------------------- Statistics --------------------------- */}
      <Container maxWidth="lg" sx={{ py: 5 }}>
        <Grid container spacing={2.5}>
          {loading || !stats ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Grid item xs={6} md={3} key={i}>
                <Skeleton variant="rounded" height={132} sx={{ borderRadius: "16px" }} />
              </Grid>
            ))
          ) : (
            <>
              <Grid item xs={6} md={3}>
                <StatCard title="Items Reported Lost" value={stats.stats.lost_total} icon={<InventoryIcon />} color="error" delay={0} />
              </Grid>
              <Grid item xs={6} md={3}>
                <StatCard title="Items Found & Listed" value={stats.stats.found_total} icon={<SearchIcon />} color="success" delay={0.08} />
              </Grid>
              <Grid item xs={6} md={3}>
                <StatCard title="Successful Returns" value={stats.stats.lost_recovered} icon={<CheckCircleIcon />} color="primary" delay={0.16} />
              </Grid>
              <Grid item xs={6} md={3}>
                <StatCard title="Community Members" value={stats.stats.users} icon={<GroupsIcon />} color="secondary" delay={0.24} />
              </Grid>
            </>
          )}
        </Grid>
        {stats && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 2 }}>
              <TrendingUpIcon sx={{ color: "success.main", fontSize: 18 }} />
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                <strong style={{ color: "var(--success)" }}>{stats.stats.recovery_rate}%</strong> of reported lost
                items have been recovered through this portal
              </Typography>
            </Box>
          </motion.div>
        )}
      </Container>

      {/* ------------------------- Recently found ------------------------- */}
      <Container maxWidth="lg" sx={{ py: 5 }}>
        <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", mb: 2.5 }}>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            Recently Found Items
          </Typography>
          <Link component={RouterLink} to="/browse?tab=found" sx={{ fontWeight: 700 }}>
            View all →
          </Link>
        </Box>
        <Grid container spacing={2.5}>
          {loading || !stats
            ? Array.from({ length: 3 }).map((_, i) => (
                <Grid item xs={12} sm={6} md={4} key={i}>
                  <Skeleton variant="rounded" height={310} sx={{ borderRadius: "16px" }} />
                </Grid>
              ))
            : stats.recent_found.slice(0, 3).map((item, i) => (
                <Grid item xs={12} sm={6} md={4} key={item.found_id}>
                  <ItemCard
                    item={{
                      id: item.found_id,
                      item_name: item.item_name,
                      category: item.category,
                      description: item.description,
                      location: item.location,
                      date: item.date_found,
                      image_url: item.image_url,
                      status: item.status,
                      kind: "found",
                    }}
                    index={i}
                  />
                </Grid>
              ))}
        </Grid>
      </Container>

      {/* --------------------------- How it works -------------------------- */}
      <Container maxWidth="lg" sx={{ py: 6, pb: 8 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 3 }}>
          How it works
        </Typography>
        <Grid container spacing={2.5}>
          {[
            { icon: "📝", title: "1 · Report", text: "Submit a lost or found report with photos and location details in under a minute." },
            { icon: "🔍", title: "2 · Match", text: "Our matching engine cross-references category, keywords and location to surface candidates." },
            { icon: "🤝", title: "3 · Claim & Return", text: "Submit an ownership claim with proof. Admins verify and the item is marked returned." },
          ].map((s, i) => (
            <Grid item xs={12} md={4} key={s.title}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.45 }}
              >
                <Paper className="hover-lift" sx={{ p: 3, height: "100%", backgroundImage: "none", borderRadius: "16px" }}>
                  <Box sx={{ fontSize: "2rem", mb: 1 }}>{s.icon}</Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 0.5 }}>
                    {s.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    {s.text}
                  </Typography>
                </Paper>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
