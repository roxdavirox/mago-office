import { memo } from 'react'
import type { ConnectionStatus } from '../hooks/useSocket'
import { STATUS_COLOR, STATUS_LABEL } from '../constants/status'
import { COLORS } from '../constants/theme'

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
        background: COLORS.hudBg,
        border: `1px solid ${COLORS.zoneBorder}`,
        borderRadius: 6,
        backdropFilter: 'blur(8px)',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 11,
        color: COLORS.label,
      }}
    >
      {/* Connection status */}
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

      <span style={{ color: COLORS.separator }}>│</span>

      {/* Online agents */}
      <span>
        {agentCount} agent{agentCount !== 1 ? 's' : ''}
      </span>

      {humanCount > 0 && (
        <>
          <span style={{ color: COLORS.separator }}>│</span>
          <span>
            {humanCount} human{humanCount !== 1 ? 's' : ''}
          </span>
        </>
      )}
    </div>
  )
})
