import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

const mockIo = vi.hoisted(() => ({
  on: vi.fn(),
  off: vi.fn(),
}))

const mockSocket = vi.hoisted(() => ({
  connected: false,
  connect: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  io: mockIo,
}))

vi.mock('../services/socket', () => ({
  socket: mockSocket,
  connectSocket: vi.fn(() => {
    if (!mockSocket.connected) mockSocket.connect()
  }),
}))

import { useSocket } from './useSocket'

describe('useSocket', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSocket.connected = false
  })

  it('returns connecting status when socket is not connected', () => {
    const { result } = renderHook(() => useSocket())
    expect(result.current.status).toBe('connecting')
  })

  it('returns connected status when socket is already connected', () => {
    mockSocket.connected = true
    const { result } = renderHook(() => useSocket())
    expect(result.current.status).toBe('connected')
  })

  it('calls connectSocket on mount', async () => {
    const { connectSocket } = await import('../services/socket')
    renderHook(() => useSocket())
    expect(connectSocket).toHaveBeenCalled()
  })

  it('returns the socket', () => {
    const { result } = renderHook(() => useSocket())
    expect(result.current.socket).toBeDefined()
  })

  it('registers listeners on mount', () => {
    renderHook(() => useSocket())
    expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function))
    expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function))
    expect(mockSocket.on).toHaveBeenCalledWith('connect_error', expect.any(Function))
    expect(mockIo.on).toHaveBeenCalledWith('reconnect_attempt', expect.any(Function))
  })

  it('removes listeners on unmount', () => {
    const { unmount } = renderHook(() => useSocket())
    unmount()
    expect(mockSocket.off).toHaveBeenCalledWith('connect', expect.any(Function))
    expect(mockSocket.off).toHaveBeenCalledWith('disconnect', expect.any(Function))
    expect(mockSocket.off).toHaveBeenCalledWith('connect_error', expect.any(Function))
    expect(mockIo.off).toHaveBeenCalledWith('reconnect_attempt', expect.any(Function))
  })

  it('updates status to connected when connect event is received', () => {
    const { result } = renderHook(() => useSocket())
    const onConnect = mockSocket.on.mock.calls.find(([e]) => e === 'connect')?.[1]
    act(() => onConnect?.())
    expect(result.current.status).toBe('connected')
  })

  it('updates status to disconnected when disconnect event is received', () => {
    mockSocket.connected = true
    const { result } = renderHook(() => useSocket())
    const onDisconnect = mockSocket.on.mock.calls.find(([e]) => e === 'disconnect')?.[1]
    act(() => onDisconnect?.())
    expect(result.current.status).toBe('disconnected')
  })

  it('updates status to error when connect_error is received', () => {
    const { result } = renderHook(() => useSocket())
    const onError = mockSocket.on.mock.calls.find(([e]) => e === 'connect_error')?.[1]
    act(() => onError?.())
    expect(result.current.status).toBe('error')
  })

  it('updates status to reconnecting when reconnect_attempt is received', () => {
    const { result } = renderHook(() => useSocket())
    const onReconnect = mockIo.on.mock.calls.find(([e]) => e === 'reconnect_attempt')?.[1]
    act(() => onReconnect?.())
    expect(result.current.status).toBe('reconnecting')
  })

  it('returns memoized object — same reference when status does not change', () => {
    const { result, rerender } = renderHook(() => useSocket())
    const first = result.current
    rerender()
    expect(result.current).toBe(first)
  })
})
