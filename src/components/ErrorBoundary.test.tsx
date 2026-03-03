import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ErrorBoundary } from './ErrorBoundary'

/** Component that throws during render for testing purposes */
function BombComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error('test explosion')
  return <div>all good</div>
}

// Suppress React's error boundary console output in tests
const originalError = console.error
beforeEach(() => {
  console.error = vi.fn()
})
afterEach(() => {
  console.error = originalError
})

describe('ErrorBoundary — no error', () => {
  it('renders children when no error is thrown', () => {
    render(
      <ErrorBoundary>
        <BombComponent shouldThrow={false} />
      </ErrorBoundary>
    )
    expect(screen.getByText('all good')).toBeTruthy()
  })
})

describe('ErrorBoundary — error caught', () => {
  it('renders alert with aria-label when child throws', () => {
    render(
      <ErrorBoundary>
        <BombComponent shouldThrow={true} />
      </ErrorBoundary>
    )
    expect(screen.getByRole('alert')).toBeTruthy()
    expect(screen.getByLabelText('application error')).toBeTruthy()
  })

  it('shows the error message', () => {
    render(
      <ErrorBoundary>
        <BombComponent shouldThrow={true} />
      </ErrorBoundary>
    )
    expect(screen.getByText('test explosion')).toBeTruthy()
  })

  it('shows something went wrong heading', () => {
    render(
      <ErrorBoundary>
        <BombComponent shouldThrow={true} />
      </ErrorBoundary>
    )
    expect(screen.getByText(/something went wrong/i)).toBeTruthy()
  })

  it('renders reload button', () => {
    render(
      <ErrorBoundary>
        <BombComponent shouldThrow={true} />
      </ErrorBoundary>
    )
    expect(screen.getByRole('button', { name: /reload application/i })).toBeTruthy()
  })

  it('does not render children when error is thrown', () => {
    render(
      <ErrorBoundary>
        <BombComponent shouldThrow={true} />
      </ErrorBoundary>
    )
    expect(screen.queryByText('all good')).toBeNull()
  })
})

describe('ErrorBoundary — custom fallback', () => {
  it('renders custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={(err) => <p>custom: {err.message}</p>}>
        <BombComponent shouldThrow={true} />
      </ErrorBoundary>
    )
    expect(screen.getByText('custom: test explosion')).toBeTruthy()
  })

  it('does not render default alert when custom fallback is used', () => {
    render(
      <ErrorBoundary fallback={() => <p>custom ui</p>}>
        <BombComponent shouldThrow={true} />
      </ErrorBoundary>
    )
    expect(screen.queryByRole('alert')).toBeNull()
  })
})

describe('ErrorBoundary — reload button', () => {
  it('calls window.location.reload when reload button is clicked', () => {
    const reload = vi.fn()
    vi.stubGlobal('location', { reload })

    render(
      <ErrorBoundary>
        <BombComponent shouldThrow={true} />
      </ErrorBoundary>
    )

    fireEvent.click(screen.getByRole('button', { name: /reload application/i }))
    expect(reload).toHaveBeenCalledTimes(1)

    vi.unstubAllGlobals()
  })
})
