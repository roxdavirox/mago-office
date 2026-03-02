import { describe, it, expect } from 'vitest'
import {
  OFFICE_ZONES,
  ZONE_BY_ID,
  AGENT_COLORS,
  getAgentColor,
  getAgentZone,
  getAgentPosition,
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

  it('status null/undefined → lobby (safe default)', () => {
    expect(getAgentZone(null)).toBe('lobby')
    expect(getAgentZone(undefined)).toBe('lobby')
    expect(getAgentZone('')).toBe('lobby')
  })

  it('status desconhecido → dev-zone', () => {
    expect(getAgentZone('busy')).toBe('dev-zone')
    expect(getAgentZone('away')).toBe('dev-zone')
  })
})

describe('getAgentPosition', () => {
  it('calcula posição dentro da zona para agente-1 (index 0)', () => {
    // dev-zone: x=2, y=5, width=28, height=30
    // offset[0] = { x:25, y:40 } → x = 2 + 28*0.25 = 9, y = 5 + 30*0.40 = 17
    const pos = getAgentPosition('dev-zone', 0)
    expect(pos.x).toBe(9)
    expect(pos.y).toBe(17)
  })

  it('calcula posição dentro da zona para agente-2 (index 1)', () => {
    // dev-zone: x=2, y=5, width=28, height=30
    // offset[1] = { x:50, y:40 } → x = 2 + 28*0.50 = 16, y = 5 + 30*0.40 = 17
    const pos = getAgentPosition('dev-zone', 1)
    expect(pos.x).toBe(16)
    expect(pos.y).toBe(17)
  })

  it('calcula posição dentro da zona para agente-3 (index 2)', () => {
    // dev-zone: x=2, y=5, width=28, height=30
    // offset[2] = { x:75, y:40 } → x = 2 + 28*0.75 = 23, y = 5 + 30*0.40 = 17
    const pos = getAgentPosition('dev-zone', 2)
    expect(pos.x).toBe(23)
    expect(pos.y).toBe(17)
  })

  it('retorna posição central para zona desconhecida', () => {
    const pos = getAgentPosition('zona-inexistente', 0)
    expect(pos).toEqual({ x: 50, y: 50 })
  })

  it('usa offset default para índice fora do range', () => {
    // index 99 não existe → offset default { x:50, y:50 }
    // dev-zone: x=2, y=5, width=28, height=30 → x=2+14=16, y=5+15=20
    const pos = getAgentPosition('dev-zone', 99)
    expect(pos.x).toBe(16)
    expect(pos.y).toBe(20)
  })

  it('cada agente tem posição horizontal distinta na mesma zona', () => {
    const p0 = getAgentPosition('coffee-corner', 0)
    const p1 = getAgentPosition('coffee-corner', 1)
    const p2 = getAgentPosition('coffee-corner', 2)
    expect(p0.x).not.toBe(p1.x)
    expect(p1.x).not.toBe(p2.x)
    expect(p0.x).not.toBe(p2.x)
  })
})
