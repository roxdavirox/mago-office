import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import type { RawAgent } from './useOfficeState'

// ─── Mocks ──────────────────────────────────────────────────────────────────

const socketListeners = vi.hoisted(() => new Map<string, (...args: unknown[]) => void>())

const mockSocket = vi.hoisted(() => ({
  on: vi.fn((event: string, cb: (...args: unknown[]) => void) => {
    socketListeners.set(event, cb)
  }),
  off: vi.fn((event: string) => {
    socketListeners.delete(event)
  }),
}))

vi.mock('../services/socket', () => ({
  getSocket: () => mockSocket,
  socket: mockSocket,
  connectSocket: vi.fn(),
}))

const mockAgents: RawAgent[] = [
  {
    id: 'rx-architect',
    name: 'Architect',
    role: 'architect',
    status: 'idle',
    current_task: 'Waiting for next cycle',
    progress: null,
    last_heartbeat: '2026-03-01T00:00:00Z',
    messages_count: 0,
  },
  {
    id: 'rx-backend',
    name: 'Backend',
    role: 'backend',
    status: 'working',
    current_task: 'implementing feature X',
    progress: null,
    last_heartbeat: '2026-03-01T00:00:01Z',
    messages_count: 2,
  },
  {
    id: 'rx-orchestrator',
    name: 'Orchestrator',
    role: 'orchestrator',
    status: 'thinking',
    current_task: 'revisando código',
    progress: null,
    last_heartbeat: '2026-03-01T00:00:02Z',
    messages_count: 1,
  },
]

// ─── Setup ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  socketListeners.clear()
  mockSocket.on.mockClear()
  mockSocket.off.mockClear()

  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockAgents),
    })
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

// ─── Tests ──────────────────────────────────────────────────────────────────

const { useOfficeState } = await import('./useOfficeState')

describe('useOfficeState — initial load', () => {
  it('starts in loading state and finishes without error', async () => {
    const { result } = renderHook(() => useOfficeState())
    // Initial state: loading=true, agents empty
    expect(result.current.isLoading).toBe(true)
    expect(result.current.agents).toHaveLength(0)
    // After fetch resolves: loading=false, agents populated
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.error).toBeNull()
  })

  it('loads agents from API and calculates zone/position', async () => {
    const { result } = renderHook(() => useOfficeState())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.agents).toHaveLength(3)
    expect(result.current.error).toBeNull()
  })

  it('idle agent goes to coffee-corner', async () => {
    const { result } = renderHook(() => useOfficeState())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const architect = result.current.agents.find((a) => a.id === 'rx-architect')
    expect(architect?.zoneId).toBe('coffee-corner')
  })

  it('working agent with no specific action goes to dev-zone', async () => {
    const { result } = renderHook(() => useOfficeState())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const backend = result.current.agents.find((a) => a.id === 'rx-backend')
    expect(backend?.zoneId).toBe('dev-zone')
  })

  it('thinking agent with review action goes to review-room', async () => {
    const { result } = renderHook(() => useOfficeState())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const orchestrator = result.current.agents.find((a) => a.id === 'rx-orchestrator')
    expect(orchestrator?.zoneId).toBe('review-room')
  })

  it('agents have calculated position (x and y are numbers)', async () => {
    const { result } = renderHook(() => useOfficeState())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    for (const agent of result.current.agents) {
      expect(typeof agent.position.x).toBe('number')
      expect(typeof agent.position.y).toBe('number')
    }
  })

  it('maps currentTask from API current_task', async () => {
    const { result } = renderHook(() => useOfficeState())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const backend = result.current.agents.find((a) => a.id === 'rx-backend')
    expect(backend?.currentTask).toBe('implementing feature X')
  })

  it('speechText starts as null', async () => {
    const { result } = renderHook(() => useOfficeState())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    for (const agent of result.current.agents) {
      expect(agent.speechText).toBeNull()
    }
  })
})

describe('useOfficeState — API error', () => {
  it('sets error and exits loading when fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))

    const { result } = renderHook(() => useOfficeState())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.error).toMatch(/500/)
    expect(result.current.agents).toHaveLength(0)
  })
})

describe('useOfficeState — socket events', () => {
  it('updates agent zone when agent:status:updated is received', async () => {
    const { result } = renderHook(() => useOfficeState())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => {
      const handler = socketListeners.get('agent:status:updated')
      handler?.({ agentId: 'rx-architect', status: 'working', lastAction: 'revisando PR #12' })
    })

    const architect = result.current.agents.find((a) => a.id === 'rx-architect')
    expect(architect?.zoneId).toBe('review-room')
    expect(architect?.status).toBe('working')
  })

  it('shows speechText when bus:message is received', async () => {
    const { result } = renderHook(() => useOfficeState())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => {
      const handler = socketListeners.get('bus:message')
      handler?.({ from: 'rx-backend', payload: { content: 'Starting analysis' } })
    })

    const backend = result.current.agents.find((a) => a.id === 'rx-backend')
    expect(backend?.speechText).toBe('Starting analysis')
  })

  it('bus:message without content does not change speechText', async () => {
    const { result } = renderHook(() => useOfficeState())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => {
      const handler = socketListeners.get('bus:message')
      handler?.({ from: 'rx-backend', payload: {} })
    })

    const backend = result.current.agents.find((a) => a.id === 'rx-backend')
    expect(backend?.speechText).toBeNull()
  })

  it('clears speechText after 5 seconds', async () => {
    // Load before activating fake timers (avoids conflict with waitFor/fetch)
    const { result } = renderHook(() => useOfficeState())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    vi.useFakeTimers()

    act(() => {
      const handler = socketListeners.get('bus:message')
      handler?.({ from: 'rx-backend', payload: { content: 'Working...' } })
    })

    expect(result.current.agents.find((a) => a.id === 'rx-backend')?.speechText).toBe('Working...')

    act(() => {
      vi.advanceTimersByTime(5000)
    })

    expect(result.current.agents.find((a) => a.id === 'rx-backend')?.speechText).toBeNull()
  })

  it('adds user when office:user:joined is received', async () => {
    const { result } = renderHook(() => useOfficeState())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => {
      const handler = socketListeners.get('office:user:joined')
      handler?.({ socketId: 'abc123', userId: 'user-1', name: 'Alice', x: 50, y: 88 })
    })

    expect(result.current.users).toHaveLength(1)
    expect(result.current.users[0].name).toBe('Alice')
  })

  it('removes user when office:user:left is received', async () => {
    const { result } = renderHook(() => useOfficeState())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => {
      socketListeners.get('office:user:joined')?.({
        socketId: 'abc123',
        userId: 'user-1',
        name: 'Alice',
        x: 50,
        y: 88,
      })
    })
    act(() => {
      socketListeners.get('office:user:left')?.({ socketId: 'abc123' })
    })

    expect(result.current.users).toHaveLength(0)
  })

  it('updates user position when office:user:moved is received', async () => {
    const { result } = renderHook(() => useOfficeState())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => {
      socketListeners.get('office:user:joined')?.({
        socketId: 'abc123',
        userId: 'user-1',
        name: 'Alice',
        x: 50,
        y: 88,
      })
    })
    act(() => {
      socketListeners.get('office:user:moved')?.({ socketId: 'abc123', x: 30, y: 60 })
    })

    const user = result.current.users.find((u) => u.socketId === 'abc123')
    expect(user?.x).toBe(30)
    expect(user?.y).toBe(60)
  })
})

describe('useOfficeState — cleanup', () => {
  it('removes socket listeners on unmount', async () => {
    const { result, unmount } = renderHook(() => useOfficeState())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    unmount()

    expect(mockSocket.off).toHaveBeenCalledWith('agent:status:updated', expect.any(Function))
    expect(mockSocket.off).toHaveBeenCalledWith('bus:message', expect.any(Function))
    expect(mockSocket.off).toHaveBeenCalledWith('office:user:joined', expect.any(Function))
    expect(mockSocket.off).toHaveBeenCalledWith('office:user:left', expect.any(Function))
    expect(mockSocket.off).toHaveBeenCalledWith('office:user:moved', expect.any(Function))
  })
})
