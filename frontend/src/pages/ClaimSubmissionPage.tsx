import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert, Box, Button, Chip, Divider, Paper, Stack, TextField, Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import GavelIcon from "@mui/icons-material/GavelOutlined";
import CloudUploadIcon from "@mui/icons-material/CloudUploadOutlined";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api, getApiErrorMessage } from "../api/client";
import { useSnackbar } from "../contexts/SnackbarContext";

const schema = z.object({
  proof_description: z
    .string()
    .trim()
    .min(20, "Describe your proof in at least 20 characters — this helps admins verify you")
    .max(2000),
});

type FormData = z.infer<typeof schema>;

interface FoundItemPayload {
  item: {
    found_id: string;
    item_name: string;
    category: string;
    location: string;
    date_found: string;
    image_url: string | null;
    status: "ACTIVE" | "RECOVERED";
  };
}

export default function ClaimSubmissionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { notify } = useSnackbar();
  const fileRef = useRef<HTMLInputElement>(null);
  const [proof, setProof] = useState<File | null>(null);
  const [item, setItem] = useState<FoundItemPayload["item"] | null>(null);
  const [apiError, setApiError] = useState("");

  const {
    register: field,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!id) return;
    api
      .get<FoundItemPayload>(`/found-items/${id}`)
      .then((res) => setItem(res.data.item ?? (res.data as unknown as FoundItemPayload["item"])))
      .catch(() => notify("Failed to load item details", "error"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const onSubmit = async (data: FormData) => {
    setApiError("");
    const fd = new FormData();
    fd.set("found_id", id ?? "");
    fd.set("proof_description", data.proof_description);
    if (proof) fd.set("proof_image", proof);
    try {
      await api.post("/claims", fd);
      notify("Claim submitted! Track its status in My Claims.", "success");
      navigate("/dashboard/claims");
    } catch (err) {
      setApiError(getApiErrorMessage(err, "Could not submit the claim"));
    }
  };

  if (!item) {
    return (
      <Box sx={{ maxWidth: 680, mx: "auto" }}>
        <div className="skeleton" style={{ height: 300, borderRadius: 16 }} />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 680, mx: "auto" }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mb: 2, fontWeight: 700 }}>
        Back to item
      </Button>

      <Paper className="glass-panel" sx={{ p: { xs: 3, md: 4 }, backgroundImage: "none" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
          <GavelIcon sx={{ color: "primary.main" }} />
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            Submit Ownership Claim
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
          An admin will review your claim against the finder&apos;s report. Approved claims result in
          the item being returned to you.
        </Typography>

        {/* Item summary */}
        <Stack direction="row" gap={2} sx={{ mb: 3, p: 1.5, borderRadius: 3, bgcolor: (t) => (t.palette.mode === "dark" ? "rgba(148,163,184,0.06)" : "rgba(15,23,42,0.03)") }}>
          {item.image_url ? (
            <img src={item.image_url} alt={item.item_name} style={{ width: 84, height: 84, borderRadius: 12, objectFit: "cover" }} />
          ) : (
            <Box sx={{ width: 84, height: 84, borderRadius: 3, display: "grid", placeItems: "center", fontSize: "2rem", bgcolor: "action.hover" }}>
              📦
            </Box>
          )}
          <Box>
            <Typography sx={{ fontWeight: 700 }}>{item.item_name}</Typography>
            <Stack direction="row" gap={1} sx={{ mt: 0.5 }}>
              <Chip size="small" label={item.category} variant="outlined" />
              <Chip size="small" label={item.location} variant="outlined" />
            </Stack>
          </Box>
        </Stack>

        {item.status !== "ACTIVE" && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            This item is no longer accepting claims — it has already been returned.
          </Alert>
        )}
        {apiError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{apiError}</Alert>}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
            Proof of ownership <span style={{ color: "var(--danger)" }}>*</span>
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={5}
            placeholder="Describe identifying details only the owner would know: color, scratches, contents, serial numbers, engravings, photos on the device…"
            error={!!errors.proof_description}
            helperText={errors.proof_description?.message}
            {...field("proof_description")}
          />

          <Divider sx={{ my: 2.5 }} />

          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
            Supporting image (optional)
          </Typography>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            hidden
            onChange={(e) => setProof(e.target.files?.[0] ?? null)}
          />
          {proof ? (
            <Stack direction="row" alignItems="center" gap={2}>
              <img
                src={URL.createObjectURL(proof)}
                alt="Proof preview"
                style={{ width: 120, height: 84, objectFit: "cover", borderRadius: 10 }}
              />
              <Button size="small" onClick={() => { setProof(null); if (fileRef.current) fileRef.current.value = ""; }}>
                Remove
              </Button>
            </Stack>
          ) : (
            <Button
              variant="outlined"
              startIcon={<CloudUploadIcon />}
              onClick={() => fileRef.current?.click()}
              sx={{ borderStyle: "dashed", py: 1.5 }}
            >
              Upload a photo of you with the item (if available)
            </Button>
          )}

          <Stack direction="row" gap={1.5} justifyContent="flex-end" sx={{ mt: 3 }}>
            <Button variant="text" onClick={() => navigate(-1)}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={isSubmitting || item.status !== "ACTIVE"}
              startIcon={<GavelIcon />}
              sx={{ borderRadius: "12px", px: 4 }}
            >
              {isSubmitting ? "Submitting…" : "Submit claim"}
            </Button>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
}
