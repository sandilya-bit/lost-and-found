/**
 * Smoke test for the in-browser mock API. Runs under Node with a tiny
 * localStorage shim:  npx tsx scripts/mock-smoke.ts
 */

const store = new Map<string, string>();
(globalThis as unknown as { localStorage: unknown }).localStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
};

import type { AxiosError } from "axios";

let passed = 0;
let failed = 0;

function check(name: string, cond: boolean, extra?: unknown): void {
  if (cond) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.error(`  ✗ ${name}`, extra ?? "");
  }
}

async function expectError(name: string, fn: () => Promise<unknown>, status: number): Promise<void> {
  try {
    await fn();
    check(name, false, "expected an error but none was thrown");
  } catch (err) {
    const e = err as AxiosError;
    check(name, e?.response?.status === status, `got status ${e?.response?.status} (${(err as Error)?.message})`);
  }
}

async function main(): Promise<void> {
  const { api, tokenStore, getPublicStats } = await import("../src/api/client");

  console.log("\n— stats (before sign-in) —");
  const stats = getPublicStats();
  check("20 lost items seeded", stats.stats.lost_total === 20, stats.stats.lost_total);
  check("20 found items seeded", stats.stats.found_total === 20, stats.stats.found_total);
  check("8 users seeded", stats.stats.users === 8, stats.stats.users);
  check("recent found has 6 entries", stats.recent_found.length === 6, stats.recent_found.length);

  console.log("\n— auth —");
  await expectError("login rejects wrong password", () => api.post("/auth/login", { email: "demo@lostfound.io", password: "nope" }), 401);
  const login = await api.post("/auth/login", { email: "demo@lostfound.io", password: "Demo@1234" });
  check("demo login succeeds", !!login.data.data.access_token && login.data.data.user.name === "Demo Explorer");
  tokenStore.set(login.data.data.access_token, login.data.data.refresh_token);
  const me = await api.get("/auth/me");
  check("/auth/me resolves session", me.data.data.user.email === "demo@lostfound.io");
  const reg = await api.post("/auth/register", { name: "Test Person", email: "test@example.com", password: "Pass@1234" });
  check("register creates a user", reg.data.data.user.email === "test@example.com");
  await expectError("duplicate register is 409", () => api.post("/auth/register", { name: "X", email: "test@example.com", password: "Pass@1234" }), 409);

  console.log("\n— item listing, filtering, pagination —");
  const lostList = await api.get("/lost-items", { params: { page: 1, limit: 12 } });
  check("lost list returns items + pagination", lostList.data.items.length === 12 && lostList.data.pages === 2 && lostList.data.total === 20);
  const search = await api.get("/lost-items", { params: { q: "wallet" } });
  check("text search matches wallet items", search.data.total >= 1, search.data.total);
  const catFilter = await api.get("/found-items", { params: { category: "Electronics" } });
  check("category filter (Electronics, found)", catFilter.data.total === 4, catFilter.data.total);
  const statusFilter = await api.get("/lost-items", { params: { status: "RECOVERED" } });
  check("status filter (RECOVERED, lost)", statusFilter.data.total === 3, statusFilter.data.total);
  const sorted = await api.get("/lost-items", { params: { sort_by: "name", sort_order: "asc" } });
  check("sort by name asc", sorted.data.items[0].item_name <= sorted.data.items[1].item_name);

  console.log("\n— item create / edit / detail / delete —");
  const createFd = new FormData();
  createFd.set("item_name", "Smoke Test Item");
  createFd.set("category", "Keys");
  createFd.set("description", "created by smoke test");
  createFd.set("location", "Test Bench");
  createFd.set("date_lost", "2026-09-30");
  const created = await api.post("/lost-items", createFd);
  const newId = created.data.item.lost_id;
  check("create lost item", !!newId && created.data.item.reporter.name === "Demo Explorer");
  const editFd = new FormData();
  editFd.set("item_name", "Smoke Test Item v2");
  editFd.set("location", "Test Bench 2");
  await api.put(`/lost-items/${newId}`, editFd);
  const afterEdit = await api.get(`/lost-items/${newId}`);
  check("edit persists", afterEdit.data.item.item_name === "Smoke Test Item v2");
  await api.delete(`/lost-items/${newId}`);
  await expectError("deleted item is 404", () => api.get(`/lost-items/${newId}`), 404);

  console.log("\n— claims —");
  tokenStore.clear();
  await expectError("claim requires sign-in", () => api.post("/claims", { found_id: "f-seed-2", proof_description: "x".repeat(30) }), 401);
  tokenStore.set(login.data.data.access_token, login.data.data.refresh_token);
  await expectError("claim rejects short proof", () => api.post("/claims", { found_id: "f-seed-2", proof_description: "too short" }), 400);
  const claim = await api.post("/claims", { found_id: "f-seed-2", proof_description: "This tote has my skyline sketches and a red pencil pouch inside the front pocket." });
  check("claim submits as PENDING", claim.data.claim.claim_status === "PENDING");
  const myClaims = await api.get("/claims");
  check("my claims lists the new one", myClaims.data.claims.some((c: { claim_id: string }) => c.claim_id === claim.data.claim.claim_id));

  console.log("\n— authorization —");
  const adminLogin = await api.post("/auth/login", { email: "admin@lostfound.io", password: "Admin@123" });
  const demoToken = tokenStore.getAccess();
  tokenStore.set(adminLogin.data.data.access_token, adminLogin.data.data.refresh_token);
  const adminDel = await api.delete("/lost-items/l-seed-3");
  check("admin can delete another user's item", !!adminDel);
  tokenStore.set(demoToken!, adminLogin.data.data.refresh_token);
  await expectError("demo cannot delete others' items", () => api.delete("/lost-items/l-seed-4"), 403);

  console.log("\n— reset —");
  localStorage.removeItem("lf_mock_db_v1");
  const fresh = getPublicStats();
  check("reset restores 20/20 seeds", fresh.stats.lost_total === 20 && fresh.stats.found_total === 20);

  console.log(`\n${failed === 0 ? "ALL PASS" : "FAILURES"}: ${passed} passed, ${failed} failed\n`);
  process.exit(failed === 0 ? 0 : 1);
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});
