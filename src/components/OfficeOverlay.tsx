import { memo, useCallback } from 'react'
import { COLORS } from '../constants/theme'

interface OfficeOverlayProps {
  /** Show loading spinner */
  isLoading?: boolean
  /** Error message — shows error state when set */
  error?: string | null
  /** Called when user clicks the retry button */
  onRetry?: () => void
}

const STYLES = {
  overlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    zIndex: 50,
    fontFamily: 'JetBrains Mono, monospace',
    pointerEvents: 'none',
  } as React.CSSProperties,

  text: {
    fontSize: 12,
    letterSpacing: '0.08em',
  } as React.CSSProperties,

  retryBtn: {
    marginTop: 4,
    background: 'none',
    border: `1px solid ${COLORS.zoneBorder}`,
    borderRadius: 4,
    color: COLORS.label,
    fontSize: 11,
    padding: '4px 14px',
    cursor: 'pointer',
    fontFamily: 'JetBrains Mono, monospace',
    letterSpacing: '0.06em',
    pointerEvents: 'auto',
    transition: 'border-color 0.15s, color 0.15s',
  } as React.CSSProperties,
}

export const OfficeOverlay = memo(function OfficeOverlay({
  isLoading = false,
  error = null,
  onRetry,
}: OfficeOverlayProps) {
  const handleRetry = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onRetry?.()
    },
    [onRetry]
  )

  if (!isLoading && !error) return null

  if (isLoading) {
    return (
      <div role="status" aria-label="loading office" style={STYLES.overlay}>
        <span style={{ ...STYLES.text, color: COLORS.label }}>⟳ connecting to MAGO...</span>
      </div>
    )
  }

  return (
    <div role="alert" aria-label="office error" style={STYLES.overlay}>
      <span style={{ ...STYLES.text, color: '#ef4444' }}>⚠ failed to load agents</span>
      <span style={{ ...STYLES.text, fontSize: 10, color: COLORS.labelMuted }}>{error}</span>
      {onRetry && (
        <button aria-label="retry loading" onClick={handleRetry} style={STYLES.retryBtn}>
          retry
        </button>
      )}
    </div>
  )
})
