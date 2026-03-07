import { type ReactNode, type RefObject } from 'react'
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
  /** Ref to the root element — used as dragConstraints by HumanAvatar */
  canvasRef?: RefObject<HTMLDivElement | null>
}

const STYLES = {
  canvas: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    background: 'transparent',
    overflow: 'hidden',
    fontFamily: 'JetBrains Mono, monospace',
    zIndex: 1,
  } as React.CSSProperties,

  grid: {
    position: 'absolute',
    inset: 0,
    backgroundImage: `radial-gradient(circle, ${COLORS.grid} 1px, transparent 1px)`,
    backgroundSize: '28px 28px',
    opacity: 0.4,
    pointerEvents: 'none',
  } as React.CSSProperties,
}

export function OfficeCanvas({
  children,
  connectionStatus,
  agentCount = 0,
  humanCount = 0,
  canvasRef,
}: OfficeCanvasProps) {
  return (
    <div ref={canvasRef} style={STYLES.canvas} data-testid="office-canvas">
      {/* Decorative grid */}
      <div style={STYLES.grid} />

      {/* Office zones */}
      {OFFICE_ZONES.map((zone) => (
        <OfficeRoom key={zone.id} zone={zone} />
      ))}

      {/* Avatars (agents + humans) — passed as children */}
      {children}

      {/* HUD: connection status + counts */}
      <OfficeHUD
        connectionStatus={connectionStatus}
        agentCount={agentCount}
        humanCount={humanCount}
      />
    </div>
  )
}
