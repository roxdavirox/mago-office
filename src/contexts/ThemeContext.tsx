import { createContext, useContext, useMemo, type ReactNode } from 'react'

export interface Theme {
  isHackerMode: boolean
  /** Fundo principal */
  bg: string
  /** Cor de grade/decoração */
  grid: string
  /** Cor de borda de zonas */
  zoneBorder: string
  /** Fundo de zona */
  zoneBg: string
  /** Cor primária de labels/texto */
  label: string
  /** Cor do HUD */
  hudBorder: string
}

export const DEFAULT_THEME: Theme = {
  isHackerMode: false,
  bg: '#0d1117',
  grid: '#1f2937',
  zoneBorder: '#1f2937',
  zoneBg: '#111827',
  label: '#6b7280',
  hudBorder: '#1f2937',
}

export const HACKER_THEME: Theme = {
  isHackerMode: true,
  bg: '#000000',
  grid: '#00ff41',
  zoneBorder: '#00ff41',
  zoneBg: '#001100',
  label: '#00ff41',
  hudBorder: '#00ff41',
}

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
