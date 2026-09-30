import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert, Box, Button, Chip, Grid, MenuItem, Paper, Stack, TextField, Typography,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUploadOutlined";
import SaveIcon from "@mui/icons-material/SaveOutlined";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api, getApiErrorMessage } from "../api/client";
import { useSnackbar } from "../contexts/SnackbarContext";
import { CATEGORIES } from "../types";

const schema = z.object({
  item_name: z.string().trim().min(2, "Item name must be at least 2 characters").max(100),
  category: z.string().min(1, "Select a category"),
  description: z.string().trim().max(2000, "Description too long").or(z.literal("")),
  location: z.string().trim().min(2, "Location is required").max(120),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a valid date"),
});

type FormData = z.infer<typeof schema>;

interface Props {
  kind: "lost" | "found";
}

export default function ItemFormPage({ kind }: Props) {
  const isEdit = Boolean(useParams<{ id: string }>().id);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { notify } = useSnackbar();
  const fileRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [apiError, setApiError] = useState("");
  const [removingImage, setRemovingImage] = useState(false);

  const {
    register: field,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: new Date().toISOString().slice(0, 10),
      category: "",
      description: "",
    },
  });

  useEffect(() => {
    if (!isEdit || !id) return;
    api
      .get(`/${kind === "lost" ? "lost-items" : "found-items"}/${id}`)
      .then((res) => {
        const it = res.data.item ?? res.data;
        reset({
          item_name: it.item_name,
          category: it.category,
          description: it.description ?? "",
          location: it.location,
          date: (kind === "lost" ? it.date_lost : it.date_found) ?? new Date().toISOString().slice(0, 10),
        });
        if (it.image_url) setPreview(it.image_url);
      })
      .catch(() => notify("Failed to load item for editing", "error"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEdit, kind]);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      notify("Image must be under 5 MB", "warning");
      return;
    }
    setImage(f);
    setPreview(URL.createObjectURL(f));
  };

  const clearImage = () => {
    setImage(null);
    setPreview(null);
    setRemovingImage(true);
    if (fileRef.current) fileRef.current.value = "";
  };

  const onSubmit = async (data: FormData) => {
    setApiError("");
    const fd = new FormData();
    fd.set("item_name", data.item_name);
    fd.set("category", data.category);
    fd.set("description", data.description);
    fd.set("location", data.location);
    if (kind === "lost") fd.set("date_lost", data.date);
    else fd.set("date_found", data.date);
    if (image) fd.set("image", image);
    if (isEdit && removingImage) fd.set("remove_image", "true");

    try {
      if (isEdit && id) {
        await api.put(`/${kind === "lost" ? "lost-items" : "found-items"}/${id}`, fd);
        notify("Item updated", "success");
        navigate(kind === "lost" ? `/items/lost/${id}` : `/items/found/${id}`);
      } else {
        const res = await api.post(`/${kind === "lost" ? "lost-items" : "found-items"}`, fd);
        const newId = (res.data.item as { lost_id?: string; found_id?: string })?.lost_id ?? res.data.item?.found_id;
        notify(kind === "lost" ? "Lost item reported" : "Found item reported", "success");
        navigate(newId ? (kind === "lost" ? `/items/lost/${newId}` : `/items/found/${newId}`) : "/dashboard");
      }
    } catch (err) {
      setApiError(getApiErrorMessage(err, "Could not save the item"));
    }
  };

  const label = kind === "lost" ? "Report Lost Item" : "Report Found Item";
  const dateLabel = kind === "lost" ? "Date lost" : "Date found";

  return (
    <Box sx={{ maxWidth: 760, mx: "auto" }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mb: 2, fontWeight: 700 }}>
        Back
      </Button>

      <Paper className="glass-panel" sx={{ p: { xs: 3, md: 4 }, backgroundImage: "none" }}>
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>
          {isEdit ? `Edit ${kind} item` : label}
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
          {kind === "lost"
            ? "Give as much detail as possible — it helps matchers find your item faster."
            : "Thanks for being honest! Describe the item so the owner can identify it."}
        </Typography>

        {apiError && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{apiError}</Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={7}>
              <TextField
                label="Item name"
                fullWidth
                error={!!errors.item_name}
                helperText={errors.item_name?.message}
                {...field("item_name")}
              />
            </Grid>
            <Grid item xs={12} sm={5}>
              <TextField
                select
                label="Category"
                fullWidth
                defaultValue=""
                error={!!errors.category}
                helperText={errors.category?.message}
                {...field("category")}
              >
                {CATEGORIES.map((c) => (
                  <MenuItem key={c} value={c}>{c}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                fullWidth
                multiline
                minRows={3}
                placeholder="Brand, color, distinguishing marks, contents…"
                error={!!errors.description}
                helperText={errors.description?.message}
                {...field("description")}
              />
            </Grid>
            <Grid item xs={12} sm={7}>
              <TextField
                label="Location"
                fullWidth
                placeholder="e.g. Central Library, 2nd floor"
                error={!!errors.location}
                helperText={errors.location?.message}
                {...field("location")}
              />
            </Grid>
            <Grid item xs={12} sm={5}>
              <TextField
                type="date"
                label={dateLabel}
                fullWidth
                InputLabelProps={{ shrink: true }}
                error={!!errors.date}
                helperText={errors.date?.message}
                {...field("date")}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Photo (optional)</Typography>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden onChange={onPick} />
              {preview ? (
                <Box sx={{ position: "relative", width: 200 }}>
                  <img
                    src={preview}
                    alt="Preview"
                    style={{ width: 200, height: 140, objectFit: "cover", borderRadius: 12, border: "1px solid var(--surface-border)" }}
                  />
                  <Chip
                    size="small"
                    label="Remove"
                    color="error"
                    onDelete={clearImage}
                    sx={{ position: "absolute", top: 6, right: 6 }}
                  />
                </Box>
              ) : (
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<CloudUploadIcon />}
                  onClick={() => fileRef.current?.click()}
                  sx={{ py: 1.5, borderStyle: "dashed", width: "100%", maxWidth: 320 }}
                >
                  Upload an image
                </Button>
              )}
            </Grid>

            <Grid item xs={12}>
              <Stack direction="row" gap={1.5} justifyContent="flex-end">
                <Button variant="text" onClick={() => navigate(-1)}>Cancel</Button>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={isSubmitting}
                  startIcon={<SaveIcon />}
                  sx={{ borderRadius: "12px", px: 4 }}
                >
                  {isSubmitting ? "Saving…" : isEdit ? "Save changes" : "Submit report"}
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
}
