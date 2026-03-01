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

  it('retorna status connecting quando socket não está conectado', () => {
    const { result } = renderHook(() => useSocket())
    expect(result.current.status).toBe('connecting')
  })

  it('retorna status connected quando socket já está conectado', () => {
    mockSocket.connected = true
    const { result } = renderHook(() => useSocket())
    expect(result.current.status).toBe('connected')
  })

  it('chama connectSocket no mount', async () => {
    const { connectSocket } = await import('../services/socket')
    renderHook(() => useSocket())
    expect(connectSocket).toHaveBeenCalled()
  })

  it('retorna o socket', () => {
    const { result } = renderHook(() => useSocket())
    expect(result.current.socket).toBeDefined()
  })

  it('registra listeners no mount', () => {
    renderHook(() => useSocket())
    expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function))
    expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function))
    expect(mockSocket.on).toHaveBeenCalledWith('connect_error', expect.any(Function))
    expect(mockIo.on).toHaveBeenCalledWith('reconnect_attempt', expect.any(Function))
  })

  it('remove listeners no unmount', () => {
    const { unmount } = renderHook(() => useSocket())
    unmount()
    expect(mockSocket.off).toHaveBeenCalledWith('connect', expect.any(Function))
    expect(mockSocket.off).toHaveBeenCalledWith('disconnect', expect.any(Function))
    expect(mockSocket.off).toHaveBeenCalledWith('connect_error', expect.any(Function))
    expect(mockIo.off).toHaveBeenCalledWith('reconnect_attempt', expect.any(Function))
  })

  it('atualiza status para connected ao receber evento connect', () => {
    const { result } = renderHook(() => useSocket())
    const onConnect = mockSocket.on.mock.calls.find(([e]) => e === 'connect')?.[1]
    act(() => onConnect?.())
    expect(result.current.status).toBe('connected')
  })

  it('atualiza status para disconnected ao receber evento disconnect', () => {
    mockSocket.connected = true
    const { result } = renderHook(() => useSocket())
    const onDisconnect = mockSocket.on.mock.calls.find(([e]) => e === 'disconnect')?.[1]
    act(() => onDisconnect?.())
    expect(result.current.status).toBe('disconnected')
  })

  it('atualiza status para error ao receber connect_error', () => {
    const { result } = renderHook(() => useSocket())
    const onError = mockSocket.on.mock.calls.find(([e]) => e === 'connect_error')?.[1]
    act(() => onError?.())
    expect(result.current.status).toBe('error')
  })

  it('atualiza status para reconnecting ao receber reconnect_attempt', () => {
    const { result } = renderHook(() => useSocket())
    const onReconnect = mockIo.on.mock.calls.find(([e]) => e === 'reconnect_attempt')?.[1]
    act(() => onReconnect?.())
    expect(result.current.status).toBe('reconnecting')
  })

  it('retorna objeto memoizado — mesma referência quando status não muda', () => {
    const { result, rerender } = renderHook(() => useSocket())
    const first = result.current
    rerender()
    expect(result.current).toBe(first)
  })
})
