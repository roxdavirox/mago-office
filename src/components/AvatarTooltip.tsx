import { memo } from 'react'
import { motion } from 'framer-motion'
import { useTheme } from '../contexts/ThemeContext'

export interface TooltipLine {
  label: string
  value: string
  valueColor?: string
}

interface AvatarTooltipProps {
  lines: TooltipLine[]
  /** Posiciona acima (padrão) ou abaixo */
  placement?: 'top' | 'bottom'
}

export const AvatarTooltip = memo(function AvatarTooltip({
  lines,
  placement = 'top',
}: AvatarTooltipProps) {
  const theme = useTheme()

  return (
    <motion.div
      role="tooltip"
      initial={{ opacity: 0, y: placement === 'top' ? 4 : -4, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.15 } }}
      exit={{ opacity: 0, y: placement === 'top' ? 4 : -4, scale: 0.95, transition: { duration: 0.1 } }}
      style={{
        position: 'absolute',
        ...(placement === 'top'
          ? { bottom: 'calc(100% + 8px)' }
          : { top: 'calc(100% + 8px)' }),
        left: '50%',
        transform: 'translateX(-50%)',
        background: theme.isHackerMode ? '#000000ee' : '#0d1117ee',
        border: `1px solid ${theme.isHackerMode ? theme.zoneBorder : '#1f2937'}`,
        borderRadius: 5,
        padding: '6px 10px',
        minWidth: 140,
        zIndex: 1001,
        pointerEvents: 'none',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 10,
        whiteSpace: 'nowrap',
        boxShadow: theme.isHackerMode
          ? `0 0 12px ${theme.zoneBorder}33`
          : '0 4px 16px #00000088',
      }}
    >
      {lines.map((line, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
            lineHeight: 1.7,
            borderTop: i > 0 && line.label === '' ? `1px solid ${theme.isHackerMode ? theme.zoneBorder + '40' : '#1f2937'}` : undefined,
            paddingTop: i > 0 && line.label === '' ? 4 : undefined,
            marginTop: i > 0 && line.label === '' ? 2 : undefined,
          }}
        >
          <span style={{ color: theme.isHackerMode ? theme.label + 'aa' : '#4b5563' }}>
            {line.label}
          </span>
          <span style={{ color: line.valueColor ?? (theme.isHackerMode ? theme.label : '#d1d5db') }}>
            {line.value}
          </span>
        </div>
      ))}
    </motion.div>
  )
})
