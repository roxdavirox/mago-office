/**
 * Paleta de cores para avatares humanos.
 * Gerada via hash do userId — distribuição uniforme.
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

/** Retorna uma cor estável para um dado userId. */
export function hashColor(userId: string): string {
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0
  }
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length]
}

/** Retorna as iniciais (até 2 letras) de um nome. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/**
 * Converte uma posição em pixels (relativa ao container) para percentual (0–100).
 * Clampeia para garantir que o avatar fique dentro dos limites.
 */
export function toPercent(px: number, total: number): number {
  return Math.min(100, Math.max(0, (px / total) * 100))
}
