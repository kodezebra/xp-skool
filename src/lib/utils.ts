import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const DEFAULT_FEE_CATEGORIES = [
  "Tuition",
  "Uniform",
  "Lunch",
  "Transport",
  "Admission",
  "Building Fund",
  "Medical",
  "Other"
];
