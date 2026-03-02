import { memo, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { getSocket } from '../services/socket'
import { hashColor, initials } from '../utils/avatar'
import type { UserOfficeData } from '../hooks/useOfficeState'

interface HumanAvatarProps {
  user: UserOfficeData
  /** Indica se este é o avatar do próprio usuário (draggable) */
  isMe: boolean
  /** Ref do elemento canvas para calcular constraints de drag */
  canvasRef: React.RefObject<HTMLElement | null>
}

const EMIT_DEBOUNCE_MS = 100

export const HumanAvatar = memo(function HumanAvatar({
  user,
  isMe,
  canvasRef,
}: HumanAvatarProps) {
  const color = hashColor(user.userId)
  const label = initials(user.name)
  const lastEmitAt = useRef(0)

  const handleDragEnd = useCallback(
    (_: unknown, info: { point: { x: number; y: number } }) => {
      if (!isMe) return

      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const x = Math.min(100, Math.max(0, ((info.point.x - rect.left) / rect.width) * 100))
      const y = Math.min(100, Math.max(0, ((info.point.y - rect.top) / rect.height) * 100))

      // Debounce para evitar flood de eventos
      const now = Date.now()
      if (now - lastEmitAt.current < EMIT_DEBOUNCE_MS) return
      lastEmitAt.current = now

      getSocket().emit('office:user:move', { x, y })
    },
    [isMe, canvasRef],
  )

  return (
    <motion.div
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
      // Animar suavemente para nova posição (outros usuários)
      animate={{ left: `${user.x}%`, top: `${user.y}%` }}
      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      drag={isMe || undefined}
      dragConstraints={canvasRef}
      dragElastic={0.05}
      whileDrag={{ scale: 1.12, cursor: 'grabbing', zIndex: 1000 }}
      onDragEnd={handleDragEnd}
    >
      {/* Avatar circular */}
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

      {/* Badge YOU + nome */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
        {isMe && (
          <span
            style={{
              fontSize: 8,
              fontFamily: 'JetBrains Mono, monospace',
              color,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            you
          </span>
        )}
        <span
          style={{
            fontSize: 9,
            fontFamily: 'JetBrains Mono, monospace',
            color: '#6b7280',
            letterSpacing: '0.04em',
            whiteSpace: 'nowrap',
            maxWidth: 64,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
          title={user.name}
        >
          {user.name}
        </span>
      </div>
    </motion.div>
  )
})
