import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'

const { mockBus } = vi.hoisted(() => {
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
  }
  return { mockBus, listeners }
})

vi.mock('../game/EventBus', () => ({ EventBus: mockBus }))

const mockSocketEmit = vi.fn()
vi.mock('../services/socket', () => ({
  getSocket: () => ({ emit: mockSocketEmit }),
}))

import { useHumanSocket } from './useHumanSocket'

describe('useHumanSocket', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('escuta human-moved no EventBus ao montar', () => {
    renderHook(() => useHumanSocket())
    expect(mockBus.on).toHaveBeenCalledWith('human-moved', expect.any(Function))
  })

  it('emite office:user:move via socket quando EventBus dispara human-moved', () => {
    renderHook(() => useHumanSocket())

    // Simula EventBus disparando human-moved
    mockBus.emit('human-moved', 100, 200)

    expect(mockSocketEmit).toHaveBeenCalledWith('office:user:move', { x: 100, y: 200 })
  })

  it('remove listener do EventBus ao desmontar', () => {
    const { unmount } = renderHook(() => useHumanSocket())
    unmount()
    expect(mockBus.off).toHaveBeenCalledWith('human-moved', expect.any(Function))
  })

  it('não emite socket sem evento do EventBus', () => {
    renderHook(() => useHumanSocket())
    expect(mockSocketEmit).not.toHaveBeenCalled()
  })
})
