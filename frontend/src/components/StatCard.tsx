import type { ReactNode } from "react";
import { Card, CardContent, Box, Typography, useTheme, alpha } from "@mui/material";
import { motion } from "framer-motion";

interface Props {
  title: string;
  value: ReactNode;
  icon: ReactNode;
  color?: "primary" | "secondary" | "success" | "warning" | "error" | "info";
  sub?: string;
  delay?: number;
}

export default function StatCard({ title, value, icon, color = "primary", sub, delay = 0 }: Props) {
  const theme = useTheme();
  const paletteColor = theme.palette[color].main;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: "easeOut" }}
    >
      <Card
        className="hover-lift"
        sx={{
          height: "100%",
          backgroundImage: "none",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Box
          aria-hidden="true"
          sx={{
            position: "absolute",
            top: -28,
            right: -28,
            width: 110,
            height: 110,
            borderRadius: "50%",
            background: alpha(paletteColor, 0.14),
          }}
        />
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.25 }}>
            <Box
              aria-hidden="true"
              sx={{
                width: 44,
                height: 44,
                borderRadius: "12px",
                display: "grid",
                placeItems: "center",
                color: paletteColor,
                background: alpha(paletteColor, 0.15),
              }}
            >
              {icon}
            </Box>
            <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 600 }}>
              {title}
            </Typography>
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: "-0.02em" }}>
            {value}
          </Typography>
          {sub && (
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {sub}
            </Typography>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
