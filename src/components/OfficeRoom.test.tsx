import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { OfficeRoom } from './OfficeRoom'
import type { Zone } from '../data/office-layout'

const mockZone: Zone = {
  id: 'test-zone',
  label: 'Test Zone',
  icon: '🧪',
  x: 10,
  y: 20,
  width: 30,
  height: 25,
  color: '#1a1a2e',
  description: 'Test zone',
  worldX: 16,
  worldY: 32,
  worldW: 160,
  worldH: 192,
}

describe('OfficeRoom', () => {
  it('renders with correct data-zone-id', () => {
    render(<OfficeRoom zone={mockZone} />)
    expect(document.querySelector('[data-zone-id="test-zone"]')).toBeTruthy()
  })

  it('shows zone icon', () => {
    render(<OfficeRoom zone={mockZone} />)
    expect(screen.getByText('🧪')).toBeTruthy()
  })

  it('shows zone label', () => {
    render(<OfficeRoom zone={mockZone} />)
    expect(screen.getByText('Test Zone')).toBeTruthy()
  })

  it('positions zone with correct coordinates', () => {
    render(<OfficeRoom zone={mockZone} />)
    const el = document.querySelector('[data-zone-id="test-zone"]') as HTMLElement
    expect(el.style.left).toBe('10%')
    expect(el.style.top).toBe('20%')
    expect(el.style.width).toBe('30%')
    expect(el.style.height).toBe('25%')
  })

  it('applies zone background color (zone.color)', () => {
    render(<OfficeRoom zone={mockZone} />)
    const el = document.querySelector('[data-zone-id="test-zone"]') as HTMLElement
    expect(el.style.background).toBeTruthy()
  })
})
