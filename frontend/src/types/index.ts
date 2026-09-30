/* Shared API/domain types for the frontend. */

export type Role = "USER" | "ADMIN";
export type ItemStatus = "ACTIVE" | "RECOVERED";
export type ClaimStatus = "PENDING" | "APPROVED" | "REJECTED";

export const CATEGORIES = [
  "Electronics",
  "Wallet",
  "Keys",
  "Bags",
  "Documents",
  "Jewelry",
  "Clothing",
  "Books",
  "ID Cards",
  "Water Bottles",
  "Sports Equipment",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export interface User {
  user_id: string;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  created_at: string;
  updated_at?: string;
}

export interface UserWithCounts extends User {
  lost_items: number;
  found_items: number;
  claims: number;
}

export interface Reporter {
  user_id: string;
  name: string;
  email: string;
  phone: string | null;
}

export interface LostItem {
  lost_id: string;
  user_id: string;
  item_name: string;
  category: string;
  description: string | null;
  location: string;
  date_lost: string;
  image_url: string | null;
  status: ItemStatus;
  created_at: string;
  reporter?: Reporter;
  claim_count?: number;
}

export interface FoundItem {
  found_id: string;
  user_id: string;
  item_name: string;
  category: string;
  description: string | null;
  location: string;
  date_found: string;
  image_url: string | null;
  status: ItemStatus;
  created_at: string;
  reporter?: Reporter;
  claim_count?: number;
}

export interface Claim {
  claim_id: string;
  claim_date: string;
  proof_description: string;
  proof_image_url: string | null;
  claim_status: ClaimStatus;
  admin_notes: string | null;
  created_at: string;
  user: Reporter;
  found_item: {
    found_id: string;
    item_name: string;
    category: string;
    location: string;
    date_found: string;
    image_url: string | null;
    status: ItemStatus;
    reporter: { user_id: string; name: string; email: string };
  };
}

export interface LostItemListResponse {
  items: LostItem[];
  total: number;
  page: number;
  pages: number;
}

export interface FoundItemListResponse {
  items: FoundItem[];
  total: number;
  page: number;
  pages: number;
}

export interface ClaimListResponse {
  claims: Claim[];
  total: number;
  page: number;
  pages: number;
}

export interface PublicStats {
  stats: {
    lost_total: number;
    lost_recovered: number;
    found_total: number;
    found_recovered: number;
    users: number;
    approved_claims: number;
    recovery_rate: number;
  };
  recent_found: FoundItem[];
}

export interface DashboardStats {
  total_lost: number;
  total_found: number;
  active_claims: number;
  returned_items: number;
  pending_review: number;
}

export interface AdminStats {
  total_users: number;
  total_lost: number;
  total_found: number;
  total_claims: number;
  pending_claims: number;
  approved_claims: number;
  rejected_claims: number;
  returned_items: number;
  last_7_days: { new_users: number; new_lost: number; new_found: number };
  lost_by_category: Array<{ category: string; count: number }>;
}

export interface MatchSuggestion {
  found_id: string;
  item_name: string;
  location: string;
  category: string;
  date_found: string;
  score: number;
}
