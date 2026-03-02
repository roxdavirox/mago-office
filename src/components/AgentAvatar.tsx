import { memo, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { TargetAndTransition } from 'framer-motion'
import type { AgentOfficeData } from '../hooks/useOfficeState'
import { SpeechBubble } from './SpeechBubble'
import { AvatarTooltip } from './AvatarTooltip'
import { STATUS_LABEL } from '../constants/status'

interface AgentAvatarProps {
  agent: AgentOfficeData
  onClick?: (agent: AgentOfficeData) => void
  isSelected?: boolean
}

/** Ícone por role do agente */
const ROLE_ICON: Record<string, string> = {
  architect:    '🤖',
  backend:      '🔬',
  orchestrator: '⚡',
}

const DEFAULT_ICON = '🤖'

/** Animações Framer Motion por status */
const STATUS_ANIMATION: Record<string, TargetAndTransition> = {
  idle: {
    y: [0, -4, 0],
    transition: { repeat: Infinity, duration: 2, ease: 'easeInOut' },
  },
  working: {
    scale: [1, 1.06, 1],
    transition: { repeat: Infinity, duration: 0.8, ease: 'easeInOut' },
  },
  thinking: {
    scale: [1, 1.04, 1],
    transition: { repeat: Infinity, duration: 1.2, ease: 'easeInOut' },
  },
  blocked: {
    x: [-2, 2, -2, 2, 0],
    transition: { duration: 0.4 },
  },
  offline: {},
}

/** Cor do badge de status */
const STATUS_BADGE_COLOR: Record<string, string> = {
  idle:      '#6b7280',
  working:   '#00ff41',
  thinking:  '#f59e0b',
  blocked:   '#ef4444',
  offline:   '#374151',
}

const TOOLTIP_DELAY_MS = 400

export const AgentAvatar = memo(function AgentAvatar({ agent, onClick, isSelected = false }: AgentAvatarProps) {
  const icon = ROLE_ICON[agent.role] ?? DEFAULT_ICON
  const animation = STATUS_ANIMATION[agent.status] ?? {}
  const badgeColor = STATUS_BADGE_COLOR[agent.status] ?? '#6b7280'
  const isOffline = agent.status === 'offline'
  const [showTooltip, setShowTooltip] = useState(false)
  const tooltipTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleMouseEnter = useCallback(() => {
    tooltipTimer.current = setTimeout(() => setShowTooltip(true), TOOLTIP_DELAY_MS)
  }, [])

  const handleMouseLeave = useCallback(() => {
    if (tooltipTimer.current) clearTimeout(tooltipTimer.current)
    setShowTooltip(false)
  }, [])

  const tooltipLines = [
    { label: 'role', value: agent.role },
    { label: 'status', value: STATUS_LABEL[agent.status] ?? agent.status, valueColor: badgeColor },
    ...(agent.currentTask ? [{ label: 'task', value: agent.currentTask.slice(0, 28) + (agent.currentTask.length > 28 ? '…' : '') }] : []),
    ...(agent.zoneId ? [{ label: 'zona', value: agent.zoneId }] : []),
  ]

  return (
    <motion.div
      layoutId={`agent-${agent.id}`}
      aria-label={`agente ${agent.name}, status ${STATUS_LABEL[agent.status] ?? agent.status}`}
      style={{
        position: 'absolute',
        left: `${agent.position.x}%`,
        top: `${agent.position.y}%`,
        transform: 'translate(-50%, -50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
      }}
      onClick={() => onClick?.(agent)}
      whileHover={onClick ? { scale: 1.1 } : undefined}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && <AvatarTooltip lines={tooltipLines} placement="top" />}
      </AnimatePresence>

      {/* Balão de fala */}
      <SpeechBubble text={agent.speechText} color={agent.color} />

      {/* Avatar circular */}
      <motion.div
        animate={animation}
        style={{
          position: 'relative',
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: `${agent.color}22`,
          border: `2px solid ${agent.color}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 16,
          opacity: isOffline ? 0.35 : 1,
          boxShadow: isOffline ? 'none' : isSelected ? `0 0 0 2px ${agent.color}, 0 0 14px ${agent.color}88` : `0 0 8px ${agent.color}44`,
          transition: 'box-shadow 0.2s ease',
        }}
      >
        {icon}

        {/* Badge de status */}
        <span
          aria-label={`status: ${agent.status}`}
          style={{
            position: 'absolute',
            bottom: -1,
            right: -1,
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: badgeColor,
            border: '1.5px solid #0d1117',
            boxShadow: isOffline ? 'none' : `0 0 4px ${badgeColor}`,
          }}
        />
      </motion.div>

      {/* Nome do agente */}
      <span
        style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 9,
          color: isOffline ? '#374151' : '#6b7280',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}
      >
        {agent.name}
      </span>
    </motion.div>
  )
})
