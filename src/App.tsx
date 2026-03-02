import { useRef } from 'react'
import { useSocket } from './hooks/useSocket'
import { useOfficeState } from './hooks/useOfficeState'
import { OfficeCanvas } from './components/OfficeCanvas'
import { AgentAvatar } from './components/AgentAvatar'
import { HumanAvatar } from './components/HumanAvatar'
import { OnlineUsersList } from './components/OnlineUsersList'
import { getSocket } from './services/socket'

export function App() {
  const { status } = useSocket()
  const { agents, users } = useOfficeState()
  const canvasRef = useRef<HTMLDivElement>(null)

  const mySocketId = getSocket().id ?? null

  return (
    <>
      <OfficeCanvas
        connectionStatus={status}
        agentCount={agents.filter(a => a.status !== 'offline').length}
        humanCount={users.length}
        canvasRef={canvasRef}
      >
        {agents.map(agent => (
          <AgentAvatar key={agent.id} agent={agent} />
        ))}
        {users.map(user => (
          <HumanAvatar
            key={user.socketId}
            user={user}
            isMe={user.socketId === mySocketId}
            canvasRef={canvasRef}
          />
        ))}
      </OfficeCanvas>

      <OnlineUsersList users={users} mySocketId={mySocketId} />

      <div
        style={{
          position: 'fixed',
          top: 16,
          left: 16,
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 10,
          color: '#374151',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        v0.4 — human presence
      </div>
    </>
  )
}
