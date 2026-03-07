import type { RawAgent } from '../hooks/useOfficeState'

/**
 * Mock agents for development without the MAGO backend.
 * Covers all 6 office zones so the layout is fully exercised.
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
    last_heartbeat: new Date().toISOString(),
    messages_count: 12,
  },
  {
    id: 'rx-backend',
    name: 'Backend',
    role: 'backend',
    status: 'working',
    current_task: 'revisando pull request #82',
    progress: 80,
    last_heartbeat: new Date().toISOString(),
    messages_count: 7,
  },
  {
    id: 'rx-orchestrator',
    name: 'Orchestrator',
    role: 'orchestrator',
    status: 'idle',
    current_task: 'Aguardando proximo ciclo',
    progress: null,
    last_heartbeat: new Date().toISOString(),
    messages_count: 34,
  },
]
