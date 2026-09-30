import type { Prisma } from "@prisma/client";

export type ItemFilters = {
  q: string;
  category: string;
  location: string;
  status: string;
  dateFrom: string;
  dateTo: string;
  mine: boolean;
  user_id: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
  page: number;
  limit: number;
};

export type ClaimFilters = {
  status: string;
  found_id: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
  page: number;
  limit: number;
};

const CATEGORIES = [
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
];

const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isoDateRe = /^\d{4}-\d{2}-\d{2}$/;

/** Parses and sanitizes list/search query parameters shared by items endpoints. */
export function parseItemFilters(query: Record<string, unknown>): ItemFilters {
  const str = (v: unknown, max = 120): string =>
    typeof v === "string" ? v.trim().slice(0, max) : "";

  const page = Math.max(1, parseIntSafe(query.page as string, 1));
  const rawLimit = parseIntSafe(query.limit as string, 12);
  const limit = Math.min(50, Math.max(1, rawLimit));

  const sortMap: Record<string, string> = {
    created_at: "created_at",
    date: "date",
    name: "item_name",
    category: "category",
    location: "location",
    status: "status",
  };
  const sortBy = sortMap[String(query.sort_by ?? "created_at")] ?? "created_at";
  const sortOrder: "asc" | "desc" = String(query.sort_order ?? "desc").toLowerCase() === "asc" ? "asc" : "desc";

  const status = ["ACTIVE", "RECOVERED"].includes(String(query.status)) ? String(query.status) : "";
  const category = CATEGORIES.includes(String(query.category)) ? String(query.category) : "";

  return {
    q: str(query.q),
    category,
    location: str(query.location),
    status,
    dateFrom: isoDateRe.test(String(query.date_from ?? "")) ? String(query.date_from) : "",
    dateTo: isoDateRe.test(String(query.date_to ?? "")) ? String(query.date_to) : "",
    mine: query.mine === "true" || query.mine === true,
    user_id: typeof query.user_id === "string" && uuidRe.test(query.user_id) ? query.user_id : "",
    sortBy,
    sortOrder,
    page,
    limit,
  };
}

/** Parses claim list filters (admin sees all, users see own). */
export function parseClaimFilters(query: Record<string, unknown>): ClaimFilters {
  const page = Math.max(1, parseIntSafe(query.page as string, 1));
  const rawLimit = parseIntSafe(query.limit as string, 12);
  const limit = Math.min(50, Math.max(1, rawLimit));

  const sortMap: Record<string, string> = {
    created_at: "created_at",
    claim_date: "claim_date",
    status: "claim_status",
  };
  const sortBy = sortMap[String(query.sort_by ?? "created_at")] ?? "created_at";
  const sortOrder: "asc" | "desc" = String(query.sort_order ?? "desc").toLowerCase() === "asc" ? "asc" : "desc";

  return {
    status: ["PENDING", "APPROVED", "REJECTED"].includes(String(query.status)) ? String(query.status) : "",
    found_id: typeof query.found_id === "string" && uuidRe.test(query.found_id) ? query.found_id : "",
    sortBy,
    sortOrder,
    page,
    limit,
  };
}

function parseIntSafe(v: unknown, fallback: number): number {
  const n = Number.parseInt(String(v ?? ""), 10);
  return Number.isNaN(n) ? fallback : n;
}

/** Builds the Prisma WHERE for lost/found item listing + search. */
export function buildItemWhere(f: ItemFilters, kind: "lost"): Prisma.lost_itemsWhereInput;
export function buildItemWhere(f: ItemFilters, kind: "found"): Prisma.found_itemsWhereInput;
export function buildItemWhere(
  f: ItemFilters,
  kind: "lost" | "found"
): Prisma.lost_itemsWhereInput | Prisma.found_itemsWhereInput {
  const dateField = kind === "lost" ? "date_lost" : "date_found";

  const where: Record<string, unknown> = {};

  if (f.mine && f.user_id) where.user_id = f.user_id;

  if (f.q) {
    where.OR = [
      { item_name: { contains: f.q, mode: "insensitive" } },
      { description: { contains: f.q, mode: "insensitive" } },
      { location: { contains: f.q, mode: "insensitive" } },
    ];
  }
  if (f.category) where.category = f.category;
  if (f.location) {
    where.location = { contains: f.location, mode: "insensitive" };
  }
  if (f.status) where.status = f.status;

  const dateCond: Record<string, Date> = {};
  if (f.dateFrom) dateCond.gte = new Date(`${f.dateFrom}T00:00:00Z`);
  if (f.dateTo) dateCond.lte = new Date(`${f.dateTo}T23:59:59Z`);
  if (Object.keys(dateCond).length) where[dateField] = dateCond;

  return kind === "lost"
    ? (where as Prisma.lost_itemsWhereInput)
    : (where as Prisma.found_itemsWhereInput);
}

/** Builds the Prisma WHERE for claims listing, enforcing visibility scope. */
export function buildClaimWhere(f: ClaimFilters, requester: { user_id: string; role: "USER" | "ADMIN" }): Prisma.claimsWhereInput {
  const where: Record<string, unknown> = {};

  if (requester.role === "ADMIN") {
    if (f.status) where.claim_status = f.status;
    if (f.found_id) where.found_id = f.found_id;
  } else {
    // Regular users see claims they submitted plus claims on items they found.
    where.OR = [
      { user_id: requester.user_id },
      { found: { user_id: requester.user_id } },
    ];
    if (f.status) where.claim_status = f.status;
    if (f.found_id) where.found_id = f.found_id;
  }

  return where as Prisma.claimsWhereInput;
}
