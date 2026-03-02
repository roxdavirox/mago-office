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

// Mapeamento status/lastAction → zone id
export function getAgentZone(status: string, lastAction = ''): string {
  if (status === 'idle') return 'coffee-corner'
  if (status === 'offline' || status === 'blocked') return 'lobby'

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

  return 'dev-zone' // default para working/thinking
}
