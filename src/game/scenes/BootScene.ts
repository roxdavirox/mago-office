import Phaser from 'phaser'
import { EventBus } from '../EventBus'

/**
 * BootScene — cena inicial minimalista.
 *
 * Renderiza um fundo escuro com o texto "MAGO Office" enquanto
 * os assets ainda não foram carregados (PRE-LOAD virá na issue #87).
 * Emite 'scene-ready' para o React saber que o Phaser inicializou.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' })
  }

  create() {
    const { width, height } = this.scale

    // Label de placeholder
    this.add
      .text(width / 2, height / 2, 'MAGO Office', {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: '#8b5cf6',
      })
      .setOrigin(0.5)

    this.add
      .text(width / 2, height / 2 + 36, 'carregando assets…', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#6b7280',
      })
      .setOrigin(0.5)

    EventBus.emit('scene-ready', this)
  }
}
