import type { Request, Response, NextFunction } from "express";
import { prisma } from "../config/prisma";
import { ok } from "../utils/http";

function wrap(fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
}

export const statsController = {
  /** GET /api/stats/public — homepage statistics (no auth) */
  publicStats: wrap(async (_req, res) => {
    const [lostTotal, lostRecovered, foundTotal, foundRecovered, users, claims] = await prisma.$transaction([
      prisma.lost_items.count(),
      prisma.lost_items.count({ where: { status: "RECOVERED" } }),
      prisma.found_items.count(),
      prisma.found_items.count({ where: { status: "RECOVERED" } }),
      prisma.users.count(),
      prisma.claims.count({ where: { claim_status: "APPROVED" } }),
    ]);

    const recentFound = await prisma.found_items.findMany({
      where: { status: "ACTIVE" },
      orderBy: { created_at: "desc" },
      take: 6,
      select: {
        found_id: true,
        item_name: true,
        category: true,
        location: true,
        date_found: true,
        image_url: true,
        created_at: true,
      },
    });

    ok(res, {
      stats: {
        lost_total: lostTotal,
        lost_recovered: lostRecovered,
        found_total: foundTotal,
        found_recovered: foundRecovered,
        users,
        approved_claims: claims,
        recovery_rate: lostTotal > 0 ? Math.round((lostRecovered / lostTotal) * 100) : 0,
      },
      recent_found: recentFound.map((f) => ({
        ...f,
        date_found: f.date_found.toISOString().slice(0, 10),
      })),
    });
  }),

  /** GET /api/stats/dashboard — per-user dashboard cards */
  dashboard: wrap(async (req, res) => {
    if (!req.user) throw unauthorized();
    const uid = req.user.user_id;

    const [lostTotal, foundTotal, activeClaims, recoveredItems, pendingReview] = await prisma.$transaction([
      prisma.lost_items.count({ where: { user_id: uid } }),
      prisma.found_items.count({ where: { user_id: uid } }),
      prisma.claims.count({ where: { user_id: uid, claim_status: "PENDING" } }),
      prisma.lost_items.count({ where: { user_id: uid, status: "RECOVERED" } }),
      prisma.claims.count({
        where: { found: { user_id: uid }, claim_status: "PENDING" },
      }),
    ]);

    ok(res, {
      total_lost: lostTotal,
      total_found: foundTotal,
      active_claims: activeClaims,
      returned_items: recoveredItems,
      pending_review: pendingReview,
    });
  }),

  /** GET /api/stats/admin — admin dashboard cards + 7-day activity */
  admin: wrap(async (_req, res) => {
    const since = new Date(Date.now() - 7 * 86_400_000);

    const [users, lostTotal, foundTotal, claimsTotal, pendingClaims, approvedClaims, rejectedClaims, recovered, newUsers, newLost, newFound] =
      await prisma.$transaction([
        prisma.users.count(),
        prisma.lost_items.count(),
        prisma.found_items.count(),
        prisma.claims.count(),
        prisma.claims.count({ where: { claim_status: "PENDING" } }),
        prisma.claims.count({ where: { claim_status: "APPROVED" } }),
        prisma.claims.count({ where: { claim_status: "REJECTED" } }),
        prisma.lost_items.count({ where: { status: "RECOVERED" } }),
        prisma.users.count({ where: { created_at: { gte: since } } }),
        prisma.lost_items.count({ where: { created_at: { gte: since } } }),
        prisma.found_items.count({ where: { created_at: { gte: since } } }),
      ]);

    const byCategory = await prisma.lost_items.groupBy({
      by: ["category"],
      _count: { category: true },
      orderBy: { _count: { category: "desc" } },
    });

    ok(res, {
      total_users: users,
      total_lost: lostTotal,
      total_found: foundTotal,
      total_claims: claimsTotal,
      pending_claims: pendingClaims,
      approved_claims: approvedClaims,
      rejected_claims: rejectedClaims,
      returned_items: recovered,
      last_7_days: { new_users: newUsers, new_lost: newLost, new_found: newFound },
      lost_by_category: byCategory.map((c) => ({ category: c.category, count: c._count.category })),
    });
  }),
};

import { unauthorized } from "../utils/errors";
