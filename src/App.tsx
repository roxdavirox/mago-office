import { useRef } from 'react'
import { useSocket } from './hooks/useSocket'
import { useOfficeState } from './hooks/useOfficeState'
import { OfficeOverlay } from './components/OfficeOverlay'
import { HumanAvatar } from './components/HumanAvatar'
import { OnlineUsersList } from './components/OnlineUsersList'
import { getSocket } from './services/socket'
import { PhaserGame } from './game/PhaserGame'
import type { PhaserGameRef } from './game/PhaserGame'
import { usePhaserBridge } from './hooks/usePhaserBridge'
import { useHumanSocket } from './hooks/useHumanSocket'

export function App() {
  useSocket()
  const { agents, users, isLoading, error, retry } = useOfficeState()
  usePhaserBridge(agents)
  useHumanSocket()

  const overlayRef = useRef<HTMLDivElement>(null)
  const phaserRef = useRef<PhaserGameRef>(null)

  const mySocketId = getSocket().id ?? null

  return (
    <>
      {/* Phaser canvas — camada base */}
      <PhaserGame ref={phaserRef} />

      {/* React overlay — human avatars e feedback de carregamento */}
      <div ref={overlayRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {users.map((user) => (
          <HumanAvatar
            key={user.socketId}
            user={user}
            isMe={user.socketId === mySocketId}
          />
        ))}
        <OfficeOverlay isLoading={isLoading} error={error} onRetry={retry} />
      </div>

      <OnlineUsersList users={users} mySocketId={mySocketId} />
    </>
  )
}
