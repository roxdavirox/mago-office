import { memo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { type Option, isSome } from '@tecnomancy/alchemy'

interface SpeechBubbleProps {
  text: Option<string>
  color: string
  /** Screen position (pixels) — when set, renders at fixed position */
  screenX?: number
  screenY?: number
}

const MAX_LENGTH = 40

const STYLES = {
  bubble: {
    maxWidth: 180,
    padding: '5px 8px',
    background: 'rgba(15, 23, 42, 0.92)',
    borderRadius: 6,
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: 10,
    color: '#c9d1d9',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    lineHeight: 1.4,
    pointerEvents: 'none',
    zIndex: 10,
    backdropFilter: 'blur(4px)',
  } as React.CSSProperties,

  arrow: {
    position: 'absolute',
    bottom: -5,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 0,
    height: 0,
    borderLeft: '5px solid transparent',
    borderRight: '5px solid transparent',
  } as React.CSSProperties,
}

const variants = {
  hidden: { scale: 0, opacity: 0, y: 8 },
  visible: {
    scale: 1,
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 300, damping: 20 },
  },
  exit: { scale: 0, opacity: 0, transition: { duration: 0.2 } },
}

/** Offset above the sprite (pixels) */
const BUBBLE_OFFSET_Y = 28

export const SpeechBubble = memo(function SpeechBubble({
  text,
  color,
  screenX,
  screenY,
}: SpeechBubbleProps) {
  const content = isSome(text)
    ? text.value.length > MAX_LENGTH
      ? `${text.value.slice(0, MAX_LENGTH)}…`
      : text.value
    : null

  const isPositioned = screenX !== undefined && screenY !== undefined

  const positionStyle: React.CSSProperties = isPositioned
    ? {
        position: 'fixed',
        left: screenX,
        top: screenY - BUBBLE_OFFSET_Y,
        transform: 'translate(-50%, -100%)',
      }
    : {
        position: 'absolute',
        bottom: 'calc(100% + 8px)',
        left: '50%',
        transform: 'translateX(-50%)',
      }

  return (
    <AnimatePresence>
      {content && (
        <motion.div
          key={content}
          variants={variants}
          initial="hidden"
          animate="visible"
          exit="exit"
          style={{ ...STYLES.bubble, ...positionStyle, border: `1px solid ${color}80` }}
        >
          {content}
          {/* Downward-pointing arrow */}
          <span
            data-testid="speech-arrow"
            style={{ ...STYLES.arrow, borderTop: `5px solid ${color}80` }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
})
