import { describe, it, expect } from 'vitest'
import { hashColor, initials, toPercent } from './avatar'

describe('hashColor', () => {
  it('returns a hex color string', () => {
    expect(hashColor('user-1')).toMatch(/^#[0-9a-f]{6}$/)
  })

  it('returns the same color for the same userId', () => {
    expect(hashColor('abc')).toBe(hashColor('abc'))
  })

  it('returns distinct colors for different userIds', () => {
    const colors = new Set(['user-1', 'user-2', 'user-3', 'user-4'].map(hashColor))
    expect(colors.size).toBeGreaterThan(1)
  })
})

describe('initials', () => {
  it('returns 2 uppercase letters for a full name', () => {
    expect(initials('João Silva')).toBe('JS')
  })

  it('returns first 2 letters for a single name', () => {
    expect(initials('Alice')).toBe('AL')
  })

  it('uses first and last word for compound names', () => {
    expect(initials('Maria da Silva')).toBe('MS')
  })

  it('handles extra spaces', () => {
    expect(initials('  Ana  Lima  ')).toBe('AL')
  })
})

describe('toPercent', () => {
  it('converts px to percentage', () => {
    expect(toPercent(250, 1000)).toBe(25)
  })

  it('clamps to minimum 0', () => {
    expect(toPercent(-50, 1000)).toBe(0)
  })

  it('clamps to maximum 100', () => {
    expect(toPercent(1200, 1000)).toBe(100)
  })

  it('returns 50 for the center', () => {
    expect(toPercent(500, 1000)).toBe(50)
  })
})
