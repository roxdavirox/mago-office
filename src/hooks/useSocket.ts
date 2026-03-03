import { useEffect, useMemo, useState } from 'react'
import { connectSocket, socket } from '../services/socket'

export type ConnectionStatus =
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'error'

export function useSocket() {
  const [status, setStatus] = useState<ConnectionStatus>(() =>
    socket.connected ? 'connected' : 'connecting'
  )

  useEffect(() => {
    // Start connection on mount — autoConnect is disabled on the singleton
    connectSocket()

    // Resolve race condition: check current state after mount
    if (socket.connected) setStatus('connected')

    const onConnect = () => setStatus('connected')
    const onDisconnect = () => setStatus('disconnected')
    const onConnectError = () => setStatus('error')
    const onReconnectAttempt = () => setStatus('reconnecting')

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('connect_error', onConnectError)
    socket.io.on('reconnect_attempt', onReconnectAttempt)

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('connect_error', onConnectError)
      socket.io.off('reconnect_attempt', onReconnectAttempt)
    }
  }, [])

  // useMemo avoids recreating the object on every render (socket is singleton, only status changes)
  return useMemo(() => ({ socket, status }), [status])
}
