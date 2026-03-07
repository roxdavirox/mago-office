import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import Phaser from 'phaser'
import { BootScene } from './scenes/BootScene'
import { PreloadScene } from './scenes/PreloadScene'
import { OfficeScene } from './scenes/OfficeScene'
import { EventBus } from './EventBus'

export interface PhaserGameRef {
  game: Phaser.Game | null
  scene: Phaser.Scene | null
}

/**
 * PhaserGame — wrapper React para o canvas Phaser.
 *
 * Instancia o Phaser.Game em um <div> ref e gerencia o ciclo de vida:
 * - mount  → cria o jogo
 * - unmount → destroi o jogo e limpa listeners do EventBus
 *
 * Expõe { game, scene } via forwardRef para o pai inspecionar se necessário.
 */
export const PhaserGame = forwardRef<PhaserGameRef>(function PhaserGame(_, ref) {
  const containerRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<Phaser.Game | null>(null)
  const sceneRef = useRef<Phaser.Scene | null>(null)

  useImperativeHandle(ref, () => ({
    get game() { return gameRef.current },
    get scene() { return sceneRef.current },
  }))

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return

    const container = containerRef.current

    // rAF garante layout calculado antes de ler clientWidth (#101)
    const raf = requestAnimationFrame(() => {
      if (gameRef.current) return

      const width = container.clientWidth || window.innerWidth
      const height = container.clientHeight || window.innerHeight

      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        parent: container,
        width,
        height,
        backgroundColor: '#0d1117',
        scene: [BootScene, PreloadScene, OfficeScene],
        scale: {
          mode: Phaser.Scale.RESIZE,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
        // UI React fica sobre o canvas via z-index — não precisa de transparência
        transparent: false,
      }

      gameRef.current = new Phaser.Game(config)
    })

    // Captura a cena ativa quando o Phaser emitir 'scene-ready'
    const onSceneReady = (scene: Phaser.Scene) => {
      sceneRef.current = scene
    }
    EventBus.on('scene-ready', onSceneReady)

    return () => {
      cancelAnimationFrame(raf)
      EventBus.off('scene-ready', onSceneReady)
      gameRef.current?.destroy(true)
      gameRef.current = null
      sceneRef.current = null
    }
  }, [])

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
      }}
    />
  )
})
