import { twMerge } from "tailwind-merge";

// Joins class names, skips falsy values, and resolves conflicting Tailwind classes
export function cn(...classes: Array<string | false | null | undefined>) {
  return twMerge(classes.filter(Boolean).join(" "));
}
