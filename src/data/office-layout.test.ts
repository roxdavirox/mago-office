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
  it('tem 6 zonas definidas', () => {
    expect(OFFICE_ZONES).toHaveLength(6)
  })

  it('todas as zonas têm campos obrigatórios', () => {
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

  it('ids são únicos', () => {
    const ids = OFFICE_ZONES.map(z => z.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('zonas não saem dos limites (x + width <= 100)', () => {
    for (const zone of OFFICE_ZONES) {
      expect(zone.x + zone.width).toBeLessThanOrEqual(100)
    }
  })
})

describe('ZONE_BY_ID', () => {
  it('resolve zona pelo id', () => {
    expect(ZONE_BY_ID['dev-zone'].label).toBe('Dev Zone')
    expect(ZONE_BY_ID['lobby'].icon).toBe('🚪')
  })
})

describe('getAgentColor', () => {
  it('retorna cor correta para agentes conhecidos', () => {
    expect(getAgentColor('agent-1')).toBe(AGENT_COLORS['agent-1'])
    expect(getAgentColor('agent-2')).toBe(AGENT_COLORS['agent-2'])
    expect(getAgentColor('agent-3')).toBe(AGENT_COLORS['agent-3'])
  })

  it('retorna cor default para agente desconhecido', () => {
    expect(getAgentColor('agent-99')).toBe(DEFAULT_AGENT_COLOR)
  })
})

describe('getAgentZone', () => {
  it('idle → coffee-corner', () => {
    expect(getAgentZone('idle')).toBe('coffee-corner')
    expect(getAgentZone('idle', 'implementando feature')).toBe('coffee-corner')
  })

  it('offline → lobby', () => {
    expect(getAgentZone('offline')).toBe('lobby')
  })

  it('blocked → lobby', () => {
    expect(getAgentZone('blocked')).toBe('lobby')
  })

  it('working + review action → review-room', () => {
    expect(getAgentZone('working', 'fazendo review do PR')).toBe('review-room')
    expect(getAgentZone('thinking', 'revisando código')).toBe('review-room')
    expect(getAgentZone('working', 'aprovando PR #42')).toBe('review-room')
  })

  it('working + planning action → planning-board', () => {
    expect(getAgentZone('working', 'criando task no backlog')).toBe('planning-board')
    expect(getAgentZone('thinking', 'sprint planning')).toBe('planning-board')
  })

  it('working + analysis action → analysis-area', () => {
    expect(getAgentZone('working', 'analisando bug')).toBe('analysis-area')
    expect(getAgentZone('thinking', 'debugging fluxo')).toBe('analysis-area')
    expect(getAgentZone('working', 'inspect memory leak')).toBe('analysis-area')
  })

  it('working sem action específica → dev-zone', () => {
    expect(getAgentZone('working')).toBe('dev-zone')
    expect(getAgentZone('working', 'implementando feature X')).toBe('dev-zone')
    expect(getAgentZone('thinking', '')).toBe('dev-zone')
  })
})
