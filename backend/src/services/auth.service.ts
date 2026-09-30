import bcrypt from "bcryptjs";
import crypto from "crypto";
import type { user_role } from "@prisma/client";
import { prisma } from "../config/prisma";
import { env } from "../config/env";
import { unauthorized, conflict, unprocessable } from "../utils/errors";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../middleware/auth";
import { logger } from "../utils/logger";

const BCRYPT_ROUNDS = 12;

interface SessionMeta {
  user_agent?: string;
}

function sha256(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

async function issueSession(
  user: { user_id: string; email: string; role: user_role; name: string },
  meta: SessionMeta
) {
  const jti = crypto.randomUUID();
  const refresh = signRefreshToken({ sub: user.user_id, email: user.email, role: user.role, name: user.name });
  await prisma.refresh_tokens.create({
    data: {
      refresh_id: jti,
      user_id: user.user_id,
      token_hash: sha256(refresh),
      user_agent: meta.user_agent?.slice(0, 255) ?? null,
      expires_at: new Date(Date.now() + env.jwt.refreshExpiresInDays * 86_400_000),
    },
  });
  return refresh;
}

export const authService = {
  async register(data: { name: string; email: string; phone?: string; password: string }, meta: SessionMeta) {
    const existing = await prisma.users.findUnique({ where: { email: data.email }, select: { user_id: true } });
    if (existing) throw conflict("An account with this email already exists");

    const password_hash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);
    const user = await prisma.users.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        password_hash,
        role: "USER",
      },
      select: { user_id: true, name: true, email: true, phone: true, role: true, created_at: true },
    });

    const refresh = await issueSession(user, meta);
    const access = signAccessToken({ sub: user.user_id, email: user.email, role: user.role, name: user.name });
    return { user, access_token: access, refresh_token: refresh };
  },

  async login(data: { email: string; password: string }, meta: SessionMeta) {
    const user = await prisma.users.findUnique({ where: { email: data.email } });
    if (!user) {
      // Constant-shape error to avoid user enumeration.
      throw unauthorized("Invalid email or password");
    }
    const valid = await bcrypt.compare(data.password, user.password_hash);
    if (!valid) throw unauthorized("Invalid email or password");

    const refresh = await issueSession(user, meta);
    const access = signAccessToken({ sub: user.user_id, email: user.email, role: user.role, name: user.name });
    return {
      user: { user_id: user.user_id, name: user.name, email: user.email, phone: user.phone, role: user.role, created_at: user.created_at },
      access_token: access,
      refresh_token: refresh,
    };
  },

  async refresh(refreshToken: string, meta: SessionMeta) {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw unauthorized("Refresh token is invalid or expired");
    }
    if (payload.type !== "refresh") throw unauthorized("Invalid token type");

    const hash = sha256(refreshToken);
    const session = await prisma.refresh_tokens.findUnique({
      where: { token_hash: hash },
      include: { user: true },
    });
    if (!session || session.revoked_at || session.expires_at < new Date()) {
      throw unauthorized("Session is invalid or expired. Please log in again.");
    }
    if (session.user_id !== payload.sub) throw unauthorized("Session does not match token");

    // Rotation: revoke the used token, issue a fresh one.
    await prisma.refresh_tokens.update({
      where: { refresh_id: session.refresh_id },
      data: { revoked_at: new Date() },
    });

    const user = session.user;
    const newRefresh = await issueSession(
      { user_id: user.user_id, email: user.email, role: user.role, name: user.name },
      meta
    );
    const access = signAccessToken({ sub: user.user_id, email: user.email, role: user.role, name: user.name });
    return {
      access_token: access,
      refresh_token: newRefresh,
      user: { user_id: user.user_id, name: user.name, email: user.email, role: user.role },
    };
  },

  async logout(refreshToken: string | undefined) {
    if (refreshToken) {
      const hash = sha256(refreshToken);
      await prisma.refresh_tokens.updateMany({
        where: { token_hash: hash, revoked_at: null },
        data: { revoked_at: new Date() },
      });
    }
    return { message: "Logged out" };
  },

  async updateProfile(
    userId: string,
    data: { name?: string; phone?: string; current_password?: string; new_password?: string }
  ) {
    const user = await prisma.users.findUnique({ where: { user_id: userId } });
    if (!user) throw unauthorized();

    const patch: Record<string, unknown> = {};
    if (data.name !== undefined) patch.name = data.name;
    if (data.phone !== undefined) patch.phone = data.phone || null;

    if (data.new_password) {
      if (!data.current_password) {
        throw unprocessable("Current password is required to change your password");
      }
      const valid = await bcrypt.compare(data.current_password, user.password_hash);
      if (!valid) throw unauthorized("Current password is incorrect");
      patch.password_hash = await bcrypt.hash(data.new_password, BCRYPT_ROUNDS);
      // Revoke all sessions after a password change.
      await prisma.refresh_tokens.updateMany({
        where: { user_id: userId, revoked_at: null },
        data: { revoked_at: new Date() },
      });
    }

    const updated = await prisma.users.update({
      where: { user_id: userId },
      data: patch,
      select: { user_id: true, name: true, email: true, phone: true, role: true, created_at: true, updated_at: true },
    });
    return updated;
  },

  /** Housekeeping: drop expired session rows (call from a cron/interval). */
  async pruneExpiredSessions(): Promise<number> {
    const res = await prisma.refresh_tokens.deleteMany({ where: { expires_at: { lt: new Date() } } });
    if (res.count > 0) logger.info(`Pruned ${res.count} expired refresh sessions`);
    return res.count;
  },
};
