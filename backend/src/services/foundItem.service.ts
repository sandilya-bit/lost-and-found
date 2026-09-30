import { Prisma, type item_status } from "@prisma/client";
import { prisma } from "../config/prisma";
import { notFound } from "../utils/errors";
import { buildItemWhere, type ItemFilters } from "./query.service";

export interface FoundItemListResult {
  items: Array<{
    found_id: string;
    user_id: string;
    item_name: string;
    category: string;
    description: string | null;
    location: string;
    date_found: string;
    image_url: string | null;
    status: item_status;
    created_at: Date;
    reporter: { user_id: string; name: string; email: string; phone: string | null };
    claim_count: number;
  }>;
  total: number;
  page: number;
  pages: number;
}

type FoundItemWithReporter = Prisma.found_itemsGetPayload<{
  include: { user: { select: { user_id: true; name: true; email: true; phone: true } } };
}>;

function mapItem(i: FoundItemWithReporter & { _count?: { claims: number } }) {
  return {
    found_id: i.found_id,
    user_id: i.user_id,
    item_name: i.item_name,
    category: i.category,
    description: i.description,
    location: i.location,
    date_found: i.date_found.toISOString().slice(0, 10),
    image_url: i.image_url,
    status: i.status,
    created_at: i.created_at,
    reporter: { user_id: i.user.user_id, name: i.user.name, email: i.user.email, phone: i.user.phone },
    claim_count: i._count?.claims ?? 0,
  };
}

export const foundItemService = {
  async list(filters: ItemFilters) {
    const where = buildItemWhere(filters, "found");
    const [rows, total] = await prisma.$transaction([
      prisma.found_items.findMany({
        where,
        include: { user: { select: { user_id: true, name: true, email: true, phone: true } }, _count: { select: { claims: true } } },
        orderBy: { [filters.sortBy]: filters.sortOrder },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      prisma.found_items.count({ where }),
    ]);
    return {
      items: rows.map(mapItem),
      total,
      page: filters.page,
      pages: Math.max(1, Math.ceil(total / filters.limit)),
    };
  },

  async getById(found_id: string) {
    const item = await prisma.found_items.findUnique({
      where: { found_id },
      include: { user: { select: { user_id: true, name: true, email: true, phone: true } } },
    });
    if (!item) throw notFound("Found item not found");
    return mapItem(item);
  },

  async create(user_id: string, data: { item_name: string; category: string; description?: string; location: string; date_found: string; image_url?: string }) {
    return prisma.found_items.create({
      data: {
        user_id,
        item_name: data.item_name,
        category: data.category,
        description: data.description || null,
        location: data.location,
        date_found: new Date(`${data.date_found}T00:00:00Z`),
        image_url: data.image_url || null,
      },
    });
  },

  async update(found_id: string, user_id: string, role: "USER" | "ADMIN", data: Record<string, unknown>) {
    const existing = await prisma.found_items.findUnique({ where: { found_id } });
    if (!existing) throw notFound("Found item not found");
    if (role !== "ADMIN" && existing.user_id !== user_id) {
      throw notFound("Found item not found");
    }

    const patch: Prisma.found_itemsUpdateInput = {};
    if (typeof data.item_name === "string") patch.item_name = data.item_name;
    if (typeof data.category === "string") patch.category = data.category;
    if (typeof data.description === "string") patch.description = data.description || null;
    if (typeof data.location === "string") patch.location = data.location;
    if (typeof data.date_found === "string") patch.date_found = new Date(`${data.date_found}T00:00:00Z`);
    if (typeof data.image_url === "string") patch.image_url = data.image_url || null;

    return prisma.found_items.update({ where: { found_id }, data: patch });
  },

  async remove(found_id: string, user_id: string, role: "USER" | "ADMIN") {
    const existing = await prisma.found_items.findUnique({ where: { found_id } });
    if (!existing) throw notFound("Found item not found");
    if (role !== "ADMIN" && existing.user_id !== user_id) {
      throw notFound("Found item not found");
    }
    await prisma.found_items.delete({ where: { found_id } });
  },

  /** Aggregated dashboard stats for the calling user. */
  async statsForUser(user_id: string) {
    const [total, active, recovered, recent] = await prisma.$transaction([
      prisma.found_items.count({ where: { user_id } }),
      prisma.found_items.count({ where: { user_id, status: "ACTIVE" } }),
      prisma.found_items.count({ where: { user_id, status: "RECOVERED" } }),
      prisma.found_items.findMany({
        where: { user_id },
        orderBy: { created_at: "desc" },
        take: 5,
        select: { found_id: true, item_name: true, category: true, location: true, date_found: true, status: true },
      }),
    ]);
    return {
      total,
      active,
      recovered,
      recent: recent.map((r) => ({ ...r, date_found: r.date_found.toISOString().slice(0, 10) })),
    };
  },

  /** Suggest active found items that may match a lost item (same category + fuzzy name/location). */
  async suggestForLostItem(lost: { item_name: string; category: string; location: string }) {
    const candidates = await prisma.found_items.findMany({
      where: {
        status: "ACTIVE",
        category: lost.category,
      },
      orderBy: { date_found: "desc" },
      take: 50,
      select: { found_id: true, item_name: true, location: true, category: true, date_found: true },
    });

    const tokensOf = (s: string) =>
      s.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length >= 3);

    return candidates
      .map((c) => {
        const a = new Set(tokensOf(lost.item_name));
        const b = tokensOf(c.item_name);
        const overlap = b.filter((t) => a.has(t)).length;
        const locA = tokensOf(lost.location);
        const locB = tokensOf(c.location);
        const locOverlap = locB.filter((t) => locA.includes(t)).length;
        const score = overlap * 2 + locOverlap;
        return { ...c, score };
      })
      .filter((c) => c.score > 0)
      .sort((x, y) => y.score - x.score)
      .slice(0, 5);
  },
};
