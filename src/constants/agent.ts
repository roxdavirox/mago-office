/**
 * Cores por agente — chaves são os IDs reais da API (GET /api/dashboard/agents).
 * A ordem define o índice de posicionamento anti-sobreposição (0, 1, 2).
 */
export const AGENT_COLORS: Record<string, string> = {
  'rx-architect':    '#8b5cf6', // violet  — Claude
  'rx-backend':      '#10b981', // emerald — Gemini
  'rx-orchestrator': '#f59e0b', // amber   — OpenCode
}

export const DEFAULT_AGENT_COLOR = '#6b7280'

export function getAgentColor(agentId: string): string {
  return AGENT_COLORS[agentId] ?? DEFAULT_AGENT_COLOR
}

export const AGENT_STATUS_LABEL: Record<string, string> = {
  idle:     'idle',
  working:  'working',
  thinking: 'thinking',
  blocked:  'blocked',
  offline:  'offline',
}
