import { useEffect, useState } from 'react'
import { EventBus, type SpriteScreenPos } from '../game/EventBus'

/**
 * useSpritePositions — retorna coordenadas de tela dos AgentSprites (#96).
 *
 * Escuta `sprite-positions` do EventBus (emitido pelo OfficeScene a cada frame)
 * e retorna um Map<agentId, {x, y}> com posições em pixels na viewport.
 */
export function useSpritePositions(): Map<string, SpriteScreenPos> {
  const [positions, setPositions] = useState<Map<string, SpriteScreenPos>>(() => new Map())

  useEffect(() => {
    const onPositions = (pos: Map<string, SpriteScreenPos>) => {
      setPositions(pos)
    }

    EventBus.on('sprite-positions', onPositions)

    return () => {
      EventBus.off('sprite-positions', onPositions)
    }
  }, [])

  return positions
}
