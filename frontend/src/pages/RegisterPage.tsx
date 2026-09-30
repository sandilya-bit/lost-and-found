import { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  IconButton,
  InputAdornment,
  Link,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Visibility from "@mui/icons-material/VisibilityOutlined";
import VisibilityOff from "@mui/icons-material/VisibilityOffOutlined";
import PersonAddIcon from "@mui/icons-material/PersonAddAlt1Outlined";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { useAuth, getApiErrorMessage } from "../contexts/AuthContext";
import { useSnackbar } from "../contexts/SnackbarContext";

const schema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  email: z.string().trim().email("Enter a valid email address"),
  phone: z
    .string()
    .trim()
    .regex(/^[+]?[\d\s()-]{7,20}$/, "Enter a valid phone number (7–20 digits)")
    .or(z.literal("")),
  password: z
    .string()
    .min(8, "At least 8 characters")
    .regex(/[A-Za-z]/, "Must contain a letter")
    .regex(/\d/, "Must contain a number"),
  confirm: z.string(),
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const { notify } = useSnackbar();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState("");

  const {
    register: field,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setApiError("");
    if (data.password !== data.confirm) {
      setApiError("Passwords do not match");
      return;
    }
    try {
      await registerUser({ name: data.name, email: data.email, phone: data.phone || undefined, password: data.password });
      notify("Account created — welcome aboard!", "success");
      navigate("/dashboard");
    } catch (err) {
      setApiError(getApiErrorMessage(err, "Registration failed. Please try again."));
    }
  };

  return (
    <Box sx={{ display: "grid", placeItems: "center", py: { xs: 6, md: 10 }, px: 2 }}>
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Paper className="glass-panel" sx={{ p: { xs: 3, md: 5 }, width: "100%", maxWidth: 480 }}>
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <Box
              aria-hidden="true"
              sx={(t) => ({
                width: 56,
                height: 56,
                borderRadius: "16px",
                mx: "auto",
                mb: 1.5,
                display: "grid",
                placeItems: "center",
                background: `linear-gradient(135deg, ${t.palette.secondary.main}, ${t.palette.primary.main})`,
                color: "#fff",
                boxShadow: t.shadows[6],
              })}
            >
              <PersonAddIcon />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              Create your account
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
              Join the portal to report and recover lost items
            </Typography>
          </Box>

          {apiError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {apiError}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <Stack spacing={2}>
              <TextField
                label="Full name"
                fullWidth
                autoComplete="name"
                error={!!errors.name}
                helperText={errors.name?.message}
                {...field("name")}
              />
              <TextField
                label="Email"
                type="email"
                fullWidth
                autoComplete="email"
                error={!!errors.email}
                helperText={errors.email?.message}
                {...field("email")}
              />
              <TextField
                label="Phone (optional)"
                fullWidth
                autoComplete="tel"
                error={!!errors.phone}
                helperText={errors.phone?.message}
                {...field("phone")}
              />
              <TextField
                label="Password"
                type={showPassword ? "text" : "password"}
                fullWidth
                autoComplete="new-password"
                error={!!errors.password}
                helperText={errors.password?.message ?? "Minimum 8 characters with letters and numbers"}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword((v) => !v)} edge="end" aria-label="Toggle password visibility">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                {...field("password")}
              />
              <TextField
                label="Confirm password"
                type="password"
                fullWidth
                autoComplete="new-password"
                error={!!errors.confirm}
                helperText={errors.confirm?.message}
                {...field("confirm")}
              />
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={isSubmitting}
                sx={{ py: 1.25, borderRadius: "12px", fontSize: "1rem" }}
              >
                {isSubmitting ? "Creating account…" : "Create account"}
              </Button>
            </Stack>
          </form>

          <Typography variant="body2" sx={{ textAlign: "center", mt: 3, color: "text.secondary" }}>
            Already registered?{" "}
            <Link component={RouterLink} to="/login" sx={{ fontWeight: 700 }}>
              Sign in
            </Link>
          </Typography>
        </Paper>
      </motion.div>
    </Box>
  );
}
