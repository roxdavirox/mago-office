import { useSocket } from './hooks/useSocket'
import { useOfficeState } from './hooks/useOfficeState'
import { OfficeCanvas } from './components/OfficeCanvas'
import { AgentAvatar } from './components/AgentAvatar'

export function App() {
  const { status } = useSocket()
  const { agents, users } = useOfficeState()

  return (
    <>
      <OfficeCanvas
        connectionStatus={status}
        agentCount={agents.filter(a => a.status !== 'offline').length}
        humanCount={users.length}
      >
        {agents.map(agent => (
          <AgentAvatar key={agent.id} agent={agent} />
        ))}
      </OfficeCanvas>

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
        v0.3 — agent avatars
      </div>
    </>
  )
}
