import type { Request, Response, NextFunction } from "express";
import { claimService } from "../services/claim.service";
import { unauthorized, notFound } from "../utils/errors";
import { ok } from "../utils/http";

function wrap(fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
}

export const claimController = {
  /** GET /api/claims — admin: all; user: own submitted + on own found items */
  list: wrap(async (req, res) => {
    if (!req.user) throw unauthorized();
    const filters = (
      req as unknown as { claimFilters?: import("../services/query.service").ClaimFilters }
    ).claimFilters!;
    const result = await claimService.list(filters, { user_id: req.user.user_id, role: req.user.role });
    ok(res, result);
  }),

  /** GET /api/claims/:id */
  getById: wrap(async (req, res) => {
    if (!req.user) throw unauthorized();
    const claim = await claimService.getById((req.params as { id: string }).id, {
      user_id: req.user.user_id,
      role: req.user.role,
    });
    ok(res, { claim });
  }),

  /** POST /api/claims — submit a claim with optional proof image */
  create: wrap(async (req, res) => {
    if (!req.user) throw unauthorized();
    const file = (req as unknown as { file?: Express.Multer.File }).file;
    const proof_image_url = file ? `/uploads/${file.filename}` : undefined;
    const claim = await claimService.create(req.user.user_id, req.body, proof_image_url);
    ok(res, { claim }, 201);
  }),

  /** PUT /api/claims/:id — admin review (approve / reject + notes) */
  review: wrap(async (req, res) => {
    if (!req.user) throw unauthorized();
    if (req.user.role !== "ADMIN") {
      // Regular users can only withdraw their own pending claim via this endpoint.
      const claimId = (req.params as { id: string }).id;
      const claim = await claimService.getById(claimId, { user_id: req.user.user_id, role: "USER" });
      if (claim.user.user_id !== req.user.user_id) throw notFound("Claim not found");
      if (claim.claim_status !== "PENDING") {
        throw notFound("Only pending claims can be withdrawn");
      }
      await prismaDeleteClaim(claimId);
      ok(res, { message: "Claim withdrawn" });
      return;
    }
    const updated = await claimService.review(
      (req.params as { id: string }).id,
      req.user.user_id,
      req.body
    );
    ok(res, { claim: updated });
  }),
};

import { prisma } from "../config/prisma";
async function prismaDeleteClaim(claim_id: string): Promise<void> {
  await prisma.claims.delete({ where: { claim_id } });
}
