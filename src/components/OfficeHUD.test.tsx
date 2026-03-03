import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { OfficeHUD } from './OfficeHUD'

describe('OfficeHUD', () => {
  it('shows connection status', () => {
    render(<OfficeHUD connectionStatus="connected" />)
    expect(screen.getByText('online')).toBeTruthy()
  })

  it('shows agent count', () => {
    render(<OfficeHUD connectionStatus="connected" agentCount={3} />)
    expect(screen.getByText('3 agents')).toBeTruthy()
  })

  it('shows singular for 1 agent', () => {
    render(<OfficeHUD connectionStatus="connected" agentCount={1} />)
    expect(screen.getByText('1 agent')).toBeTruthy()
  })

  it('does not show humans when humanCount=0', () => {
    render(<OfficeHUD connectionStatus="connected" humanCount={0} />)
    expect(screen.queryByText(/human/i)).toBeNull()
  })

  it('shows human count when humanCount>0', () => {
    render(<OfficeHUD connectionStatus="connected" humanCount={2} />)
    expect(screen.getByText('2 humans')).toBeTruthy()
  })

  it('status role="status" is present', () => {
    render(<OfficeHUD connectionStatus="connecting" />)
    expect(screen.getByRole('status')).toBeTruthy()
  })
})
