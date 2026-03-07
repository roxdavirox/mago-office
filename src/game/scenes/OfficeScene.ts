import Phaser from 'phaser'
import { EventBus } from '../EventBus'

/**
 * OfficeScene — cena principal do jogo.
 *
 * Nesta issue (#87) é um placeholder que confirma a transição do PreloadScene.
 * Será expandida em #88 (tilemap + câmera) e #92 (AgentSprite).
 *
 * Fluxo: PreloadScene → OfficeScene
 */
export class OfficeScene extends Phaser.Scene {
  constructor() {
    super({ key: 'OfficeScene' })
  }

  create() {
    const { width, height } = this.scale

    this.add
      .text(width / 2, height / 2, 'Office Scene', {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#8b5cf6',
      })
      .setOrigin(0.5)

    this.add
      .text(width / 2, height / 2 + 28, 'assets carregados — mapa em breve (#88)', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#4b5563',
      })
      .setOrigin(0.5)

    EventBus.emit('scene-ready', this)
  }
}
