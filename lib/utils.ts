import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Supabase join result lehet tömb vagy objektum — mindig az első elemet adja vissza */
export function getJoined<T>(data: T | T[] | null | undefined): T | null {
  if (!data) return null
  return Array.isArray(data) ? (data[0] ?? null) : data
}

/** Kategóriák névduplicatum-szűrése (Supabase több business_area-ból hozhat ugyanolyan nevűt) */
export function deduplicateByName<T extends { name: string }>(items: T[]): T[] {
  const seen = new Set<string>()
  return items.filter(item => {
    const key = item.name.toLowerCase().trim()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
