export interface Zone {
  id: string
  label: string
  icon: string
  x: number // % from left
  y: number // % from top
  width: number // % width
  height: number // % height
  color: string // background (dark theme)
  description: string
}

export const OFFICE_ZONES: Zone[] = [
  {
    id: 'dev-zone',
    label: 'Dev Zone',
    icon: '⚡',
    x: 2,
    y: 5,
    width: 28,
    height: 30,
    color: '#1e1b4b',
    description: 'Implementation and development',
  },
  {
    id: 'review-room',
    label: 'Review Room',
    icon: '👁',
    x: 34,
    y: 5,
    width: 28,
    height: 30,
    color: '#1a2035',
    description: 'Code review and quality analysis',
  },
  {
    id: 'planning-board',
    label: 'Planning Board',
    icon: '📋',
    x: 66,
    y: 5,
    width: 30,
    height: 30,
    color: '#1f1635',
    description: 'Sprint planning and task management',
  },
  {
    id: 'analysis-area',
    label: 'Analysis Area',
    icon: '🔍',
    x: 2,
    y: 42,
    width: 44,
    height: 30,
    color: '#0f2027',
    description: 'Problem analysis and edge cases',
  },
  {
    id: 'coffee-corner',
    label: 'Coffee Corner',
    icon: '☕',
    x: 50,
    y: 42,
    width: 46,
    height: 30,
    color: '#1a0f0f',
    description: 'Idle agents rest here',
  },
  {
    id: 'lobby',
    label: 'Lobby',
    icon: '🚪',
    x: 2,
    y: 78,
    width: 94,
    height: 18,
    color: '#0d1117',
    description: 'Entrance — humans and offline agents',
  },
]

export const ZONE_BY_ID = Object.fromEntries(OFFICE_ZONES.map((z) => [z.id, z])) as Record<
  string,
  Zone
>

/**
 * Offsets within a zone by agent index (0-based).
 * Values in % relative to the zone (0–100).
 * Guarantees anti-overlap for up to 3 agents.
 */
const AGENT_ZONE_OFFSETS = [
  { x: 25, y: 40 }, // rx-architect (Claude)
  { x: 50, y: 40 }, // rx-backend   (Gemini)
  { x: 75, y: 40 }, // rx-orchestrator (OpenCode)
]

const DEFAULT_OFFSET = { x: 50, y: 50 }

export interface AgentPosition {
  /** % from left of the canvas */
  x: number
  /** % from top of the canvas */
  y: number
}

/**
 * Calculates the absolute position (% of canvas) of an agent within its zone,
 * using the agent index to avoid overlap.
 *
 * @param zoneId      ID of the zone where the agent is located
 * @param agentIndex  0-based agent index (0=agent-1, 1=agent-2, 2=agent-3)
 */
export function getAgentPosition(zoneId: string, agentIndex: number): AgentPosition {
  const zone = ZONE_BY_ID[zoneId]
  if (!zone) return { x: 50, y: 50 }

  const offset = AGENT_ZONE_OFFSETS[agentIndex] ?? DEFAULT_OFFSET

  return {
    x: zone.x + (zone.width * offset.x) / 100,
    y: zone.y + (zone.height * offset.y) / 100,
  }
}

// Re-exported from constants/agent to maintain compatibility with existing imports
export { AGENT_COLORS, DEFAULT_AGENT_COLOR, getAgentColor } from '../constants/agent'

/**
 * Statuses supported by the MAGO backend:
 *   idle      → coffee-corner
 *   offline   → lobby
 *   blocked   → lobby
 *   working   → zone based on lastAction
 *   thinking  → zone based on lastAction
 *
 * Other values (e.g. undefined, null, unknown) → lobby (safe default)
 */
export function getAgentZone(status: string | null | undefined, lastAction = ''): string {
  if (!status) return 'lobby'

  if (status === 'idle') return 'coffee-corner'
  if (status === 'offline' || status === 'blocked') return 'lobby'

  // For working/thinking: use lastAction to refine the zone
  const action = lastAction.toLowerCase()

  if (action.includes('review') || action.includes('aprovando') || action.includes('revisando')) {
    return 'review-room'
  }
  if (
    action.includes('plan') ||
    action.includes('task') ||
    action.includes('sprint') ||
    action.includes('backlog')
  ) {
    return 'planning-board'
  }
  if (
    action.includes('analyz') ||
    action.includes('analis') ||
    action.includes('inspect') ||
    action.includes('debug')
  ) {
    return 'analysis-area'
  }

  return 'dev-zone'
}
