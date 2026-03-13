import Phaser from 'phaser'
import { EventBus } from '../EventBus'

/**
 * HumanSprite — avatar do jogador com movimento WASD/clique (#94).
 *
 * Usa o spritesheet `agent-sprite` com tint diferenciado.
 * Colide com layers `walls` e `furniture`.
 * Câmera segue com lerp suave.
 * Emite posição via EventBus a cada 100ms (debounce).
 */

type Direction = 'down' | 'left' | 'right' | 'up'

const SPEED = 80
const EMIT_INTERVAL_MS = 100

export class HumanSprite extends Phaser.Physics.Arcade.Sprite {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private wasd!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key }
  private currentDirection: Direction = 'down'
  private lastEmitTime = 0
  private lastEmittedX = 0
  private lastEmittedY = 0
  private clickTween: Phaser.Tweens.Tween | null = null

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'agent-sprite', 0)

    scene.add.existing(this)
    scene.physics.add.existing(this)

    this.setTint(0x3b82f6) // blue to distinguish from agents
    this.setDepth(20) // above agent sprites (depth 10)
    this.setCollideWorldBounds(true)

    const body = this.body as Phaser.Physics.Arcade.Body
    body.setSize(12, 12)
    body.setOffset(2, 4)

    if (scene.input.keyboard) {
      this.cursors = scene.input.keyboard.createCursorKeys()
      this.wasd = {
        W: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        A: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        S: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        D: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      }
    }

    scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const worldPoint = scene.cameras.main.getWorldPoint(pointer.x, pointer.y)
      this.moveToPoint(worldPoint.x, worldPoint.y)
    })

    this.play('idle-down')
  }

  /** Configura câmera follow e colisão com layers do mapa. */
  setupCamera(
    camera: Phaser.Cameras.Scene2D.Camera,
    wallsLayer: Phaser.Tilemaps.TilemapLayer | null,
    furnitureLayer: Phaser.Tilemaps.TilemapLayer | null,
  ): void {
    camera.startFollow(this, true, 0.1, 0.1)

    if (wallsLayer) this.scene.physics.add.collider(this, wallsLayer)
    if (furnitureLayer) this.scene.physics.add.collider(this, furnitureLayer)
  }

  /** Move via clique — tween até o ponto alvo. */
  private moveToPoint(x: number, y: number): void {
    this.clickTween?.stop()

    const dx = x - this.x
    const dy = y - this.y
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist < 4) return

    this.currentDirection = this.directionFrom(dx, dy)
    this.play(`walk-${this.currentDirection}`, true)

    const body = this.body as Phaser.Physics.Arcade.Body
    this.scene.physics.moveTo(this, x, y, SPEED)

    const duration = (dist / SPEED) * 1000

    this.clickTween = this.scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration,
      onComplete: () => {
        body.setVelocity(0, 0)
        this.play('idle-down', true)
        this.clickTween = null
      },
    })
  }

  /** Chamado a cada frame pelo OfficeScene.update(). */
  handleInput(time: number): void {
    if (!this.cursors) return

    const body = this.body as Phaser.Physics.Arcade.Body
    const left = this.cursors.left?.isDown || this.wasd.A.isDown
    const right = this.cursors.right?.isDown || this.wasd.D.isDown
    const up = this.cursors.up?.isDown || this.wasd.W.isDown
    const down = this.cursors.down?.isDown || this.wasd.S.isDown

    const hasInput = left || right || up || down

    if (hasInput) {
      // Cancel click movement when keyboard takes over
      if (this.clickTween) {
        this.clickTween.stop()
        this.clickTween = null
      }

      let vx = 0
      let vy = 0
      if (left) vx -= SPEED
      if (right) vx += SPEED
      if (up) vy -= SPEED
      if (down) vy += SPEED

      // Normalize diagonal speed
      if (vx !== 0 && vy !== 0) {
        const factor = SPEED / Math.sqrt(vx * vx + vy * vy)
        vx *= factor
        vy *= factor
      }

      body.setVelocity(vx, vy)

      const dir = this.directionFrom(vx, vy)
      if (dir !== this.currentDirection) {
        this.currentDirection = dir
        this.play(`walk-${dir}`, true)
      } else if (!this.anims.isPlaying || this.anims.currentAnim?.key === 'idle-down') {
        this.play(`walk-${dir}`, true)
      }
    } else if (!this.clickTween) {
      body.setVelocity(0, 0)

      if (this.anims.currentAnim?.key !== 'idle-down') {
        this.play('idle-down', true)
      }
    }

    this.emitPosition(time)
  }

  /** Emite posição debounced via EventBus. */
  private emitPosition(time: number): void {
    if (time - this.lastEmitTime < EMIT_INTERVAL_MS) return

    const x = Math.round(this.x)
    const y = Math.round(this.y)

    if (x === this.lastEmittedX && y === this.lastEmittedY) return

    this.lastEmitTime = time
    this.lastEmittedX = x
    this.lastEmittedY = y
    EventBus.emit('human-moved', x, y)
  }

  private directionFrom(dx: number, dy: number): Direction {
    if (Math.abs(dx) >= Math.abs(dy)) {
      return dx > 0 ? 'right' : 'left'
    }
    return dy > 0 ? 'down' : 'up'
  }
}
