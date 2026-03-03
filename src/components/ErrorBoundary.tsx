import { Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'
import { COLORS } from '../constants/theme'

interface ErrorBoundaryProps {
  children: ReactNode
  /** Optional fallback UI — receives the error. Defaults to built-in fallback. */
  fallback?: (error: Error) => ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

const STYLES = {
  root: {
    position: 'fixed',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    background: COLORS.bg,
    fontFamily: 'JetBrains Mono, monospace',
    color: COLORS.label,
  } as React.CSSProperties,

  title: {
    fontSize: 14,
    letterSpacing: '0.08em',
    color: '#ef4444',
    margin: 0,
  } as React.CSSProperties,

  message: {
    fontSize: 11,
    color: COLORS.labelMuted,
    maxWidth: 480,
    textAlign: 'center',
    lineHeight: 1.6,
    margin: 0,
  } as React.CSSProperties,

  reloadBtn: {
    marginTop: 8,
    background: 'none',
    border: `1px solid ${COLORS.zoneBorder}`,
    borderRadius: 4,
    color: COLORS.label,
    fontSize: 11,
    padding: '6px 18px',
    cursor: 'pointer',
    fontFamily: 'JetBrains Mono, monospace',
    letterSpacing: '0.06em',
  } as React.CSSProperties,
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Log for debugging — can be replaced with a real error reporting service
    console.error('[ErrorBoundary] Uncaught error:', error, info.componentStack)
  }

  handleReload = (): void => {
    window.location.reload()
  }

  render(): ReactNode {
    const { error } = this.state
    const { children, fallback } = this.props

    if (!error) return children

    if (fallback) return fallback(error)

    return (
      <div role="alert" aria-label="application error" style={STYLES.root}>
        <p style={STYLES.title}>⚠ something went wrong</p>
        <p style={STYLES.message}>{error.message}</p>
        <button
          aria-label="reload application"
          onClick={this.handleReload}
          style={STYLES.reloadBtn}
        >
          reload
        </button>
      </div>
    )
  }
}
