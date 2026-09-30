import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { unauthorized, forbidden } from "../utils/errors";
import { asyncHandler } from "../utils/http";
import type { user_role } from "@prisma/client";

export interface JwtPayloadShape {
  sub: string;      // user_id
  email: string;
  role: user_role;
  name: string;
  type: "access" | "refresh";
}

export function signAccessToken(payload: Omit<JwtPayloadShape, "type">): string {
  return jwt.sign({ ...payload, type: "access" } as object, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpiresIn,
    issuer: "lostfound-api",
  } as jwt.SignOptions);
}

export function signRefreshToken(payload: Omit<JwtPayloadShape, "type">): string {
  return jwt.sign({ ...payload, type: "refresh" } as object, env.jwt.refreshSecret, {
    expiresIn: `${env.jwt.refreshExpiresInDays}d`,
    issuer: "lostfound-api",
  } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): JwtPayloadShape {
  return jwt.verify(token, env.jwt.accessSecret, { issuer: "lostfound-api" }) as JwtPayloadShape;
}

export function verifyRefreshToken(token: string): JwtPayloadShape {
  return jwt.verify(token, env.jwt.refreshSecret, { issuer: "lostfound-api" }) as JwtPayloadShape;
}

/** Requires a valid access token; attaches the decoded payload to req.user. */
export const requireAuth = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) throw unauthorized("Missing or malformed Authorization header");

  const token = header.slice(7).trim();
  let payload: JwtPayloadShape;
  try {
    payload = verifyAccessToken(token);
  } catch {
    throw unauthorized("Access token is invalid or expired");
  }
  if (payload.type !== "access") throw unauthorized("Invalid token type");

  req.user = { user_id: payload.sub, email: payload.email, role: payload.role, name: payload.name };
  next();
});

/** Requires an authenticated user with the ADMIN role. */
export const requireAdmin = (req: Request, _res: Response, next: NextFunction): void => {
  if (!req.user) throw unauthorized();
  if (req.user.role !== "ADMIN") throw forbidden("Admin privileges required");
  next();
};
