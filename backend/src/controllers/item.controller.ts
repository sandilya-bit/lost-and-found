import type { Request, Response, NextFunction } from "express";
import { lostItemService } from "../services/lostItem.service";
import { foundItemService } from "../services/foundItem.service";
import { parseItemFilters } from "../services/query.service";
import { unauthorized, forbidden } from "../utils/errors";
import { ok } from "../utils/http";

type Kind = "lost" | "found";

function idOf(req: Request): string {
  return (req.params as { id: string }).id;
}

/** Factory that produces identical CRUD handlers for lost & found items. */
export function itemControllerFactory(kind: Kind) {
  const service = kind === "lost" ? lostItemService : foundItemService;

  return {
    /** GET /api/lost-items | /api/found-items — public search + listing */
    list: asyncHandler(async (req, res) => {
      const filters = parseItemFilters(req.query as Record<string, unknown>);
      if (filters.mine && !req.user) throw unauthorized("Login required to list your items");
      if (filters.mine && req.user) filters.user_id = req.user.user_id;
      const result = await service.list(filters);
      ok(res, result);
    }),

    /** GET /api/lost-items/:id | /api/found-items/:id — public detail */
    getById: asyncHandler(async (req, res) => {
      const item = await service.getById(idOf(req));
      ok(res, { item });
    }),

    /** POST — create (auth required) */
    create: asyncHandler(async (req, res) => {
      if (!req.user) throw unauthorized();
      const image_url = (req as unknown as { file?: Express.Multer.File }).file
        ? `/uploads/${(req as unknown as { file?: Express.Multer.File }).file!.filename}`
        : undefined;
      const created = await service.create(req.user.user_id, {
        item_name: req.body.item_name,
        category: req.body.category,
        description: req.body.description,
        location: req.body.location,
        ...(kind === "lost"
          ? { date_lost: req.body.date_lost }
          : { date_found: req.body.date_found }),
        image_url,
      } as never);
      ok(res, { item: created }, 201);
    }),

    /** PUT /:id — owner or admin */
    update: asyncHandler(async (req, res) => {
      if (!req.user) throw unauthorized();
      const image_url = (req as unknown as { file?: Express.Multer.File }).file
        ? `/uploads/${(req as unknown as { file?: Express.Multer.File }).file!.filename}`
        : undefined;
      const payload: Record<string, unknown> = { ...req.body };
      if (image_url) payload.image_url = image_url;
      const updated = await service.update(idOf(req), req.user.user_id, req.user.role, payload);
      ok(res, { item: updated });
    }),

    /** DELETE /:id — owner or admin */
    remove: asyncHandler(async (req, res) => {
      if (!req.user) throw unauthorized();
      await service.remove(idOf(req), req.user.user_id, req.user.role);
      ok(res, { message: `${kind === "lost" ? "Lost" : "Found"} item deleted successfully` });
    }),

    /** GET /api/lost-items/:id/matches — suggest found items for a lost report */
    matches: asyncHandler(async (req, res) => {
      if (!req.user) throw unauthorized();
      const lost = await lostItemService.getById(idOf(req));
      if (lost.user_id !== req.user.user_id && req.user.role !== "ADMIN") {
        throw forbidden("You can only get matches for your own lost items");
      }
      const suggestions = await foundItemService.suggestForLostItem({
        item_name: lost.item_name,
        category: lost.category,
        location: lost.location,
      });
      ok(res, { matches: suggestions });
    }),
  };

  function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) {
    return (req: Request, res: Response, next: NextFunction): void => {
      fn(req, res, next).catch(next);
    };
  }
}
