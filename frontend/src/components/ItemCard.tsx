import { Link as RouterLink } from "react-router-dom";
import {
  Card, CardActionArea, CardMedia, Box, Typography, Chip, Stack,
} from "@mui/material";
import { motion } from "framer-motion";
import LocationOnIcon from "@mui/icons-material/LocationOnOutlined";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonthOutlined";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import { ItemStatusChip } from "./StatusChip";

export interface ItemCardData {
  id: string;
  item_name: string;
  category: string;
  description: string | null;
  location: string;
  date: string;
  image_url: string | null;
  status: string;
  reporter_name?: string;
  kind: "lost" | "found";
}

interface Props {
  item: ItemCardData;
  index?: number;
}

const CATEGORY_ICONS: Record<string, string> = {
  Electronics: "📱",
  Wallet: "👛",
  Keys: "🔑",
  Bags: "🎒",
  Documents: "📄",
  Jewelry: "💍",
  Clothing: "👕",
  Books: "📚",
  "ID Cards": "🪪",
  "Water Bottles": "🧴",
  "Sports Equipment": "🏀",
  Other: "📦",
};

export default function ItemCard({ item, index = 0 }: Props) {
  const href = item.kind === "lost" ? `/items/lost/${item.id}` : `/items/found/${item.id}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.05, 0.4), ease: "easeOut" }}
      style={{ height: "100%" }}
    >
      <Card
        className="hover-lift"
        sx={{
          height: "100%",
          backgroundImage: "none",
          borderRadius: "16px",
          overflow: "hidden",
        }}
      >
        <CardActionArea component={RouterLink} to={href} sx={{ height: "100%" }}>
          <Box sx={{ position: "relative", pt: "62%", overflow: "hidden" }}>
            {item.image_url ? (
              <CardMedia
                component="img"
                image={item.image_url}
                alt={item.item_name}
                sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <Box
                aria-hidden="true"
                sx={(t) => ({
                  position: "absolute",
                  inset: 0,
                  display: "grid",
                  placeItems: "center",
                  fontSize: "3rem",
                  background:
                    t.palette.mode === "dark"
                      ? `linear-gradient(135deg, ${t.palette.primary.main}22, ${t.palette.secondary.main}22)`
                      : `linear-gradient(135deg, ${t.palette.primary.main}11, ${t.palette.secondary.main}18)`,
                })}
              >
                {CATEGORY_ICONS[item.category] ?? "📦"}
              </Box>
            )}
            <Box sx={{ position: "absolute", top: 10, left: 10, display: "flex", gap: 1 }}>
              <Chip
                size="small"
                label={item.kind === "lost" ? "LOST" : "FOUND"}
                sx={(t) => ({
                  fontWeight: 800,
                  fontSize: "0.7rem",
                  color: "#fff",
                  background:
                    item.kind === "lost"
                      ? t.palette.error.main
                      : t.palette.success.main,
                })}
              />
            </Box>
            <Box sx={{ position: "absolute", top: 10, right: 10 }}>
              {item.status === "RECOVERED" ? (
                <ItemStatusChip status="RECOVERED" />
              ) : null}
            </Box>
          </Box>

          <Box sx={{ p: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, mb: 0.5 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
                {item.item_name}
              </Typography>
              <Chip
                size="small"
                label={item.category}
                variant="outlined"
                sx={{ fontSize: "0.7rem", fontWeight: 600, flexShrink: 0 }}
              />
            </Box>

            {item.description && (
              <Typography
                variant="body2"
                sx={{ color: "text.secondary", mb: 1.25, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
              >
                {item.description}
              </Typography>
            )}

            <Stack spacing={0.5}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <LocationOnIcon sx={{ fontSize: 15, color: "text.secondary" }} />
                <Typography variant="caption" sx={{ color: "text.secondary" }} noWrap>
                  {item.location}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <CalendarMonthIcon sx={{ fontSize: 15, color: "text.secondary" }} />
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  {item.kind === "lost" ? "Lost on" : "Found on"} {formatDate(item.date)}
                </Typography>
              </Box>
            </Stack>

            {item.reporter_name && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1.5, pt: 1.5, borderTop: (t) => `1px solid ${t.palette.divider}` }}>
                <ShieldOutlinedIcon sx={{ fontSize: 15, color: "text.secondary" }} />
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  Reported by {item.reporter_name}
                </Typography>
              </Box>
            )}
          </Box>
        </CardActionArea>
      </Card>
    </motion.div>
  );
}

function formatDate(d: string): string {
  const date = new Date(d.length === 10 ? `${d}T00:00:00` : d);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
