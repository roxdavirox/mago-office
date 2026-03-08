import { useEffect, useReducer, useCallback, useRef, useState } from 'react'
import { fetchAgents } from '../services/agents'
import { getSocket } from '../services/socket'
import type {
  AgentStatus as SocketAgentStatus,
  BusMessage as SocketBusMessage,
  OfficeUser,
} from '../services/socket'
import { getAgentZone, getAgentPosition, getAgentColor, AGENT_COLORS } from '../data/office-layout'
import { MOCK_AGENTS } from '../data/mock-agents'
import { type Option, Some, None, fromNullable, unwrapOptionOr } from '@roxdavirox/fp-core/option'
import { isString, isNotEmpty } from '@roxdavirox/fp-core/predicates'

const IS_MOCK_MODE = import.meta.env.VITE_MOCK_MODE === 'true'

// ─── Types ──────────────────────────────────────────────────────────────────

/** Real shape of the GET /api/dashboard/agents API */
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

/** Agent enriched with calculated position data */
export interface AgentOfficeData {
  id: string
  name: string
  role: string
  status: string
  /** current_task from the API — equivalent to lastAction */
  currentTask: string
  zoneId: string
  /** Absolute position as % of the canvas */
  position: { x: number; y: number }
  color: string
  /** Current SpeechBubble text (None = hidden) */
  speechText: Option<string>
  /** True when position was manually overridden by drag (visual only) */
  isManualOverride: boolean
}

export interface UserOfficeData {
  socketId: string
  userId: string
  name: string
  x: number
  y: number
}

/** A manual zone override for a single agent */
export interface ZoneOverride {
  /** Canvas-relative X position in % */
  x: number
  /** Canvas-relative Y position in % */
  y: number
  zoneId: string
}

export interface OfficeState {
  agents: AgentOfficeData[]
  users: UserOfficeData[]
  isLoading: boolean
  error: string | null
  /** Manual position overrides by agentId — cleared on next agent:status:updated */
  overrides: Record<string, ZoneOverride>
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const AGENT_IDS_ORDERED = Object.keys(AGENT_COLORS) // ['rx-architect', 'rx-backend', 'rx-orchestrator']

/**
 * Determines the stable agent index for anti-overlap offset calculation.
 * Uses the id position in the ordered list; unknown ids go to the end.
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
    speechText: None,
    isManualOverride: false,
  }
}

// ─── Reducer ────────────────────────────────────────────────────────────────

type Action =
  | { type: 'FETCH_START' }
  | { type: 'AGENTS_LOADED'; agents: RawAgent[] }
  | { type: 'AGENT_STATUS_UPDATED'; agentId: string; status: string; lastAction: string }
  | { type: 'AGENT_SPEECH'; agentId: string; text: string }
  | { type: 'AGENT_SPEECH_CLEAR'; agentId: string }
  | { type: 'AGENT_ZONE_OVERRIDE'; agentId: string; override: ZoneOverride }
  | { type: 'AGENT_ZONE_CLEAR_OVERRIDE'; agentId: string }
  | { type: 'USER_JOINED'; user: OfficeUser }
  | { type: 'USER_LEFT'; socketId: string }
  | { type: 'USER_MOVED'; socketId: string; x: number; y: number }
  | { type: 'FETCH_ERROR'; error: string }

function reducer(state: OfficeState, action: Action): OfficeState {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, isLoading: true, error: null }

    case 'AGENTS_LOADED':
      return {
        ...state,
        isLoading: false,
        error: null,
        agents: action.agents.map(enrichAgent),
      }

    case 'AGENT_STATUS_UPDATED': {
      // Clear any manual override for this agent — backend has the real zone now
      const overrides = { ...state.overrides }
      delete overrides[action.agentId]

      return {
        ...state,
        overrides,
        agents: state.agents.map((a) => {
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
    }

    case 'AGENT_SPEECH':
      return {
        ...state,
        agents: state.agents.map((a) =>
          a.id === action.agentId ? { ...a, speechText: Some(action.text) } : a
        ),
      }

    case 'AGENT_SPEECH_CLEAR':
      return {
        ...state,
        agents: state.agents.map((a) => (a.id === action.agentId ? { ...a, speechText: None } : a)),
      }

    case 'AGENT_ZONE_OVERRIDE':
      return {
        ...state,
        overrides: { ...state.overrides, [action.agentId]: action.override },
      }

    case 'AGENT_ZONE_CLEAR_OVERRIDE': {
      const overrides = { ...state.overrides }
      delete overrides[action.agentId]
      return { ...state, overrides }
    }

    case 'USER_JOINED':
      return {
        ...state,
        users: [...state.users.filter((u) => u.socketId !== action.user.socketId), action.user],
      }

    case 'USER_LEFT':
      return {
        ...state,
        users: state.users.filter((u) => u.socketId !== action.socketId),
      }

    case 'USER_MOVED':
      return {
        ...state,
        users: state.users.map((u) =>
          u.socketId === action.socketId ? { ...u, x: action.x, y: action.y } : u
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
  overrides: {},
}

// ─── Hook ───────────────────────────────────────────────────────────────────


export interface UseOfficeStateReturn extends Omit<OfficeState, 'overrides'> {
  /** Apply a manual position override for an agent (drag-and-drop) */
  setZoneOverride: (agentId: string, override: ZoneOverride) => void
  /** Remove a manual override, restoring the auto-computed position */
  clearZoneOverride: (agentId: string) => void
  /** Re-trigger the agents REST fetch (clears error and sets isLoading) */
  retry: () => void
}

export function useOfficeState(): UseOfficeStateReturn {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE)
  // retryKey é incrementado pelo botão "Retry" da UI para re-disparar o fetch
  const [retryKey, setRetryKey] = useState(0)

  // Keep refs of speech bubble timers per agent for cleanup
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

  const setZoneOverride = useCallback((agentId: string, override: ZoneOverride) => {
    dispatch({ type: 'AGENT_ZONE_OVERRIDE', agentId, override })
  }, [])

  const clearZoneOverride = useCallback((agentId: string) => {
    dispatch({ type: 'AGENT_ZONE_CLEAR_OVERRIDE', agentId })
  }, [])

  // retry manual — usado pelo botão da UI; fetchAgents já faz 3 tentativas automáticas
  const retry = useCallback(() => {
    setRetryKey((k) => k + 1)
  }, [])

  // ── Initial load via REST (or mock) ─────────────────────────────────────
  // fetchAgents já faz retry automático (3×, backoff 2×) e timeout de 8s (#116)
  useEffect(() => {
    if (IS_MOCK_MODE) {
      dispatch({ type: 'AGENTS_LOADED', agents: MOCK_AGENTS })
      return
    }

    const controller = new AbortController()

    dispatch({ type: 'FETCH_START' })

    fetchAgents(controller.signal)
      .then((result) => {
        if (result.ok) dispatch({ type: 'AGENTS_LOADED', agents: result.value })
        else dispatch({ type: 'FETCH_ERROR', error: result.error })
      })
      .catch(() => {
        // AbortError — cancelamento intencional, ignorar
      })

    return () => {
      controller.abort()
    }
  }, [retryKey])

  // ── Socket events ───────────────────────────────────────────────────────
  useEffect(() => {
    if (IS_MOCK_MODE) return

    const socket = getSocket()

    const onAgentStatus = (data: SocketAgentStatus) => {
      dispatch({
        type: 'AGENT_STATUS_UPDATED',
        agentId: data.agentId,
        status: data.status,
        lastAction: unwrapOptionOr('')(fromNullable(data.lastAction ?? data.currentTask)),
      })
    }

    const onBusMessage = (data: SocketBusMessage) => {
      const content = data.payload['content']
      if (!isString(content) || !isNotEmpty(content)) return
      dispatch({ type: 'AGENT_SPEECH', agentId: data.from, text: content })
      scheduleSpeechClear(data.from)
    }

    const onUserJoined = (user: OfficeUser) => {
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

  // ── Timer cleanup on unmount ─────────────────────────────────────────────
  useEffect(() => {
    const timers = speechTimers.current
    return () => {
      for (const timer of timers.values()) {
        clearTimeout(timer)
      }
      timers.clear()
    }
  }, [])

  // Apply overrides to agent positions before returning
  const agents = state.agents.map((a) => {
    const ov = state.overrides[a.id]
    if (!ov) return a
    return {
      ...a,
      position: { x: ov.x, y: ov.y },
      zoneId: ov.zoneId,
      isManualOverride: true,
    }
  })

  return {
    agents,
    users: state.users,
    isLoading: state.isLoading,
    error: state.error,
    setZoneOverride,
    clearZoneOverride,
    retry,
  }
}
