import { useRef } from 'react'
import { isSome } from '@tecnomancy/alchemy'
import { useSocket } from './hooks/useSocket'
import { useOfficeState } from './hooks/useOfficeState'
import { OfficeOverlay } from './components/OfficeOverlay'
import { HumanAvatar } from './components/HumanAvatar'
import { SpeechBubble } from './components/SpeechBubble'
import { OnlineUsersList } from './components/OnlineUsersList'
import { getSocket } from './services/socket'
import { PhaserGame } from './game/PhaserGame'
import type { PhaserGameRef } from './game/PhaserGame'
import { usePhaserBridge } from './hooks/usePhaserBridge'
import { useHumanSocket } from './hooks/useHumanSocket'
import { useSpritePositions } from './hooks/useSpritePositions'

export function App() {
  useSocket()
  const { agents, users, isLoading, error, retry } = useOfficeState()
  usePhaserBridge(agents)
  useHumanSocket()
  const spritePositions = useSpritePositions()

  const overlayRef = useRef<HTMLDivElement>(null)
  const phaserRef = useRef<PhaserGameRef>(null)

  const mySocketId = getSocket().id ?? null

  return (
    <>
      {/* Phaser canvas — camada base */}
      <PhaserGame ref={phaserRef} />

      {/* React overlay — human avatars, speech bubbles e feedback */}
      <div ref={overlayRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {users.map((user) => (
          <HumanAvatar
            key={user.socketId}
            user={user}
            isMe={user.socketId === mySocketId}
          />
        ))}

        {/* SpeechBubbles posicionados sobre sprites Phaser (#96) */}
        {agents
          .filter((a) => isSome(a.speechText))
          .map((agent) => {
            const pos = spritePositions.get(agent.id)
            if (!pos) return null
            return (
              <SpeechBubble
                key={`speech-${agent.id}`}
                text={agent.speechText}
                color={agent.color}
                screenX={pos.x}
                screenY={pos.y}
              />
            )
          })}

        <OfficeOverlay isLoading={isLoading} error={error} onRetry={retry} />
      </div>

      <OnlineUsersList users={users} mySocketId={mySocketId} />
    </>
  )
}
