import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const SITE = {
  name: "ASI Cayman",
  longName: "Adventist-Laymen's Services & Industries — Cayman",
  tagline: "Showcase. Connect. Succeed.",
  email: "asicayman@gmail.com",
  whatsapp: "345-324-0458",
  whatsappLink: "https://wa.me/13453240458",
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
