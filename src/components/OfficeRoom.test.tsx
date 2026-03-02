import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { OfficeRoom } from './OfficeRoom'
import type { Zone } from '../data/office-layout'
import { ThemeProvider } from '../contexts/ThemeContext'

const mockZone: Zone = {
  id: 'test-zone',
  label: 'Test Zone',
  icon: '🧪',
  x: 10,
  y: 20,
  width: 30,
  height: 25,
  color: '#1a1a2e',
  description: 'Zona de teste',
}

describe('OfficeRoom', () => {
  it('renderiza com data-zone-id correto', () => {
    render(<OfficeRoom zone={mockZone} />)
    expect(document.querySelector('[data-zone-id="test-zone"]')).toBeTruthy()
  })

  it('exibe o ícone da zona', () => {
    render(<OfficeRoom zone={mockZone} />)
    expect(screen.getByText('🧪')).toBeTruthy()
  })

  it('exibe o label da zona', () => {
    render(<OfficeRoom zone={mockZone} />)
    expect(screen.getByText('Test Zone')).toBeTruthy()
  })

  it('posiciona a zona com as coordenadas corretas', () => {
    render(<OfficeRoom zone={mockZone} />)
    const el = document.querySelector('[data-zone-id="test-zone"]') as HTMLElement
    expect(el.style.left).toBe('10%')
    expect(el.style.top).toBe('20%')
    expect(el.style.width).toBe('30%')
    expect(el.style.height).toBe('25%')
  })

  it('aplica a cor de fundo da zona', () => {
    render(<ThemeProvider isHackerMode={false}><OfficeRoom zone={mockZone} /></ThemeProvider>)
    const el = document.querySelector('[data-zone-id="test-zone"]') as HTMLElement
    expect(el.style.background).toBe('rgb(26, 26, 46)')
  })

  it('no hacker mode usa zoneBg #001100', () => {
    render(<ThemeProvider isHackerMode={true}><OfficeRoom zone={mockZone} /></ThemeProvider>)
    const el = document.querySelector('[data-zone-id="test-zone"]') as HTMLElement
    expect(el.style.background).toBe('rgb(0, 17, 0)')
  })

  it('no hacker mode usa borda verde', () => {
    render(<ThemeProvider isHackerMode={true}><OfficeRoom zone={mockZone} /></ThemeProvider>)
    const el = document.querySelector('[data-zone-id="test-zone"]') as HTMLElement
    expect(el.style.borderColor).toBe('rgb(0, 255, 65)')
  })
})
