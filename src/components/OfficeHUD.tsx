import { memo } from 'react'
import type { ConnectionStatus } from '../hooks/useSocket'
import { STATUS_COLOR, STATUS_LABEL } from '../constants/status'

interface OfficeHUDProps {
  connectionStatus: ConnectionStatus
  agentCount?: number
  humanCount?: number
}

export const OfficeHUD = memo(function OfficeHUD({
  connectionStatus,
  agentCount = 0,
  humanCount = 0,
}: OfficeHUDProps) {
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
          aria-label={`status: ${label}`}
          role="status"
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
})
