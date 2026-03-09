import { pipe } from '@tecnomancy/alchemy'
import { type Option, Some, None, mapOption, unwrapOptionOr } from '@tecnomancy/alchemy/option'

export interface Zone {
  id: string
  label: string
  icon: string
  x: number // % from left (CSS layout)
  y: number // % from top  (CSS layout)
  width: number // % width  (CSS layout)
  height: number // % height (CSS layout)
  color: string // background (dark theme)
  description: string
  /** Coordenadas em pixels no tilemap (office-map.json, 16px/tile) — usadas pelo Phaser (#91) */
  worldX: number
  worldY: number
  worldW: number
  worldH: number
}

export const OFFICE_ZONES: Zone[] = [
  {
    id: 'dev-zone',
    label: 'Dev Zone',
    icon: '⚡',
    x: 2, y: 5, width: 28, height: 30,
    color: '#1e1b4b',
    description: 'Implementation and development',
    worldX: 16, worldY: 32, worldW: 160, worldH: 192,
  },
  {
    id: 'review-room',
    label: 'Review Room',
    icon: '👁',
    x: 34, y: 5, width: 28, height: 30,
    color: '#1a2035',
    description: 'Code review and quality analysis',
    worldX: 192, worldY: 32, worldW: 160, worldH: 192,
  },
  {
    id: 'planning-board',
    label: 'Planning Board',
    icon: '📋',
    x: 66, y: 5, width: 30, height: 30,
    color: '#1f1635',
    description: 'Sprint planning and task management',
    worldX: 368, worldY: 32, worldW: 160, worldH: 192,
  },
  {
    id: 'analysis-area',
    label: 'Analysis Area',
    icon: '🔍',
    x: 2, y: 42, width: 44, height: 30,
    color: '#0f2027',
    description: 'Problem analysis and edge cases',
    worldX: 16, worldY: 240, worldW: 256, worldH: 192,
  },
  {
    id: 'coffee-corner',
    label: 'Coffee Corner',
    icon: '☕',
    x: 50, y: 42, width: 46, height: 30,
    color: '#1a0f0f',
    description: 'Idle agents rest here',
    worldX: 288, worldY: 240, worldW: 256, worldH: 192,
  },
  {
    id: 'lobby',
    label: 'Lobby',
    icon: '🚪',
    x: 2, y: 78, width: 94, height: 18,
    color: '#0d1117',
    description: 'Entrance — humans and offline agents',
    worldX: 16, worldY: 448, worldW: 512, worldH: 96,
  },
]

export const ZONE_BY_ID = Object.fromEntries(OFFICE_ZONES.map((z) => [z.id, z])) as Record<
  string,
  Zone
>

// Re-exported from constants/agent to maintain compatibility with existing imports
export { AGENT_COLORS, DEFAULT_AGENT_COLOR, getAgentColor } from '../constants/agent'

// ─── getAgentZone helpers ────────────────────────────────────────────────────

/** Treats null, undefined and empty string as None. */
const fromNonEmpty = (s: string | null | undefined): Option<string> => (s ? Some(s) : None)

const STATUS_ZONE: Record<string, string> = {
  idle: 'coffee-corner',
  offline: 'lobby',
  blocked: 'lobby',
}

const actionToZone = (action: string): string => {
  if (action.includes('review') || action.includes('aprovando') || action.includes('revisando'))
    return 'review-room'
  if (
    action.includes('plan') ||
    action.includes('task') ||
    action.includes('sprint') ||
    action.includes('backlog')
  )
    return 'planning-board'
  if (
    action.includes('analyz') ||
    action.includes('analis') ||
    action.includes('inspect') ||
    action.includes('debug')
  )
    return 'analysis-area'
  return 'dev-zone'
}

/**
 * Statuses supported by the MAGO backend:
 *   idle      → coffee-corner
 *   offline   → lobby
 *   blocked   → lobby
 *   working   → zone based on lastAction
 *   thinking  → zone based on lastAction
 *
 * Other values (e.g. undefined, null, empty string) → lobby (safe default)
 */
export const getAgentZone = (status: string | null | undefined, lastAction = ''): string =>
  pipe(
    fromNonEmpty(status),
    mapOption((s) => STATUS_ZONE[s] ?? actionToZone(lastAction.toLowerCase())),
    unwrapOptionOr('lobby'),
  )
