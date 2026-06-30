import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const SITE = {
  name: "Adventist Business Community",
  shortName: "ABC",
  longName: "Adventist Business Community — Cayman Islands",
  tagline: "Showcase. Connect. Succeed.",
  email: "info@345guide.com",
  whatsapp: "345-324-9000",
  whatsappLink: "https://wa.me/13453249000",
  rbcAccount: {
    name: "ASI Cayman Cheque Account",
    number: "06975-1154855",
    bank: "Royal Bank of Canada (RBC), Cayman",
  },
  expo: {
    date: "Sunday, June 28, 2026",
    time: "2:00 PM",
    location: "The Lion Center, Grand Cayman",
    earlyBirdDeadline: "May 31, 2026",
  },
} as const;
