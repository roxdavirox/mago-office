import Phaser from 'phaser'

/**
 * AgentSprite — personagem animado no tilemap (#92).
 *
 * Usa o spritesheet `agent-sprite` (48×64px, 16×16px/frame):
 *   Row 0 (down):  frames 0-2  → idle, walk-A, walk-B
 *   Row 1 (left):  frames 3-5
 *   Row 2 (right): frames 6-8
 *   Row 3 (up):    frames 9-11
 *
 * Tint por agente: violet (#8b5cf6), emerald (#10b981), amber (#f59e0b).
 */

/** Direções suportadas para walk cycle. */
type Direction = 'down' | 'left' | 'right' | 'up'

const ANIM_FRAME_RATE = 8

/** Registra animações na cena (chamado uma vez por cena). */
export function registerAgentAnimations(scene: Phaser.Scene): void {
  const key = 'agent-sprite'
  if (scene.anims.exists('idle-down')) return // já registradas

  scene.anims.create({
    key: 'idle-down',
    frames: scene.anims.generateFrameNumbers(key, { frames: [0] }),
    frameRate: 1,
    repeat: -1,
  })

  const directions: Array<[string, number]> = [
    ['down', 0],
    ['left', 3],
    ['right', 6],
    ['up', 9],
  ]

  for (const [dir, start] of directions) {
    scene.anims.create({
      key: `walk-${dir}`,
      frames: scene.anims.generateFrameNumbers(key, { frames: [start, start + 1, start + 2] }),
      frameRate: ANIM_FRAME_RATE,
      repeat: -1,
    })
  }
}

export class AgentSprite extends Phaser.GameObjects.Sprite {
  readonly agentId: string
  private currentDirection: Direction = 'down'
  private activeTween: Phaser.Tweens.Tween | null = null

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    agentId: string,
    tintColor: number,
  ) {
    super(scene, x, y, 'agent-sprite', 0)
    this.agentId = agentId
    this.setTint(tintColor)
    this.setDepth(10)
    scene.add.existing(this)
    this.play('idle-down')
  }

  /**
   * Move o sprite suavemente para (x, y) com tween.
   * Determina a direção pelo delta e troca para walk cycle.
   */
  moveTo(x: number, y: number, onComplete?: () => void): void {
    const dx = x - this.x
    const dy = y - this.y

    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) {
      onComplete?.()
      return
    }

    this.currentDirection = this.directionFrom(dx, dy)
    this.play(`walk-${this.currentDirection}`, true)

    this.activeTween?.stop()

    const dist = Math.sqrt(dx * dx + dy * dy)
    const duration = Math.min(Math.max(dist * 10, 300), 2000)

    this.activeTween = this.scene.tweens.add({
      targets: this,
      x,
      y,
      duration,
      ease: 'Linear',
      onComplete: () => {
        this.activeTween = null
        this.play('idle-down', true)
        onComplete?.()
      },
    })
  }

  /**
   * Troca estado visual baseado no status do agente.
   * idle/offline/blocked → idle-down; outros → walk no loop atual.
   */
  setStatus(status: string): void {
    if (status === 'idle' || status === 'offline' || status === 'blocked') {
      if (!this.activeTween) this.play('idle-down', true)
    } else {
      if (!this.activeTween) this.play(`walk-${this.currentDirection}`, true)
    }
  }

  private directionFrom(dx: number, dy: number): Direction {
    if (Math.abs(dx) >= Math.abs(dy)) {
      return dx > 0 ? 'right' : 'left'
    }
    return dy > 0 ? 'down' : 'up'
  }
}
