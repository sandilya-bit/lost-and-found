import dotenv from "dotenv";
import path from "path";

// Load root .env first (monorepo layout), then backend/.env as fallback.
dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });
dotenv.config();

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required environment variable: ${name}`);
  return v;
}

function int(name: string, fallback: number): number {
  const v = process.env[name];
  if (!v) return fallback;
  const n = Number.parseInt(v, 10);
  return Number.isNaN(n) ? fallback : n;
}

function bool(name: string, fallback: boolean): boolean {
  const v = process.env[name];
  if (v === undefined) return fallback;
  return ["1", "true", "yes", "on"].includes(v.toLowerCase());
}

function list(name: string, fallback: string[]): string[] {
  const v = process.env[name];
  if (!v) return fallback;
  return v.split(",").map((s) => s.trim()).filter(Boolean);
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  isProd: process.env.NODE_ENV === "production",
  port: int("PORT", 5000),

  databaseUrl: required("DATABASE_URL"),

  jwt: {
    accessSecret: required("JWT_ACCESS_SECRET"),
    refreshSecret: required("JWT_REFRESH_SECRET"),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? "15m",
    refreshExpiresInDays: int("JWT_REFRESH_EXPIRES_IN_DAYS", 7),
  },

  cors: {
    origins: list("CLIENT_URL", [
      "http://localhost:5173",
      "http://localhost:8080",
      "http://localhost:3000",
    ]),
  },

  uploads: {
    dir: process.env.UPLOAD_DIR ?? "uploads",
    maxMb: int("MAX_UPLOAD_MB", 5),
    publicPath: "/uploads",
  },

  seedOnStart: bool("SEED_ON_START", false),
} as const;

// Guard against trivially guessable JWT secrets in production.
if (env.isProd) {
  if (env.jwt.accessSecret.length < 32 || env.jwt.refreshSecret.length < 32) {
    // Not fatal: log loudly and continue so the container still boots.
    // eslint-disable-next-line no-console
    console.warn(
      "[config] WARNING: JWT secrets are shorter than 32 chars in production. Generate secrets with `openssl rand -hex 32`."
    );
  }
}
