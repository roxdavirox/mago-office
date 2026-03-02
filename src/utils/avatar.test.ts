import { describe, it, expect } from 'vitest'
import { hashColor, initials, toPercent } from './avatar'

describe('hashColor', () => {
  it('retorna uma string de cor hex', () => {
    expect(hashColor('user-1')).toMatch(/^#[0-9a-f]{6}$/)
  })

  it('retorna a mesma cor para o mesmo userId', () => {
    expect(hashColor('abc')).toBe(hashColor('abc'))
  })

  it('retorna cores distintas para userIds diferentes', () => {
    const colors = new Set(['user-1','user-2','user-3','user-4'].map(hashColor))
    expect(colors.size).toBeGreaterThan(1)
  })
})

describe('initials', () => {
  it('retorna 2 letras maiúsculas de nome completo', () => {
    expect(initials('João Silva')).toBe('JS')
  })

  it('retorna 2 primeiras letras para nome único', () => {
    expect(initials('Alice')).toBe('AL')
  })

  it('usa primeira e última palavra para nomes compostos', () => {
    expect(initials('Maria da Silva')).toBe('MS')
  })

  it('lida com espaços extras', () => {
    expect(initials('  Ana  Lima  ')).toBe('AL')
  })
})

describe('toPercent', () => {
  it('converte px para porcentagem', () => {
    expect(toPercent(250, 1000)).toBe(25)
  })

  it('clampeia no mínimo 0', () => {
    expect(toPercent(-50, 1000)).toBe(0)
  })

  it('clampeia no máximo 100', () => {
    expect(toPercent(1200, 1000)).toBe(100)
  })

  it('retorna 50 para o centro', () => {
    expect(toPercent(500, 1000)).toBe(50)
  })
})
