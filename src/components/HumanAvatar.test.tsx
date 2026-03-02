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
      div: ({ children, style, drag, onDragEnd: _ode, dragConstraints: _dc, dragElastic: _de, whileDrag: _wd, animate: _an, transition: _tr, ...rest }: React.HTMLAttributes<HTMLDivElement> & { drag?: boolean; onDragEnd?: unknown; dragConstraints?: unknown; dragElastic?: unknown; whileDrag?: unknown; animate?: unknown; transition?: unknown }) => (
        <div style={style} {...(drag !== undefined ? { 'data-drag': String(drag) } : {})} {...rest}>{children}</div>
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
  it('exibe as iniciais do usuário', () => {
    render(<HumanAvatar user={mockUser} isMe={false} canvasRef={canvasRef} />)
    expect(screen.getByText('AL')).toBeTruthy()
  })

  it('exibe o nome do usuário', () => {
    render(<HumanAvatar user={mockUser} isMe={false} canvasRef={canvasRef} />)
    expect(screen.getByText('Alice Lima')).toBeTruthy()
  })

  it('exibe badge YOU quando isMe=true', () => {
    render(<HumanAvatar user={mockUser} isMe={true} canvasRef={canvasRef} />)
    expect(screen.getByText('you')).toBeTruthy()
  })

  it('não exibe badge YOU quando isMe=false', () => {
    render(<HumanAvatar user={mockUser} isMe={false} canvasRef={canvasRef} />)
    expect(screen.queryByText('you')).toBeNull()
  })

  it('tem drag ativo apenas quando isMe=true', () => {
    const { container } = render(<HumanAvatar user={mockUser} isMe={true} canvasRef={canvasRef} />)
    const el = container.firstChild as HTMLElement
    expect(el.getAttribute('data-drag')).toBe('true')
  })

  it('não tem drag quando isMe=false', () => {
    const { container } = render(<HumanAvatar user={mockUser} isMe={false} canvasRef={canvasRef} />)
    const el = container.firstChild as HTMLElement
    expect(el.getAttribute('data-drag')).toBeNull()
  })
})
