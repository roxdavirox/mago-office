import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { createRef } from 'react'
import { HumanAvatar } from './HumanAvatar'
import type { UserOfficeData } from '../hooks/useOfficeState'

const mockEmit = vi.fn()

vi.mock('../services/socket', () => ({
  getSocket: () => ({ emit: mockEmit }),
}))

// Captures the last onDragEnd handler so tests can invoke it directly
let capturedOnDragEnd: ((_e: unknown, info: unknown) => void) | undefined

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion')
  return {
    ...actual,
    motion: {
      div: ({
        children,
        style,
        drag,
        role,
        'aria-label': ariaLabel,
        'aria-grabbed': ariaGrabbed,
        tabIndex,
        onDragEnd,
        dragConstraints: _dc,
        dragElastic: _de,
        whileDrag: _wd,
        animate: _an,
        transition: _tr,
        ...rest
      }: React.HTMLAttributes<HTMLDivElement> & {
        drag?: boolean
        onDragEnd?: (_e: unknown, info: unknown) => void
        dragConstraints?: unknown
        dragElastic?: unknown
        whileDrag?: unknown
        animate?: unknown
        transition?: unknown
      }) => {
        if (typeof onDragEnd === 'function') {
          capturedOnDragEnd = onDragEnd
        }
        return (
          <div
            style={style}
            role={role}
            aria-label={ariaLabel}
            aria-grabbed={ariaGrabbed}
            tabIndex={tabIndex}
            {...(drag !== undefined ? { 'data-drag': String(drag) } : {})}
            {...rest}
          >
            {children}
          </div>
        )
      },
    },
  }
})

const mockUser: UserOfficeData = {
  socketId: 'sock-1',
  userId: 'user-abc',
  name: 'Alice Lima',
  x: 50,
  y: 80,
}

const canvasRef = createRef<HTMLDivElement>()

/** Build a canvas ref with a specific getBoundingClientRect */
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

describe('HumanAvatar', () => {
  it('shows user initials', () => {
    render(<HumanAvatar user={mockUser} isMe={false} canvasRef={canvasRef} />)
    expect(screen.getByText('AL')).toBeTruthy()
  })

  it('shows user name', () => {
    render(<HumanAvatar user={mockUser} isMe={false} canvasRef={canvasRef} />)
    expect(screen.getByText('Alice Lima')).toBeTruthy()
  })

  it('shows YOU badge when isMe=true', () => {
    render(<HumanAvatar user={mockUser} isMe={true} canvasRef={canvasRef} />)
    expect(screen.getByText('you')).toBeTruthy()
  })

  it('does not show YOU badge when isMe=false', () => {
    render(<HumanAvatar user={mockUser} isMe={false} canvasRef={canvasRef} />)
    expect(screen.queryByText('you')).toBeNull()
  })

  it('has drag active only when isMe=true', () => {
    const { container } = render(<HumanAvatar user={mockUser} isMe={true} canvasRef={canvasRef} />)
    const el = container.firstChild as HTMLElement
    expect(el.getAttribute('data-drag')).toBe('true')
  })

  it('has no drag when isMe=false', () => {
    const { container } = render(<HumanAvatar user={mockUser} isMe={false} canvasRef={canvasRef} />)
    const el = container.firstChild as HTMLElement
    expect(el.getAttribute('data-drag')).toBeNull()
  })

  it('has role=button and aria-label when isMe=true', () => {
    render(<HumanAvatar user={mockUser} isMe={true} canvasRef={canvasRef} />)
    const btn = screen.getByRole('button')
    expect(btn).toBeTruthy()
    expect(btn.getAttribute('aria-label')).toContain('Alice Lima')
  })

  it('has no role=button when isMe=false', () => {
    render(<HumanAvatar user={mockUser} isMe={false} canvasRef={canvasRef} />)
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('has aria-label describing the user when isMe=false', () => {
    const { container } = render(<HumanAvatar user={mockUser} isMe={false} canvasRef={canvasRef} />)
    const el = container.firstChild as HTMLElement
    expect(el.getAttribute('aria-label')).toContain('Alice Lima')
  })

  describe('handleDragEnd', () => {
    afterEach(() => {
      mockEmit.mockClear()
      capturedOnDragEnd = undefined
      vi.useRealTimers()
    })

    it('emits office:user:move with % coords when isMe=true', () => {
      const ref = makeCanvasRef({ left: 0, top: 0, width: 1000, height: 500 })
      render(<HumanAvatar user={mockUser} isMe={true} canvasRef={ref} />)

      act(() => {
        capturedOnDragEnd?.(null, { point: { x: 500, y: 250 } })
      })

      expect(mockEmit).toHaveBeenCalledWith('office:user:move', { x: 50, y: 50 })
    })

    it('does not emit when isMe=false', () => {
      const ref = makeCanvasRef({ left: 0, top: 0, width: 1000, height: 500 })
      render(<HumanAvatar user={mockUser} isMe={false} canvasRef={ref} />)

      act(() => {
        capturedOnDragEnd?.(null, { point: { x: 500, y: 250 } })
      })

      expect(mockEmit).not.toHaveBeenCalled()
    })

    it('does not emit when canvasRef.current is null', () => {
      const ref = { current: null } as unknown as React.RefObject<HTMLDivElement>
      render(<HumanAvatar user={mockUser} isMe={true} canvasRef={ref} />)

      act(() => {
        capturedOnDragEnd?.(null, { point: { x: 500, y: 250 } })
      })

      expect(mockEmit).not.toHaveBeenCalled()
    })

    it('debounces — does not emit a second event within 100ms', () => {
      vi.useFakeTimers()
      const ref = makeCanvasRef({ left: 0, top: 0, width: 1000, height: 500 })
      render(<HumanAvatar user={mockUser} isMe={true} canvasRef={ref} />)

      act(() => {
        capturedOnDragEnd?.(null, { point: { x: 500, y: 250 } })
      })
      act(() => {
        capturedOnDragEnd?.(null, { point: { x: 600, y: 300 } })
      })

      expect(mockEmit).toHaveBeenCalledTimes(1)
    })

    it('emits again after debounce window elapses', () => {
      vi.useFakeTimers()
      const ref = makeCanvasRef({ left: 0, top: 0, width: 1000, height: 500 })
      render(<HumanAvatar user={mockUser} isMe={true} canvasRef={ref} />)

      act(() => {
        capturedOnDragEnd?.(null, { point: { x: 500, y: 250 } })
      })
      act(() => {
        vi.advanceTimersByTime(101)
      })
      act(() => {
        capturedOnDragEnd?.(null, { point: { x: 600, y: 300 } })
      })

      expect(mockEmit).toHaveBeenCalledTimes(2)
    })
  })
})
