import { memo } from 'react'
import type { Zone } from '../data/office-layout'
import { COLORS } from '../constants/theme'

interface OfficeRoomProps {
  zone: Zone
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
      {/* Header da zona */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 10px',
          borderBottom: `1px solid ${COLORS.zoneBorder}50`,
        }}
      >
        <span style={{ fontSize: 12 }}>{zone.icon}</span>
        <span
          style={{
            fontSize: 10,
            fontFamily: 'JetBrains Mono, monospace',
            color: COLORS.label,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}
        >
          {zone.label}
        </span>
      </div>
    </div>
  )
})
