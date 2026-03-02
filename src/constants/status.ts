import type { ConnectionStatus } from '../hooks/useSocket'

export const STATUS_COLOR: Record<ConnectionStatus, string> = {
  connecting: '#f59e0b',
  connected: '#00ff41',
  reconnecting: '#f59e0b',
  disconnected: '#6b7280',
  error: '#ef4444',
}

export const STATUS_LABEL: Record<ConnectionStatus, string> = {
  connecting: 'conectando',
  connected: 'online',
  reconnecting: 'reconectando',
  disconnected: 'offline',
  error: 'erro',
}
