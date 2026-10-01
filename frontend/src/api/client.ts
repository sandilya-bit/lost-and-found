/**
 * In-browser mock backend — this app is a fully self-contained prototype.
 *
 * Every call site (`api.get/post/put/delete`) is served from a fake database
 * in localStorage (see mockData.ts) using the exact response shapes the pages
 * expect. No server, no network: sign in, create, edit, delete and claim —
 * all state persists per browser. Errors surface as real AxiosErrors so the
 * existing `getApiErrorMessage` handling keeps working.
 */

import axios, { AxiosError, type AxiosRequestConfig } from "axios";
import type { FoundItem, LostItem, PublicStats, Role } from "../types";
import {
  loadDb,
  resetDb,
  saveDb,
  toReporter,
  uid,
  withoutPassword,
  type MockClaim,
  type MockUser,
} from "./mockData";

export interface ApiError {
  code: string;
  message: string;
}

const STORAGE = {
  access: "lf_access_token",
  refresh: "lf_refresh_token",
};

/* ------------------------------ tokens -------------------------------- */

export const tokenStore = {
  getAccess(): string | null {
    return localStorage.getItem(STORAGE.access);
  },
  getRefresh(): string | null {
    return localStorage.getItem(STORAGE.refresh);
  },
  set(access: string, refresh: string): void {
    localStorage.setItem(STORAGE.access, access);
    localStorage.setItem(STORAGE.refresh, refresh);
  },
  clear(): void {
    localStorage.removeItem(STORAGE.access);
    localStorage.removeItem(STORAGE.refresh);
  },
};

/* --------------------------- error helpers ---------------------------- */

function makeError(status: number, code: string, message: string): AxiosError {
  return new AxiosError(message, code, undefined, undefined, {
    status,
    statusText: code,
    data: { error: { code, message } },
  } as unknown as AxiosError["response"]);
}

function fail(status: number, code: string, message: string): never {
  throw makeError(status, code, message);
}

/* ------------------------- session management ------------------------- */

const authAttempts = new Map<string, number[]>();
const AUTH_LIMIT = 20;
const AUTH_WINDOW_MS = 15 * 60 * 1000;

function userFromAccess(token: string | null): MockUser {
  if (!token) fail(401, "UNAUTHORIZED", "Please sign in to continue.");
  const db = loadDb();
  const user = db.users.find((u) => u.user_id === token.replace(/^mock-access:/, ""));
  if (!user) fail(401, "UNAUTHORIZED", "Your session is no longer valid. Please sign in again.");
  return user;
}

function issueTokens(user: MockUser): { access_token: string; refresh_token: string } {
  return { access_token: `mock-access:${user.user_id}`, refresh_token: `mock-refresh:${user.user_id}` };
}

/* ----------------------------- the router ----------------------------- */

const wait = (ms = 200): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));
const nowIso = (): string => new Date().toISOString();

async function route(method: string, url: string, body: unknown, params: Record<string, unknown>): Promise<unknown> {
  const db = loadDb();
  const path = url.replace(/^\/+/, "");
  const [head, query] = path.split("?");
  const segments = head.split("/").filter(Boolean);
  if (segments[0] === "api") segments.shift(); // tolerate "/api/..." style URLs
  const [root, second, third] = segments;
  const collection = second;
  // Item URLs use two segments ("/lost-items/:id"), everything else three.
  const itemId = third ?? second;
  const q: Record<string, string> = { ...params as Record<string, string> };
  if (query) for (const [k, v] of new URLSearchParams(query)) q[k] ??= v;
  const fd = body instanceof FormData ? Object.fromEntries((body as FormData).entries()) : body ?? {};

  /* ------------------------------- auth ------------------------------- */

  if (root === "auth") {
    if (method === "get" && collection === "me") {
      const user = userFromAccess(tokenStore.getAccess());
      return { data: { user: withoutPassword(user) } };
    }

    if (method === "post" && collection === "login") {
      const { email, password } = (fd ?? {}) as { email?: string; password?: string };
      const key = (email ?? "").toLowerCase().trim();
      const now = Date.now();
      const recent = (authAttempts.get(key) ?? []).filter((t) => now - t < AUTH_WINDOW_MS);
      if (recent.length >= AUTH_LIMIT) {
        fail(429, "RATE_LIMITED", "Too many sign-in attempts. Please wait 15 minutes and try again.");
      }
      const user = db.users.find((u) => u.email.toLowerCase() === key);
      if (!user || user.password !== password) {
        recent.push(now);
        authAttempts.set(key, recent);
        fail(401, "INVALID_CREDENTIALS", "Incorrect email or password. Tip: tap the demo sign-in button below.");
      }
      authAttempts.delete(key);
      return { data: { user: withoutPassword(user), ...issueTokens(user) } };
    }

    if (method === "post" && collection === "register") {
      const input = (fd ?? {}) as { name?: string; email?: string; phone?: string; password?: string };
      const email = (input.email ?? "").trim().toLowerCase();
      if (!email || !input.password) fail(400, "VALIDATION_ERROR", "Name, email and password are required.");
      if (db.users.some((u) => u.email.toLowerCase() === email)) {
        fail(409, "EMAIL_TAKEN", "An account with this email already exists. Try signing in instead.");
      }
      const user: MockUser = {
        user_id: uid("u-"),
        name: (input.name ?? "").trim() || "New Member",
        email,
        phone: input.phone?.trim() || null,
        password: input.password!,
        role: "USER" as Role,
        created_at: nowIso(),
        updated_at: nowIso(),
      };
      db.users.push(user);
      saveDb(db);
      return { data: { user: withoutPassword(user), ...issueTokens(user) } };
    }

    if (method === "post" && collection === "refresh") {
      const refresh = (fd as { refresh_token?: string })?.refresh_token ?? "";
      if (!refresh.startsWith("mock-refresh:")) {
        fail(401, "INVALID_REFRESH", "Session expired. Please sign in again.");
      }
      const user = db.users.find((u) => u.user_id === refresh.replace(/^mock-refresh:/, ""));
      if (!user) fail(401, "INVALID_REFRESH", "Session expired. Please sign in again.");
      return { data: issueTokens(user) };
    }

    if (method === "post" && collection === "logout") {
      return {};
    }
  }

  /* ------------------------------ items ------------------------------- */

  if ((root === "lost-items" || root === "found-items") && itemId) {
    const kind = root === "lost-items" ? "lost" : "found";
    const idKey = kind === "lost" ? "lost_id" : "found_id";
    const dateKey = kind === "lost" ? "date_lost" : "date_found";

    if (method === "get" && itemId) {
      const all = (kind === "lost" ? db.lost : db.found) as unknown as Array<LostItem & FoundItem>;
      const item = all.find((x) => x[idKey] === itemId);
      if (!item) fail(404, "NOT_FOUND", "That item no longer exists or was removed.");
      return { item };
    }

    if (method === "delete" && itemId) {
      const user = userFromAccess(tokenStore.getAccess());
      const all = (kind === "lost" ? db.lost : db.found) as unknown as Array<LostItem & FoundItem>;
      const idx = all.findIndex((x) => x[idKey] === itemId);
      if (idx === -1) fail(404, "NOT_FOUND", "That item no longer exists.");
      if (all[idx].user_id !== user.user_id && user.role !== "ADMIN") {
        fail(403, "FORBIDDEN", "You can only delete your own items.");
      }
      all.splice(idx, 1);
      saveDb(db);
      return {};
    }

    if (method === "put" && itemId) {
      const user = userFromAccess(tokenStore.getAccess());
      const all = (kind === "lost" ? db.lost : db.found) as unknown as Array<LostItem & FoundItem>;
      const item = all.find((x) => x[idKey] === itemId);
      if (!item) fail(404, "NOT_FOUND", "That item no longer exists.");
      if (item.user_id !== user.user_id && user.role !== "ADMIN") {
        fail(403, "FORBIDDEN", "You can only edit your own items.");
      }
      const f = fd as Record<string, string>;
      if (f.item_name) item.item_name = f.item_name;
      if (f.category) item.category = f.category;
      item.description = f.description || null;
      if (f.location) item.location = f.location;
      if (f[dateKey]) (item as unknown as Record<string, string>)[dateKey] = f[dateKey];
      item.reporter = toReporter(user);
      saveDb(db);
      return { item };
    }
  }

  if ((root === "lost-items" || root === "found-items") && !itemId && method === "post") {
    const kind = root === "lost-items" ? "lost" : "found";
    const user = userFromAccess(tokenStore.getAccess());
    const f = fd as Record<string, string>;
    const itemName = (f.item_name ?? "").trim();
    const location = (f.location ?? "").trim();
    if (!itemName || !location) fail(400, "VALIDATION_ERROR", "Item name and location are required.");
    const base = {
      user_id: user.user_id,
      item_name: itemName,
      category: f.category || "Other",
      description: f.description || null,
      location,
      image_url: null,
      status: "ACTIVE" as const,
      created_at: nowIso(),
      reporter: toReporter(user),
      claim_count: 0,
    };
    if (kind === "lost") {
      const created: LostItem = { ...base, lost_id: uid("l-"), date_lost: f.date_lost || nowIso().slice(0, 10) };
      db.lost.unshift(created);
      saveDb(db);
      return { item: created };
    }
    const created: FoundItem = { ...base, found_id: uid("f-"), date_found: f.date_found || nowIso().slice(0, 10) };
    db.found.unshift(created);
    saveDb(db);
    return { item: created };
  }

  if ((root === "lost-items" || root === "found-items") && !itemId && method === "get") {
    const kind = root === "lost-items" ? "lost" : "found";
    const all = (kind === "lost" ? [...db.lost] : [...db.found]) as unknown as Array<LostItem & FoundItem>;

    const text = (q.q ?? "").toLowerCase().trim();
    const filtered = all.filter((it) => {
      if (text && ![it.item_name, it.description ?? "", it.location].join(" ").toLowerCase().includes(text)) return false;
      if (q.category && it.category !== q.category) return false;
      if (q.location && !it.location.toLowerCase().includes(String(q.location).toLowerCase())) return false;
      if (q.status && it.status !== q.status) return false;
      const d = kind === "lost" ? it.date_lost : it.date_found;
      if (q.date_from && d && d < String(q.date_from)) return false;
      if (q.date_to && d && d > String(q.date_to)) return false;
      return true;
    });

    const sortBy = q.sort_by ?? "created_at";
    const dir = q.sort_order === "asc" ? 1 : -1;
    filtered.sort((a, b) => {
      let av: string | number;
      let bv: string | number;
      if (sortBy === "date") {
        av = (kind === "lost" ? a.date_lost : a.date_found) ?? "";
        bv = (kind === "lost" ? b.date_lost : b.date_found) ?? "";
      } else if (sortBy === "name") {
        av = a.item_name.toLowerCase();
        bv = b.item_name.toLowerCase();
      } else if (sortBy === "category") {
        av = a.category;
        bv = b.category;
      } else if (sortBy === "location") {
        av = a.location.toLowerCase();
        bv = b.location.toLowerCase();
      } else {
        av = a.created_at;
        bv = b.created_at;
      }
      return av < bv ? -dir : av > bv ? dir : 0;
    });

    const page = Math.max(1, Number(q.page ?? "1") || 1);
    const limit = Math.min(50, Math.max(1, Number(q.limit ?? "12") || 12));
    const total = filtered.length;
    return {
      items: filtered.slice((page - 1) * limit, page * limit),
      total,
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  /* ------------------------------ claims ------------------------------ */

  if (root === "claims") {
    if (method === "get") {
      const user = userFromAccess(tokenStore.getAccess());
      const mine = db.claims
        .filter((c) => c.user_id === user.user_id || user.role === "ADMIN")
        .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
      const page = Math.max(1, Number(q.page ?? "1") || 1);
      const limit = Math.min(50, Math.max(1, Number(q.limit ?? "10") || 10));
      return {
        claims: mine.slice((page - 1) * limit, page * limit),
        total: mine.length,
        page,
        pages: Math.max(1, Math.ceil(mine.length / limit)),
      };
    }

    if (method === "post") {
      const user = userFromAccess(tokenStore.getAccess());
      const f = fd as Record<string, string>;
      const target = db.found.find((x) => x.found_id === f.found_id);
      if (!target) fail(404, "NOT_FOUND", "The item you are claiming no longer exists.");
      if (target.status !== "ACTIVE") fail(409, "ITEM_CLOSED", "This item has already been returned and is no longer accepting claims.");
      const proof = (f.proof_description ?? "").trim();
      if (proof.length < 20) fail(400, "VALIDATION_ERROR", "Describe your proof in at least 20 characters — this helps admins verify you.");
      const claim: MockClaim = {
        claim_id: uid("c-"),
        user_id: user.user_id,
        claim_date: nowIso(),
        proof_description: proof,
        proof_image_url: null,
        claim_status: "PENDING",
        admin_notes: null,
        created_at: nowIso(),
        user: toReporter(user),
        found_item: {
          found_id: target.found_id,
          item_name: target.item_name,
          category: target.category,
          location: target.location,
          date_found: target.date_found,
          image_url: target.image_url,
          status: target.status,
          reporter: { user_id: target.reporter!.user_id, name: target.reporter!.name, email: target.reporter!.email },
        },
      };
      db.claims.push(claim);
      target.claim_count = (target.claim_count ?? 0) + 1;
      saveDb(db);
      return { claim };
    }
  }

  /* ------------------------------ stats ------------------------------- */

  if (root === "stats" && collection === "public" && method === "get") {
    const lostTotal = db.lost.length;
    const lostRecovered = db.lost.filter((i) => i.status === "RECOVERED").length;
    const foundTotal = db.found.length;
    const foundRecovered = db.found.filter((i) => i.status === "RECOVERED").length;
    const recentFound: FoundItem[] = [...db.found]
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
      .slice(0, 6);
    const stats: PublicStats["stats"] = {
      lost_total: lostTotal,
      lost_recovered: lostRecovered,
      found_total: foundTotal,
      found_recovered: foundRecovered,
      users: db.users.length,
      approved_claims: db.claims.filter((c) => c.claim_status === "APPROVED").length,
      recovery_rate: lostTotal ? Math.round((lostRecovered / lostTotal) * 100) : 0,
    };
    return { data: { stats, recent_found: recentFound } };
  }

  fail(404, "NO_ROUTE", `Prototype has no handler for ${method} /${path}`);
}

/* ---------------------------- axios facade ---------------------------- */

/** Same call surface as the previous axios instance: `api.get(...).then(r => r.data)`. */
export const api = {
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<{ data: T }> {
    await wait();
    const data = (await route("get", url, undefined, (config?.params ?? {}) as Record<string, unknown>)) as T;
    return { data };
  },
  async post<T = any>(url: string, body?: unknown): Promise<{ data: T }> {
    await wait();
    const data = (await route("post", url, body ?? {}, {})) as T;
    return { data };
  },
  async put<T = any>(url: string, body?: unknown): Promise<{ data: T }> {
    await wait();
    const data = (await route("put", url, body ?? {}, {})) as T;
    return { data };
  },
  async delete<T = any>(url: string): Promise<{ data: T }> {
    await wait();
    const data = (await route("delete", url, undefined, {})) as T;
    return { data };
  },
} as unknown as typeof axios;

/* -------------------------- friendly errors --------------------------- */

/** Extracts a friendly message from an API error response. */
export function getApiErrorMessage(err: unknown, fallback = "Something went wrong. Please try again."): string {
  if (axios.isAxiosError(err)) {
    const msg = (err.response?.data as { error?: ApiError } | undefined)?.error?.message;
    if (msg) return msg;
  }
  return fallback;
}

export const __mockRouter = route;

/* ------------------- prototype extras (sync helpers) ------------------- */

/** Instant stats for the home page — reads the fake DB synchronously. */
export function getPublicStats(): PublicStats {
  const db = loadDb();
  const lostTotal = db.lost.length;
  const lostRecovered = db.lost.filter((i) => i.status === "RECOVERED").length;
  const foundTotal = db.found.length;
  const foundRecovered = db.found.filter((i) => i.status === "RECOVERED").length;
  const recent_found: FoundItem[] = [...db.found]
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .slice(0, 6);
  return {
    stats: {
      lost_total: lostTotal,
      lost_recovered: lostRecovered,
      found_total: foundTotal,
      found_recovered: foundRecovered,
      users: db.users.length,
      approved_claims: db.claims.filter((c) => c.claim_status === "APPROVED").length,
      recovery_rate: lostTotal ? Math.round((lostRecovered / lostTotal) * 100) : 0,
    },
    recent_found,
  };
}

/** Direct access to the mock backend for prototype-specific UI (reset, etc.). */
export const mockApi = {
  resetDemoData(): void {
    resetDb();
  },
};
