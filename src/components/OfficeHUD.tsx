import type { ConnectionStatus } from '../hooks/useSocket'

interface OfficeHUDProps {
  connectionStatus: ConnectionStatus
  agentCount: number
  humanCount: number
}

const STATUS_COLOR: Record<ConnectionStatus, string> = {
  connecting: '#f59e0b',
  connected: '#00ff41',
  reconnecting: '#f59e0b',
  disconnected: '#6b7280',
  error: '#ef4444',
}

const STATUS_LABEL: Record<ConnectionStatus, string> = {
  connecting: 'conectando',
  connected: 'online',
  reconnecting: 'reconectando',
  disconnected: 'offline',
  error: 'erro',
}

export function OfficeHUD({ connectionStatus, agentCount, humanCount }: OfficeHUDProps) {
  const color = STATUS_COLOR[connectionStatus]
  const label = STATUS_LABEL[connectionStatus]

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 16,
        right: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '6px 12px',
        background: '#0d1117cc',
        border: '1px solid #1f2937',
        borderRadius: 6,
        backdropFilter: 'blur(8px)',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 11,
        color: '#6b7280',
      }}
    >
      {/* Status conexão */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: color,
            boxShadow: `0 0 4px ${color}`,
          }}
        />
        <span style={{ color }}>{label}</span>
      </div>

      <span style={{ color: '#374151' }}>│</span>

      {/* Agentes online */}
      <span>{agentCount} agent{agentCount !== 1 ? 's' : ''}</span>

      {humanCount > 0 && (
        <>
          <span style={{ color: '#374151' }}>│</span>
          <span>{humanCount} human{humanCount !== 1 ? 's' : ''}</span>
        </>
      )}
    </div>
  )
}
