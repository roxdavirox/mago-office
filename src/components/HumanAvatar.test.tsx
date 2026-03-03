import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createRef } from 'react'
import { HumanAvatar } from './HumanAvatar'
import type { UserOfficeData } from '../hooks/useOfficeState'

vi.mock('../services/socket', () => ({
  getSocket: () => ({ emit: vi.fn() }),
}))

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
        onDragEnd: _ode,
        dragConstraints: _dc,
        dragElastic: _de,
        whileDrag: _wd,
        animate: _an,
        transition: _tr,
        ...rest
      }: React.HTMLAttributes<HTMLDivElement> & {
        drag?: boolean
        onDragEnd?: unknown
        dragConstraints?: unknown
        dragElastic?: unknown
        whileDrag?: unknown
        animate?: unknown
        transition?: unknown
      }) => (
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
      ),
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
})
