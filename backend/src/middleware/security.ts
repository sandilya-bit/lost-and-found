import type { RequestHandler } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import cors from "cors";
import multer from "multer";
import path from "path";
import crypto from "crypto";
import { env } from "../config/env";
import { unprocessable } from "../utils/errors";

/* ------------------------------ CORS ---------------------------------- */

const allowedOrigins = new Set(env.cors.origins);

export const corsMiddleware = cors({
  origin(origin, callback) {
    // Allow non-browser tools (curl, Postman) which omit Origin.
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  maxAge: 86400,
});

/* --------------------------- Security headers -------------------------- */

export const securityHeaders = helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],
      "img-src": ["'self'", "data:", "blob:"],
      // Swagger UI injects inline scripts/styles; allow them in non-prod only.
      "script-src": env.isProd ? ["'self'"] : ["'self'", "'unsafe-inline'"],
      "style-src": env.isProd ? ["'self'"] : ["'self'", "'unsafe-inline'"],
    },
  },
  crossOriginResourcePolicy: { policy: "same-site" },
  referrerPolicy: { policy: "no-referrer" },
});

/* --------------------------- Rate limiting ----------------------------- */

const json =
  (message: string, code: string) =>
  (req: { path: string }, res: { status: (n: number) => { json: (b: unknown) => void } }): void => {
    res.status(429).json({ success: false, error: { code, message, path: req.path } });
  };

export const apiLimiter: RequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: json("Too many requests from this IP, please slow down", "RATE_LIMITED"),
});

/** Stricter limiter for credential endpoints (brute-force mitigation). */
export const authLimiter: RequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  message: json("Too many authentication attempts, please try again in 15 minutes", "RATE_LIMITED"),
});

/** Limiter for resource-mutating endpoints (spam mitigation). */
export const writeLimiter: RequestHandler = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 120,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: json("Too many write operations, please try again later", "RATE_LIMITED"),
});

/* --------------------------- File uploads ------------------------------ */

const ALLOWED_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export const uploadMiddleware = multer({
  storage: multer.diskStorage({
    destination(_req, _file, cb) {
      cb(null, env.uploads.dir);
    },
    filename(_req, file, cb) {
      const ext = ALLOWED_MIME[file.mimetype] ?? (path.extname(file.originalname).slice(1) || "bin");
      cb(null, `${Date.now()}-${crypto.randomBytes(8).toString("hex")}.${ext}`);
    },
  }),
  limits: { fileSize: env.uploads.maxMb * 1024 * 1024, files: 1 },
  fileFilter(_req, file, cb) {
    if (ALLOWED_MIME[file.mimetype]) return cb(null, true);
    cb(unprocessable("Only JPEG, PNG, WebP or GIF images are allowed"));
  },
});

/** 404-aware helper for serving the uploads directory safely. */
export const uploadsNotFoundHandler: RequestHandler = (req, res, next) => {
  if (req.path.startsWith("/uploads")) {
    res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "File not found" } });
    return;
  }
  next();
};
