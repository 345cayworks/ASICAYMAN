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

// ----- Membership application -----
export const membershipApplicationSchema = z
  .object({
    name: z.string().trim().min(2, "Please enter your full name").max(120),
    email: z.string().trim().toLowerCase().email("Enter a valid email"),
    phone: z.string().trim().min(5, "Enter a phone number").max(40),
    whatsapp: z.string().trim().max(40).optional().or(z.literal("")),
    churchAffiliation: z
      .string()
      .trim()
      .min(2, "Tell us your home church or company")
      .max(160),
    membershipType: z.enum(["INDIVIDUAL", "BUSINESS", "STUDENT"]),
    reason: z
      .string()
      .trim()
      .min(20, "Tell us a little about why you'd like to join")
      .max(2000),
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
