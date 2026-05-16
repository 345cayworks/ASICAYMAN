import { z } from "zod";

// ----- Auth -----
export const signUpSchema = z
  .object({
    name: z.string().trim().min(2, "Please enter your full name").max(120),
    email: z.string().trim().toLowerCase().email("Enter a valid email"),
    phone: z.string().trim().max(40).optional().or(z.literal("")),
    password: z.string().min(8, "Use at least 8 characters").max(120),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords don't match",
  });

export const signInSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

// ----- Membership application (official ASI Cayman form) -----
export const membershipApplicationSchema = z
  .object({
    name: z.string().trim().min(2, "Please enter your name").max(120),
    phone: z.string().trim().min(5, "Enter a phone number").max(40),
    email: z.string().trim().toLowerCase().email("Enter a valid email"),
    businessOrProfession: z
      .string()
      .trim()
      .min(2, "Enter your business or profession")
      .max(160),
    churchAffiliation: z
      .string()
      .trim()
      .min(2, "Enter the name of your church")
      .max(160),
    membershipCategory: z.enum([
      "BUSINESS_UNDER_10",
      "BUSINESS_10_PLUS",
      "PROFESSIONAL",
      "SELF_SUPPORTING_MINISTRY",
    ]),
    commitment: z.literal("YES", {
      errorMap: () => ({
        message: "You must agree to the ASI commitment to apply",
      }),
    }),
    password: z.string().min(8, "Use at least 8 characters").max(120),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords don't match",
  });

export type MembershipApplicationInput = z.infer<typeof membershipApplicationSchema>;

// ----- Expo registration -----
export const expoRegistrationSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  businessName: z.string().trim().min(1).max(160),
  email: z.string().trim().toLowerCase().email(),
  phone: z.string().trim().min(5).max(40),
  businessCategory: z.string().trim().min(1).max(80),
  isAsiMember: z.coerce.boolean().default(false),
  needsBooth: z.coerce.boolean().default(true),
  wantsVideoSubmission: z.coerce.boolean().default(false),
  promoVideoUrl: z
    .string()
    .trim()
    .url("Enter a valid URL")
    .optional()
    .or(z.literal("")),
  wantsInterview: z.coerce.boolean().default(false),
});

export type ExpoRegistrationInput = z.infer<typeof expoRegistrationSchema>;

// ----- Contact form -----
export const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email(),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  inquiry: z.enum(["general", "membership", "expo", "directory", "partnership", "other"]),
  message: z.string().trim().min(10, "Tell us a bit more").max(4000),
});

// ----- Business listing -----
export const businessListingSchema = z.object({
  businessName: z.string().trim().min(1).max(160),
  category: z.string().trim().min(1).max(80),
  description: z.string().trim().min(20).max(4000),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  email: z.string().trim().toLowerCase().email().optional().or(z.literal("")),
  website: z.string().trim().url().optional().or(z.literal("")),
  specialOffer: z.string().trim().max(500).optional().or(z.literal("")),
  socialLinks: z
    .object({
      facebook: z.string().url().optional().or(z.literal("")),
      instagram: z.string().url().optional().or(z.literal("")),
      linkedin: z.string().url().optional().or(z.literal("")),
    })
    .optional(),
});
