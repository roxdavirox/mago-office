import type { Zone } from '../data/office-layout'

interface OfficeRoomProps {
  zone: Zone
}

export function OfficeRoom({ zone }: OfficeRoomProps) {
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
        border: '1px solid #1f2937',
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
          borderBottom: '1px solid #1f293780',
        }}
      >
        <span style={{ fontSize: 12 }}>{zone.icon}</span>
        <span
          style={{
            fontSize: 10,
            fontFamily: 'JetBrains Mono, monospace',
            color: '#6b7280',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}
        >
          {zone.label}
        </span>
      </div>
    </div>
  )
}
