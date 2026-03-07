import Phaser from 'phaser'

/**
 * PreloadScene — carrega todos os assets antes de iniciar o jogo.
 *
 * Assets reais (tileset LimeZu/Kenney + spritesheet) serão adicionados
 * nas issues #89 e #90. Por enquanto usa placeholders.
 *
 * Fluxo: BootScene → PreloadScene → OfficeScene
 */
export class PreloadScene extends Phaser.Scene {
  private progressBar!: Phaser.GameObjects.Rectangle
  private progressBg!: Phaser.GameObjects.Rectangle

  constructor() {
    super({ key: 'PreloadScene' })
  }

  preload() {
    this.createProgressBar()

    this.load.on('progress', (value: number) => {
      this.progressBar.setScale(value, 1)
    })

    this.load.on('complete', () => {
      this.progressBar.destroy()
      this.progressBg.destroy()
    })

    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      console.warn(`[PreloadScene] asset não carregado: ${file.key} (${file.url})`)
    })

    // ── Assets placeholder (serão substituídos em #89 / #90) ──────────────
    this.load.image('tile-placeholder', 'assets/agent-placeholder.png')
    this.load.tilemapTiledJSON('office-map', 'assets/office-map.json')

    // Spritesheet de agente — placeholder até #90
    // frameWidth/frameHeight deve coincidir com o sprite real (16x16)
    this.load.spritesheet('agent-sprite', 'assets/agent-placeholder.png', {
      frameWidth: 16,
      frameHeight: 16,
    })
  }

  create() {
    this.scene.start('OfficeScene')
  }

  private createProgressBar() {
    const { width, height } = this.scale

    const barW = width * 0.5
    const barH = 8
    const barX = width / 2 - barW / 2
    const barY = height / 2 + 20

    this.add
      .text(width / 2, height / 2 - 8, 'Carregando…', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#6b7280',
      })
      .setOrigin(0.5)

    // Background da barra
    this.progressBg = this.add.rectangle(barX, barY, barW, barH, 0x1f2937).setOrigin(0)

    // Barra de progresso — escala em X de 0→1
    this.progressBar = this.add
      .rectangle(barX, barY, barW, barH, 0x8b5cf6)
      .setOrigin(0)
      .setScale(0, 1)
  }
}
