import Phaser from 'phaser'
import { EventBus } from '../EventBus'

/**
 * OfficeScene — cena principal do jogo (#88, expandida em #90).
 *
 * Carrega office-map.json (34×35 tiles, 544×560px) e renderiza as camadas:
 *   floor      — base do escritório (carpet por zona)
 *   walls      — paredes, janelas e portas
 *   furniture  — mesas, cadeiras e plantas
 *
 * Lê zone-markers (objectgroup) para expor getZoneCenterWorld() (#92).
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

  constructor() {
    super({ key: 'OfficeScene' })
  }

  create() {
    const map = this.make.tilemap({ key: 'office-map' })

    const tileset = map.addTilesetImage('tileset-placeholder', 'tile-placeholder')

    if (tileset) {
      map.createLayer('floor', tileset, 0, 0)
      map.createLayer('walls', tileset, 0, 0)
      map.createLayer('furniture', tileset, 0, 0)
    }

    this.parseZoneMarkers(map)
    this.setupCamera(map)

    EventBus.emit('scene-ready', this)
  }

  /** Retorna o centro em pixels de uma zona pelo seu zoneId. */
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
      const rect = new Phaser.Geom.Rectangle(
        obj.x ?? 0,
        obj.y ?? 0,
        obj.width ?? 0,
        obj.height ?? 0,
      )
      this.zoneRects.set(zoneId, rect)
    }
  }

  private setupCamera(map: Phaser.Tilemaps.Tilemap) {
    const cam = this.cameras.main
    cam.setBounds(0, 0, map.widthInPixels, map.heightInPixels)

    // Centraliza o mapa no viewport inicial
    cam.centerOn(map.widthInPixels / 2, map.heightInPixels / 2)

    // Re-centraliza ao redimensionar a janela
    this.scale.on(Phaser.Scale.Events.RESIZE, () => {
      cam.centerOn(map.widthInPixels / 2, map.heightInPixels / 2)
    })
  }
}
