import type { Page } from '@playwright/test'

/** Fake agents returned by the mocked REST endpoint */
export const MOCK_AGENTS = [
  {
    id: 'rx-architect',
    name: 'rx-architect',
    role: 'architect',
    status: 'working',
    current_task: 'Implementing feature X',
    progress: null,
    last_heartbeat: new Date().toISOString(),
    messages_count: 0,
  },
  {
    id: 'rx-backend',
    name: 'rx-backend',
    role: 'backend',
    status: 'thinking',
    current_task: 'Analyzing requirements',
    progress: null,
    last_heartbeat: new Date().toISOString(),
    messages_count: 0,
  },
  {
    id: 'rx-orchestrator',
    name: 'rx-orchestrator',
    role: 'orchestrator',
    status: 'idle',
    current_task: '',
    progress: null,
    last_heartbeat: new Date().toISOString(),
    messages_count: 0,
  },
]

/**
 * Sets up route mocks needed for every E2E test:
 *  - REST: GET /api/dashboard/agents → returns MOCK_AGENTS
 *  - Socket.io polling: silently drops all requests (app stays "connecting")
 */
export async function setupMocks(page: Page): Promise<void> {
  // Mock the agents REST endpoint
  await page.route('**/api/dashboard/agents', (route) => {
    void route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_AGENTS),
    })
  })

  // Block socket.io transport to keep the app in "connecting" state without errors
  await page.route('**/socket.io/**', (route) => {
    void route.abort()
  })
}
