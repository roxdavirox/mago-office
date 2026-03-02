import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AgentDetailPanel } from './AgentDetailPanel'
import type { AgentOfficeData } from '../hooks/useOfficeState'

// jsdom não implementa scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn()

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion')
  return {
    ...actual,
    motion: {
      div: ({ children, style, variants: _v, initial: _i, animate: _a, exit: _e, transition: _t, layout: _l, ...rest }: React.HTMLAttributes<HTMLDivElement> & Record<string, unknown>) => (
        <div style={style} {...rest}>{children}</div>
      ),
      aside: ({ children, style, variants: _v, initial: _i, animate: _a, exit: _e, ...rest }: React.HTMLAttributes<HTMLElement> & Record<string, unknown>) => (
        <aside style={style} {...rest}>{children}</aside>
      ),
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  }
})

const mockAgent: AgentOfficeData = {
  id: 'rx-architect',
  name: 'Architect',
  role: 'architect',
  status: 'working',
  currentTask: 'Revisando PR #44',
  zoneId: 'dev-zone',
  position: { x: 50, y: 50 },
  color: '#8b5cf6',
  speechText: null,
}

describe('AgentDetailPanel', () => {
  let onClose: ReturnType<typeof vi.fn>

  beforeEach(() => {
    onClose = vi.fn()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('exibe o nome do agente no header', () => {
    render(<AgentDetailPanel agent={mockAgent} onClose={onClose} />)
    expect(screen.getByText('Architect')).toBeTruthy()
  })

  it('exibe o role do agente', () => {
    render(<AgentDetailPanel agent={mockAgent} onClose={onClose} />)
    expect(screen.getByText('architect')).toBeTruthy()
  })

  it('exibe status e zona', () => {
    render(<AgentDetailPanel agent={mockAgent} onClose={onClose} />)
    expect(screen.getByText('ZONA')).toBeTruthy()
    expect(screen.getByText('dev-zone')).toBeTruthy()
  })

  it('exibe a task atual', () => {
    render(<AgentDetailPanel agent={mockAgent} onClose={onClose} />)
    expect(screen.getByText('Revisando PR #44')).toBeTruthy()
  })

  it('não exibe seção task quando currentTask está vazio', () => {
    const agentSemTask = { ...mockAgent, currentTask: '' }
    render(<AgentDetailPanel agent={agentSemTask} onClose={onClose} />)
    expect(screen.queryByText('TASK ATUAL')).toBeNull()
  })

  it('chama onClose ao clicar no botão fechar', () => {
    render(<AgentDetailPanel agent={mockAgent} onClose={onClose} />)
    fireEvent.click(screen.getByLabelText('Fechar painel'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('chama onClose ao pressionar Escape', () => {
    render(<AgentDetailPanel agent={mockAgent} onClose={onClose} />)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('chama onClose ao clicar no overlay', () => {
    render(<AgentDetailPanel agent={mockAgent} onClose={onClose} />)
    const overlay = document.querySelector('[aria-hidden="true"]') as HTMLElement
    fireEvent.click(overlay)
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('tem role complementary e aria-label', () => {
    render(<AgentDetailPanel agent={mockAgent} onClose={onClose} />)
    expect(screen.getByRole('complementary', { name: /detalhes do agente Architect/i })).toBeTruthy()
  })

  it('exibe mensagens rápidas predefinidas', () => {
    render(<AgentDetailPanel agent={mockAgent} onClose={onClose} />)
    expect(screen.getByText('Qual sua task atual?')).toBeTruthy()
    expect(screen.getByText('Pause e aguarde')).toBeTruthy()
  })

  it('input de mensagem está presente', () => {
    render(<AgentDetailPanel agent={mockAgent} onClose={onClose} />)
    expect(screen.getByLabelText('mensagem para o agente')).toBeTruthy()
  })

  it('botão send está desabilitado com input vazio', () => {
    render(<AgentDetailPanel agent={mockAgent} onClose={onClose} />)
    const btn = screen.getByLabelText('enviar mensagem') as HTMLButtonElement
    expect(btn.disabled).toBe(true)
  })

  it('botão send habilita ao digitar mensagem', () => {
    render(<AgentDetailPanel agent={mockAgent} onClose={onClose} />)
    const input = screen.getByLabelText('mensagem para o agente')
    fireEvent.change(input, { target: { value: 'olá agente' } })
    const btn = screen.getByLabelText('enviar mensagem') as HTMLButtonElement
    expect(btn.disabled).toBe(false)
  })

  it('envia mensagem com fetch e exibe no histórico', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ response: 'Tudo certo!' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<AgentDetailPanel agent={mockAgent} onClose={onClose} />)
    const input = screen.getByLabelText('mensagem para o agente')
    fireEvent.change(input, { target: { value: 'Qual a task?' } })
    fireEvent.click(screen.getByLabelText('enviar mensagem'))

    // Mensagem do usuário aparece imediatamente
    expect(screen.getByText('Qual a task?')).toBeTruthy()

    // Resposta do agente aparece após fetch
    await waitFor(() => expect(screen.getByText('Tudo certo!')).toBeTruthy())
    await waitFor(() => expect(screen.getByText('Mensagem enviada!')).toBeTruthy())
  })

  it('exibe erro quando fetch falha', async () => {
    const fetchMock = vi.fn().mockRejectedValueOnce(new Error('Network error'))
    vi.stubGlobal('fetch', fetchMock)

    render(<AgentDetailPanel agent={mockAgent} onClose={onClose} />)
    const input = screen.getByLabelText('mensagem para o agente')
    fireEvent.change(input, { target: { value: 'teste' } })
    fireEvent.click(screen.getByLabelText('enviar mensagem'))

    await waitFor(() => expect(screen.getByText('Erro ao enviar. Tente novamente.')).toBeTruthy())
  })

  it('exibe erro quando fetch retorna status não-ok', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({ ok: false, status: 500 })
    vi.stubGlobal('fetch', fetchMock)

    render(<AgentDetailPanel agent={mockAgent} onClose={onClose} />)
    const input = screen.getByLabelText('mensagem para o agente')
    fireEvent.change(input, { target: { value: 'teste' } })
    fireEvent.click(screen.getByLabelText('enviar mensagem'))

    await waitFor(() => expect(screen.getByText('Erro ao enviar. Tente novamente.')).toBeTruthy())
  })

  it('click em quick message envia mensagem', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ response: 'ok' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<AgentDetailPanel agent={mockAgent} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: 'Qual sua task atual?' }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce())
  })
})
