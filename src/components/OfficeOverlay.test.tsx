import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { OfficeOverlay } from './OfficeOverlay'

describe('OfficeOverlay — returns null when idle', () => {
  it('renders nothing when isLoading=false and error=null', () => {
    const { container } = render(<OfficeOverlay isLoading={false} error={null} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing when no props are given', () => {
    const { container } = render(<OfficeOverlay />)
    expect(container.firstChild).toBeNull()
  })
})

describe('OfficeOverlay — loading state', () => {
  it('renders status element with aria-label when isLoading=true', () => {
    render(<OfficeOverlay isLoading={true} />)
    expect(screen.getByRole('status')).toBeTruthy()
    expect(screen.getByLabelText('loading office')).toBeTruthy()
  })

  it('shows connecting message', () => {
    render(<OfficeOverlay isLoading={true} />)
    expect(screen.getByText(/connecting to MAGO/i)).toBeTruthy()
  })

  it('loading takes priority over error when both are set', () => {
    render(<OfficeOverlay isLoading={true} error="some error" />)
    expect(screen.getByRole('status')).toBeTruthy()
    expect(screen.queryByRole('alert')).toBeNull()
  })
})

describe('OfficeOverlay — error state', () => {
  it('renders alert element with aria-label when error is set', () => {
    render(<OfficeOverlay error="HTTP 500" />)
    expect(screen.getByRole('alert')).toBeTruthy()
    expect(screen.getByLabelText('office error')).toBeTruthy()
  })

  it('shows failed to load agents message', () => {
    render(<OfficeOverlay error="HTTP 500" />)
    expect(screen.getByText(/failed to load agents/i)).toBeTruthy()
  })

  it('shows the error detail text', () => {
    render(<OfficeOverlay error="HTTP 500" />)
    expect(screen.getByText('HTTP 500')).toBeTruthy()
  })

  it('renders retry button when onRetry is provided', () => {
    render(<OfficeOverlay error="timeout" onRetry={vi.fn()} />)
    expect(screen.getByRole('button', { name: /retry loading/i })).toBeTruthy()
  })

  it('does not render retry button when onRetry is omitted', () => {
    render(<OfficeOverlay error="timeout" />)
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('calls onRetry when retry button is clicked', () => {
    const onRetry = vi.fn()
    render(<OfficeOverlay error="timeout" onRetry={onRetry} />)
    fireEvent.click(screen.getByRole('button', { name: /retry loading/i }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
