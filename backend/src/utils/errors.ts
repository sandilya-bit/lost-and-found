/* Application error type + helpers for consistent error responses. */

export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(statusCode: number, message: string, code = "ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Error.captureStackTrace?.(this, AppError);
  }
}

export const badRequest = (msg = "Bad request") => new AppError(400, msg, "BAD_REQUEST");
export const unauthorized = (msg = "Authentication required") => new AppError(401, msg, "UNAUTHORIZED");
export const forbidden = (msg = "You do not have permission to perform this action") =>
  new AppError(403, msg, "FORBIDDEN");
export const notFound = (msg = "Resource not found") => new AppError(404, msg, "NOT_FOUND");
export const conflict = (msg = "Resource already exists") => new AppError(409, msg, "CONFLICT");
export const payloadTooLarge = (msg = "Payload too large") => new AppError(413, msg, "PAYLOAD_TOO_LARGE");
export const unprocessable = (msg = "Validation failed") => new AppError(422, msg, "VALIDATION_ERROR");
export const tooMany = (msg = "Too many requests, please try again later") =>
  new AppError(429, msg, "RATE_LIMITED");
export const internal = (msg = "Internal server error") => new AppError(500, msg, "INTERNAL_ERROR");
