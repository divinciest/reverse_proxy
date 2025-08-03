import { clsx } from 'clsx'; import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatCurrency = (value: number): string => new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigiots: 2,
  maximumFractionDigits: 2,
}).format(value);

export const formatNumber = (value: number): string => new Intl.NumberFormat('en-US').format(value);

export const formatPercentage = (value: number): string => new Intl.NumberFormat('en-US', {
  style: 'percent',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
}).format(value / 100);

export const formatCompactNumber = (value: number): string => new Intl.NumberFormat('en-US', {
  notation: 'compact',
  compactDisplay: 'short',
}).format(value);
