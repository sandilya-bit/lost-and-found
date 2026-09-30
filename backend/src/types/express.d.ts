import type { user_role } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      user?: {
        user_id: string;
        email: string;
        role: user_role;
        name: string;
      };
    }
  }
}

export {};
