import { createApp } from "./app";
import { env } from "./config/env";
import { prisma } from "./config/prisma";
import { logger } from "./utils/logger";
import { authService } from "./services/auth.service";

async function main(): Promise<void> {
  // Verify database connectivity early with a clear message.
  try {
    await prisma.$queryRaw`SELECT 1`;
    logger.info("Database connection established");
  } catch (err) {
    logger.error("Failed to connect to PostgreSQL. Check DATABASE_URL.", {
      message: err instanceof Error ? err.message : String(err),
    });
    process.exit(1);
  }

  if (env.seedOnStart) {
    try {
      const { seedDatabase } = await import("../prisma/seed");
      await seedDatabase();
    } catch (err) {
      logger.warn("Seed step failed or was skipped", {
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const app = createApp();
  const server = app.listen(env.port, () => {
    logger.info(`API listening on port ${env.port} (${env.nodeEnv})`);
  });

  // Periodically prune expired refresh sessions (every 6 hours).
  const pruneTimer = setInterval(() => {
    authService.pruneExpiredSessions().catch(() => undefined);
  }, 6 * 60 * 60 * 1000);
  pruneTimer.unref?.();

  const shutdown = (signal: string) => {
    logger.info(`${signal} received — shutting down gracefully`);
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
    // Force exit if connections refuse to drain.
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((err) => {
  logger.error("Fatal startup error", {
    message: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
  });
  process.exit(1);
});
