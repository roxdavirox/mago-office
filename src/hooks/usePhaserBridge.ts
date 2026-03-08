import { useEffect, useRef } from 'react'
import { EventBus } from '../game/EventBus'
import type { AgentOfficeData } from './useOfficeState'

/**
 * usePhaserBridge — sincroniza estado React → Phaser via EventBus (#93).
 *
 * Emite `agents-updated` sempre que `agents` muda.
 * Quando a cena ainda não estava pronta, re-emite ao receber `scene-ready`
 * para garantir que os sprites são criados mesmo se os dados chegarem antes
 * do Phaser terminar de inicializar.
 *
 * Cleanup: remove todos os listeners ao desmontar.
 */
export function usePhaserBridge(agents: AgentOfficeData[]): void {
  const agentsRef = useRef(agents)
  agentsRef.current = agents

  // Emite quando agents mudam
  useEffect(() => {
    EventBus.emit('agents-updated', agents)
  }, [agents])

  // Re-emite no scene-ready (Phaser pode inicializar depois do primeiro render)
  useEffect(() => {
    const onSceneReady = () => {
      EventBus.emit('agents-updated', agentsRef.current)
    }
    EventBus.on('scene-ready', onSceneReady)
    return () => {
      EventBus.off('scene-ready', onSceneReady)
    }
  }, [])
}
