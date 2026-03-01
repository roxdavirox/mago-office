import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

const mockSocket = vi.hoisted(() => ({
  connected: false,
  on: vi.fn(),
  off: vi.fn(),
}))

vi.mock('../services/socket', () => ({
  socket: mockSocket,
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

  it('retorna o socket', () => {
    const { result } = renderHook(() => useSocket())
    expect(result.current.socket).toBeDefined()
  })

  it('registra listeners no mount', () => {
    renderHook(() => useSocket())
    expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function))
    expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function))
    expect(mockSocket.on).toHaveBeenCalledWith('connect_error', expect.any(Function))
  })

  it('remove listeners no unmount', () => {
    const { unmount } = renderHook(() => useSocket())
    unmount()
    expect(mockSocket.off).toHaveBeenCalledWith('connect', expect.any(Function))
    expect(mockSocket.off).toHaveBeenCalledWith('disconnect', expect.any(Function))
    expect(mockSocket.off).toHaveBeenCalledWith('connect_error', expect.any(Function))
  })

  it('atualiza status para connected ao receber evento connect', () => {
    const { result } = renderHook(() => useSocket())
    const onConnect = mockSocket.on.mock.calls.find(([event]) => event === 'connect')?.[1]
    act(() => onConnect?.())
    expect(result.current.status).toBe('connected')
  })

  it('atualiza status para disconnected ao receber evento disconnect', () => {
    mockSocket.connected = true
    const { result } = renderHook(() => useSocket())
    const onDisconnect = mockSocket.on.mock.calls.find(([event]) => event === 'disconnect')?.[1]
    act(() => onDisconnect?.())
    expect(result.current.status).toBe('disconnected')
  })

  it('atualiza status para error ao receber connect_error', () => {
    const { result } = renderHook(() => useSocket())
    const onError = mockSocket.on.mock.calls.find(([event]) => event === 'connect_error')?.[1]
    act(() => onError?.())
    expect(result.current.status).toBe('error')
  })
})
