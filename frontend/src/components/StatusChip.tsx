import { Chip } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import CancelIcon from "@mui/icons-material/Cancel";
import CircleIcon from "@mui/icons-material/Circle";

const ITEM_STATUS_CONFIG: Record<string, { label: string; color: "success" | "info"; icon: React.ReactElement }> = {
  ACTIVE: { label: "Active", color: "info", icon: <CircleIcon sx={{ fontSize: 10 }} /> },
  RECOVERED: { label: "Returned", color: "success", icon: <CheckCircleIcon sx={{ fontSize: 16 }} /> },
};

const CLAIM_STATUS_CONFIG: Record<string, { label: string; color: "warning" | "success" | "error"; icon: React.ReactElement }> = {
  PENDING: { label: "Pending", color: "warning", icon: <HourglassTopIcon sx={{ fontSize: 16 }} /> },
  APPROVED: { label: "Approved", color: "success", icon: <CheckCircleIcon sx={{ fontSize: 16 }} /> },
  REJECTED: { label: "Rejected", color: "error", icon: <CancelIcon sx={{ fontSize: 16 }} /> },
};

export function ItemStatusChip({ status }: { status: string }) {
  const cfg = ITEM_STATUS_CONFIG[status] ?? ITEM_STATUS_CONFIG.ACTIVE;
  return <Chip size="small" label={cfg.label} color={cfg.color} icon={cfg.icon} sx={{ fontWeight: 700 }} />;
}

export function ClaimStatusChip({ status }: { status: string }) {
  const cfg = CLAIM_STATUS_CONFIG[status] ?? CLAIM_STATUS_CONFIG.PENDING;
  return <Chip size="small" label={cfg.label} color={cfg.color} icon={cfg.icon} sx={{ fontWeight: 700 }} />;
}
