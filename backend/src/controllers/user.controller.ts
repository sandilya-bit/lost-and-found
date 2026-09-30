import type { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { unauthorized, forbidden, notFound } from "../utils/errors";
import { asyncHandler } from "../utils/http";

/**
 * Public user endpoints (admin-only listing) — kept minimal per spec.
 */
export const userController = {
  /** GET /api/users — admin only */
  list: asyncHandler(async (req: Request, res: Response) => {
    const page = Math.max(1, Number.parseInt(String(req.query.page ?? "1"), 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(String(req.query.limit ?? "20"), 10) || 20));
    const q = typeof req.query.q === "string" ? req.query.q.trim().slice(0, 80) : "";
    const role = ["USER", "ADMIN"].includes(String(req.query.role)) ? String(req.query.role) : "";

    const where: Record<string, unknown> = {};
    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ];
    }
    if (role) where.role = role;

    const [rows, total] = await prisma.$transaction([
      prisma.users.findMany({
        where,
        select: {
          user_id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          created_at: true,
          _count: { select: { lost_items: true, found_items: true, claims: true } },
        },
        orderBy: { created_at: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.users.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        users: rows.map((u) => ({
          ...u,
          lost_items: u._count.lost_items,
          found_items: u._count.found_items,
          claims: u._count.claims,
          _count: undefined,
        })),
        total,
        page,
        pages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  }),

  /** GET /api/users/:id — self or admin */
  getById: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    if (!req.user) throw unauthorized();
    if (req.user.role !== "ADMIN" && req.user.user_id !== id) {
      throw forbidden("You can only view your own profile");
    }

    const user = await prisma.users.findUnique({
      where: { user_id: id },
      select: {
        user_id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        created_at: true,
        updated_at: true,
        _count: { select: { lost_items: true, found_items: true, claims: true } },
      },
    });
    if (!user) throw notFound("User not found");

    res.json({
      success: true,
      data: {
        user: {
          ...user,
          lost_items: user._count.lost_items,
          found_items: user._count.found_items,
          claims: user._count.claims,
          _count: undefined,
        },
      },
    });
  }),
};
