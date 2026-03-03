import { memo } from 'react'
import { motion } from 'framer-motion'
import { COLORS } from '../constants/theme'

export interface TooltipLine {
  label: string
  value: string
  valueColor?: string
}

interface AvatarTooltipProps {
  lines: TooltipLine[]
  /** Positions above (default) or below */
  placement?: 'top' | 'bottom'
}

const STYLES = {
  tooltipBase: {
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)',
    background: `${COLORS.bg}ee`,
    border: `1px solid ${COLORS.zoneBorder}`,
    borderRadius: 5,
    padding: '6px 10px',
    minWidth: 140,
    zIndex: 1001,
    pointerEvents: 'none',
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: 10,
    whiteSpace: 'nowrap',
    boxShadow: '0 4px 16px #00000088',
  } as React.CSSProperties,

  row: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    lineHeight: 1.7,
  } as React.CSSProperties,

  rowLabel: {
    color: COLORS.labelMuted,
  } as React.CSSProperties,
}

export const AvatarTooltip = memo(function AvatarTooltip({
  lines,
  placement = 'top',
}: AvatarTooltipProps) {
  const placementStyle: React.CSSProperties =
    placement === 'top' ? { bottom: 'calc(100% + 8px)' } : { top: 'calc(100% + 8px)' }

  return (
    <motion.div
      role="tooltip"
      initial={{ opacity: 0, y: placement === 'top' ? 4 : -4, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.15 } }}
      exit={{
        opacity: 0,
        y: placement === 'top' ? 4 : -4,
        scale: 0.95,
        transition: { duration: 0.1 },
      }}
      style={{ ...STYLES.tooltipBase, ...placementStyle }}
    >
      {lines.map((line, i) => (
        <div
          key={i}
          style={{
            ...STYLES.row,
            borderTop: i > 0 && line.label === '' ? `1px solid ${COLORS.zoneBorder}` : undefined,
            paddingTop: i > 0 && line.label === '' ? 4 : undefined,
            marginTop: i > 0 && line.label === '' ? 2 : undefined,
          }}
        >
          <span style={STYLES.rowLabel}>{line.label}</span>
          <span style={{ color: line.valueColor ?? COLORS.labelBright }}>{line.value}</span>
        </div>
      ))}
    </motion.div>
  )
})
