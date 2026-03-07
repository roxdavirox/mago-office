import Phaser from 'phaser'
import { EventBus } from '../EventBus'

/**
 * OfficeScene — cena principal do jogo (#88 → #91).
 *
 * Carrega office-map.json (34×35 tiles, 544×560px) e renderiza:
 *   floor      — base do escritório (carpet por zona)
 *   walls      — paredes + colisão (GIDs 2-3, 7-8)
 *   furniture  — mesas/cadeiras + colisão (GIDs 4-5)
 *
 * Expõe getZoneBounds() e getZoneCenterWorld() para AgentSprite (#92).
 *
 * Fluxo: PreloadScene → OfficeScene
 */

export type ZoneId =
  | 'dev-zone'
  | 'review-room'
  | 'planning-board'
  | 'analysis-area'
  | 'coffee-corner'
  | 'lobby'

export class OfficeScene extends Phaser.Scene {
  private zoneRects = new Map<string, Phaser.Geom.Rectangle>()
  wallsLayer: Phaser.Tilemaps.TilemapLayer | null = null
  furnitureLayer: Phaser.Tilemaps.TilemapLayer | null = null

  constructor() {
    super({ key: 'OfficeScene' })
  }

  create() {
    const map = this.make.tilemap({ key: 'office-map' })
    const tileset = map.addTilesetImage('tileset-placeholder', 'tile-placeholder')

    if (tileset) {
      map.createLayer('floor', tileset, 0, 0)

      this.wallsLayer = map.createLayer('walls', tileset, 0, 0)
      // GID 3 = wall (sólido). Portas (GID 7) e janelas (GID 8) são passáveis.
      this.wallsLayer?.setCollisionBetween(3, 3)

      this.furnitureLayer = map.createLayer('furniture', tileset, 0, 0)
      // GID 4 = desk, 5 = chair — colisão. Planta (GID 6) é decorativa.
      this.furnitureLayer?.setCollisionBetween(4, 5)
    }

    this.parseZoneMarkers(map)
    this.setupCamera(map)

    EventBus.emit('scene-ready', this)
  }

  /** Retorna os bounds em pixels de uma zona. */
  getZoneBounds(zoneId: string): Phaser.Geom.Rectangle | null {
    return this.zoneRects.get(zoneId) ?? null
  }

  /** Retorna o centro em pixels de uma zona. */
  getZoneCenterWorld(zoneId: string): { x: number; y: number } | null {
    const rect = this.zoneRects.get(zoneId)
    if (!rect) return null
    return { x: rect.centerX, y: rect.centerY }
  }

  private parseZoneMarkers(map: Phaser.Tilemaps.Tilemap) {
    const objectLayer = map.getObjectLayer('zone-markers')
    if (!objectLayer) return

    for (const obj of objectLayer.objects) {
      const zoneIdProp = obj.properties?.find(
        (p: { name: string; value: unknown }) => p.name === 'zoneId',
      )
      if (!zoneIdProp) continue

      const zoneId = zoneIdProp.value as string
      this.zoneRects.set(
        zoneId,
        new Phaser.Geom.Rectangle(obj.x ?? 0, obj.y ?? 0, obj.width ?? 0, obj.height ?? 0),
      )
    }
  }

  private setupCamera(map: Phaser.Tilemaps.Tilemap) {
    const cam = this.cameras.main
    cam.setBounds(0, 0, map.widthInPixels, map.heightInPixels)
    cam.centerOn(map.widthInPixels / 2, map.heightInPixels / 2)

    this.scale.on(Phaser.Scale.Events.RESIZE, () => {
      cam.centerOn(map.widthInPixels / 2, map.heightInPixels / 2)
    })
  }
}
