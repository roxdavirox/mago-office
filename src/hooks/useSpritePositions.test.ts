import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

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

import { useSpritePositions } from './useSpritePositions'

describe('useSpritePositions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retorna Map vazio inicialmente', () => {
    const { result } = renderHook(() => useSpritePositions())
    expect(result.current.size).toBe(0)
  })

  it('escuta sprite-positions no EventBus', () => {
    renderHook(() => useSpritePositions())
    expect(mockBus.on).toHaveBeenCalledWith('sprite-positions', expect.any(Function))
  })

  it('atualiza posições quando EventBus emite', () => {
    const { result } = renderHook(() => useSpritePositions())

    const positions = new Map([
      ['agent-1', { x: 100, y: 200 }],
      ['agent-2', { x: 300, y: 400 }],
    ])

    act(() => {
      mockBus.emit('sprite-positions', positions)
    })

    expect(result.current.get('agent-1')).toEqual({ x: 100, y: 200 })
    expect(result.current.get('agent-2')).toEqual({ x: 300, y: 400 })
  })

  it('remove listener ao desmontar', () => {
    const { unmount } = renderHook(() => useSpritePositions())
    unmount()
    expect(mockBus.off).toHaveBeenCalledWith('sprite-positions', expect.any(Function))
  })
})
