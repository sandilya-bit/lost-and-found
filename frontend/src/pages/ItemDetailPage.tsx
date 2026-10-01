import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert, Box, Button, Chip, Container, Dialog, DialogActions, DialogContent, DialogContentText,
  DialogTitle, Divider, Grid, Paper, Stack, Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LocationOnIcon from "@mui/icons-material/LocationOnOutlined";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonthOutlined";
import PersonIcon from "@mui/icons-material/PersonOutlined";
import EditIcon from "@mui/icons-material/EditOutlined";
import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import GavelIcon from "@mui/icons-material/GavelOutlined";
import { api, getApiErrorMessage } from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import { useSnackbar } from "../contexts/SnackbarContext";
import { ItemStatusChip } from "../components/StatusChip";

interface ItemPayload {
  item: {
    lost_id?: string;
    found_id?: string;
    user_id: string;
    item_name: string;
    category: string;
    description: string | null;
    location: string;
    date_lost?: string;
    date_found?: string;
    image_url: string | null;
    status: "ACTIVE" | "RECOVERED";
    created_at: string;
    reporter?: { name: string; email: string; phone: string | null };
  };
}

export default function ItemDetailPage({ kind }: { kind: "lost" | "found" }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notify } = useSnackbar();
  const [item, setItem] = useState<ItemPayload["item"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.get<ItemPayload>(`/${kind === "lost" ? "lost-items" : "found-items"}/${id}`);
      setItem(res.data.item ?? (res.data as unknown as ItemPayload["item"]));
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load item"));
    } finally {
      setLoading(false);
    }
  }, [id, kind]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDelete = async () => {
    try {
      await api.delete(`/${kind === "lost" ? "lost-items" : "found-items"}/${id}`);
      notify("Item deleted", "success");
      navigate("/dashboard");
    } catch (err) {
      notify(getApiErrorMessage(err), "error");
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <div className="skeleton" style={{ height: 380, borderRadius: 16 }} />
      </Container>
    );
  }

  if (error || !item) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Alert severity="error">{error || "Item not found"}</Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mt: 2 }}>
          Go back
        </Button>
      </Container>
    );
  }

  const isOwner = user?.user_id === item.user_id;
  const dateLabel = kind === "lost" ? "Date lost" : "Date found";
  const dateValue = (kind === "lost" ? item.date_lost : item.date_found) ?? "";

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mb: 2, fontWeight: 700 }}>
        Back
      </Button>

      <Paper className="glass-panel" sx={{ overflow: "hidden", backgroundImage: "none" }}>
        <Box sx={{ position: "relative", pt: "42%", bgcolor: "background.paper" }}>
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.item_name}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <Box
              sx={(t) => ({
                position: "absolute",
                inset: 0,
                display: "grid",
                placeItems: "center",
                fontSize: "5rem",
                background: `linear-gradient(135deg, ${t.palette.primary.main}18, ${t.palette.secondary.main}18)`,
              })}
            >
              📦
            </Box>
          )}
          <Box sx={{ position: "absolute", top: 12, left: 12 }}>
            <Chip
              label={kind === "lost" ? "LOST ITEM" : "FOUND ITEM"}
              sx={{
                fontWeight: 800,
                color: "#fff",
                background: kind === "lost" ? "error.main" : "success.main",
                bgcolor: kind === "lost" ? "error.main" : "success.main",
              }}
            />
          </Box>
        </Box>

        <Box sx={{ p: { xs: 2.5, md: 4 } }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2} flexWrap="wrap">
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              {item.item_name}
            </Typography>
            <ItemStatusChip status={item.status} />
          </Stack>

          <Stack direction="row" gap={2} flexWrap="wrap" sx={{ mt: 1.5, mb: 2 }}>
            <Chip label={item.category} variant="outlined" size="small" />
          </Stack>

          {item.description && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                Description
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", whiteSpace: "pre-wrap" }}>
                {item.description}
              </Typography>
            </>
          )}

          <Divider sx={{ my: 2 }} />

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <MetaRow icon={<LocationOnIcon fontSize="small" />} label="Location" value={item.location} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <MetaRow icon={<CalendarMonthIcon fontSize="small" />} label={dateLabel} value={formatDate(dateValue)} />
            </Grid>
            {item.reporter && (
              <Grid item xs={12}>
                <MetaRow
                  icon={<PersonIcon fontSize="small" />}
                  label="Reported by"
                  value={`${item.reporter.name}${item.reporter.phone ? ` · ${item.reporter.phone}` : ` · ${item.reporter.email}`}`}
                />
              </Grid>
            )}
          </Grid>

          <Divider sx={{ my: 2.5 }} />

          <Stack direction="row" gap={1.5} flexWrap="wrap">
            {kind === "found" && !isOwner && item.status === "ACTIVE" && (
              <Button
                variant="contained"
                size="large"
                startIcon={<GavelIcon />}
                onClick={() => navigate(`/items/found/${item.found_id}/claim`)}
                sx={{ borderRadius: "12px" }}
              >
                This is mine — Submit a claim
              </Button>
            )}
            {kind === "found" && !isOwner && item.status !== "ACTIVE" && (
              <Alert severity="info" sx={{ flexGrow: 1 }}>
                This item has already been returned to its owner.
              </Alert>
            )}
            {isOwner && (
              <>
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() =>
                    navigate(kind === "lost" ? `/dashboard/lost/${item.lost_id}/edit` : `/dashboard/found/${item.found_id}/edit`)
                  }
                >
                  Edit
                </Button>
                <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={() => setConfirmDelete(true)}>
                  Delete
                </Button>
              </>
            )}
          </Stack>
        </Box>
      </Paper>

      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)}>
        <DialogTitle sx={{ fontWeight: 700 }}>Delete this item?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            &quot;{item.item_name}&quot; will be permanently removed. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete permanently
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

function MetaRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Stack direction="row" spacing={1.25} alignItems="flex-start">
      <Box sx={{ color: "text.secondary", mt: "2px" }}>{icon}</Box>
      <Box>
        <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
          {label}
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {value}
        </Typography>
      </Box>
    </Stack>
  );
}

function formatDate(d: string): string {
  if (!d) return "—";
  const date = new Date(d.length === 10 ? `${d}T00:00:00` : d);
  return date.toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric" });
}
