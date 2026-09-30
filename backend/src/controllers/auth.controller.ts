import type { Request, Response, NextFunction } from "express";
import { authService } from "../services/auth.service";
import { ok } from "../utils/http";
import { unauthorized } from "../utils/errors";

function meta(req: Request) {
  return { user_agent: req.headers["user-agent"] };
}

export const authController = {
  register: asyncHandlerWrap(async (req, res) => {
    const result = await authService.register(req.body, meta(req));
    ok(res, result, 201);
  }),

  login: asyncHandlerWrap(async (req, res) => {
    const result = await authService.login(req.body, meta(req));
    ok(res, result);
  }),

  refresh: asyncHandlerWrap(async (req, res) => {
    const token = req.body?.refresh_token ?? req.cookies?.refresh_token;
    if (!token || typeof token !== "string") throw unauthorized("Refresh token is required");
    const result = await authService.refresh(token, meta(req));
    ok(res, result);
  }),

  logout: asyncHandlerWrap(async (req, res) => {
    const token = req.body?.refresh_token ?? req.cookies?.refresh_token;
    await authService.logout(typeof token === "string" ? token : undefined);
    res.clearCookie("refresh_token");
    ok(res, { message: "Logged out successfully" });
  }),

  me: asyncHandlerWrap(async (req, res) => {
    ok(res, { user: req.user });
  }),

  updateProfile: asyncHandlerWrap(async (req, res) => {
    if (!req.user) throw unauthorized();
    const updated = await authService.updateProfile(req.user.user_id, req.body);
    ok(res, { user: updated });
  }),
};

/** Local async wrapper to keep this file self-contained. */
function asyncHandlerWrap(fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
}
