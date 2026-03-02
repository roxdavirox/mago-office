import { io, Socket } from 'socket.io-client'

const BACKEND_URL = import.meta.env.VITE_MAGO_BACKEND_URL ?? 'http://localhost:3002'

// --- Tipos dos eventos emitidos pelo MAGO backend ---

export interface AgentStatus {
  agentId: string
  status: 'idle' | 'working' | 'thinking' | 'blocked' | 'offline'
  lastAction?: string
  currentTask?: string
  updatedAt: string
}

export interface BusMessage {
  id: string
  from: string
  to?: string
  type: string
  payload: Record<string, unknown>
  timestamp: string
}

export interface BoardItemMoved {
  itemId: string
  fromColumn: string
  toColumn: string
  movedBy: string
}

export interface OfficeUser {
  socketId: string
  userId: string
  name: string
  x: number
  y: number
}

// --- Mapa de eventos (ServerToClient) ---

export interface ServerToClientEvents {
  'agent:status:updated': (data: AgentStatus) => void
  'bus:message': (data: BusMessage) => void
  'board:item:moved': (data: BoardItemMoved) => void
  'office:user:joined': (data: OfficeUser) => void
  'office:user:moved': (data: { socketId: string; x: number; y: number }) => void
  'office:user:left': (data: { socketId: string }) => void
}

export interface ClientToServerEvents {
  'office:join': (data: { userId: string; name: string }) => void
  'office:user:move': (data: { x: number; y: number }) => void
  'office:leave': () => void
}

export type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>

// --- Singleton ---
// autoConnect: false — conexão iniciada explicitamente via connectSocket()
// para permitir controle do ciclo de vida e facilitar testes

export const socket: TypedSocket = io(BACKEND_URL, {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 10000,
  autoConnect: false,
})

export function connectSocket(): void {
  if (!socket.connected) {
    socket.connect()
  }
}

/** Retorna a instância singleton do socket — uso em hooks e testes. */
export function getSocket(): TypedSocket {
  return socket
}
