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

/** Returns a stable color for a given userId. */
export function hashColor(userId: string): string {
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0
  }
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length]
}

/** Returns the initials (up to 2 letters) of a name. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/**
 * Converts a pixel position (relative to the container) to percentage (0–100).
 * Clamps to ensure the avatar stays within bounds.
 */
export function toPercent(px: number, total: number): number {
  return Math.min(100, Math.max(0, (px / total) * 100))
}
