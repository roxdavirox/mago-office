import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { OfficeCanvas } from './OfficeCanvas'
import { OFFICE_ZONES } from '../data/office-layout'
import { ThemeProvider } from '../contexts/ThemeContext'

describe('OfficeCanvas', () => {
  it('renderiza todas as zonas', () => {
    render(<OfficeCanvas connectionStatus="connected" />)
    for (const zone of OFFICE_ZONES) {
      expect(document.querySelector(`[data-zone-id="${zone.id}"]`)).toBeTruthy()
    }
  })

  it('renderiza o HUD com status connected', () => {
    render(<OfficeCanvas connectionStatus="connected" />)
    expect(screen.getByText('online')).toBeTruthy()
  })

  it('renderiza o HUD com status error', () => {
    render(<OfficeCanvas connectionStatus="error" />)
    expect(screen.getByText('erro')).toBeTruthy()
  })

  it('exibe contagem de agentes', () => {
    render(<OfficeCanvas connectionStatus="connected" agentCount={3} />)
    expect(screen.getByText('3 agents')).toBeTruthy()
  })

  it('exibe "agent" no singular', () => {
    render(<OfficeCanvas connectionStatus="connected" agentCount={1} />)
    expect(screen.getByText('1 agent')).toBeTruthy()
  })

  it('não exibe humans quando humanCount é 0', () => {
    render(<OfficeCanvas connectionStatus="connected" humanCount={0} />)
    expect(screen.queryByText(/human/)).toBeNull()
  })

  it('exibe humans quando humanCount > 0', () => {
    render(<OfficeCanvas connectionStatus="connected" humanCount={2} />)
    expect(screen.getByText('2 humans')).toBeTruthy()
  })

  it('renderiza children dentro do canvas', () => {
    render(
      <OfficeCanvas connectionStatus="connected">
        <div data-testid="avatar">Agent Avatar</div>
      </OfficeCanvas>,
    )
    expect(screen.getByTestId('avatar')).toBeTruthy()
  })

  it('passa onToggleHackerMode para o HUD', () => {
    const onToggle = vi.fn()
    render(
      <ThemeProvider isHackerMode={false}>
        <OfficeCanvas connectionStatus="connected" onToggleHackerMode={onToggle} />
      </ThemeProvider>,
    )
    fireEvent.click(screen.getByLabelText('ativar hacker mode'))
    expect(onToggle).toHaveBeenCalledOnce()
  })

  it('usa bg preto no hacker mode', () => {
    const { container } = render(
      <ThemeProvider isHackerMode={true}>
        <OfficeCanvas connectionStatus="connected" />
      </ThemeProvider>,
    )
    const canvas = container.firstChild as HTMLElement
    expect(canvas.style.background).toBe('rgb(0, 0, 0)')
  })
})
