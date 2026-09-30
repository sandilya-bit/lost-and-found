import type { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { MulterError } from "multer";
import { AppError } from "../utils/errors";
import { logger } from "../utils/logger";

/** 404 handler for unmatched routes. */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: { code: "NOT_FOUND", message: `Route ${req.method} ${req.originalUrl} does not exist` },
  });
}

/** Central error middleware: translates known errors into clean JSON envelopes. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: { code: err.code, message: err.message },
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const mapped = mapPrismaError(err);
    res.status(mapped.status).json({
      success: false,
      error: { code: mapped.code, message: mapped.message },
    });
    return;
  }

  if (err instanceof MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "Uploaded file exceeds the maximum allowed size"
        : err.code === "LIMIT_UNEXPECTED_FILE"
          ? "Unexpected file field"
          : `Upload error: ${err.message}`;
    res.status(err.code === "LIMIT_FILE_SIZE" ? 413 : 400).json({
      success: false,
      error: { code: "UPLOAD_ERROR", message },
    });
    return;
  }

  if (err instanceof SyntaxError && "body" in (err as object)) {
    res.status(400).json({
      success: false,
      error: { code: "INVALID_JSON", message: "Malformed JSON body" },
    });
    return;
  }

  logger.error("Unhandled error", {
    message: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
  });
  res.status(500).json({
    success: false,
    error: { code: "INTERNAL_ERROR", message: "Internal server error" },
  });
}

function mapPrismaError(err: Prisma.PrismaClientKnownRequestError): {
  status: number;
  code: string;
  message: string;
} {
  switch (err.code) {
    case "P2002":
      return {
        status: 409,
        code: "DUPLICATE",
        message: "A record with this value already exists",
      };
    case "P2025":
      return { status: 404, code: "NOT_FOUND", message: "Record not found" };
    case "P2003":
      return {
        status: 409,
        code: "FK_CONSTRAINT",
        message: "Operation violates a foreign key constraint",
      };
    case "P2011":
      return { status: 400, code: "NULL_CONSTRAINT", message: "A required field is missing" };
    default:
      return { status: 500, code: "DB_ERROR", message: "Database error" };
  }
}
