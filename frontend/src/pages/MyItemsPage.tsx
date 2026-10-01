import { useEffect, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Alert, Box, Button, Chip, Divider, Grid, Link, Paper, Skeleton, Stack, Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/AddOutlined";
import ReportProblemIcon from "@mui/icons-material/ReportProblemOutlined";
import Inventory2Icon from "@mui/icons-material/Inventory2Outlined";
import GavelIcon from "@mui/icons-material/GavelOutlined";
import SearchOffIcon from "@mui/icons-material/SearchOffOutlined";
import { motion } from "framer-motion";
import { api, getApiErrorMessage } from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import ItemCard from "../components/ItemCard";
import { ClaimStatusChip } from "../components/StatusChip";
import type { Claim, ClaimListResponse, FoundItem, FoundItemListResponse, LostItem, LostItemListResponse } from "../types";

export type MyTab = "all" | "lost" | "found" | "claims";

interface SectionMeta {
  label: string;
  blurb: string;
  newTo: string;
  newLabel: string;
  icon: React.ReactNode;
}

const META: Record<Exclude<MyTab, "all">, SectionMeta> = {
  lost: {
    label: "My Lost Items",
    blurb: "Everything you have reported missing. Items move to “Returned” once recovered.",
    newTo: "/dashboard/lost/new",
    newLabel: "Report lost item",
    icon: <ReportProblemIcon sx={{ color: "error.main" }} />,
  },
  found: {
    label: "My Found Items",
    blurb: "Items you have handed in. Claims from other members appear on each item.",
    newTo: "/dashboard/found/new",
    newLabel: "Report found item",
    icon: <Inventory2Icon sx={{ color: "success.main" }} />,
  },
  claims: {
    label: "My Claims",
    blurb: "Ownership claims you have submitted. An admin reviews each one against the finder's report.",
    newTo: "/browse?tab=found",
    newLabel: "Browse found items",
    icon: <GavelIcon sx={{ color: "primary.main" }} />,
  },
};

interface Buckets {
  lost: LostItem[];
  found: FoundItem[];
  claims: Claim[];
}

const EMPTY: Buckets = { lost: [], found: [], claims: [] };

export default function MyItemsPage({ tab }: { tab: MyTab }) {
  const { user } = useAuth();
  const [buckets, setBuckets] = useState<Buckets>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    const load = async () => {
      try {
        if (tab === "lost" || tab === "all") {
          const res = await api.get<LostItemListResponse>("/lost-items", { params: { limit: 50, sort_by: "created_at", sort_order: "desc" } });
          setBuckets((b) => ({ ...b, lost: res.data.items.filter((i) => i.user_id === user?.user_id) }));
        }
        if (tab === "found" || tab === "all") {
          const res = await api.get<FoundItemListResponse>("/found-items", { params: { limit: 50, sort_by: "created_at", sort_order: "desc" } });
          setBuckets((b) => ({ ...b, found: res.data.items.filter((i) => i.user_id === user?.user_id) }));
        }
        if (tab === "claims" || tab === "all") {
          const res = await api.get<ClaimListResponse>("/claims", { params: { limit: 50 } });
          setBuckets((b) => ({ ...b, claims: res.data.claims }));
        }
      } catch (err) {
        if (alive) setError(getApiErrorMessage(err, "Failed to load your items"));
      } finally {
        if (alive) setLoading(false);
      }
    };
    void load();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, user?.user_id]);

  if (loading) {
    return (
      <Grid container spacing={2.5}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Grid item xs={12} sm={6} md={4} key={i}>
            <Skeleton variant="rounded" height={210} sx={{ borderRadius: "16px" }} />
          </Grid>
        ))}
      </Grid>
    );
  }

  if (error) {
    return <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>;
  }

  if (tab === "all") {
    const { lost, found, claims } = buckets;
    return (
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          Welcome back, <span className="gradient-text">{user?.name.split(" ")[0]}</span>
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 3.5 }}>
          Here is everything you have reported and claimed on the portal.
        </Typography>

        <ItemsSection
          title="My Lost Items"
          icon={<ReportProblemIcon sx={{ color: "error.main" }} />}
          count={lost.length}
          emptyText="You haven't reported anything missing yet."
          newTo="/dashboard/lost/new"
          newLabel="Report lost item"
          kind="lost"
          items={lost}
        />
        <ItemsSection
          title="My Found Items"
          icon={<Inventory2Icon sx={{ color: "success.main" }} />}
          count={found.length}
          emptyText="Nothing handed in by you yet — thank you in advance!"
          newTo="/dashboard/found/new"
          newLabel="Report found item"
          kind="found"
          items={found}
          sx={{ mt: 5 }}
        />

        <Box sx={{ mt: 5 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
            <Stack direction="row" alignItems="center" gap={1.5}>
              <GavelIcon sx={{ color: "primary.main" }} />
              <Typography variant="h5" sx={{ fontWeight: 800 }}>
                My Claims {claims.length > 0 && <span style={{ color: "var(--text-muted)" }}>({claims.length})</span>}
              </Typography>
            </Stack>
            {claims.length > 0 && (
              <Button size="small" component={RouterLink} to="/dashboard/claims" sx={{ fontWeight: 700 }}>
                View all →
              </Button>
            )}
          </Box>
          {claims.length === 0 ? (
            <Paper className="glass-panel" sx={{ p: 3.5, backgroundImage: "none", borderRadius: "16px" }}>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                No claims yet — spot something of yours on the <Link component={RouterLink} to="/browse?tab=found" sx={{ fontWeight: 700 }}>found board</Link> and submit a claim.
              </Typography>
            </Paper>
          ) : (
            <Stack spacing={2}>
              {claims.slice(0, 3).map((c) => (
                <ClaimCard key={c.claim_id} claim={c} />
              ))}
            </Stack>
          )}
        </Box>
      </Box>
    );
  }

  const meta = META[tab];

  if (tab === "claims") {
    return (
      <Box>
        <SectionHeader meta={meta} />
        {buckets.claims.length === 0 ? (
          <EmptyState meta={meta} title="No claims yet" text="Found something of yours on the board? Submit an ownership claim and track it here." />
        ) : (
          <Stack spacing={2}>
            {buckets.claims.map((c) => (
              <ClaimCard key={c.claim_id} claim={c} />
            ))}
          </Stack>
        )}
      </Box>
    );
  }

  const items = (tab === "lost" ? buckets.lost : buckets.found) as unknown as Array<LostItem & FoundItem>;
  return (
    <Box>
      <SectionHeader meta={meta} />
      {items.length === 0 ? (
        <EmptyState
          meta={meta}
          title="Nothing here yet"
          text={
            tab === "lost"
              ? "Report a lost item and it will show up here — the sooner it's listed, the sooner it can be matched."
              : "Handed something in? Log it here so its owner can find and claim it."
          }
        />
      ) : (
        <Grid container spacing={2.5}>
          {items.map((item, i) => (
            <Grid item xs={12} sm={6} md={4} key={item.lost_id ?? item.found_id}>
              <ItemCard
                item={{
                  id: (tab === "lost" ? item.lost_id : item.found_id) ?? "",
                  item_name: item.item_name,
                  category: item.category,
                  description: item.description,
                  location: item.location,
                  date: (tab === "lost" ? item.date_lost : item.date_found) ?? "",
                  image_url: item.image_url,
                  status: item.status,
                  kind: tab,
                }}
                index={i}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}

/* ------------------------------ sections ------------------------------ */

function SectionHeader({ meta }: { meta: SectionMeta }) {
  const navigate = useNavigate();
  return (
    <>
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2, flexWrap: "wrap", mb: 0.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          {meta.icon}
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            {meta.label}
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate(meta.newTo)} sx={{ borderRadius: "12px" }}>
          {meta.newLabel}
        </Button>
      </Box>
      <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
        {meta.blurb}
      </Typography>
    </>
  );
}

function ItemsSection({
  title, icon, count, emptyText, newTo, newLabel, kind, items, sx,
}: {
  title: string;
  icon: React.ReactNode;
  count: number;
  emptyText: string;
  newTo: string;
  newLabel: string;
  kind: "lost" | "found";
  items: LostItem[] | FoundItem[];
  sx?: object;
}) {
  const navigate = useNavigate();
  const cast = items as unknown as Array<LostItem & FoundItem>;
  return (
    <Box sx={sx}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Stack direction="row" alignItems="center" gap={1.5}>
          {icon}
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            {title} {count > 0 && <span style={{ color: "var(--text-muted)" }}>({count})</span>}
          </Typography>
        </Stack>
        <Button size="small" startIcon={<AddIcon />} onClick={() => navigate(newTo)} sx={{ fontWeight: 700 }}>
          {newLabel}
        </Button>
      </Box>
      {items.length === 0 ? (
        <Paper className="glass-panel" sx={{ p: 3.5, backgroundImage: "none", borderRadius: "16px" }}>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {emptyText}
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={2.5}>
          {cast.map((item, i) => (
            <Grid item xs={12} sm={6} md={4} key={item.lost_id ?? item.found_id}>
              <ItemCard
                item={{
                  id: (kind === "lost" ? item.lost_id : item.found_id) ?? "",
                  item_name: item.item_name,
                  category: item.category,
                  description: item.description,
                  location: item.location,
                  date: (kind === "lost" ? item.date_lost : item.date_found) ?? "",
                  image_url: item.image_url,
                  status: item.status,
                  kind,
                }}
                index={i}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}

function ClaimCard({ claim: c }: { claim: Claim }) {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <Paper className="glass-panel" sx={{ p: { xs: 2, md: 2.5 }, backgroundImage: "none", borderRadius: "16px" }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1.5} flexWrap="wrap">
          <Box>
            <Typography sx={{ fontWeight: 800 }}>{c.found_item.item_name}</Typography>
            <Stack direction="row" gap={1} sx={{ mt: 0.5, flexWrap: "wrap" }}>
              <Chip size="small" label={c.found_item.category} variant="outlined" />
              <Chip size="small" label={c.found_item.location} variant="outlined" />
            </Stack>
          </Box>
          <ClaimStatusChip status={c.claim_status} />
        </Stack>
        <Divider sx={{ my: 1.5 }} />
        <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 0.5, fontWeight: 700 }}>
          YOUR PROOF
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          {c.proof_description}
        </Typography>
        {c.admin_notes && (
          <>
            <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 1.5, mb: 0.5, fontWeight: 700 }}>
              ADMIN NOTES
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {c.admin_notes}
            </Typography>
          </>
        )}
        <Box sx={{ mt: 1.5 }}>
          <Button size="small" component={RouterLink} to={`/items/found/${c.found_item.found_id}`} sx={{ fontWeight: 700 }}>
            View item →
          </Button>
        </Box>
      </Paper>
    </motion.div>
  );
}

function EmptyState({ meta, title, text }: { meta: SectionMeta; title: string; text: string }) {
  const navigate = useNavigate();
  return (
    <Paper className="glass-panel" sx={{ p: 6, textAlign: "center", backgroundImage: "none", borderRadius: "16px" }}>
      <SearchOffIcon sx={{ fontSize: 48, color: "text.secondary", mb: 1 }} />
      <Typography variant="h6" sx={{ fontWeight: 700 }}>{title}</Typography>
      <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5, mb: 2.5 }}>
        {text}
      </Typography>
      <Button variant="contained" onClick={() => navigate(meta.newTo)} sx={{ borderRadius: "12px" }}>
        {meta.newLabel}
      </Button>
    </Paper>
  );
}
