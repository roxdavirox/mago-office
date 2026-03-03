import { memo } from 'react'
import type { Zone } from '../data/office-layout'
import { COLORS } from '../constants/theme'

interface OfficeRoomProps {
  zone: Zone
}

const STYLES = {
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 10px',
    borderBottom: `1px solid ${COLORS.zoneBorder}50`,
  } as React.CSSProperties,

  icon: {
    fontSize: 12,
  } as React.CSSProperties,

  label: {
    fontSize: 10,
    fontFamily: 'JetBrains Mono, monospace',
    color: COLORS.label,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  } as React.CSSProperties,
}

export const OfficeRoom = memo(function OfficeRoom({ zone }: OfficeRoomProps) {
  return (
    <div
      data-zone-id={zone.id}
      style={{
        position: 'absolute',
        left: `${zone.x}%`,
        top: `${zone.y}%`,
        width: `${zone.width}%`,
        height: `${zone.height}%`,
        background: zone.color,
        border: `1px solid ${COLORS.zoneBorder}`,
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      {/* Zone header */}
      <div style={STYLES.header}>
        <span style={STYLES.icon}>{zone.icon}</span>
        <span style={STYLES.label}>{zone.label}</span>
      </div>
    </div>
  )
})
