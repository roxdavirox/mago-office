import { useEffect } from 'react'
import { EventBus } from '../game/EventBus'
import { getSocket } from '../services/socket'

/**
 * useHumanSocket — conecta EventBus `human-moved` ao socket `office:user:move` (#95).
 *
 * HumanSprite emite posição via EventBus (já debounced 100ms no Phaser).
 * Este hook escuta e repassa ao servidor via socket.
 */
export function useHumanSocket(): void {
  useEffect(() => {
    const onHumanMoved = (x: number, y: number) => {
      getSocket().emit('office:user:move', { x, y })
    }

    EventBus.on('human-moved', onHumanMoved)

    return () => {
      EventBus.off('human-moved', onHumanMoved)
    }
  }, [])
}
