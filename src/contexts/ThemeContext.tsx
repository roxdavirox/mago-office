import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { type Theme, DEFAULT_THEME, HACKER_THEME } from '../constants/theme'

export type { Theme }
export { DEFAULT_THEME, HACKER_THEME }

export const ThemeContext = createContext<Theme>(DEFAULT_THEME)

export function useTheme(): Theme {
  return useContext(ThemeContext)
}

export function ThemeProvider({
  isHackerMode,
  children,
}: {
  isHackerMode: boolean
  children: ReactNode
}) {
  const theme = useMemo(() => (isHackerMode ? HACKER_THEME : DEFAULT_THEME), [isHackerMode])
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
}
