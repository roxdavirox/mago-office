import { useRef, useState, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useSocket } from './hooks/useSocket'
import { useOfficeState } from './hooks/useOfficeState'
import type { AgentOfficeData } from './hooks/useOfficeState'
import { OfficeCanvas } from './components/OfficeCanvas'
import { AgentAvatar } from './components/AgentAvatar'
import { HumanAvatar } from './components/HumanAvatar'
import { OnlineUsersList } from './components/OnlineUsersList'
import { AgentDetailPanel } from './components/AgentDetailPanel'
import { getSocket } from './services/socket'

export function App() {
  const { status } = useSocket()
  const { agents, users } = useOfficeState()
  const canvasRef = useRef<HTMLDivElement>(null)
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)

  const mySocketId = getSocket().id ?? null

  const selectedAgent = agents.find(a => a.id === selectedAgentId) ?? null

  const handleAgentClick = useCallback((agent: AgentOfficeData) => {
    setSelectedAgentId(prev => (prev === agent.id ? null : agent.id))
  }, [])

  const handleClosePanel = useCallback(() => {
    setSelectedAgentId(null)
  }, [])

  return (
    <>
      <OfficeCanvas
        connectionStatus={status}
        agentCount={agents.filter(a => a.status !== 'offline').length}
        humanCount={users.length}
        canvasRef={canvasRef}
      >
        {agents.map(agent => (
          <AgentAvatar
            key={agent.id}
            agent={agent}
            onClick={handleAgentClick}
            isSelected={agent.id === selectedAgentId}
          />
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

      <AnimatePresence>
        {selectedAgent && (
          <AgentDetailPanel
            key={selectedAgent.id}
            agent={selectedAgent}
            onClose={handleClosePanel}
          />
        )}
      </AnimatePresence>

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
        v0.5 — interactions
      </div>
    </>
  )
}
