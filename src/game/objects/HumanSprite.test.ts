import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockBus } = vi.hoisted(() => {
  const listeners = new Map<string, Set<(...args: unknown[]) => void>>()
  const mockBus = {
    emit: vi.fn((event: string, ...args: unknown[]) => {
      listeners.get(event)?.forEach((fn) => fn(...args))
    }),
    on: vi.fn((event: string, fn: (...args: unknown[]) => void) => {
      if (!listeners.has(event)) listeners.set(event, new Set())
      listeners.get(event)!.add(fn)
    }),
    off: vi.fn((event: string, fn: (...args: unknown[]) => void) => {
      listeners.get(event)?.delete(fn)
    }),
  }
  return { mockBus, listeners }
})

vi.mock('../EventBus', () => ({ EventBus: mockBus }))

vi.mock('phaser', () => {
  const MockSprite = vi.fn().mockImplementation(function (
    this: Record<string, unknown>,
    scene: Record<string, unknown>,
  ) {
    this.x = 0
    this.y = 0
    this.scene = scene
    this.body = {
      setSize: vi.fn(),
      setOffset: vi.fn(),
      setVelocity: vi.fn(),
    }
    this.anims = {
      isPlaying: false,
      currentAnim: null,
    }
  })
  MockSprite.prototype.setTint = vi.fn()
  MockSprite.prototype.setDepth = vi.fn()
  MockSprite.prototype.setCollideWorldBounds = vi.fn()
  MockSprite.prototype.play = vi.fn(function (this: Record<string, unknown>, key: string) {
    const anims = this.anims as { currentAnim: { key: string } | null; isPlaying: boolean }
    anims.currentAnim = { key }
    anims.isPlaying = true
  })
  MockSprite.prototype.destroy = vi.fn()

  return {
    default: {
      Physics: {
        Arcade: {
          Sprite: MockSprite,
        },
      },
      Input: {
        Keyboard: { KeyCodes: { W: 87, A: 65, S: 83, D: 68 } },
      },
    },
  }
})

import { HumanSprite } from './HumanSprite'

function createMockScene() {
  return {
    add: { existing: vi.fn() },
    physics: {
      add: {
        existing: vi.fn(),
        collider: vi.fn(),
      },
      moveTo: vi.fn(),
    },
    input: {
      keyboard: {
        createCursorKeys: vi.fn(() => ({
          left: { isDown: false },
          right: { isDown: false },
          up: { isDown: false },
          down: { isDown: false },
        })),
        addKey: vi.fn(() => ({ isDown: false })),
      },
      on: vi.fn(),
    },
    cameras: {
      main: {
        startFollow: vi.fn(),
        getWorldPoint: vi.fn(() => ({ x: 100, y: 100 })),
      },
    },
    tweens: {
      add: vi.fn(() => ({ stop: vi.fn() })),
      addCounter: vi.fn(() => ({ stop: vi.fn() })),
    },
  }
}

describe('HumanSprite', () => {
  let scene: ReturnType<typeof createMockScene>

  beforeEach(() => {
    vi.clearAllMocks()
    scene = createMockScene()
  })

  it('cria sprite na posição informada', () => {
    const sprite = new HumanSprite(scene as never, 100, 200)
    expect(sprite).toBeDefined()
    expect(scene.add.existing).toHaveBeenCalledWith(sprite)
    expect(scene.physics.add.existing).toHaveBeenCalledWith(sprite)
  })

  it('configura tint azul e depth 20', () => {
    const sprite = new HumanSprite(scene as never, 50, 50)
    expect(sprite.setTint).toHaveBeenCalledWith(0x3b82f6)
    expect(sprite.setDepth).toHaveBeenCalledWith(20)
  })

  it('configura body com hitbox reduzida', () => {
    const sprite = new HumanSprite(scene as never, 50, 50)
    const body = sprite.body as unknown as { setSize: ReturnType<typeof vi.fn>; setOffset: ReturnType<typeof vi.fn> }
    expect(body.setSize).toHaveBeenCalledWith(12, 12)
    expect(body.setOffset).toHaveBeenCalledWith(2, 4)
  })

  it('registra WASD e cursors do teclado', () => {
    new HumanSprite(scene as never, 0, 0)
    expect(scene.input.keyboard.createCursorKeys).toHaveBeenCalled()
    expect(scene.input.keyboard.addKey).toHaveBeenCalledTimes(4)
  })

  it('registra listener de pointerdown para clique', () => {
    new HumanSprite(scene as never, 0, 0)
    expect(scene.input.on).toHaveBeenCalledWith('pointerdown', expect.any(Function))
  })

  it('setupCamera configura follow e colliders', () => {
    const sprite = new HumanSprite(scene as never, 50, 50)
    const camera = scene.cameras.main
    const wallsLayer = {} as never
    const furnitureLayer = {} as never

    sprite.setupCamera(camera as never, wallsLayer, furnitureLayer)

    expect(camera.startFollow).toHaveBeenCalledWith(sprite, true, 0.1, 0.1)
    expect(scene.physics.add.collider).toHaveBeenCalledTimes(2)
  })

  it('handleInput para velocidade quando sem input', () => {
    const sprite = new HumanSprite(scene as never, 50, 50)
    const body = sprite.body as unknown as { setVelocity: ReturnType<typeof vi.fn> }

    sprite.handleInput(1000)

    expect(body.setVelocity).toHaveBeenCalledWith(0, 0)
  })

  it('emite human-moved via EventBus com debounce', () => {
    const sprite = new HumanSprite(scene as never, 50, 50)
    sprite.x = 100
    sprite.y = 200

    // First emit at time=200 (> EMIT_INTERVAL_MS from lastEmitTime=0)
    sprite.handleInput(200)
    expect(mockBus.emit).toHaveBeenCalledWith('human-moved', 100, 200)

    mockBus.emit.mockClear()
    sprite.handleInput(250) // < 100ms since last emit — should not emit
    expect(mockBus.emit).not.toHaveBeenCalled()

    sprite.x = 110
    sprite.handleInput(350) // >= 100ms since last emit — should emit
    expect(mockBus.emit).toHaveBeenCalledWith('human-moved', 110, 200)
  })

  it('não emite human-moved quando posição não muda', () => {
    const sprite = new HumanSprite(scene as never, 50, 50)
    sprite.x = 100
    sprite.y = 200

    sprite.handleInput(200) // first emit
    mockBus.emit.mockClear()

    sprite.handleInput(400) // > 100ms but same position
    expect(mockBus.emit).not.toHaveBeenCalled()
  })
})
