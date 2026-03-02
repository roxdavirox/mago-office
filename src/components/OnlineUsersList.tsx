import { memo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { UserOfficeData } from '../hooks/useOfficeState'
import { hashColor, initials } from '../utils/avatar'

interface OnlineUsersListProps {
  users: UserOfficeData[]
  mySocketId: string | null
}

const ITEM_VARIANTS = {
  hidden: { opacity: 0, x: -12 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.2 } },
  exit: { opacity: 0, x: -12, transition: { duration: 0.15 } },
}

const UserRow = memo(function UserRow({
  user,
  isMe,
}: {
  user: UserOfficeData
  isMe: boolean
}) {
  const color = user.userId ? hashColor(user.userId) : '#6b7280'
  const label = user.name ? initials(user.name) : '?'

  return (
    <motion.div
      layout
      variants={ITEM_VARIANTS}
      initial="hidden"
      animate="visible"
      exit="exit"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        padding: '3px 0',
      }}
    >
      {/* Avatar circular mini */}
      <div
        aria-hidden="true"
        style={{
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: `${color}22`,
          border: `1.5px solid ${color}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 8,
          fontWeight: 700,
          color,
          flexShrink: 0,
        }}
      >
        {label}
      </div>

      {/* Nome */}
      <span
        style={{
          fontSize: 10,
          color: isMe ? color : '#9ca3af',
          fontWeight: isMe ? 700 : 400,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: 90,
        }}
        title={user.name}
      >
        {user.name}
        {isMe && (
          <span style={{ color, opacity: 0.7, marginLeft: 4, fontSize: 8 }}>you</span>
        )}
      </span>
    </motion.div>
  )
})

export const OnlineUsersList = memo(function OnlineUsersList({
  users,
  mySocketId,
}: OnlineUsersListProps) {
  if (users.length === 0) return null

  return (
    <div
      role="list"
      aria-label="usuários online"
      style={{
        position: 'fixed',
        top: 16,
        right: 16,
        padding: '8px 10px',
        background: '#0d1117cc',
        border: '1px solid #1f2937',
        borderRadius: 6,
        backdropFilter: 'blur(8px)',
        fontFamily: 'JetBrains Mono, monospace',
        minWidth: 130,
        maxWidth: 160,
        zIndex: 50,
      }}
    >
      {/* Cabeçalho */}
      <div
        style={{
          fontSize: 9,
          color: '#4b5563',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginBottom: 6,
          borderBottom: '1px solid #1f2937',
          paddingBottom: 4,
        }}
      >
        online · {users.length}
      </div>

      {/* Lista com AnimatePresence para animações de join/leave */}
      <AnimatePresence initial={false}>
        {users.map(user => (
          <div key={user.socketId} role="listitem">
            <UserRow user={user} isMe={user.socketId === mySocketId} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
})
