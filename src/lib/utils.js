import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function truncateName(name, max = 15) {
  if (!name) return name;
  return name.length > max ? name.slice(0, max) + "…" : name;
}
