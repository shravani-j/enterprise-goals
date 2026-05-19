import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseDateSafely(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  
  // 1. Try standard new Date parsing first
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return d;
  }
  
  // 2. Try parsing DD-MM-YYYY format
  const parts = dateStr.split(/[-/]/);
  if (parts.length === 3) {
    const p0 = parseInt(parts[0], 10);
    const p1 = parseInt(parts[1], 10);
    const p2 = parseInt(parts[2], 10);
    
    if (p0 <= 31 && p1 <= 12 && p2 > 1000) {
      // DD-MM-YYYY
      const parsed = new Date(p2, p1 - 1, p0);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    } else if (p0 > 1000 && p1 <= 12 && p2 <= 31) {
      // YYYY-MM-DD
      const parsed = new Date(p0, p1 - 1, p2);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }
  }
  
  return null;
}
