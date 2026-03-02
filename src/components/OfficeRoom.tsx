import { memo } from 'react'
import type { Zone } from '../data/office-layout'
import { useTheme } from '../contexts/ThemeContext'

interface OfficeRoomProps {
  zone: Zone
}

export const OfficeRoom = memo(function OfficeRoom({ zone }: OfficeRoomProps) {
  const theme = useTheme()

  return (
    <div
      data-zone-id={zone.id}
      style={{
        position: 'absolute',
        left: `${zone.x}%`,
        top: `${zone.y}%`,
        width: `${zone.width}%`,
        height: `${zone.height}%`,
        background: theme.isHackerMode ? theme.zoneBg : zone.color,
        border: `1px solid ${theme.zoneBorder}`,
        borderRadius: 8,
        overflow: 'hidden',
        transition: 'background 0.4s ease, border-color 0.4s ease',
        boxShadow: theme.isHackerMode ? `0 0 8px ${theme.zoneBorder}44` : 'none',
      }}
    >
      {/* Header da zona */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 10px',
          borderBottom: `1px solid ${theme.zoneBorder}50`,
        }}
      >
        <span style={{ fontSize: 12 }}>{zone.icon}</span>
        <span
          style={{
            fontSize: 10,
            fontFamily: 'JetBrains Mono, monospace',
            color: theme.label,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            transition: 'color 0.4s ease',
          }}
        >
          {zone.label}
        </span>
      </div>
    </div>
  )
})
