/**
 * Cores por agente — chaves são os IDs reais da API (GET /api/dashboard/agents).
 * A ordem define o índice de posicionamento anti-sobreposição (0, 1, 2).
 */
export const AGENT_COLORS = {
  'rx-architect':    '#8b5cf6', // violet  — Claude
  'rx-backend':      '#10b981', // emerald — Gemini
  'rx-orchestrator': '#f59e0b', // amber   — OpenCode
} as const

/** Cor usada quando o agente não está mapeado em AGENT_COLORS */
export const DEFAULT_AGENT_COLOR = '#6b7280'

/** Retorna a cor do agente pelo ID, ou DEFAULT_AGENT_COLOR como fallback */
export function getAgentColor(agentId: string): string {
  return (AGENT_COLORS as Record<string, string>)[agentId] ?? DEFAULT_AGENT_COLOR
}

/**
 * Labels de exibição para cada status de agente retornado pelo backend MAGO.
 * Usar como fallback quando o status não está mapeado: `AGENT_STATUS_LABEL[s] ?? s`
 */
export const AGENT_STATUS_LABEL: Record<string, string> = {
  idle:     'idle',
  working:  'working',
  thinking: 'thinking',
  blocked:  'blocked',
  offline:  'offline',
}
