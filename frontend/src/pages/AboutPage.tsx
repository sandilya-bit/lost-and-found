import { Box, Chip, Container, Divider, Grid, Paper, Typography } from "@mui/material";
import StorageIcon from "@mui/icons-material/StorageOutlined";
import SecurityIcon from "@mui/icons-material/SecurityOutlined";
import CodeIcon from "@mui/icons-material/CodeOutlined";

export default function AboutPage() {
  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Typography variant="h3" sx={{ fontWeight: 900, letterSpacing: "-0.02em", mb: 1 }}>
        About the <span className="gradient-text">Lost & Found Portal</span>
      </Typography>
      <Typography variant="body1" sx={{ color: "text.secondary", mb: 4, maxWidth: 720 }}>
        A centralized platform that replaces paper registers and notice boards: report lost or found
        items, search a live database, submit ownership claims, and let administrators verify and
        return items — all in one auditable system.
      </Typography>

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={4}>
          <Paper className="hover-lift" sx={{ p: 3, height: "100%", backgroundImage: "none", borderRadius: "16px" }}>
            <StorageIcon sx={{ color: "primary.main", mb: 1 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 0.5 }}>Instant Fake Database</Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              20 lost + 20 found items, ownership claims and accounts are preloaded in an in-browser
              store (localStorage). Everything you create persists across reloads; clear site data to reset.
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper className="hover-lift" sx={{ p: 3, height: "100%", backgroundImage: "none", borderRadius: "16px" }}>
            <SecurityIcon sx={{ color: "success.main", mb: 1 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 0.5 }}>Simulated Auth</Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              JWT-style sessions, rate limiting and role checks are emulated inside the mock API,
              so sign-in, registration and the demo account behave exactly like production.
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper className="hover-lift" sx={{ p: 3, height: "100%", backgroundImage: "none", borderRadius: "16px" }}>
            <CodeIcon sx={{ color: "secondary.main", mb: 1 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 0.5 }}>Zero-Install Prototype</Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              React 18 + TypeScript + MUI v6 + Framer Motion — and no server to run or deploy.
              Clone it, `npm run dev`, and every feature works instantly, even offline.
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Divider sx={{ my: 5 }} />

      <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.5 }}>Roles</Typography>
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 3 }}>
        <Chip label="User — report items, claim, track" variant="outlined" />
        <Chip label="Admin — verify claims, manage all records" color="secondary" variant="outlined" />
      </Box>

      <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.5 }}>For evaluators</Typography>
      <Typography variant="body2" sx={{ color: "text.secondary", maxWidth: 720 }}>
        This is a fully working prototype: the Express/PostgreSQL backend has been replaced by an
        in-browser mock API (<code>frontend/src/api/client.ts</code>), so every feature works offline
        with seeded data — lost &amp; found items, sample claims and user accounts. Sign in with
        <code> demo@lostfound.io</code> / <code>Demo@1234</code> or use the one-click demo button on
        the login page. To start fresh, use the Reset demo data button in the dashboard sidebar
        (or clear the site&apos;s storage).
      </Typography>
    </Container>
  );
}
