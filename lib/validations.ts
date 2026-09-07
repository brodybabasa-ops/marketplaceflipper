import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().email("Enter a valid email."),
  password: z.string().min(1, "Password is required."),
});

export const signUpSchema = z.object({
  firstName: z.string().min(1, "First name is required.").max(60),
  lastName: z.string().min(1, "Last name is required.").max(60),
  email: z.string().email("Enter a valid email."),
  password: z
    .string()
    .min(8, "Use at least 8 characters.")
    .regex(/[A-Za-z]/, "Include a letter.")
    .regex(/[0-9]/, "Include a number."),
  role: z.enum(["CUSTOMER", "MECHANIC"]),
});

export const vehicleSchema = z.object({
  year: z.coerce.number().int().min(1980).max(new Date().getFullYear() + 1),
  makeId: z.string().uuid(),
  modelId: z.string().uuid(),
  trim: z.string().max(80).optional(),
  engine: z.string().max(80).optional(),
  drivetrain: z.string().max(40).optional(),
  mileage: z.coerce.number().int().min(0).max(1_000_000),
  vin: z.string().max(17).optional(),
  plate: z.string().max(12).optional(),
  color: z.string().max(40).optional(),
  nickname: z.string().max(60).optional(),
  notes: z.string().max(500).optional(),
});

export const serviceRequestSchema = z
  .object({
    vehicleId: z.string().uuid().optional(),
    assetId: z.string().uuid().optional(),
    problemText: z.string().min(8, "Tell us what’s going on."),
    description: z.string().max(2000).optional(),
    zip: z.string().min(5, "Enter a ZIP code.").max(10),
    preferredDate: z.string().optional(),
    preferredTimeWindow: z.string().optional(),
    budgetCents: z.coerce.number().int().min(0).optional(),
    mobilePreferred: z.coerce.boolean().optional(),
    mechanicProfileId: z.string().uuid().optional(),
    whenItHappens: z.string().max(40).optional(),
    noticedWhen: z.array(z.string()).optional(),
    startedWhen: z.string().max(80).optional(),
    warningLights: z.string().max(200).optional(),
    drivability: z.string().max(80).optional(),
    summary: z.string().max(500).optional(),
    requestKind: z.enum(["REPAIR", "MAINTENANCE", "DIAGNOSTIC", "PRE_PURCHASE", "INSPECTION", "FLEET_PM", "ROADSIDE"]).optional(),
    urgencyMode: z.enum(["NORMAL", "URGENT"]).optional(),
  })
  .refine((value) => Boolean(value.vehicleId || value.assetId), { message: "Choose something from your garage." });

export const genericAssetSchema = z.object({
  industryKey: z.string().min(2),
  assetTypeKey: z.string().min(2),
  year: z.coerce.number().int().min(1950).max(new Date().getFullYear() + 1).optional(),
  manufacturer: z.string().min(1).max(80),
  model: z.string().min(1).max(80),
  nickname: z.string().max(60).optional(),
  usageValue: z.coerce.number().min(0).optional(),
  serial: z.string().max(80).optional(),
});

export const estimateSchema = z.object({
  jobId: z.string().uuid(),
  type: z.enum(["PRELIMINARY", "PRIMARY", "CHANGE_ORDER"]).default("PRIMARY"),
  reason: z.string().max(1000).optional(),
  notes: z.string().max(2000).optional(),
  lineItems: z
    .array(
      z.object({
        category: z.enum(["DIAGNOSTIC", "PARTS", "LABOR", "SUPPLIES", "OTHER"]),
        description: z.string().min(1),
        quantity: z.coerce.number().positive(),
        unitCents: z.coerce.number().int().min(0),
      }),
    )
    .min(1, "Add at least one line item."),
});

export const reviewSchema = z.object({
  jobId: z.string().uuid(),
  overallRating: z.coerce.number().int().min(1).max(5),
  communicationRating: z.coerce.number().int().min(1).max(5),
  professionalismRating: z.coerce.number().int().min(1).max(5),
  pricingRating: z.coerce.number().int().min(1).max(5),
  timelinessRating: z.coerce.number().int().min(1).max(5),
  qualityRating: z.coerce.number().int().min(1).max(5),
  wouldUseAgain: z.coerce.boolean(),
  body: z.string().min(12, "Share a bit more about the repair."),
});

export const messageSchema = z.object({
  threadId: z.string().uuid(),
  body: z.string().min(1).max(4000),
});

export const mechanicOnboardingSchema = z.object({
  businessName: z.string().min(2).max(80),
  bio: z.string().min(20, "Tell customers a little about your work.").max(1200),
  yearsExperience: z.coerce.number().int().min(0).max(60),
  serviceMode: z.enum(["MOBILE", "SHOP", "BOTH"]),
  shopCity: z.string().min(2),
  shopState: z.string().min(2).max(2),
  shopZip: z.string().min(5).max(10),
  serviceRadiusMiles: z.coerce.number().int().min(5).max(150),
  diagnosticPriceCents: z.coerce.number().int().min(0),
  laborRateCents: z.coerce.number().int().min(0),
  mobileFeeCents: z.coerce.number().int().min(0),
  industryKeys: z.array(z.string()).optional(),
});

export const disputeSchema = z.object({
  jobId: z.string().uuid(),
  category: z.enum([
    "REPAIR_DIDNT_FIX",
    "UNEXPECTED_CHARGE",
    "WORKMANSHIP",
    "NO_SHOW",
    "VEHICLE_DAMAGE",
    "COMMUNICATION",
    "UNAUTHORIZED_WORK",
    "WORK_NOT_COMPLETED",
    "OTHER",
  ]),
  description: z.string().min(12).max(3000),
});
