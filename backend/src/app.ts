import express from "express";
import cookieParser from "cookie-parser";
import path from "path";
import fs from "fs";
import { env } from "./config/env";
import { corsMiddleware, securityHeaders, uploadsNotFoundHandler } from "./middleware/security";
import { notFoundHandler, errorHandler } from "./middleware/error";
import { apiLimiter } from "./middleware/security";
import routes from "./routes";

export function createApp(): express.Express {
  const app = express();

  // Trust the first proxy hop (nginx / reverse proxies) so rate limiting
  // and req.ip reflect real client addresses.
  app.set("trust proxy", 1);
  app.disable("x-powered-by");

  app.use(securityHeaders);
  app.use(corsMiddleware);

  // Body parsing — payload limits enforced here too.
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));
  app.use(cookieParser());

  // Ensure the uploads directory exists, then serve it statically.
  const uploadsDir = path.resolve(process.cwd(), env.uploads.dir);
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  app.use(
    env.uploads.publicPath,
    express.static(uploadsDir, {
      fallthrough: false,
      maxAge: "7d",
      setHeaders(res) {
        res.setHeader("X-Content-Type-Options", "nosniff");
      },
    })
  );

  // Health + docs
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", uptime: process.uptime(), timestamp: new Date().toISOString() });
  });

  app.get("/", apiLimiter, (_req, res) => {
    res.json({
      name: "Lost & Found Management System API",
      version: "1.0.0",
      docs: "/api-docs",
      health: "/health",
    });
  });

  // OpenAPI viewer (non-production convenience; spec served at /api-docs/swagger.json)
  if (!env.isProd) {
    const { serveDocs } = require("./docs/swagger") as { serveDocs: (a: express.Express) => void };
    serveDocs(app);
  }

  // API routes
  app.use("/api", routes);

  // Static uploads 404 handling + unmatched routes + errors
  app.use(uploadsNotFoundHandler);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
