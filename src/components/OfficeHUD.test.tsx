import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { OfficeHUD } from './OfficeHUD'

describe('OfficeHUD', () => {
  it('exibe status de conexão', () => {
    render(<OfficeHUD connectionStatus="connected" />)
    expect(screen.getByText('online')).toBeTruthy()
  })

  it('exibe contagem de agentes', () => {
    render(<OfficeHUD connectionStatus="connected" agentCount={3} />)
    expect(screen.getByText('3 agents')).toBeTruthy()
  })

  it('exibe singular para 1 agente', () => {
    render(<OfficeHUD connectionStatus="connected" agentCount={1} />)
    expect(screen.getByText('1 agent')).toBeTruthy()
  })

  it('não exibe humanos quando humanCount=0', () => {
    render(<OfficeHUD connectionStatus="connected" humanCount={0} />)
    expect(screen.queryByText(/human/i)).toBeNull()
  })

  it('exibe contagem de humanos quando humanCount>0', () => {
    render(<OfficeHUD connectionStatus="connected" humanCount={2} />)
    expect(screen.getByText('2 humans')).toBeTruthy()
  })

  it('status role="status" presente', () => {
    render(<OfficeHUD connectionStatus="connecting" />)
    expect(screen.getByRole('status')).toBeTruthy()
  })
})
