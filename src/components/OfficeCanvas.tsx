import { useMemo, type ReactNode, type RefObject } from 'react'
import { OFFICE_ZONES } from '../data/office-layout'
import { OfficeRoom } from './OfficeRoom'
import { OfficeHUD } from './OfficeHUD'
import type { ConnectionStatus } from '../hooks/useSocket'
import { COLORS } from '../constants/theme'

interface OfficeCanvasProps {
  children?: ReactNode
  connectionStatus: ConnectionStatus
  agentCount?: number
  humanCount?: number
  /** Ref para o elemento raiz — usado como dragConstraints pelo HumanAvatar */
  canvasRef?: RefObject<HTMLDivElement | null>
}

export function OfficeCanvas({
  children,
  connectionStatus,
  agentCount = 0,
  humanCount = 0,
  canvasRef,
}: OfficeCanvasProps) {
  const gridStyle = useMemo<React.CSSProperties>(
    () => ({
      position: 'absolute',
      inset: 0,
      backgroundImage: `radial-gradient(circle, ${COLORS.grid} 1px, transparent 1px)`,
      backgroundSize: '28px 28px',
      opacity: 0.4,
      pointerEvents: 'none',
    }),
    []
  )

  return (
    <div
      ref={canvasRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        background: COLORS.bg,
        overflow: 'hidden',
        fontFamily: 'JetBrains Mono, monospace',
      }}
    >
      {/* Grid decorativo */}
      <div style={gridStyle} />

      {/* Zonas do escritório */}
      {OFFICE_ZONES.map((zone) => (
        <OfficeRoom key={zone.id} zone={zone} />
      ))}

      {/* Avatares (agents + humans) — passados como children */}
      {children}

      {/* HUD: status de conexão + contagem */}
      <OfficeHUD
        connectionStatus={connectionStatus}
        agentCount={agentCount}
        humanCount={humanCount}
      />
    </div>
  )
}
