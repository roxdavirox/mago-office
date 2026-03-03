import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AgentDetailPanel } from './AgentDetailPanel'
import type { AgentOfficeData } from '../hooks/useOfficeState'

// scrollIntoView is not implemented in happy-dom
window.HTMLElement.prototype.scrollIntoView = vi.fn()

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion')
  return {
    ...actual,
    motion: {
      div: ({
        children,
        style,
        variants: _v,
        initial: _i,
        animate: _a,
        exit: _e,
        transition: _t,
        layout: _l,
        ...rest
      }: React.HTMLAttributes<HTMLDivElement> & Record<string, unknown>) => (
        <div style={style} {...rest}>
          {children}
        </div>
      ),
      aside: ({
        children,
        style,
        variants: _v,
        initial: _i,
        animate: _a,
        exit: _e,
        ...rest
      }: React.HTMLAttributes<HTMLElement> & Record<string, unknown>) => (
        <aside style={style} {...rest}>
          {children}
        </aside>
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
  currentTask: 'Reviewing PR #44',
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

  it('shows agent name in header', () => {
    render(<AgentDetailPanel agent={mockAgent} onClose={onClose} />)
    expect(screen.getByText('Architect')).toBeTruthy()
  })

  it('shows agent role', () => {
    render(<AgentDetailPanel agent={mockAgent} onClose={onClose} />)
    expect(screen.getByText('architect')).toBeTruthy()
  })

  it('shows status and zone', () => {
    render(<AgentDetailPanel agent={mockAgent} onClose={onClose} />)
    expect(screen.getByText('ZONE')).toBeTruthy()
    expect(screen.getByText('dev-zone')).toBeTruthy()
  })

  it('shows current task', () => {
    render(<AgentDetailPanel agent={mockAgent} onClose={onClose} />)
    expect(screen.getByText('Reviewing PR #44')).toBeTruthy()
  })

  it('does not show task section when currentTask is empty', () => {
    const agentNoTask = { ...mockAgent, currentTask: '' }
    render(<AgentDetailPanel agent={agentNoTask} onClose={onClose} />)
    expect(screen.queryByText('CURRENT TASK')).toBeNull()
  })

  it('calls onClose when close button is clicked', () => {
    render(<AgentDetailPanel agent={mockAgent} onClose={onClose} />)
    fireEvent.click(screen.getByLabelText('Close panel'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('calls onClose when Escape is pressed', () => {
    render(<AgentDetailPanel agent={mockAgent} onClose={onClose} />)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('calls onClose when overlay is clicked', () => {
    render(<AgentDetailPanel agent={mockAgent} onClose={onClose} />)
    const overlay = document.querySelector('[aria-hidden="true"]') as HTMLElement
    fireEvent.click(overlay)
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('has complementary role and aria-label', () => {
    render(<AgentDetailPanel agent={mockAgent} onClose={onClose} />)
    expect(screen.getByRole('complementary', { name: /Agent details: Architect/i })).toBeTruthy()
  })

  it('shows predefined quick messages', () => {
    render(<AgentDetailPanel agent={mockAgent} onClose={onClose} />)
    expect(screen.getByText('What is your current task?')).toBeTruthy()
    expect(screen.getByText('Pause and wait')).toBeTruthy()
  })

  it('message input is present', () => {
    render(<AgentDetailPanel agent={mockAgent} onClose={onClose} />)
    expect(screen.getByLabelText('message to agent')).toBeTruthy()
  })

  it('send button is disabled with empty input', () => {
    render(<AgentDetailPanel agent={mockAgent} onClose={onClose} />)
    const btn = screen.getByLabelText('send message') as HTMLButtonElement
    expect(btn.disabled).toBe(true)
  })

  it('send button enables when message is typed', () => {
    render(<AgentDetailPanel agent={mockAgent} onClose={onClose} />)
    const input = screen.getByLabelText('message to agent')
    fireEvent.change(input, { target: { value: 'hello agent' } })
    const btn = screen.getByLabelText('send message') as HTMLButtonElement
    expect(btn.disabled).toBe(false)
  })

  it('sends message with fetch and shows it in history', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ response: 'All good!' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<AgentDetailPanel agent={mockAgent} onClose={onClose} />)
    const input = screen.getByLabelText('message to agent')
    fireEvent.change(input, { target: { value: 'What is the task?' } })
    fireEvent.click(screen.getByLabelText('send message'))

    // User message appears immediately
    expect(screen.getByText('What is the task?')).toBeTruthy()

    // Agent response appears after fetch
    await waitFor(() => expect(screen.getByText('All good!')).toBeTruthy())
    await waitFor(() => expect(screen.getByText('Message sent!')).toBeTruthy())
  })

  it('shows error when fetch fails', async () => {
    const fetchMock = vi.fn().mockRejectedValueOnce(new Error('Network error'))
    vi.stubGlobal('fetch', fetchMock)

    render(<AgentDetailPanel agent={mockAgent} onClose={onClose} />)
    const input = screen.getByLabelText('message to agent')
    fireEvent.change(input, { target: { value: 'test' } })
    fireEvent.click(screen.getByLabelText('send message'))

    await waitFor(() => expect(screen.getByText('Failed to send. Please try again.')).toBeTruthy())
  })

  it('shows error when fetch returns non-ok status', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({ ok: false, status: 500 })
    vi.stubGlobal('fetch', fetchMock)

    render(<AgentDetailPanel agent={mockAgent} onClose={onClose} />)
    const input = screen.getByLabelText('message to agent')
    fireEvent.change(input, { target: { value: 'test' } })
    fireEvent.click(screen.getByLabelText('send message'))

    await waitFor(() => expect(screen.getByText('Failed to send. Please try again.')).toBeTruthy())
  })

  it('clicking a quick message sends it', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ response: 'ok' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<AgentDetailPanel agent={mockAgent} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: 'What is your current task?' }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce())
  })
})
