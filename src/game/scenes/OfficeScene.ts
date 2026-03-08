import Phaser from 'phaser'
import { EventBus } from '../EventBus'
import { AgentSprite, registerAgentAnimations } from '../objects/AgentSprite'
import type { AgentOfficeData } from '../../hooks/useOfficeState'
import { getAgentColor } from '../../constants/agent'

/**
 * OfficeScene — cena principal do jogo (#88 → #92).
 *
 * Carrega office-map.json (34×35 tiles, 544×560px) e renderiza:
 *   floor      — base do escritório (carpet por zona)
 *   walls      — paredes + colisão (GIDs 3)
 *   furniture  — mesas/cadeiras + colisão (GIDs 4-5)
 *
 * Ouve `agents-updated` do EventBus e instancia/atualiza AgentSprites.
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
  private agentSprites = new Map<string, AgentSprite>()
  private readonly onAgentsUpdated = (agents: AgentOfficeData[]) => this.syncAgents(agents)
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
      this.wallsLayer?.setCollisionBetween(3, 3)

      this.furnitureLayer = map.createLayer('furniture', tileset, 0, 0)
      this.furnitureLayer?.setCollisionBetween(4, 5)
    }

    this.parseZoneMarkers(map)
    this.setupCamera(map)
    registerAgentAnimations(this)

    EventBus.on('agents-updated', this.onAgentsUpdated)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      EventBus.off('agents-updated', this.onAgentsUpdated)
    })

    EventBus.emit('scene-ready', this)
  }

  /** Sincroniza AgentSprites com a lista de agentes do React. */
  private syncAgents(agents: AgentOfficeData[]): void {
    const seen = new Set<string>()

    for (const agent of agents) {
      seen.add(agent.id)
      const center = this.getZoneCenterWorld(agent.zoneId) ?? { x: 272, y: 280 }

      let sprite = this.agentSprites.get(agent.id)
      if (!sprite) {
        const hex = parseInt(getAgentColor(agent.id).replace('#', ''), 16)
        sprite = new AgentSprite(this, center.x, center.y, agent.id, hex)
        this.agentSprites.set(agent.id, sprite)
      } else {
        sprite.moveTo(center.x, center.y)
      }

      sprite.setStatus(agent.status)
    }

    // Remove sprites de agentes que saíram
    for (const [id, sprite] of this.agentSprites) {
      if (!seen.has(id)) {
        sprite.destroy()
        this.agentSprites.delete(id)
      }
    }
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
