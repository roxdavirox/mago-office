import type { ReactNode } from 'react'
import { OFFICE_ZONES } from '../data/office-layout'
import { OfficeRoom } from './OfficeRoom'
import { OfficeHUD } from './OfficeHUD'
import type { ConnectionStatus } from '../hooks/useSocket'

interface OfficeCanvasProps {
  children?: ReactNode
  connectionStatus: ConnectionStatus
  agentCount?: number
  humanCount?: number
}

const GRID_STYLE: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  backgroundImage: `
    radial-gradient(circle, #1f2937 1px, transparent 1px)
  `,
  backgroundSize: '28px 28px',
  opacity: 0.4,
  pointerEvents: 'none',
}

export function OfficeCanvas({
  children,
  connectionStatus,
  agentCount = 0,
  humanCount = 0,
}: OfficeCanvasProps) {
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        background: '#0d1117',
        overflow: 'hidden',
        fontFamily: 'JetBrains Mono, monospace',
      }}
    >
      {/* Grid decorativo de fundo */}
      <div style={GRID_STYLE} />

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
      />
    </div>
  )
}
