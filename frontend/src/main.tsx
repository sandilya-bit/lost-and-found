import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { themes } from "./theme";
import { AuthProvider } from "./contexts/AuthContext";
import { SnackbarProvider } from "./contexts/SnackbarContext";
import { ThemeModeProvider, useThemeMode } from "./contexts/ThemeModeContext";
import PublicLayout from "./layouts/PublicLayout";
import DashboardLayout from "./layouts/DashboardLayout";
import AboutPage from "./pages/AboutPage";
import BrowsePage from "./pages/BrowsePage";
import ClaimSubmissionPage from "./pages/ClaimSubmissionPage";
import HomePage from "./pages/HomePage";
import ItemDetailPage from "./pages/ItemDetailPage";
import ItemFormPage from "./pages/ItemFormPage";
import LoginPage from "./pages/LoginPage";
import MyItemsPage from "./pages/MyItemsPage";
import NotFoundPage from "./pages/NotFoundPage";
import RegisterPage from "./pages/RegisterPage";
import "./styles/global.css";

function App() {
  const { mode } = useThemeMode();

  return (
    <ThemeProvider theme={themes[mode]}>
      <CssBaseline />
      <HashRouter>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route index element={<HomePage />} />
            <Route path="browse" element={<BrowsePage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="items/lost/:id" element={<ItemDetailPage kind="lost" />} />
            <Route path="items/found/:id" element={<ItemDetailPage kind="found" />} />
            <Route path="items/found/:id/claim" element={<ClaimSubmissionPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<MyItemsPage tab="all" />} />
            <Route path="lost" element={<MyItemsPage tab="lost" />} />
            <Route path="found" element={<MyItemsPage tab="found" />} />
            <Route path="claims" element={<MyItemsPage tab="claims" />} />
            <Route path="lost/new" element={<ItemFormPage kind="lost" />} />
            <Route path="found/new" element={<ItemFormPage kind="found" />} />
            <Route path="lost/:id/edit" element={<ItemFormPage kind="lost" />} />
            <Route path="found/:id/edit" element={<ItemFormPage kind="found" />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </ThemeProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeModeProvider>
      <AuthProvider>
        <SnackbarProvider>
          <App />
        </SnackbarProvider>
      </AuthProvider>
    </ThemeModeProvider>
  </React.StrictMode>
);