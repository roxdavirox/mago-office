export interface Zone {
  id: string
  label: string
  icon: string
  x: number       // % from left
  y: number       // % from top
  width: number   // % width
  height: number  // % height
  color: string   // background (dark theme)
  description: string
}

export const OFFICE_ZONES: Zone[] = [
  {
    id: 'dev-zone',
    label: 'Dev Zone',
    icon: '⚡',
    x: 2, y: 5, width: 28, height: 30,
    color: '#1e1b4b',
    description: 'Implementação e desenvolvimento',
  },
  {
    id: 'review-room',
    label: 'Review Room',
    icon: '👁',
    x: 34, y: 5, width: 28, height: 30,
    color: '#1a2035',
    description: 'Code review e análise de qualidade',
  },
  {
    id: 'planning-board',
    label: 'Planning Board',
    icon: '📋',
    x: 66, y: 5, width: 30, height: 30,
    color: '#1f1635',
    description: 'Sprint planning e task management',
  },
  {
    id: 'analysis-area',
    label: 'Analysis Area',
    icon: '🔍',
    x: 2, y: 42, width: 44, height: 30,
    color: '#0f2027',
    description: 'Análise de problemas e edge cases',
  },
  {
    id: 'coffee-corner',
    label: 'Coffee Corner',
    icon: '☕',
    x: 50, y: 42, width: 46, height: 30,
    color: '#1a0f0f',
    description: 'Agentes em idle descansam aqui',
  },
  {
    id: 'lobby',
    label: 'Lobby',
    icon: '🚪',
    x: 2, y: 78, width: 94, height: 18,
    color: '#0d1117',
    description: 'Entrada — humanos e agentes offline',
  },
]

export const ZONE_BY_ID = Object.fromEntries(
  OFFICE_ZONES.map(z => [z.id, z]),
) as Record<string, Zone>

/**
 * Offsets dentro de uma zona por índice do agente (0-based).
 * Valores em % relativo à zona (0–100).
 * Garante anti-sobreposição para até 3 agentes.
 */
const AGENT_ZONE_OFFSETS = [
  { x: 25, y: 40 }, // agent-1
  { x: 50, y: 40 }, // agent-2
  { x: 75, y: 40 }, // agent-3
]

const DEFAULT_OFFSET = { x: 50, y: 50 }

export interface AgentPosition {
  /** % from left of the canvas */
  x: number
  /** % from top of the canvas */
  y: number
}

/**
 * Calcula a posição absoluta (% do canvas) de um agente dentro de sua zona,
 * usando o índice do agente para evitar sobreposição.
 *
 * @param zoneId   ID da zona onde o agente está
 * @param agentIndex  Índice 0-based do agente (0=agent-1, 1=agent-2, 2=agent-3)
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

// Cores por agente
export const AGENT_COLORS: Record<string, string> = {
  'agent-1': '#8b5cf6', // violet  — Claude
  'agent-2': '#10b981', // emerald — Gemini
  'agent-3': '#f59e0b', // amber   — OpenCode
}

export const DEFAULT_AGENT_COLOR = '#6b7280'

export function getAgentColor(agentId: string): string {
  return AGENT_COLORS[agentId] ?? DEFAULT_AGENT_COLOR
}

/**
 * Statuses suportados pelo MAGO backend:
 *   idle      → coffee-corner
 *   offline   → lobby
 *   blocked   → lobby
 *   working   → zona baseada em lastAction
 *   thinking  → zona baseada em lastAction
 *
 * Outros valores (ex: undefined, null, desconhecido) → lobby (safe default)
 */
export function getAgentZone(status: string | null | undefined, lastAction = ''): string {
  if (!status) return 'lobby'

  if (status === 'idle') return 'coffee-corner'
  if (status === 'offline' || status === 'blocked') return 'lobby'

  // Para working/thinking: usar lastAction para refinar a zona
  const action = lastAction.toLowerCase()

  if (action.includes('review') || action.includes('aprovando') || action.includes('revisando')) {
    return 'review-room'
  }
  if (action.includes('plan') || action.includes('task') || action.includes('sprint') || action.includes('backlog')) {
    return 'planning-board'
  }
  if (action.includes('analyz') || action.includes('analis') || action.includes('inspect') || action.includes('debug')) {
    return 'analysis-area'
  }

  return 'dev-zone'
}
