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

export default function LoginPage() {
  const { login } = useAuth();
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
