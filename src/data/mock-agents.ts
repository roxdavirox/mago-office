import type { RawAgent } from '../hooks/useOfficeState'

const NOW = new Date().toISOString()

/**
 * Mock agents for development without the MAGO backend.
 * Covers all 6 office zones so the layout is fully exercised:
 *
 *   rx-architect   → dev-zone        (working, task genérica)
 *   rx-backend     → review-room     (working + "revisando")
 *   rx-orchestrator→ planning-board  (working + "sprint")
 *   rx-analyst     → analysis-area   (working + "analyzing")
 *   rx-monitor     → coffee-corner   (idle)
 *   rx-deployer    → lobby           (offline)
 *
 * Activate via: VITE_MOCK_MODE=true
 */
export const MOCK_AGENTS: RawAgent[] = [
  {
    id: 'rx-architect',
    name: 'Architect',
    role: 'architect',
    status: 'working',
    current_task: 'Implementando feature de autenticacao',
    progress: 42,
    last_heartbeat: NOW,
    messages_count: 12,
  },
  {
    id: 'rx-backend',
    name: 'Backend',
    role: 'backend',
    status: 'working',
    current_task: 'revisando pull request #84',
    progress: 80,
    last_heartbeat: NOW,
    messages_count: 7,
  },
  {
    id: 'rx-orchestrator',
    name: 'Orchestrator',
    role: 'orchestrator',
    status: 'working',
    current_task: 'Organizando sprint backlog',
    progress: 60,
    last_heartbeat: NOW,
    messages_count: 34,
  },
  {
    id: 'rx-analyst',
    name: 'Analyst',
    role: 'analyst',
    status: 'working',
    current_task: 'Analyzing edge cases no fluxo de auth',
    progress: 25,
    last_heartbeat: NOW,
    messages_count: 5,
  },
  {
    id: 'rx-monitor',
    name: 'Monitor',
    role: 'monitor',
    status: 'idle',
    current_task: 'Aguardando proximo ciclo',
    progress: null,
    last_heartbeat: NOW,
    messages_count: 0,
  },
  {
    id: 'rx-deployer',
    name: 'Deployer',
    role: 'deployer',
    status: 'offline',
    current_task: '',
    progress: null,
    last_heartbeat: NOW,
    messages_count: 0,
  },
]
