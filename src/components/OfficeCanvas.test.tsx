import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { OfficeCanvas } from './OfficeCanvas'
import { OFFICE_ZONES } from '../data/office-layout'

describe('OfficeCanvas', () => {
  it('renders all zones', () => {
    render(<OfficeCanvas connectionStatus="connected" />)
    for (const zone of OFFICE_ZONES) {
      expect(document.querySelector(`[data-zone-id="${zone.id}"]`)).toBeTruthy()
    }
  })

  it('renders HUD with connected status', () => {
    render(<OfficeCanvas connectionStatus="connected" />)
    expect(screen.getByText('online')).toBeTruthy()
  })

  it('renders HUD with error status', () => {
    render(<OfficeCanvas connectionStatus="error" />)
    expect(screen.getByText('error')).toBeTruthy()
  })

  it('shows agent count', () => {
    render(<OfficeCanvas connectionStatus="connected" agentCount={3} />)
    expect(screen.getByText('3 agents')).toBeTruthy()
  })

  it('shows "agent" in singular', () => {
    render(<OfficeCanvas connectionStatus="connected" agentCount={1} />)
    expect(screen.getByText('1 agent')).toBeTruthy()
  })

  it('does not show humans when humanCount is 0', () => {
    render(<OfficeCanvas connectionStatus="connected" humanCount={0} />)
    expect(screen.queryByText(/human/)).toBeNull()
  })

  it('shows humans when humanCount > 0', () => {
    render(<OfficeCanvas connectionStatus="connected" humanCount={2} />)
    expect(screen.getByText('2 humans')).toBeTruthy()
  })

  it('renders children inside the canvas', () => {
    render(
      <OfficeCanvas connectionStatus="connected">
        <div data-testid="avatar">Agent Avatar</div>
      </OfficeCanvas>
    )
    expect(screen.getByTestId('avatar')).toBeTruthy()
  })

  it('uses static background color defined in COLORS', () => {
    const { container } = render(<OfficeCanvas connectionStatus="connected" />)
    const canvas = container.firstChild as HTMLElement
    expect(canvas.style.background).toBeTruthy()
  })
})
