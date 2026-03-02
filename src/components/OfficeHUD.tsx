import { memo } from 'react'
import type { ConnectionStatus } from '../hooks/useSocket'
import { STATUS_COLOR, STATUS_LABEL } from '../constants/status'
import { useTheme } from '../contexts/ThemeContext'

interface OfficeHUDProps {
  connectionStatus: ConnectionStatus
  agentCount?: number
  humanCount?: number
  onToggleHackerMode?: () => void
}

export const OfficeHUD = memo(function OfficeHUD({
  connectionStatus,
  agentCount = 0,
  humanCount = 0,
  onToggleHackerMode,
}: OfficeHUDProps) {
  const theme = useTheme()
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
        background: theme.isHackerMode ? '#000000cc' : '#0d1117cc',
        border: `1px solid ${theme.hudBorder}`,
        borderRadius: 6,
        backdropFilter: 'blur(8px)',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 11,
        color: theme.label,
        transition: 'border-color 0.4s ease, color 0.4s ease',
        boxShadow: theme.isHackerMode ? `0 0 8px ${theme.hudBorder}44` : 'none',
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
            background: theme.isHackerMode ? theme.label : color,
            boxShadow: `0 0 4px ${theme.isHackerMode ? theme.label : color}`,
          }}
        />
        <span style={{ color: theme.isHackerMode ? theme.label : color }}>{label}</span>
      </div>

      <span style={{ color: theme.isHackerMode ? `${theme.label}50` : '#374151' }}>│</span>

      {/* Agentes online */}
      <span>{agentCount} agent{agentCount !== 1 ? 's' : ''}</span>

      {humanCount > 0 && (
        <>
          <span style={{ color: theme.isHackerMode ? `${theme.label}50` : '#374151' }}>│</span>
          <span>{humanCount} human{humanCount !== 1 ? 's' : ''}</span>
        </>
      )}

      {/* Botão Hacker Mode */}
      {onToggleHackerMode && (
        <>
          <span style={{ color: theme.isHackerMode ? `${theme.label}50` : '#374151' }}>│</span>
          <button
            onClick={onToggleHackerMode}
            aria-label={theme.isHackerMode ? 'desativar hacker mode' : 'ativar hacker mode'}
            title="Ctrl+Shift+H"
            style={{
              background: 'none',
              border: 'none',
              color: theme.isHackerMode ? theme.label : '#4b5563',
              cursor: 'pointer',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 9,
              padding: 0,
              letterSpacing: '0.05em',
            }}
          >
            {theme.isHackerMode ? '[H]' : 'H'}
          </button>
        </>
      )}
    </div>
  )
})
