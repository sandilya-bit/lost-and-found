import { Router, type Request, type Response, type NextFunction } from "express";
import { authController } from "../controllers/auth.controller";
import { userController } from "../controllers/user.controller";
import { itemControllerFactory } from "../controllers/item.controller";
import { claimController } from "../controllers/claim.controller";
import { statsController } from "../controllers/stats.controller";
import { requireAuth, requireAdmin } from "../middleware/auth";
import { validate } from "../utils/http";
import { parseClaimFilters } from "../services/query.service";
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  createLostItemSchema,
  createFoundItemSchema,
  updateLostItemSchema,
  updateFoundItemSchema,
  createClaimSchema,
  reviewClaimSchema,
  updateProfileSchema,
} from "../validators/schemas";
import {
  apiLimiter,
  authLimiter,
  writeLimiter,
  uploadMiddleware,
} from "../middleware/security";

const router = Router();

/* ------------------------------ AUTH --------------------------------- */

const authRouter = Router();
authRouter.post("/register", authLimiter, validate(registerSchema), authController.register);
authRouter.post("/login", authLimiter, validate(loginSchema), authController.login);
authRouter.post("/refresh", authLimiter, validate(refreshSchema), authController.refresh);
authRouter.post("/logout", authController.logout);

/* --------------------------- LOST ITEMS ------------------------------- */

const lostItemsRouter = Router();
const lost = itemControllerFactory("lost");
const singleImage = uploadMiddleware.single("image");

lostItemsRouter.get("/", apiLimiter, lost.list);
lostItemsRouter.get("/:id", apiLimiter, lost.getById);
lostItemsRouter.get("/:id/matches", requireAuth, apiLimiter, lost.matches);
lostItemsRouter.post("/", requireAuth, writeLimiter, singleImage, validate(createLostItemSchema), lost.create);
lostItemsRouter.put("/:id", requireAuth, writeLimiter, singleImage, validate(updateLostItemSchema), lost.update);
lostItemsRouter.delete("/:id", requireAuth, writeLimiter, lost.remove);

/* --------------------------- FOUND ITEMS ------------------------------ */

const foundItemsRouter = Router();
const found = itemControllerFactory("found");

foundItemsRouter.get("/", apiLimiter, found.list);
foundItemsRouter.get("/:id", apiLimiter, found.getById);
foundItemsRouter.post("/", requireAuth, writeLimiter, singleImage, validate(createFoundItemSchema), found.create);
foundItemsRouter.put("/:id", requireAuth, writeLimiter, singleImage, validate(updateFoundItemSchema), found.update);
foundItemsRouter.delete("/:id", requireAuth, writeLimiter, found.remove);

/* ----------------------------- CLAIMS --------------------------------- */

/** Stashes parsed claim filters on the request for the controller. */
function claimFilterParser(req: Request, _res: Response, next: NextFunction): void {
  (req as unknown as { claimFilters?: unknown }).claimFilters = parseClaimFilters(
    req.query as Record<string, unknown>
  );
  next();
}

const claimsRouter = Router();
claimsRouter.get("/", requireAuth, apiLimiter, claimFilterParser, claimController.list);
claimsRouter.get("/:id", requireAuth, apiLimiter, claimController.getById);
claimsRouter.post(
  "/",
  requireAuth,
  writeLimiter,
  uploadMiddleware.single("proof_image"),
  validate(createClaimSchema),
  claimController.create
);
claimsRouter.put("/:id", requireAuth, writeLimiter, validate(reviewClaimSchema), claimController.review);

/* ----------------------------- USERS ---------------------------------- */

const usersRouter = Router();
usersRouter.get("/", requireAuth, requireAdmin, userController.list);
usersRouter.get("/:id", requireAuth, userController.getById);
usersRouter.put("/me", requireAuth, validate(updateProfileSchema), authController.updateProfile);

/* ----------------------------- STATS ---------------------------------- */

const statsRouter = Router();
statsRouter.get("/public", apiLimiter, statsController.publicStats);
statsRouter.get("/dashboard", requireAuth, statsController.dashboard);
statsRouter.get("/admin", requireAuth, requireAdmin, statsController.admin);

/* ----------------------------- MOUNT ---------------------------------- */

router.use("/auth", authRouter);
router.use("/lost-items", lostItemsRouter);
router.use("/found-items", foundItemsRouter);
router.use("/claims", claimsRouter);
router.use("/users", usersRouter);
router.use("/stats", statsRouter);

export default router;
