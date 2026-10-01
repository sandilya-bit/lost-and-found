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
import LoginIcon from "@mui/icons-material/LoginOutlined";
import BoltIcon from "@mui/icons-material/BoltOutlined";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { useAuth, getApiErrorMessage } from "../contexts/AuthContext";
import { useSnackbar } from "../contexts/SnackbarContext";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type FormData = z.infer<typeof schema>;

/** One-click demo account (seeded by `backend/prisma/seed.ts`). */
const DEMO_ACCOUNT = {
  label: "Demo user",
  email: "demo@lostfound.io",
  password: "Demo@1234",
  icon: <BoltIcon sx={{ fontSize: 18 }} />,
};

export default function LoginPage() {
  const { login } = useAuth();
  const { notify } = useSnackbar();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState("");

  const {
    register: field,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const fillDemo = () => {
    setValue("email", DEMO_ACCOUNT.email, { shouldValidate: true });
    setValue("password", DEMO_ACCOUNT.password, { shouldValidate: true });
    setApiError("");
  };

  const quickLogin = async () => {
    setApiError("");
    try {
      await login(DEMO_ACCOUNT.email, DEMO_ACCOUNT.password);
      notify(`Signed in as ${DEMO_ACCOUNT.label}`, "success");
      navigate("/dashboard");
    } catch (err) {
      setApiError(getApiErrorMessage(err, "Login failed. Please check your credentials."));
    }
  };

  const onSubmit = async (data: FormData) => {
    setApiError("");
    try {
      await login(data.email, data.password);
      notify("Welcome back!", "success");
      navigate("/dashboard");
    } catch (err) {
      setApiError(getApiErrorMessage(err, "Login failed. Please check your credentials."));
    }
  };

  return (
    <Box sx={{ display: "grid", placeItems: "center", py: { xs: 6, md: 10 }, px: 2 }}>
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Paper className="glass-panel" sx={{ p: { xs: 3, md: 5 }, width: "100%", maxWidth: 440 }}>
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
                background: `linear-gradient(135deg, ${t.palette.primary.main}, ${t.palette.secondary.main})`,
                color: "#fff",
                boxShadow: t.shadows[6],
              })}
            >
              <LoginIcon />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              Welcome back
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
              Sign in to report items and track your claims
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
                label="Email"
                type="email"
                fullWidth
                autoComplete="email"
                error={!!errors.email}
                helperText={errors.email?.message}
                {...field("email")}
              />
              <TextField
                label="Password"
                type={showPassword ? "text" : "password"}
                fullWidth
                autoComplete="current-password"
                error={!!errors.password}
                helperText={errors.password?.message}
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
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={isSubmitting}
                sx={{ py: 1.25, borderRadius: "12px", fontSize: "1rem" }}
              >
                {isSubmitting ? "Signing in…" : "Sign in"}
              </Button>
            </Stack>
          </form>

          {/* ------- One-click demo accounts ------- */}
          <Box
            sx={(t) => ({
              mt: 3,
              p: 1.75,
              borderRadius: "14px",
              border: `1px dashed ${t.palette.divider}`,
              bgcolor: (tt) => (tt.palette.mode === "dark" ? "rgba(148,163,184,0.05)" : "rgba(15,23,42,0.025)"),
            })}
          >
            <Typography
              variant="overline"
              sx={(t) => ({ display: "block", textAlign: "center", color: t.palette.text.secondary, letterSpacing: "0.16em", mb: 1 })}
            >
              Try the portal instantly
            </Typography>
            <Stack direction="row" spacing={1.25} justifyContent="center" flexWrap="wrap">
              <Button
                size="small"
                variant="outlined"
                startIcon={DEMO_ACCOUNT.icon}
                disabled={isSubmitting}
                onClick={() => void quickLogin()}
                sx={(t) => ({
                  borderRadius: "10px",
                  fontWeight: 700,
                  borderColor: t.palette.divider,
                  "&:hover": { borderColor: t.palette.primary.main, bgcolor: `${t.palette.primary.main}0d` },
                })}
              >
                Sign in as {DEMO_ACCOUNT.label}
              </Button>
              <Button
                size="small"
                variant="text"
                disabled={isSubmitting}
                onClick={() => fillDemo()}
                sx={{ borderRadius: "10px", fontWeight: 700 }}
              >
                Fill credentials
              </Button>
            </Stack>
            <Typography variant="caption" sx={(t) => ({ display: "block", textAlign: "center", mt: 1, color: t.palette.text.secondary })}>
              Demo account: demo@lostfound.io / Demo@1234
            </Typography>
          </Box>

          <Typography variant="body2" sx={{ textAlign: "center", mt: 3, color: "text.secondary" }}>
            New here?{" "}
            <Link component={RouterLink} to="/register" sx={{ fontWeight: 700 }}>
              Create an account
            </Link>
          </Typography>
        </Paper>
      </motion.div>
    </Box>
  );
}
