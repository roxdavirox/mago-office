import { memo } from 'react'
import { motion } from 'framer-motion'
import { hashColor, initials } from '../utils/avatar'
import type { UserOfficeData } from '../hooks/useOfficeState'

interface HumanAvatarProps {
  user: UserOfficeData
  /** Whether this is the current user's own avatar */
  isMe: boolean
}

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

/**
 * HumanAvatar — exibe avatar de usuários remotos na overlay React (#95).
 *
 * Movimento local agora é via HumanSprite no Phaser (#94).
 * Este componente apenas renderiza a posição recebida via socket.
 */
export const HumanAvatar = memo(function HumanAvatar({ user, isMe }: HumanAvatarProps) {
  const color = hashColor(user.userId)
  const label = initials(user.name)

  return (
    <motion.div
      aria-label={isMe ? `your avatar: ${user.name}` : `user ${user.name}`}
      style={{
        position: 'absolute',
        left: `${user.x}%`,
        top: `${user.y}%`,
        transform: 'translate(-50%, -50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        userSelect: 'none',
        zIndex: isMe ? 20 : 10,
      }}
      animate={{ left: `${user.x}%`, top: `${user.y}%` }}
      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
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
