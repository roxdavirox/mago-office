import Phaser from 'phaser'
import type { AgentOfficeData } from '../hooks/useOfficeState'

/**
 * Mapa de eventos do EventBus com tipos completos (#103).
 *
 * React emite → Phaser consome:
 *   agents-updated   — sincroniza AgentSprites com estado atual
 *
 * Phaser emite → React consome:
 *   scene-ready      — OfficeScene pronta para receber comandos
 *   agent-speech-position — posição em tela do balão de fala
 *   human-moved      — posição do HumanSprite (para emitir via socket)
 */
export interface SpriteScreenPos {
  x: number
  y: number
}

export interface OfficeEventMap {
  'scene-ready': [scene: Phaser.Scene]
  'agents-updated': [agents: AgentOfficeData[]]
  'agent-speech': [agentId: string, text: string]
  'agent-speech-position': [agentId: string, x: number, y: number]
  'sprite-positions': [positions: Map<string, SpriteScreenPos>]
  'human-moved': [x: number, y: number]
}

/** Wrapper tipado sobre Phaser.Events.EventEmitter. */
class TypedEventBus {
  private readonly emitter = new Phaser.Events.EventEmitter()

  on<K extends keyof OfficeEventMap>(
    event: K,
    fn: (...args: OfficeEventMap[K]) => void,
  ): this {
    this.emitter.on(event as string, fn)
    return this
  }

  once<K extends keyof OfficeEventMap>(
    event: K,
    fn: (...args: OfficeEventMap[K]) => void,
  ): this {
    this.emitter.once(event as string, fn)
    return this
  }

  off<K extends keyof OfficeEventMap>(
    event: K,
    fn: (...args: OfficeEventMap[K]) => void,
  ): this {
    this.emitter.off(event as string, fn)
    return this
  }

  emit<K extends keyof OfficeEventMap>(event: K, ...args: OfficeEventMap[K]): this {
    this.emitter.emit(event as string, ...args)
    return this
  }
}

export const EventBus = new TypedEventBus()
