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
    current_task: 'Aguardando próximo ciclo',
    progress: null,
    last_heartbeat: '2026-03-01T00:00:00Z',
    messages_count: 0,
  },
  {
    id: 'rx-backend',
    name: 'Backend',
    role: 'backend',
    status: 'working',
    current_task: 'implementando feature X',
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
    }),
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

// ─── Tests ──────────────────────────────────────────────────────────────────

const { useOfficeState } = await import('./useOfficeState')

describe('useOfficeState — carga inicial', () => {
  it('começa em estado de loading e termina sem erro', async () => {
    const { result } = renderHook(() => useOfficeState())
    // Estado inicial: loading=true, agents vazio
    expect(result.current.isLoading).toBe(true)
    expect(result.current.agents).toHaveLength(0)
    // Após fetch resolver: loading=false, agents preenchidos
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.error).toBeNull()
  })

  it('carrega agentes da API e calcula zona/posição', async () => {
    const { result } = renderHook(() => useOfficeState())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.agents).toHaveLength(3)
    expect(result.current.error).toBeNull()
  })

  it('agente idle vai para coffee-corner', async () => {
    const { result } = renderHook(() => useOfficeState())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const architect = result.current.agents.find(a => a.id === 'rx-architect')
    expect(architect?.zoneId).toBe('coffee-corner')
  })

  it('agente working sem action específica vai para dev-zone', async () => {
    const { result } = renderHook(() => useOfficeState())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const backend = result.current.agents.find(a => a.id === 'rx-backend')
    expect(backend?.zoneId).toBe('dev-zone')
  })

  it('agente thinking com review action vai para review-room', async () => {
    const { result } = renderHook(() => useOfficeState())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const orchestrator = result.current.agents.find(a => a.id === 'rx-orchestrator')
    expect(orchestrator?.zoneId).toBe('review-room')
  })

  it('agentes têm posição calculada (x e y são números)', async () => {
    const { result } = renderHook(() => useOfficeState())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    for (const agent of result.current.agents) {
      expect(typeof agent.position.x).toBe('number')
      expect(typeof agent.position.y).toBe('number')
    }
  })

  it('mapeia currentTask a partir de current_task da API', async () => {
    const { result } = renderHook(() => useOfficeState())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const backend = result.current.agents.find(a => a.id === 'rx-backend')
    expect(backend?.currentTask).toBe('implementando feature X')
  })

  it('speechText começa como null', async () => {
    const { result } = renderHook(() => useOfficeState())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    for (const agent of result.current.agents) {
      expect(agent.speechText).toBeNull()
    }
  })
})

describe('useOfficeState — erro na API', () => {
  it('define error e sai do loading quando fetch falha', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 500 }),
    )

    const { result } = renderHook(() => useOfficeState())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.error).toMatch(/500/)
    expect(result.current.agents).toHaveLength(0)
  })
})

describe('useOfficeState — eventos socket', () => {
  it('atualiza zona do agente ao receber agent:status:updated', async () => {
    const { result } = renderHook(() => useOfficeState())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => {
      const handler = socketListeners.get('agent:status:updated')
      handler?.({ agentId: 'rx-architect', status: 'working', lastAction: 'revisando PR #12' })
    })

    const architect = result.current.agents.find(a => a.id === 'rx-architect')
    expect(architect?.zoneId).toBe('review-room')
    expect(architect?.status).toBe('working')
  })

  it('exibe speechText ao receber bus:message', async () => {
    const { result } = renderHook(() => useOfficeState())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => {
      const handler = socketListeners.get('bus:message')
      handler?.({ from: 'rx-backend', payload: { content: 'Iniciando análise' } })
    })

    const backend = result.current.agents.find(a => a.id === 'rx-backend')
    expect(backend?.speechText).toBe('Iniciando análise')
  })

  it('bus:message sem content não altera speechText', async () => {
    const { result } = renderHook(() => useOfficeState())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => {
      const handler = socketListeners.get('bus:message')
      handler?.({ from: 'rx-backend', payload: {} })
    })

    const backend = result.current.agents.find(a => a.id === 'rx-backend')
    expect(backend?.speechText).toBeNull()
  })

  it('limpa speechText após 5 segundos', async () => {
    // Carregar antes de ativar fake timers (evita conflito com waitFor/fetch)
    const { result } = renderHook(() => useOfficeState())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    vi.useFakeTimers()

    act(() => {
      const handler = socketListeners.get('bus:message')
      handler?.({ from: 'rx-backend', payload: { content: 'Trabalhando...' } })
    })

    expect(result.current.agents.find(a => a.id === 'rx-backend')?.speechText).toBe('Trabalhando...')

    act(() => { vi.advanceTimersByTime(5000) })

    expect(result.current.agents.find(a => a.id === 'rx-backend')?.speechText).toBeNull()
  })

  it('adiciona usuário ao receber office:user:joined', async () => {
    const { result } = renderHook(() => useOfficeState())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => {
      const handler = socketListeners.get('office:user:joined')
      handler?.({ socketId: 'abc123', userId: 'user-1', name: 'Alice', x: 50, y: 88 })
    })

    expect(result.current.users).toHaveLength(1)
    expect(result.current.users[0].name).toBe('Alice')
  })

  it('remove usuário ao receber office:user:left', async () => {
    const { result } = renderHook(() => useOfficeState())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => {
      socketListeners.get('office:user:joined')?.({ socketId: 'abc123', userId: 'user-1', name: 'Alice', x: 50, y: 88 })
    })
    act(() => {
      socketListeners.get('office:user:left')?.({ socketId: 'abc123' })
    })

    expect(result.current.users).toHaveLength(0)
  })

  it('atualiza posição do usuário ao receber office:user:moved', async () => {
    const { result } = renderHook(() => useOfficeState())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => {
      socketListeners.get('office:user:joined')?.({ socketId: 'abc123', userId: 'user-1', name: 'Alice', x: 50, y: 88 })
    })
    act(() => {
      socketListeners.get('office:user:moved')?.({ socketId: 'abc123', x: 30, y: 60 })
    })

    const user = result.current.users.find(u => u.socketId === 'abc123')
    expect(user?.x).toBe(30)
    expect(user?.y).toBe(60)
  })
})

describe('useOfficeState — cleanup', () => {
  it('remove listeners do socket ao desmontar', async () => {
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
