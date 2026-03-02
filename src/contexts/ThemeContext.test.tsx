import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ThemeProvider, useTheme, DEFAULT_THEME, HACKER_THEME } from './ThemeContext'

function ThemeConsumer() {
  const theme = useTheme()
  return (
    <div>
      <span data-testid="bg">{theme.bg}</span>
      <span data-testid="hacker">{String(theme.isHackerMode)}</span>
      <span data-testid="label">{theme.label}</span>
    </div>
  )
}

describe('ThemeContext', () => {
  it('provê tema padrão quando isHackerMode=false', () => {
    render(
      <ThemeProvider isHackerMode={false}>
        <ThemeConsumer />
      </ThemeProvider>,
    )
    expect(screen.getByTestId('bg').textContent).toBe(DEFAULT_THEME.bg)
    expect(screen.getByTestId('hacker').textContent).toBe('false')
  })

  it('provê tema hacker quando isHackerMode=true', () => {
    render(
      <ThemeProvider isHackerMode={true}>
        <ThemeConsumer />
      </ThemeProvider>,
    )
    expect(screen.getByTestId('bg').textContent).toBe(HACKER_THEME.bg)
    expect(screen.getByTestId('hacker').textContent).toBe('true')
    expect(screen.getByTestId('label').textContent).toBe('#00ff41')
  })

  it('useTheme retorna DEFAULT_THEME fora do provider', () => {
    render(<ThemeConsumer />)
    expect(screen.getByTestId('bg').textContent).toBe(DEFAULT_THEME.bg)
  })
})
