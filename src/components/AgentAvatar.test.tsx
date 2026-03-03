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
  currentTask: 'Waiting for next cycle',
  zoneId: 'coffee-corner',
  position: { x: 30, y: 50 },
  color: '#8b5cf6',
  speechText: null,
}

describe('AgentAvatar', () => {
  it('renders the agent name', () => {
    render(<AgentAvatar agent={mockAgent} />)
    expect(screen.getByText('Architect')).toBeTruthy()
  })

  it('renders the correct icon for role architect', () => {
    render(<AgentAvatar agent={mockAgent} />)
    expect(screen.getByText('🤖')).toBeTruthy()
  })

  it('renders the correct icon for role backend', () => {
    render(<AgentAvatar agent={{ ...mockAgent, role: 'backend' }} />)
    expect(screen.getByText('🔬')).toBeTruthy()
  })

  it('renders the correct icon for role orchestrator', () => {
    render(<AgentAvatar agent={{ ...mockAgent, role: 'orchestrator' }} />)
    expect(screen.getByText('⚡')).toBeTruthy()
  })

  it('calls onClick when clicked', () => {
    const onClick = vi.fn()
    render(<AgentAvatar agent={mockAgent} onClick={onClick} />)
    const container = document.querySelector('[style*="position: absolute"]') as HTMLElement
    fireEvent.click(container)
    expect(onClick).toHaveBeenCalledWith(mockAgent)
  })

  it('does not render SpeechBubble when speechText is null', () => {
    render(<AgentAvatar agent={mockAgent} />)
    expect(screen.queryByText(/waiting/i)).toBeNull()
  })

  it('renders SpeechBubble when speechText is set', () => {
    render(<AgentAvatar agent={{ ...mockAgent, speechText: 'Analyzing code' }} />)
    expect(screen.getByText('Analyzing code')).toBeTruthy()
  })

  it('badge has aria-label with current status', () => {
    render(<AgentAvatar agent={mockAgent} />)
    expect(document.querySelector('[aria-label="status: idle"]')).toBeTruthy()
  })

  it('offline agent has reduced opacity', () => {
    render(<AgentAvatar agent={{ ...mockAgent, status: 'offline' }} />)
    const circle = document.querySelector('[style*="opacity: 0.35"]')
    expect(circle).toBeTruthy()
  })

  it('has aria-label with agent name and status', () => {
    render(<AgentAvatar agent={mockAgent} />)
    expect(document.querySelector('[aria-label*="Architect"]')).toBeTruthy()
  })

  describe('tooltip with fake timers', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })
    afterEach(() => {
      vi.useRealTimers()
    })

    it('tooltip appears after 400ms of hover', () => {
      render(<AgentAvatar agent={mockAgent} />)
      const container = document.querySelector('[style*="position: absolute"]') as HTMLElement
      fireEvent.mouseEnter(container)
      expect(screen.queryByRole('tooltip')).toBeNull()
      act(() => {
        vi.advanceTimersByTime(400)
      })
      expect(screen.getByRole('tooltip')).toBeTruthy()
    })

    it('tooltip disappears on mouseLeave', () => {
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
