import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { OfficeHUD } from './OfficeHUD'
import { ThemeProvider } from '../contexts/ThemeContext'

function Wrapper({ isHackerMode = false, children }: { isHackerMode?: boolean; children: React.ReactNode }) {
  return <ThemeProvider isHackerMode={isHackerMode}>{children}</ThemeProvider>
}

describe('OfficeHUD', () => {
  it('exibe status de conexão', () => {
    render(
      <Wrapper><OfficeHUD connectionStatus="connected" /></Wrapper>,
    )
    expect(screen.getByText('online')).toBeTruthy()
  })

  it('exibe contagem de agentes', () => {
    render(
      <Wrapper><OfficeHUD connectionStatus="connected" agentCount={3} /></Wrapper>,
    )
    expect(screen.getByText('3 agents')).toBeTruthy()
  })

  it('exibe singular para 1 agente', () => {
    render(
      <Wrapper><OfficeHUD connectionStatus="connected" agentCount={1} /></Wrapper>,
    )
    expect(screen.getByText('1 agent')).toBeTruthy()
  })

  it('não exibe humanos quando humanCount=0', () => {
    render(
      <Wrapper><OfficeHUD connectionStatus="connected" humanCount={0} /></Wrapper>,
    )
    expect(screen.queryByText(/human/i)).toBeNull()
  })

  it('exibe contagem de humanos quando humanCount>0', () => {
    render(
      <Wrapper><OfficeHUD connectionStatus="connected" humanCount={2} /></Wrapper>,
    )
    expect(screen.getByText('2 humans')).toBeTruthy()
  })

  it('exibe botão de hacker mode quando onToggleHackerMode é fornecido', () => {
    render(
      <Wrapper>
        <OfficeHUD connectionStatus="connected" onToggleHackerMode={vi.fn()} />
      </Wrapper>,
    )
    expect(screen.getByLabelText('ativar hacker mode')).toBeTruthy()
  })

  it('não exibe botão de hacker mode sem prop onToggleHackerMode', () => {
    render(
      <Wrapper><OfficeHUD connectionStatus="connected" /></Wrapper>,
    )
    expect(screen.queryByLabelText(/hacker mode/i)).toBeNull()
  })

  it('chama onToggleHackerMode ao clicar no botão', () => {
    const onToggle = vi.fn()
    render(
      <Wrapper>
        <OfficeHUD connectionStatus="connected" onToggleHackerMode={onToggle} />
      </Wrapper>,
    )
    fireEvent.click(screen.getByLabelText('ativar hacker mode'))
    expect(onToggle).toHaveBeenCalledOnce()
  })

  it('botão mostra [H] quando hacker mode ativo', () => {
    render(
      <Wrapper isHackerMode={true}>
        <OfficeHUD connectionStatus="connected" onToggleHackerMode={vi.fn()} />
      </Wrapper>,
    )
    expect(screen.getByText('[H]')).toBeTruthy()
    expect(screen.getByLabelText('desativar hacker mode')).toBeTruthy()
  })

  it('botão mostra H quando hacker mode inativo', () => {
    render(
      <Wrapper isHackerMode={false}>
        <OfficeHUD connectionStatus="connected" onToggleHackerMode={vi.fn()} />
      </Wrapper>,
    )
    expect(screen.getByText('H')).toBeTruthy()
  })

  it('status role="status" presente', () => {
    render(
      <Wrapper><OfficeHUD connectionStatus="connecting" /></Wrapper>,
    )
    expect(screen.getByRole('status')).toBeTruthy()
  })
})
