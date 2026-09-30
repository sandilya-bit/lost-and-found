import { z } from "zod";

const IMAGE_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  email: z.string().trim().toLowerCase().email("A valid email is required").max(254),
  phone: z
    .string()
    .trim()
    .regex(/^[+]?[\d\s()-]{7,20}$/, "Phone must be 7–20 digits (spaces, dashes, + allowed)")
    .optional()
    .or(z.literal("")),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be at most 72 characters")
    .regex(/[A-Za-z]/, "Password must contain a letter")
    .regex(/\d/, "Password must contain a number"),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("A valid email is required"),
  password: z.string().min(1, "Password is required"),
});

export const refreshSchema = z.object({
  refresh_token: z.string().min(10).optional(),
});

const CATEGORIES = [
  "Electronics",
  "Wallet",
  "Keys",
  "Bags",
  "Documents",
  "Jewelry",
  "Clothing",
  "Books",
  "ID Cards",
  "Water Bottles",
  "Sports Equipment",
  "Other",
] as const;

const categorySchema = z.enum(CATEGORIES, {
  errorMap: () => ({ message: `Category must be one of: ${CATEGORIES.join(", ")}` }),
});

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
  .refine((s) => !Number.isNaN(Date.parse(s)), "Invalid calendar date");

const futureDateCheck = (label: string) =>
  isoDate.refine((s) => new Date(`${s}T00:00:00Z`).getTime() <= Date.now() + 86_400_000, {
    message: `${label} cannot be more than 1 day in the future`,
  });

export const itemBaseSchema = {
  item_name: z.string().trim().min(2, "Item name must be at least 2 characters").max(100),
  category: categorySchema,
  description: z.string().trim().max(2000, "Description too long").optional().or(z.literal("")),
  location: z.string().trim().min(2, "Location is required").max(120),
  date: futureDateCheck("Date"),
};

export const createLostItemSchema = z.object({
  ...itemBaseSchema,
  date_lost: futureDateCheck("Date lost"),
});

export const createFoundItemSchema = z.object({
  ...itemBaseSchema,
  date_found: futureDateCheck("Date found"),
});

export const updateLostItemSchema = createLostItemSchema.partial();
export const updateFoundItemSchema = createFoundItemSchema.partial();

export const createClaimSchema = z.object({
  found_id: z.string().uuid("found_id must be a valid UUID"),
  proof_description: z
    .string()
    .trim()
    .min(20, "Please describe your proof of ownership in at least 20 characters")
    .max(2000),
});

export const reviewClaimSchema = z.object({
  claim_status: z.enum(["APPROVED", "REJECTED"], {
    errorMap: () => ({ message: "claim_status must be APPROVED or REJECTED" }),
  }),
  admin_notes: z.string().trim().max(2000).optional(),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  phone: z
    .string()
    .trim()
    .regex(/^[+]?[\d\s()-]{7,20}$/, "Phone must be 7–20 digits")
    .optional()
    .or(z.literal("")),
  current_password: z.string().min(1).optional(),
  new_password: z
    .string()
    .min(8, "New password must be at least 8 characters")
    .max(72)
    .regex(/[A-Za-z]/, "Password must contain a letter")
    .regex(/\d/, "Password must contain a number")
    .optional(),
});

export const imageMimeTypes = IMAGE_MIME;
