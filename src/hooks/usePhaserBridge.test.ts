import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { None } from '@roxdavirox/fp-core/option'

// vi.hoisted garante que mockBus existe antes do hoist de vi.mock
const { mockBus, listeners } = vi.hoisted(() => {
  const listeners = new Map<string, Set<(...args: unknown[]) => void>>()
  const mockBus = {
    emit: vi.fn((event: string, ...args: unknown[]) => {
      listeners.get(event)?.forEach((fn) => fn(...args))
    }),
    on: vi.fn((event: string, fn: (...args: unknown[]) => void) => {
      if (!listeners.has(event)) listeners.set(event, new Set())
      listeners.get(event)!.add(fn)
    }),
    off: vi.fn((event: string, fn: (...args: unknown[]) => void) => {
      listeners.get(event)?.delete(fn)
    }),
    once: vi.fn(),
  }
  return { mockBus, listeners }
})

vi.mock('../game/EventBus', () => ({ EventBus: mockBus }))

import { usePhaserBridge } from './usePhaserBridge'
import type { AgentOfficeData } from './useOfficeState'

const makeAgent = (id: string, status = 'working', zoneId = 'dev-zone'): AgentOfficeData => ({
  id,
  name: id,
  role: 'agent',
  status,
  currentTask: '',
  zoneId,
  color: '#8b5cf6',
  speechText: None,
})

describe('usePhaserBridge', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    listeners.clear()
  })

  it('emite agents-updated ao montar', () => {
    const agents = [makeAgent('rx-architect')]
    renderHook(() => usePhaserBridge(agents))
    expect(mockBus.emit).toHaveBeenCalledWith('agents-updated', agents)
  })

  it('re-emite agents-updated ao receber scene-ready', () => {
    const agents = [makeAgent('rx-architect')]
    renderHook(() => usePhaserBridge(agents))

    mockBus.emit.mockClear()
    act(() => {
      // Simula Phaser emitindo scene-ready
      mockBus.emit('scene-ready', {} as never)
    })

    expect(mockBus.emit).toHaveBeenCalledWith('agents-updated', agents)
  })

  it('emite novamente quando agents muda', () => {
    const agents1 = [makeAgent('rx-architect')]
    const agents2 = [makeAgent('rx-architect', 'idle', 'coffee-corner')]

    const { rerender } = renderHook(({ agents }) => usePhaserBridge(agents), {
      initialProps: { agents: agents1 },
    })

    mockBus.emit.mockClear()
    rerender({ agents: agents2 })

    expect(mockBus.emit).toHaveBeenCalledWith('agents-updated', agents2)
  })

  it('remove listener de scene-ready ao desmontar', () => {
    const { unmount } = renderHook(() => usePhaserBridge([]))
    unmount()
    expect(mockBus.off).toHaveBeenCalledWith('scene-ready', expect.any(Function))
  })
})
