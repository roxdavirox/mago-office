import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useHackerMode } from './useHackerMode'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    clear: () => { store = {} },
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

describe('useHackerMode', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  it('inicia com isHackerMode=false por padrão', () => {
    const { result } = renderHook(() => useHackerMode())
    expect(result.current.isHackerMode).toBe(false)
  })

  it('toggle ativa o hacker mode', () => {
    const { result } = renderHook(() => useHackerMode())
    act(() => { result.current.toggle() })
    expect(result.current.isHackerMode).toBe(true)
  })

  it('toggle duas vezes volta para false', () => {
    const { result } = renderHook(() => useHackerMode())
    act(() => { result.current.toggle() })
    act(() => { result.current.toggle() })
    expect(result.current.isHackerMode).toBe(false)
  })

  it('persiste estado no localStorage ao ativar', () => {
    const { result } = renderHook(() => useHackerMode())
    act(() => { result.current.toggle() })
    expect(localStorageMock.setItem).toHaveBeenCalledWith('mago-office:hacker-mode', 'true')
  })

  it('persiste estado no localStorage ao desativar', () => {
    const { result } = renderHook(() => useHackerMode())
    act(() => { result.current.toggle() })
    act(() => { result.current.toggle() })
    expect(localStorageMock.setItem).toHaveBeenLastCalledWith('mago-office:hacker-mode', 'false')
  })

  it('lê estado inicial do localStorage', () => {
    localStorageMock.getItem.mockReturnValueOnce('true')
    const { result } = renderHook(() => useHackerMode())
    expect(result.current.isHackerMode).toBe(true)
  })

  it('ativa com Ctrl+Shift+H', () => {
    const { result } = renderHook(() => useHackerMode())
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'H', ctrlKey: true, shiftKey: true }))
    })
    expect(result.current.isHackerMode).toBe(true)
  })

  it('desativa com Ctrl+Shift+H quando já ativo', () => {
    const { result } = renderHook(() => useHackerMode())
    act(() => { result.current.toggle() })
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'H', ctrlKey: true, shiftKey: true }))
    })
    expect(result.current.isHackerMode).toBe(false)
  })
})
