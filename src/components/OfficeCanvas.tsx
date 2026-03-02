import { useMemo, type ReactNode, type RefObject } from 'react'
import { OFFICE_ZONES } from '../data/office-layout'
import { OfficeRoom } from './OfficeRoom'
import { OfficeHUD } from './OfficeHUD'
import type { ConnectionStatus } from '../hooks/useSocket'
import { useTheme } from '../contexts/ThemeContext'

interface OfficeCanvasProps {
  children?: ReactNode
  connectionStatus: ConnectionStatus
  agentCount?: number
  humanCount?: number
  /** Ref para o elemento raiz — usado como dragConstraints pelo HumanAvatar */
  canvasRef?: RefObject<HTMLDivElement | null>
  onToggleHackerMode?: () => void
}

export function OfficeCanvas({
  children,
  connectionStatus,
  agentCount = 0,
  humanCount = 0,
  canvasRef,
  onToggleHackerMode,
}: OfficeCanvasProps) {
  const theme = useTheme()

  const gridStyle = useMemo<React.CSSProperties>(() => ({
    position: 'absolute',
    inset: 0,
    backgroundImage: theme.isHackerMode
      ? `repeating-linear-gradient(0deg, ${theme.grid}0d 0px, transparent 1px, transparent 27px, ${theme.grid}0d 28px),
         repeating-linear-gradient(90deg, ${theme.grid}0d 0px, transparent 1px, transparent 27px, ${theme.grid}0d 28px)`
      : `radial-gradient(circle, #1f2937 1px, transparent 1px)`,
    backgroundSize: '28px 28px',
    opacity: theme.isHackerMode ? 1 : 0.4,
    pointerEvents: 'none',
  }), [theme.isHackerMode, theme.grid])

  return (
    <div
      ref={canvasRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        background: theme.bg,
        overflow: 'hidden',
        fontFamily: 'JetBrains Mono, monospace',
        transition: 'background 0.4s ease',
      }}
    >
      {/* Grid decorativo */}
      <div style={gridStyle} />

      {/* Zonas do escritório */}
      {OFFICE_ZONES.map(zone => (
        <OfficeRoom key={zone.id} zone={zone} />
      ))}

      {/* Avatares (agents + humans) — passados como children */}
      {children}

      {/* HUD: status de conexão + contagem */}
      <OfficeHUD
        connectionStatus={connectionStatus}
        agentCount={agentCount}
        humanCount={humanCount}
        onToggleHackerMode={onToggleHackerMode}
      />
    </div>
  )
}
