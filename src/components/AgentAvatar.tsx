import { memo, useState, useRef, useCallback, useEffect, useMemo, type RefObject } from 'react'
import { motion, AnimatePresence, useMotionValue } from 'framer-motion'
import type { TargetAndTransition, PanInfo } from 'framer-motion'
import type { AgentOfficeData } from '../hooks/useOfficeState'
import type { ZoneOverride } from '../hooks/useOfficeState'
import { SpeechBubble } from './SpeechBubble'
import { AvatarTooltip } from './AvatarTooltip'
import { AGENT_STATUS_LABEL } from '../constants/agent'
import { OFFICE_ZONES } from '../data/office-layout'

interface AgentAvatarProps {
  agent: AgentOfficeData
  onClick?: (agent: AgentOfficeData) => void
  isSelected?: boolean
  /** Canvas ref — enables drag when provided */
  canvasRef?: RefObject<HTMLDivElement | null>
  /** Called when agent is dropped into a valid zone */
  onZoneOverride?: (agentId: string, override: ZoneOverride) => void
  /** Called when the manual override is reset */
  onClearOverride?: (agentId: string) => void
}

/** Icon per agent role */
const ROLE_ICON: Record<string, string> = {
  architect: '🤖',
  backend: '🔬',
  orchestrator: '⚡',
}

const DEFAULT_ICON = '🤖'

/** Framer Motion animations per status */
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

/** Shake animation played when agent is dropped outside a valid zone */
const SHAKE_ANIMATION: TargetAndTransition = {
  x: [-6, 6, -6, 6, -3, 3, 0],
  transition: { duration: 0.4 },
}

/** Status badge color */
const STATUS_BADGE_COLOR: Record<string, string> = {
  idle: '#6b7280',
  working: '#00ff41',
  thinking: '#f59e0b',
  blocked: '#ef4444',
  offline: '#374151',
}

const TOOLTIP_DELAY_MS = 400

const STYLES = {
  nameLabel: {
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: 9,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
  } as React.CSSProperties,

  badge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 8,
    height: 8,
    borderRadius: '50%',
    border: '1.5px solid #0d1117',
  } as React.CSSProperties,

  anchorBadge: {
    position: 'absolute',
    top: -4,
    left: -4,
    fontSize: 8,
    lineHeight: 1,
    userSelect: 'none',
  } as React.CSSProperties,

  resetBtn: {
    background: 'none',
    border: '1px solid #374151',
    borderRadius: 3,
    color: '#6b7280',
    fontSize: 8,
    padding: '1px 5px',
    cursor: 'pointer',
    fontFamily: 'JetBrains Mono, monospace',
    whiteSpace: 'nowrap',
  } as React.CSSProperties,
}

export const AgentAvatar = memo(function AgentAvatar({
  agent,
  onClick,
  isSelected = false,
  canvasRef,
  onZoneOverride,
  onClearOverride,
}: AgentAvatarProps) {
  const icon = ROLE_ICON[agent.role] ?? DEFAULT_ICON
  const badgeColor = STATUS_BADGE_COLOR[agent.status] ?? '#6b7280'
  const isOffline = agent.status === 'offline'
  const isDraggable = !!canvasRef

  const [showTooltip, setShowTooltip] = useState(false)
  const [shaking, setShaking] = useState(false)
  const tooltipTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Drag offset motion values — reset to 0 after each drag
  const dragX = useMotionValue(0)
  const dragY = useMotionValue(0)

  const handleMouseEnter = useCallback(() => {
    tooltipTimer.current = setTimeout(() => setShowTooltip(true), TOOLTIP_DELAY_MS)
  }, [])

  const handleMouseLeave = useCallback(() => {
    if (tooltipTimer.current) clearTimeout(tooltipTimer.current)
    setShowTooltip(false)
  }, [])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (tooltipTimer.current) clearTimeout(tooltipTimer.current)
    }
  }, [])

  const handleDragEnd = useCallback(
    (_e: unknown, info: PanInfo) => {
      // Reset drag transform offsets regardless of where we dropped
      dragX.set(0)
      dragY.set(0)

      if (!canvasRef?.current) return

      const rect = canvasRef.current.getBoundingClientRect()
      const xPct = ((info.point.x - rect.left) / rect.width) * 100
      const yPct = ((info.point.y - rect.top) / rect.height) * 100

      // Find the zone containing the drop point
      const zone = OFFICE_ZONES.find(
        (z) => xPct >= z.x && xPct <= z.x + z.width && yPct >= z.y && yPct <= z.y + z.height
      )

      if (zone) {
        onZoneOverride?.(agent.id, { x: xPct, y: yPct, zoneId: zone.id })
      } else {
        // Dropped outside any zone — shake and snap back
        setShaking(true)
        setTimeout(() => setShaking(false), 500)
      }
    },
    [canvasRef, agent.id, onZoneOverride, dragX, dragY]
  )

  const handleReset = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onClearOverride?.(agent.id)
    },
    [agent.id, onClearOverride]
  )

  // Choose the animation: shake overrides status animation
  const outerAnimation = shaking ? SHAKE_ANIMATION : undefined
  const innerAnimation = shaking ? undefined : (STATUS_ANIMATION[agent.status] ?? {})

  const tooltipLines = useMemo(
    () => [
      { label: 'role', value: agent.role },
      {
        label: 'status',
        value: AGENT_STATUS_LABEL[agent.status] ?? agent.status,
        valueColor: badgeColor,
      },
      ...(agent.currentTask
        ? [
            {
              label: 'task',
              value: agent.currentTask.slice(0, 28) + (agent.currentTask.length > 28 ? '…' : ''),
            },
          ]
        : []),
      ...(agent.zoneId ? [{ label: 'zone', value: agent.zoneId }] : []),
      ...(agent.isManualOverride ? [{ label: 'mode', value: '⚓ manual' }] : []),
    ],
    [agent.role, agent.status, agent.currentTask, agent.zoneId, agent.isManualOverride, badgeColor]
  )

  return (
    <motion.div
      layoutId={`agent-${agent.id}`}
      aria-label={`agent ${agent.name}, status ${AGENT_STATUS_LABEL[agent.status] ?? agent.status}`}
      drag={isDraggable}
      dragConstraints={canvasRef ?? undefined}
      dragElastic={0}
      dragMomentum={false}
      style={{
        position: 'absolute',
        left: `${agent.position.x}%`,
        top: `${agent.position.y}%`,
        transform: 'translate(-50%, -50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        cursor: isDraggable ? 'grab' : onClick ? 'pointer' : 'default',
        userSelect: 'none',
        x: dragX,
        y: dragY,
        zIndex: isDraggable ? 10 : undefined,
      }}
      animate={outerAnimation}
      onClick={() => onClick?.(agent)}
      whileHover={onClick ? { scale: 1.1 } : undefined}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onDragEnd={isDraggable ? handleDragEnd : undefined}
    >
      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && <AvatarTooltip lines={tooltipLines} placement="top" />}
      </AnimatePresence>

      {/* Speech bubble */}
      <SpeechBubble text={agent.speechText} color={agent.color} />

      {/* Circular avatar */}
      <motion.div
        animate={innerAnimation}
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
          boxShadow: isOffline
            ? 'none'
            : isSelected
              ? `0 0 0 2px ${agent.color}, 0 0 14px ${agent.color}88`
              : `0 0 8px ${agent.color}44`,
          transition: 'box-shadow 0.2s ease',
        }}
      >
        {icon}

        {/* Status badge */}
        <span
          aria-label={`status: ${agent.status}`}
          style={{
            ...STYLES.badge,
            background: badgeColor,
            boxShadow: isOffline ? 'none' : `0 0 4px ${badgeColor}`,
          }}
        />

        {/* Anchor badge — shown when position is manually overridden */}
        {agent.isManualOverride && (
          <span aria-label="manual override" style={STYLES.anchorBadge}>
            ⚓
          </span>
        )}
      </motion.div>

      {/* Agent name */}
      <span style={{ ...STYLES.nameLabel, color: isOffline ? '#374151' : '#6b7280' }}>
        {agent.name}
      </span>

      {/* Reset button — shown only when override is active */}
      {agent.isManualOverride && (
        <button
          aria-label={`reset position for ${agent.name}`}
          onClick={handleReset}
          style={STYLES.resetBtn}
        >
          reset ↺
        </button>
      )}
    </motion.div>
  )
})
