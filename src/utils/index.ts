import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = 'USD') {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

export function formatCompact(amount: number, currency: string = 'USD') {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount);
}

export function getCurrencySymbol(currency: string = 'USD') {
  const parts = new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency,
  }).formatToParts(0);
  return parts.find((p) => p.type === 'currency')?.value ?? '$';
}
