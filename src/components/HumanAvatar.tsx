import { memo, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { getSocket } from '../services/socket'
import { hashColor, initials, toPercent } from '../utils/avatar'
import type { UserOfficeData } from '../hooks/useOfficeState'

interface HumanAvatarProps {
  user: UserOfficeData
  /** Whether this is the current user's own avatar (draggable) */
  isMe: boolean
  /** Ref to the canvas element for calculating drag constraints */
  canvasRef: React.RefObject<HTMLDivElement | null>
}

const EMIT_DEBOUNCE_MS = 100

const STYLES = {
  nameStack: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 1,
  } as React.CSSProperties,

  youBadge: {
    fontSize: 8,
    fontFamily: 'JetBrains Mono, monospace',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  } as React.CSSProperties,

  nameLabel: {
    fontSize: 9,
    fontFamily: 'JetBrains Mono, monospace',
    color: '#6b7280',
    letterSpacing: '0.04em',
    whiteSpace: 'nowrap',
    maxWidth: 64,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  } as React.CSSProperties,
}

export const HumanAvatar = memo(function HumanAvatar({ user, isMe, canvasRef }: HumanAvatarProps) {
  const color = hashColor(user.userId)
  const label = initials(user.name)
  const lastEmitAt = useRef(0)

  const handleDragEnd = useCallback(
    (_: unknown, info: { point: { x: number; y: number } }) => {
      if (!isMe) return

      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const x = toPercent(info.point.x - rect.left, rect.width)
      const y = toPercent(info.point.y - rect.top, rect.height)

      // Debounce to avoid event flooding
      const now = Date.now()
      if (now - lastEmitAt.current < EMIT_DEBOUNCE_MS) return
      lastEmitAt.current = now

      getSocket().emit('office:user:move', { x, y })
    },
    [isMe, canvasRef]
  )

  return (
    <motion.div
      role={isMe ? 'button' : undefined}
      aria-label={isMe ? `your avatar: ${user.name}, drag to move` : `user ${user.name}`}
      aria-grabbed={isMe ? false : undefined}
      tabIndex={isMe ? 0 : undefined}
      style={{
        position: 'absolute',
        left: `${user.x}%`,
        top: `${user.y}%`,
        transform: 'translate(-50%, -50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        cursor: isMe ? 'grab' : 'default',
        userSelect: 'none',
        zIndex: isMe ? 20 : 10,
      }}
      // Smoothly animate to new position (other users)
      animate={{ left: `${user.x}%`, top: `${user.y}%` }}
      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      drag={isMe || undefined}
      dragConstraints={canvasRef}
      dragElastic={0.05}
      whileDrag={{ scale: 1.12, cursor: 'grabbing', zIndex: 1000 }}
      onDragEnd={handleDragEnd}
    >
      {/* Circular avatar */}
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: `${color}33`,
          border: `2px solid ${color}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 11,
          fontWeight: 700,
          color,
          boxShadow: `0 0 6px ${color}55`,
        }}
      >
        {label}
      </div>

      {/* YOU badge + name */}
      <div style={STYLES.nameStack}>
        {isMe && <span style={{ ...STYLES.youBadge, color }}>you</span>}
        <span style={STYLES.nameLabel} title={user.name}>
          {user.name}
        </span>
      </div>
    </motion.div>
  )
})
