import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { OnlineUsersList } from './OnlineUsersList'
import type { UserOfficeData } from '../hooks/useOfficeState'

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion')
  return {
    ...actual,
    motion: {
      div: ({
        children,
        style,
        layout: _l,
        variants: _v,
        initial: _i,
        animate: _a,
        exit: _e,
        transition: _t,
        ...rest
      }: React.HTMLAttributes<HTMLDivElement> & {
        layout?: unknown
        variants?: unknown
        initial?: unknown
        animate?: unknown
        exit?: unknown
        transition?: unknown
      }) => (
        <div style={style} {...rest}>
          {children}
        </div>
      ),
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  }
})

const mockUsers: UserOfficeData[] = [
  { socketId: 'sock-1', userId: 'user-abc', name: 'Alice Lima', x: 50, y: 80 },
  { socketId: 'sock-2', userId: 'user-def', name: 'Bob Silva', x: 30, y: 40 },
]

describe('OnlineUsersList', () => {
  it('does not render when list is empty', () => {
    const { container } = render(<OnlineUsersList users={[]} mySocketId={null} />)
    expect(container.firstChild).toBeNull()
  })

  it('shows header with user count', () => {
    render(<OnlineUsersList users={mockUsers} mySocketId={null} />)
    expect(screen.getByText(/online · 2/i)).toBeTruthy()
  })

  it('shows all user names', () => {
    render(<OnlineUsersList users={mockUsers} mySocketId={null} />)
    expect(screen.getByText('Alice Lima')).toBeTruthy()
    expect(screen.getByText('Bob Silva')).toBeTruthy()
  })

  it('shows you badge only for own user', () => {
    render(<OnlineUsersList users={mockUsers} mySocketId="sock-1" />)
    expect(screen.getByText('you')).toBeTruthy()
  })

  it('does not show you badge when mySocketId does not match', () => {
    render(<OnlineUsersList users={mockUsers} mySocketId="sock-999" />)
    expect(screen.queryByText('you')).toBeNull()
  })

  it('has list role and aria-label for accessibility', () => {
    render(<OnlineUsersList users={mockUsers} mySocketId={null} />)
    const list = screen.getByRole('list', { name: /online users/i })
    expect(list).toBeTruthy()
  })

  it('shows initials of each user', () => {
    render(<OnlineUsersList users={mockUsers} mySocketId={null} />)
    expect(screen.getByText('AL')).toBeTruthy()
    expect(screen.getByText('BS')).toBeTruthy()
  })

  it('shows correct count with 1 user', () => {
    render(<OnlineUsersList users={[mockUsers[0]]} mySocketId={null} />)
    expect(screen.getByText(/online · 1/i)).toBeTruthy()
  })
})
