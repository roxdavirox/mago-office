import { useSocket } from './hooks/useSocket'
import type { ConnectionStatus } from './hooks/useSocket'

const STATUS_COLOR: Record<ConnectionStatus, string> = {
  connecting: '#f59e0b',
  connected: '#00ff41',
  disconnected: '#6b7280',
  error: '#ef4444',
}

const STATUS_LABEL: Record<ConnectionStatus, string> = {
  connecting: 'conectando...',
  connected: 'conectado',
  disconnected: 'desconectado',
  error: 'erro de conexão',
}

export function App() {
  const { status } = useSocket()
  const color = STATUS_COLOR[status]

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: 12,
        background: '#0d1117',
        color: '#00ff41',
        fontFamily: 'JetBrains Mono, monospace',
      }}
    >
      <span style={{ fontSize: 32 }}>⌂</span>
      <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.1em' }}>MAGO OFFICE</span>
      <span style={{ fontSize: 11, opacity: 0.5 }}>v0.1 — foundation</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: color,
            boxShadow: `0 0 6px ${color}`,
          }}
        />
        <span style={{ fontSize: 11, color, opacity: 0.9 }}>
          backend {STATUS_LABEL[status]}
        </span>
      </div>
    </div>
  )
}
