import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { AgentAvatar } from './AgentAvatar'
import type { AgentOfficeData } from '../hooks/useOfficeState'

type MotionDivProps = React.HTMLAttributes<HTMLDivElement> & Record<string, unknown>

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion')
  return {
    ...actual,
    motion: {
      div: ({
        children,
        animate: _a,
        whileHover: _wh,
        transition: _t,
        layoutId: _lid,
        variants: _v,
        initial: _i,
        exit: _e,
        layout: _l,
        ...rest
      }: MotionDivProps) => <div {...rest}>{children}</div>,
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    layoutId: undefined,
  }
})

const mockAgent: AgentOfficeData = {
  id: 'rx-architect',
  name: 'Architect',
  role: 'architect',
  status: 'idle',
  currentTask: 'Aguardando próximo ciclo',
  zoneId: 'coffee-corner',
  position: { x: 30, y: 50 },
  color: '#8b5cf6',
  speechText: null,
}

describe('AgentAvatar', () => {
  it('renderiza o nome do agente', () => {
    render(<AgentAvatar agent={mockAgent} />)
    expect(screen.getByText('Architect')).toBeTruthy()
  })

  it('renderiza o ícone correto para role architect', () => {
    render(<AgentAvatar agent={mockAgent} />)
    expect(screen.getByText('🤖')).toBeTruthy()
  })

  it('renderiza ícone correto para role backend', () => {
    render(<AgentAvatar agent={{ ...mockAgent, role: 'backend' }} />)
    expect(screen.getByText('🔬')).toBeTruthy()
  })

  it('renderiza ícone correto para role orchestrator', () => {
    render(<AgentAvatar agent={{ ...mockAgent, role: 'orchestrator' }} />)
    expect(screen.getByText('⚡')).toBeTruthy()
  })

  it('chama onClick ao clicar', () => {
    const onClick = vi.fn()
    render(<AgentAvatar agent={mockAgent} onClick={onClick} />)
    const container = document.querySelector('[style*="position: absolute"]') as HTMLElement
    fireEvent.click(container)
    expect(onClick).toHaveBeenCalledWith(mockAgent)
  })

  it('não renderiza SpeechBubble quando speechText é null', () => {
    render(<AgentAvatar agent={mockAgent} />)
    expect(screen.queryByText(/aguardando/i)).toBeNull()
  })

  it('renderiza SpeechBubble quando speechText está preenchido', () => {
    render(<AgentAvatar agent={{ ...mockAgent, speechText: 'Analisando código' }} />)
    expect(screen.getByText('Analisando código')).toBeTruthy()
  })

  it('badge tem aria-label com o status atual', () => {
    render(<AgentAvatar agent={mockAgent} />)
    expect(document.querySelector('[aria-label="status: idle"]')).toBeTruthy()
  })

  it('agente offline tem opacidade reduzida', () => {
    render(<AgentAvatar agent={{ ...mockAgent, status: 'offline' }} />)
    const circle = document.querySelector('[style*="opacity: 0.35"]')
    expect(circle).toBeTruthy()
  })

  it('tem aria-label com nome e status do agente', () => {
    render(<AgentAvatar agent={mockAgent} />)
    expect(document.querySelector('[aria-label*="Architect"]')).toBeTruthy()
  })

  describe('tooltip com fake timers', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })
    afterEach(() => {
      vi.useRealTimers()
    })

    it('tooltip aparece após 400ms de hover', () => {
      render(<AgentAvatar agent={mockAgent} />)
      const container = document.querySelector('[style*="position: absolute"]') as HTMLElement
      fireEvent.mouseEnter(container)
      expect(screen.queryByRole('tooltip')).toBeNull()
      act(() => {
        vi.advanceTimersByTime(400)
      })
      expect(screen.getByRole('tooltip')).toBeTruthy()
    })

    it('tooltip desaparece ao mouseLeave', () => {
      render(<AgentAvatar agent={mockAgent} />)
      const container = document.querySelector('[style*="position: absolute"]') as HTMLElement
      fireEvent.mouseEnter(container)
      act(() => {
        vi.advanceTimersByTime(400)
      })
      fireEvent.mouseLeave(container)
      expect(screen.queryByRole('tooltip')).toBeNull()
    })
  })
})
