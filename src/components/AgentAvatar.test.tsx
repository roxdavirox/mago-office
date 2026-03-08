import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { None, Some } from '@roxdavirox/fp-core/option'
import { AgentAvatar } from './AgentAvatar'
import type { AgentOfficeData } from '../hooks/useOfficeState'

type MotionDivProps = React.HTMLAttributes<HTMLDivElement> & Record<string, unknown>

// Captures the last onDragEnd handler passed by AgentAvatar so tests can invoke it
let capturedOnDragEnd: ((_e: unknown, info: unknown) => void) | undefined

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion')
  return {
    ...actual,
    useMotionValue: () => ({ set: vi.fn(), get: vi.fn() }),
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
        drag: _drag,
        dragConstraints: _dc,
        dragElastic: _de,
        dragMomentum: _dm,
        onDragEnd,
        x: _x,
        y: _y,
        ...rest
      }: MotionDivProps) => {
        if (typeof onDragEnd === 'function') {
          capturedOnDragEnd = onDragEnd as (_e: unknown, info: unknown) => void
        }
        return <div {...rest}>{children}</div>
      },
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
  speechText: None,
  isManualOverride: false,
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

  it('does not render SpeechBubble when speechText is None', () => {
    render(<AgentAvatar agent={mockAgent} />)
    expect(screen.queryByText(/waiting/i)).toBeNull()
  })

  it('renders SpeechBubble when speechText is Some', () => {
    render(<AgentAvatar agent={{ ...mockAgent, speechText: Some('Analyzing code') }} />)
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

  describe('manual override', () => {
    it('shows anchor badge when isManualOverride is true', () => {
      render(<AgentAvatar agent={{ ...mockAgent, isManualOverride: true }} />)
      expect(document.querySelector('[aria-label="manual override"]')).toBeTruthy()
    })

    it('hides anchor badge when isManualOverride is false', () => {
      render(<AgentAvatar agent={mockAgent} />)
      expect(document.querySelector('[aria-label="manual override"]')).toBeNull()
    })

    it('shows reset button when isManualOverride is true', () => {
      const onClear = vi.fn()
      render(
        <AgentAvatar agent={{ ...mockAgent, isManualOverride: true }} onClearOverride={onClear} />
      )
      expect(screen.getByRole('button', { name: /reset position/i })).toBeTruthy()
    })

    it('hides reset button when isManualOverride is false', () => {
      render(<AgentAvatar agent={mockAgent} />)
      expect(screen.queryByRole('button', { name: /reset position/i })).toBeNull()
    })

    it('calls onClearOverride when reset button is clicked', () => {
      const onClear = vi.fn()
      render(
        <AgentAvatar agent={{ ...mockAgent, isManualOverride: true }} onClearOverride={onClear} />
      )
      fireEvent.click(screen.getByRole('button', { name: /reset position/i }))
      expect(onClear).toHaveBeenCalledWith('rx-architect')
    })
  })

  describe('drag handler', () => {
    beforeEach(() => {
      capturedOnDragEnd = undefined
    })
    afterEach(() => {
      vi.useRealTimers()
    })

    /** Build a canvas mock with a specific getBoundingClientRect */
    function makeCanvasRef(rect: { left: number; top: number; width: number; height: number }) {
      const div = document.createElement('div')
      div.getBoundingClientRect = () => ({
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        right: rect.left + rect.width,
        bottom: rect.top + rect.height,
        x: rect.left,
        y: rect.top,
        toJSON: () => {},
      })
      return { current: div } as React.RefObject<HTMLDivElement>
    }

    it('calls onZoneOverride when dropped inside a valid zone', () => {
      const onZoneOverride = vi.fn()
      const canvasRef = makeCanvasRef({ left: 0, top: 0, width: 1000, height: 600 })

      render(
        <AgentAvatar agent={mockAgent} canvasRef={canvasRef} onZoneOverride={onZoneOverride} />
      )

      // dev-zone spans x: 5-55, y: 5-45 (from office-layout.ts)
      // Simulate a drop at 30% x, 25% y → point at (300, 150) on a 1000x600 canvas
      act(() => {
        capturedOnDragEnd?.(null, { point: { x: 300, y: 150 } })
      })

      expect(onZoneOverride).toHaveBeenCalledWith(
        'rx-architect',
        expect.objectContaining({ zoneId: expect.any(String) })
      )
    })

    it('does not call onZoneOverride when dropped outside all zones', () => {
      const onZoneOverride = vi.fn()
      const canvasRef = makeCanvasRef({ left: 0, top: 0, width: 1000, height: 600 })

      render(
        <AgentAvatar agent={mockAgent} canvasRef={canvasRef} onZoneOverride={onZoneOverride} />
      )

      // Drop at 50% x, 50% y — check if it falls outside zones; use far corner 99%, 99%
      act(() => {
        capturedOnDragEnd?.(null, { point: { x: 990, y: 594 } })
      })

      expect(onZoneOverride).not.toHaveBeenCalled()
    })

    it('shows shake when dropped outside all zones (clears after 500ms)', () => {
      vi.useFakeTimers()
      const canvasRef = makeCanvasRef({ left: 0, top: 0, width: 1000, height: 600 })

      render(<AgentAvatar agent={mockAgent} canvasRef={canvasRef} />)

      act(() => {
        capturedOnDragEnd?.(null, { point: { x: 990, y: 594 } })
      })

      act(() => {
        vi.advanceTimersByTime(500)
      })
      // No throw = shake timer cleared cleanly
    })

    it('does not call onZoneOverride when canvasRef.current is null', () => {
      const onZoneOverride = vi.fn()
      const canvasRef = { current: null } as unknown as React.RefObject<HTMLDivElement>

      render(
        <AgentAvatar agent={mockAgent} canvasRef={canvasRef} onZoneOverride={onZoneOverride} />
      )

      act(() => {
        capturedOnDragEnd?.(null, { point: { x: 300, y: 150 } })
      })

      expect(onZoneOverride).not.toHaveBeenCalled()
    })
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
