import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AvatarTooltip } from './AvatarTooltip'

const lines = [
  { label: 'role', value: 'architect' },
  { label: 'status', value: 'working', valueColor: '#00ff41' },
  { label: 'task', value: 'Reviewing PR #44' },
]

describe('AvatarTooltip', () => {
  it('has tooltip role', () => {
    render(<AvatarTooltip lines={lines} />)
    expect(screen.getByRole('tooltip')).toBeTruthy()
  })

  it('displays all content lines', () => {
    render(<AvatarTooltip lines={lines} />)
    expect(screen.getByText('architect')).toBeTruthy()
    expect(screen.getByText('working')).toBeTruthy()
    expect(screen.getByText('Reviewing PR #44')).toBeTruthy()
  })

  it('displays the label of each line', () => {
    render(<AvatarTooltip lines={lines} />)
    expect(screen.getByText('role')).toBeTruthy()
    expect(screen.getByText('status')).toBeTruthy()
    expect(screen.getByText('task')).toBeTruthy()
  })

  it('renders with bottom placement', () => {
    const { container } = render(<AvatarTooltip lines={lines} placement="bottom" />)
    expect(container.firstChild).toBeTruthy()
  })
})
