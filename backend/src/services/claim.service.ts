import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { conflict, forbidden, notFound, unprocessable } from "../utils/errors";
import { buildClaimWhere, type ClaimFilters } from "./query.service";

type ClaimWithRelations = Prisma.claimsGetPayload<{
  include: {
    user: { select: { user_id: true; name: true; email: true; phone: true } };
    found: { include: { user: { select: { user_id: true; name: true; email: true } } } };
  };
}>;

function mapClaim(c: ClaimWithRelations) {
  return {
    claim_id: c.claim_id,
    claim_date: c.claim_date,
    proof_description: c.proof_description,
    proof_image_url: c.proof_image_url,
    claim_status: c.claim_status,
    admin_notes: c.admin_notes,
    created_at: c.created_at,
    user: { user_id: c.user.user_id, name: c.user.name, email: c.user.email, phone: c.user.phone },
    found_item: {
      found_id: c.found.found_id,
      item_name: c.found.item_name,
      category: c.found.category,
      location: c.found.location,
      date_found: c.found.date_found.toISOString().slice(0, 10),
      image_url: c.found.image_url,
      status: c.found.status,
      reporter: { user_id: c.found.user.user_id, name: c.found.user.name, email: c.found.user.email },
    },
  };
}

export const claimService = {
  async list(filters: ClaimFilters, requester: { user_id: string; role: "USER" | "ADMIN" }) {
    const where = buildClaimWhere(filters, requester);
    const [rows, total] = await prisma.$transaction([
      prisma.claims.findMany({
        where,
        include: {
          user: { select: { user_id: true, name: true, email: true, phone: true } },
          found: { include: { user: { select: { user_id: true, name: true } } } },
        },
        orderBy: { [filters.sortBy]: filters.sortOrder },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      prisma.claims.count({ where }),
    ]);
    return {
      claims: rows.map(mapClaim),
      total,
      page: filters.page,
      pages: Math.max(1, Math.ceil(total / filters.limit)),
    };
  },

  async getById(claim_id: string, requester: { user_id: string; role: "USER" | "ADMIN" }) {
    const claim = await prisma.claims.findUnique({
      where: { claim_id },
      include: {
        user: { select: { user_id: true, name: true, email: true, phone: true } },
        found: { include: { user: { select: { user_id: true, name: true } } } },
      },
    });
    if (!claim) throw notFound("Claim not found");
    const isOwner = claim.user_id === requester.user_id;
    const isItemOwner = claim.found.user_id === requester.user_id;
    if (!isOwner && !isItemOwner && requester.role !== "ADMIN") {
      throw forbidden("You do not have access to this claim");
    }
    return mapClaim(claim);
  },

  async create(user_id: string, data: { found_id: string; proof_description: string }, proofImageUrl?: string) {
    const found = await prisma.found_items.findUnique({ where: { found_id: data.found_id } });
    if (!found) throw notFound("Found item not found");
    if (found.status !== "ACTIVE") {
      throw conflict("This item has already been returned and is no longer accepting claims");
    }
    if (found.user_id === user_id) {
      throw unprocessable("You cannot claim an item that you reported as found");
    }

    const duplicate = await prisma.claims.findFirst({
      where: { user_id, found_id: data.found_id, claim_status: { in: ["PENDING", "APPROVED"] } },
      select: { claim_id: true },
    });
    if (duplicate) throw conflict("You already have an active claim for this item");

    return prisma.claims.create({
      data: {
        user_id,
        found_id: data.found_id,
        proof_description: data.proof_description,
        proof_image_url: proofImageUrl ?? null,
      },
    });
  },

  /** Admin review: approve or reject. Approving marks the item RECOVERED. */
  async review(claim_id: string, adminId: string, data: { claim_status: "APPROVED" | "REJECTED"; admin_notes?: string }) {
    const claim = await prisma.claims.findUnique({
      where: { claim_id },
      include: { found: true },
    });
    if (!claim) throw notFound("Claim not found");
    if (claim.claim_status !== "PENDING") {
      throw conflict("This claim has already been reviewed");
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.claims.update({
        where: { claim_id },
        data: {
          claim_status: data.claim_status,
          admin_notes: data.admin_notes ?? null,
        },
      });

      if (data.claim_status === "APPROVED") {
        await tx.found_items.update({
          where: { found_id: claim.found_id },
          data: { status: "RECOVERED" },
        });
        // Auto-reject other pending claims on the same item.
        await tx.claims.updateMany({
          where: { found_id: claim.found_id, claim_id: { not: claim_id }, claim_status: "PENDING" },
          data: { claim_status: "REJECTED", admin_notes: "Another claim was approved for this item" },
        });
      }

      return updated;
    });

    void adminId;
    return result;
  },
};
