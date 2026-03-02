import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'mago-office:hacker-mode'
const TOGGLE_KEY = 'h'

export interface HackerModeState {
  isHackerMode: boolean
  toggle: () => void
}

/**
 * Persiste e controla o Hacker Mode.
 * Atalho: Ctrl+Shift+H
 */
export function useHackerMode(): HackerModeState {
  const [isHackerMode, setIsHackerMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true'
    } catch {
      return false
    }
  })

  const toggle = useCallback(() => {
    setIsHackerMode(prev => {
      const next = !prev
      try {
        localStorage.setItem(STORAGE_KEY, String(next))
      } catch {
        // storage indisponível — ignora
      }
      return next
    })
  }, [])

  useEffect(() => {
    function onKey(e: globalThis.KeyboardEvent) {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === TOGGLE_KEY) {
        e.preventDefault()
        toggle()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggle])

  return { isHackerMode, toggle }
}
