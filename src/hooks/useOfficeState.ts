import { useEffect, useReducer, useCallback, useRef } from 'react'
import { getSocket } from '../services/socket'
import {
  getAgentZone,
  getAgentPosition,
  getAgentColor,
  AGENT_COLORS,
} from '../data/office-layout'

// ─── Types ──────────────────────────────────────────────────────────────────

/** Shape real da API GET /api/dashboard/agents */
export interface RawAgent {
  id: string
  name: string
  role: string
  status: string
  current_task: string
  progress: number | null
  last_heartbeat: string
  messages_count: number
}

/** Agente enriquecido com dados de posição calculados */
export interface AgentOfficeData {
  id: string
  name: string
  role: string
  status: string
  /** current_task da API — equivalente a lastAction */
  currentTask: string
  zoneId: string
  /** Posição absoluta em % do canvas */
  position: { x: number; y: number }
  color: string
  /** Texto do SpeechBubble atual (nulo = oculto) */
  speechText: string | null
}

export interface UserOfficeData {
  socketId: string
  userId: string
  name: string
  x: number
  y: number
}

export interface OfficeState {
  agents: AgentOfficeData[]
  users: UserOfficeData[]
  isLoading: boolean
  error: string | null
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const AGENT_IDS_ORDERED = Object.keys(AGENT_COLORS) // ['rx-architect', 'rx-backend', 'rx-orchestrator']

/**
 * Determina o índice estável do agente para cálculo de offset anti-sobreposição.
 * Usa a posição do id na lista ordenada; ids desconhecidos vão para o final.
 */
function agentIndex(id: string): number {
  const idx = AGENT_IDS_ORDERED.indexOf(id)
  return idx >= 0 ? idx : AGENT_IDS_ORDERED.length
}

function enrichAgent(raw: RawAgent): AgentOfficeData {
  const zoneId = getAgentZone(raw.status, raw.current_task)
  const position = getAgentPosition(zoneId, agentIndex(raw.id))
  return {
    id: raw.id,
    name: raw.name,
    role: raw.role,
    status: raw.status,
    currentTask: raw.current_task,
    zoneId,
    position,
    color: getAgentColor(raw.id),
    speechText: null,
  }
}

// ─── Reducer ────────────────────────────────────────────────────────────────

type Action =
  | { type: 'AGENTS_LOADED'; agents: RawAgent[] }
  | { type: 'AGENT_STATUS_UPDATED'; agentId: string; status: string; lastAction: string }
  | { type: 'AGENT_SPEECH'; agentId: string; text: string }
  | { type: 'AGENT_SPEECH_CLEAR'; agentId: string }
  | { type: 'USER_JOINED'; user: UserOfficeData }
  | { type: 'USER_LEFT'; socketId: string }
  | { type: 'USER_MOVED'; socketId: string; x: number; y: number }
  | { type: 'FETCH_ERROR'; error: string }

function reducer(state: OfficeState, action: Action): OfficeState {
  switch (action.type) {
    case 'AGENTS_LOADED':
      return {
        ...state,
        isLoading: false,
        error: null,
        agents: action.agents.map(enrichAgent),
      }

    case 'AGENT_STATUS_UPDATED':
      return {
        ...state,
        agents: state.agents.map(a => {
          if (a.id !== action.agentId) return a
          const raw: RawAgent = {
            id: a.id,
            name: a.name,
            role: a.role,
            status: action.status,
            current_task: action.lastAction,
            progress: null,
            last_heartbeat: new Date().toISOString(),
            messages_count: 0,
          }
          return { ...enrichAgent(raw), speechText: a.speechText }
        }),
      }

    case 'AGENT_SPEECH':
      return {
        ...state,
        agents: state.agents.map(a =>
          a.id === action.agentId ? { ...a, speechText: action.text } : a,
        ),
      }

    case 'AGENT_SPEECH_CLEAR':
      return {
        ...state,
        agents: state.agents.map(a =>
          a.id === action.agentId ? { ...a, speechText: null } : a,
        ),
      }

    case 'USER_JOINED':
      return {
        ...state,
        users: [...state.users.filter(u => u.socketId !== action.user.socketId), action.user],
      }

    case 'USER_LEFT':
      return {
        ...state,
        users: state.users.filter(u => u.socketId !== action.socketId),
      }

    case 'USER_MOVED':
      return {
        ...state,
        users: state.users.map(u =>
          u.socketId === action.socketId ? { ...u, x: action.x, y: action.y } : u,
        ),
      }

    case 'FETCH_ERROR':
      return { ...state, isLoading: false, error: action.error }

    default:
      return state
  }
}

const INITIAL_STATE: OfficeState = {
  agents: [],
  users: [],
  isLoading: true,
  error: null,
}

// ─── Hook ───────────────────────────────────────────────────────────────────

const AGENTS_URL = 'http://localhost:3002/api/dashboard/agents'

export function useOfficeState(): OfficeState {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE)

  // Manter refs de timers de speech bubble por agente para cleanup
  const speechTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const scheduleSpeechClear = useCallback((agentId: string) => {
    const existing = speechTimers.current.get(agentId)
    if (existing) clearTimeout(existing)
    const timer = setTimeout(() => {
      dispatch({ type: 'AGENT_SPEECH_CLEAR', agentId })
      speechTimers.current.delete(agentId)
    }, 5000)
    speechTimers.current.set(agentId, timer)
  }, [])

  // ── Carga inicial via REST ───────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false

    fetch(AGENTS_URL)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json() as Promise<RawAgent[]>
      })
      .then(agents => {
        if (!cancelled) dispatch({ type: 'AGENTS_LOADED', agents })
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : String(err)
          dispatch({ type: 'FETCH_ERROR', error: msg })
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  // ── Socket events ────────────────────────────────────────────────────────
  useEffect(() => {
    const socket = getSocket()

    const onAgentStatus = (data: { agentId: string; status: string; lastAction: string }) => {
      dispatch({
        type: 'AGENT_STATUS_UPDATED',
        agentId: data.agentId,
        status: data.status,
        lastAction: data.lastAction ?? '',
      })
    }

    const onBusMessage = (data: {
      from: string
      payload?: { content?: string }
    }) => {
      const text = data.payload?.content ?? ''
      if (!text) return
      dispatch({ type: 'AGENT_SPEECH', agentId: data.from, text })
      scheduleSpeechClear(data.from)
    }

    const onUserJoined = (user: UserOfficeData) => {
      dispatch({ type: 'USER_JOINED', user })
    }

    const onUserLeft = (data: { socketId: string }) => {
      dispatch({ type: 'USER_LEFT', socketId: data.socketId })
    }

    const onUserMoved = (data: { socketId: string; x: number; y: number }) => {
      dispatch({ type: 'USER_MOVED', socketId: data.socketId, x: data.x, y: data.y })
    }

    socket.on('agent:status:updated', onAgentStatus)
    socket.on('bus:message', onBusMessage)
    socket.on('office:user:joined', onUserJoined)
    socket.on('office:user:left', onUserLeft)
    socket.on('office:user:moved', onUserMoved)

    return () => {
      socket.off('agent:status:updated', onAgentStatus)
      socket.off('bus:message', onBusMessage)
      socket.off('office:user:joined', onUserJoined)
      socket.off('office:user:left', onUserLeft)
      socket.off('office:user:moved', onUserMoved)
    }
  }, [scheduleSpeechClear])

  // ── Cleanup de timers ao desmontar ───────────────────────────────────────
  useEffect(() => {
    const timers = speechTimers.current
    return () => {
      for (const timer of timers.values()) {
        clearTimeout(timer)
      }
      timers.clear()
    }
  }, [])

  return state
}
