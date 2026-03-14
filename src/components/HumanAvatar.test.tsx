import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HumanAvatar } from './HumanAvatar'
import type { UserOfficeData } from '../hooks/useOfficeState'

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion')
  return {
    ...actual,
    motion: {
      div: ({
        children,
        style,
        'aria-label': ariaLabel,
        animate: _an,
        transition: _tr,
        ...rest
      }: React.HTMLAttributes<HTMLDivElement> & {
        animate?: unknown
        transition?: unknown
      }) => (
        <div style={style} aria-label={ariaLabel} {...rest}>
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

describe('HumanAvatar', () => {
  it('mostra iniciais do usuário', () => {
    render(<HumanAvatar user={mockUser} isMe={false} />)
    expect(screen.getByText('AL')).toBeTruthy()
  })

  it('mostra nome do usuário', () => {
    render(<HumanAvatar user={mockUser} isMe={false} />)
    expect(screen.getByText('Alice Lima')).toBeTruthy()
  })

  it('mostra badge YOU quando isMe=true', () => {
    render(<HumanAvatar user={mockUser} isMe={true} />)
    expect(screen.getByText('you')).toBeTruthy()
  })

  it('não mostra badge YOU quando isMe=false', () => {
    render(<HumanAvatar user={mockUser} isMe={false} />)
    expect(screen.queryByText('you')).toBeNull()
  })

  it('aria-label contém nome quando isMe=true', () => {
    const { container } = render(<HumanAvatar user={mockUser} isMe={true} />)
    const el = container.firstChild as HTMLElement
    expect(el.getAttribute('aria-label')).toContain('Alice Lima')
    expect(el.getAttribute('aria-label')).toContain('your avatar')
  })

  it('aria-label contém nome quando isMe=false', () => {
    const { container } = render(<HumanAvatar user={mockUser} isMe={false} />)
    const el = container.firstChild as HTMLElement
    expect(el.getAttribute('aria-label')).toContain('Alice Lima')
    expect(el.getAttribute('aria-label')).toContain('user')
  })

  it('posiciona via left/top em porcentagem', () => {
    const { container } = render(<HumanAvatar user={mockUser} isMe={false} />)
    const el = container.firstChild as HTMLElement
    expect(el.style.left).toBe('50%')
    expect(el.style.top).toBe('80%')
  })
})
