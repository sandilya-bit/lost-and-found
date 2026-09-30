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
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 0.5 }}>Database-First Design</Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Normalized PostgreSQL schema (3NF) with strict foreign keys, cascading rules, indexes
              on search columns, and triggers for data integrity.
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper className="hover-lift" sx={{ p: 3, height: "100%", backgroundImage: "none", borderRadius: "16px" }}>
            <SecurityIcon sx={{ color: "success.main", mb: 1 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 0.5 }}>Secure by Default</Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              JWT auth with rotating refresh sessions, bcrypt hashing, RBAC, rate limiting, input
              validation (Zod) and parameterized queries via Prisma.
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper className="hover-lift" sx={{ p: 3, height: "100%", backgroundImage: "none", borderRadius: "16px" }}>
            <CodeIcon sx={{ color: "secondary.main", mb: 1 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 0.5 }}>Modern Stack</Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              React 18 + TypeScript + MUI v6 + Framer Motion on the front; Express + Prisma +
              PostgreSQL on the back; Docker Compose for one-command deployment.
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
        Demo credentials are seeded automatically: <code>admin@lostfound.io / Admin@123</code> and
        <code> priya@example.com / User@1234</code>. Database documentation, the ER diagram and SQL
        scripts live in the <code>database/</code> and <code>docs/</code> folders of the repository.
      </Typography>
    </Container>
  );
}
