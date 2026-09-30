import type { Request, Response, NextFunction } from "express";
import { ZodError, type ZodType } from "zod";
import { unprocessable } from "./errors";

/**
 * Wraps an async route handler so rejections propagate to the error
 * middleware instead of silently hanging the request.
 */
export const asyncHandler =
  <T>(fn: (req: Request, res: Response, next: NextFunction) => Promise<T>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };

/** Returns the default success envelope used by every endpoint. */
export function ok<T>(res: Response, data: T, status = 200, meta?: Record<string, unknown>): void {
  res.status(status).json({ success: true, data, ...(meta ? { meta } : {}) });
}

/**
 * Zod validation middleware factory.
 * Validates `body` by default; pass `query` or `params` to validate those.
 * Parsed (coerced) value replaces the original on `req` for downstream code.
 */
export function validate(schema: ZodType, source: "body" | "query" | "params" = "body") {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req[source]);
      // Express 5 makes req.query a getter; only body/params are assignable.
      if (source !== "query") {
        (req as unknown as Record<string, unknown>)[source] = parsed;
      } else {
        Object.assign(req.query as Record<string, unknown>, parsed);
      }
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        next(
          unprocessable(
            err.issues.map((i) => `${i.path.join(".") || "input"}: ${i.message}`).join("; ")
          )
        );
        return;
      }
      next(err);
    }
  };
}
