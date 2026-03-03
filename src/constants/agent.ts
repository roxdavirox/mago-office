/**
 * Colors per agent — keys are the real API IDs (GET /api/dashboard/agents).
 * Order defines the anti-overlap positioning index (0, 1, 2).
 */
export const AGENT_COLORS = {
  'rx-architect': '#8b5cf6', // violet  — Claude
  'rx-backend': '#10b981', // emerald — Gemini
  'rx-orchestrator': '#f59e0b', // amber   — OpenCode
} as const

/** Color used when the agent is not mapped in AGENT_COLORS */
export const DEFAULT_AGENT_COLOR = '#6b7280'

/** Returns the agent color by ID, or DEFAULT_AGENT_COLOR as fallback */
export function getAgentColor(agentId: string): string {
  return agentId in AGENT_COLORS
    ? AGENT_COLORS[agentId as keyof typeof AGENT_COLORS]
    : DEFAULT_AGENT_COLOR
}

/**
 * Display labels for each agent status returned by the MAGO backend.
 * Use as fallback when the status is not mapped: `AGENT_STATUS_LABEL[s] ?? s`
 */
export const AGENT_STATUS_LABEL: Record<string, string> = {
  idle: 'idle',
  working: 'working',
  thinking: 'thinking',
  blocked: 'blocked',
  offline: 'offline',
}
