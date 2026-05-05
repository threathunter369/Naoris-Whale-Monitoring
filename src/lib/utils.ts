import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatAddress(address: string) {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatNumber(num: number) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
    notation: num > 1000000 ? 'compact' : 'standard',
  }).format(num);
}
