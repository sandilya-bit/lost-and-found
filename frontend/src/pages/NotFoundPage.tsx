import { Link as RouterLink } from "react-router-dom";
import { Button, Container, Typography } from "@mui/material";
import { motion } from "framer-motion";

export default function NotFoundPage() {
  return (
    <Container maxWidth="sm" sx={{ py: 12, textAlign: "center" }}>
      <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
        <Typography variant="h1" className="gradient-text" sx={{ fontWeight: 900, fontSize: { xs: "5rem", md: "7rem" } }}>
          404
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
          This page wandered off
        </Typography>
        <Typography variant="body1" sx={{ color: "text.secondary", mb: 4 }}>
          Fitting, really — this is a lost and found portal, after all.
        </Typography>
        <Button component={RouterLink} to="/" variant="contained" size="large" sx={{ borderRadius: "12px" }}>
          Take me home
        </Button>
      </motion.div>
    </Container>
  );
}
