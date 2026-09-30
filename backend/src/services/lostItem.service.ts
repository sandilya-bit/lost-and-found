import { Prisma, type item_status } from "@prisma/client";
import { prisma } from "../config/prisma";
import { notFound } from "../utils/errors";
import { buildItemWhere, type ItemFilters } from "./query.service";

export interface ItemListResult {
  items: Array<{
    lost_id: string;
    user_id: string;
    item_name: string;
    category: string;
    description: string | null;
    location: string;
    date_lost: string;
    image_url: string | null;
    status: item_status;
    created_at: Date;
    reporter: { user_id: string; name: string; email: string; phone: string | null };
  }>;
  total: number;
  page: number;
  pages: number;
}

type LostItemWithReporter = Prisma.lost_itemsGetPayload<{
  include: { user: { select: { user_id: true; name: true; email: true; phone: true } } };
}>;

function mapItem(i: LostItemWithReporter) {
  return {
    lost_id: i.lost_id,
    user_id: i.user_id,
    item_name: i.item_name,
    category: i.category,
    description: i.description,
    location: i.location,
    date_lost: i.date_lost.toISOString().slice(0, 10),
    image_url: i.image_url,
    status: i.status,
    created_at: i.created_at,
    reporter: { user_id: i.user.user_id, name: i.user.name, email: i.user.email, phone: i.user.phone },
  };
}

/** Shared column set for sorting: allowed fields map to DB columns. */
const SORTABLE = {
  created_at: "created_at",
  date_lost: "date_lost",
  item_name: "item_name",
  category: "category",
  location: "location",
} as const;

export const lostItemService = {
  async list(filters: ItemFilters) {
    const where = buildItemWhere(filters, "lost");
    const [rows, total] = await prisma.$transaction([
      prisma.lost_items.findMany({
        where,
        include: { user: { select: { user_id: true, name: true, email: true, phone: true } } },
        orderBy: { [filters.sortBy]: filters.sortOrder },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      prisma.lost_items.count({ where }),
    ]);
    return {
      items: rows.map(mapItem),
      total,
      page: filters.page,
      pages: Math.max(1, Math.ceil(total / filters.limit)),
    };
  },

  async getById(lost_id: string) {
    const item = await prisma.lost_items.findUnique({
      where: { lost_id },
      include: { user: { select: { user_id: true, name: true, email: true, phone: true } } },
    });
    if (!item) throw notFound("Lost item not found");
    return mapItem(item);
  },

  async create(user_id: string, data: { item_name: string; category: string; description?: string; location: string; date_lost: string; image_url?: string }) {
    return prisma.lost_items.create({
      data: {
        user_id,
        item_name: data.item_name,
        category: data.category,
        description: data.description || null,
        location: data.location,
        date_lost: new Date(`${data.date_lost}T00:00:00Z`),
        image_url: data.image_url || null,
      },
    });
  },

  async update(lost_id: string, user_id: string, role: "USER" | "ADMIN", data: Record<string, unknown>) {
    const existing = await prisma.lost_items.findUnique({ where: { lost_id } });
    if (!existing) throw notFound("Lost item not found");
    if (role !== "ADMIN" && existing.user_id !== user_id) {
      throw notFound("Lost item not found"); // avoid leaking existence of others' items
    }

    const patch: Prisma.lost_itemsUpdateInput = {};
    if (typeof data.item_name === "string") patch.item_name = data.item_name;
    if (typeof data.category === "string") patch.category = data.category;
    if (typeof data.description === "string") patch.description = data.description || null;
    if (typeof data.location === "string") patch.location = data.location;
    if (typeof data.date_lost === "string") patch.date_lost = new Date(`${data.date_lost}T00:00:00Z`);
    if (typeof data.image_url === "string") patch.image_url = data.image_url || null;

    return prisma.lost_items.update({ where: { lost_id }, data: patch });
  },

  async remove(lost_id: string, user_id: string, role: "USER" | "ADMIN") {
    const existing = await prisma.lost_items.findUnique({ where: { lost_id } });
    if (!existing) throw notFound("Lost item not found");
    if (role !== "ADMIN" && existing.user_id !== user_id) {
      throw notFound("Lost item not found");
    }
    await prisma.lost_items.delete({ where: { lost_id } });
  },

  /** Aggregated dashboard stats for the calling user. */
  async statsForUser(user_id: string) {
    const [total, active, recovered, recent] = await prisma.$transaction([
      prisma.lost_items.count({ where: { user_id } }),
      prisma.lost_items.count({ where: { user_id, status: "ACTIVE" } }),
      prisma.lost_items.count({ where: { user_id, status: "RECOVERED" } }),
      prisma.lost_items.findMany({
        where: { user_id },
        orderBy: { created_at: "desc" },
        take: 5,
        select: { lost_id: true, item_name: true, category: true, location: true, date_lost: true, status: true },
      }),
    ]);
    return { total, active, recovered, recent: recent.map((r) => ({ ...r, date_lost: r.date_lost.toISOString().slice(0, 10) })) };
  },
};

export const SORT_MAP = SORTABLE;
