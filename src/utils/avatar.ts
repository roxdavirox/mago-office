import { pipe } from '@tecnomancy/alchemy'

/**
 * Color palette for human avatars.
 * Generated via userId hash — uniform distribution.
 */
const AVATAR_PALETTE = [
  '#3b82f6', // blue
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
  '#a855f7', // purple
  '#84cc16', // lime
  '#06b6d4', // cyan
  '#f43f5e', // rose
]

const charCodes = (s: string): number[] => Array.from(s).map((c) => c.charCodeAt(0))
const foldHash = (codes: number[]): number => codes.reduce((h, c) => ((h * 31 + c) >>> 0), 0)

/** Returns a stable color for a given userId. */
export const hashColor = (userId: string): string =>
  pipe(userId, charCodes, foldHash, (h) => AVATAR_PALETTE[h % AVATAR_PALETTE.length])

const words = (s: string): string[] => s.trim().split(/\s+/)
const abbreviate = (parts: string[]): string =>
  parts.length === 1
    ? parts[0].slice(0, 2).toUpperCase()
    : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()

/** Returns the initials (up to 2 letters) of a name. */
export const initials = (name: string): string => pipe(name, words, abbreviate)

/**
 * Converts a pixel position (relative to the container) to percentage (0–100).
 * Clamps to ensure the avatar stays within bounds.
 */
export function toPercent(px: number, total: number): number {
  return Math.min(100, Math.max(0, (px / total) * 100))
}
