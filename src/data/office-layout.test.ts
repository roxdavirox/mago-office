import { describe, it, expect } from 'vitest'
import {
  OFFICE_ZONES,
  ZONE_BY_ID,
  AGENT_COLORS,
  getAgentColor,
  getAgentZone,
  DEFAULT_AGENT_COLOR,
} from './office-layout'

describe('OFFICE_ZONES', () => {
  it('has 6 defined zones', () => {
    expect(OFFICE_ZONES).toHaveLength(6)
  })

  it('all zones have required fields', () => {
    for (const zone of OFFICE_ZONES) {
      expect(zone.id).toBeTruthy()
      expect(zone.label).toBeTruthy()
      expect(zone.icon).toBeTruthy()
      expect(zone.color).toMatch(/^#[0-9a-f]{6}$/i)
      expect(zone.x).toBeGreaterThanOrEqual(0)
      expect(zone.y).toBeGreaterThanOrEqual(0)
      expect(zone.width).toBeGreaterThan(0)
      expect(zone.height).toBeGreaterThan(0)
    }
  })

  it('ids are unique', () => {
    const ids = OFFICE_ZONES.map((z) => z.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('zones do not exceed bounds (x + width <= 100)', () => {
    for (const zone of OFFICE_ZONES) {
      expect(zone.x + zone.width).toBeLessThanOrEqual(100)
    }
  })
})

describe('ZONE_BY_ID', () => {
  it('resolves zone by id', () => {
    expect(ZONE_BY_ID['dev-zone'].label).toBe('Dev Zone')
    expect(ZONE_BY_ID['lobby'].icon).toBe('🚪')
  })
})

describe('getAgentColor', () => {
  it('returns correct color for known agents', () => {
    expect(getAgentColor('rx-architect')).toBe(AGENT_COLORS['rx-architect'])
    expect(getAgentColor('rx-backend')).toBe(AGENT_COLORS['rx-backend'])
    expect(getAgentColor('rx-orchestrator')).toBe(AGENT_COLORS['rx-orchestrator'])
  })

  it('returns default color for unknown agent', () => {
    expect(getAgentColor('agent-99')).toBe(DEFAULT_AGENT_COLOR)
  })
})

describe('getAgentZone', () => {
  it('idle → coffee-corner', () => {
    expect(getAgentZone('idle')).toBe('coffee-corner')
    expect(getAgentZone('idle', 'implementing feature')).toBe('coffee-corner')
  })

  it('offline → lobby', () => {
    expect(getAgentZone('offline')).toBe('lobby')
  })

  it('blocked → lobby', () => {
    expect(getAgentZone('blocked')).toBe('lobby')
  })

  it('working + review action → review-room', () => {
    expect(getAgentZone('working', 'doing PR review')).toBe('review-room')
    expect(getAgentZone('thinking', 'revisando código')).toBe('review-room')
    expect(getAgentZone('working', 'aprovando PR #42')).toBe('review-room')
  })

  it('working + planning action → planning-board', () => {
    expect(getAgentZone('working', 'creating task in backlog')).toBe('planning-board')
    expect(getAgentZone('thinking', 'sprint planning')).toBe('planning-board')
  })

  it('working + analysis action → analysis-area', () => {
    expect(getAgentZone('working', 'analyzing bug')).toBe('analysis-area')
    expect(getAgentZone('thinking', 'debugging flow')).toBe('analysis-area')
    expect(getAgentZone('working', 'inspect memory leak')).toBe('analysis-area')
  })

  it('working with no specific action → dev-zone', () => {
    expect(getAgentZone('working')).toBe('dev-zone')
    expect(getAgentZone('working', 'implementing feature X')).toBe('dev-zone')
    expect(getAgentZone('thinking', '')).toBe('dev-zone')
  })

  it('null/undefined status → lobby (safe default)', () => {
    expect(getAgentZone(null)).toBe('lobby')
    expect(getAgentZone(undefined)).toBe('lobby')
    expect(getAgentZone('')).toBe('lobby')
  })

  it('unknown status → dev-zone', () => {
    expect(getAgentZone('busy')).toBe('dev-zone')
    expect(getAgentZone('away')).toBe('dev-zone')
  })
})

