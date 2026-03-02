import { memo, useState, useEffect, useCallback, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { AgentOfficeData } from '../hooks/useOfficeState'
import { STATUS_COLOR, STATUS_LABEL } from '../constants/status'

interface AgentDetailPanelProps {
  agent: AgentOfficeData
  onClose: () => void
}

interface ChatMessage {
  id: string
  role: 'user' | 'agent'
  text: string
  timestamp: Date
}

const PANEL_VARIANTS = {
  hidden: { x: '100%', opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { type: 'spring' as const, damping: 20, stiffness: 200 } },
  exit: { x: '100%', opacity: 0, transition: { duration: 0.2 } },
}

const QUICK_MESSAGES = [
  'Qual sua task atual?',
  'Pause e aguarde',
  'Continue normalmente',
]

const CELEBRO_URL = 'http://localhost:3099/chat'

function formatTime(date: Date): string {
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export const AgentDetailPanel = memo(function AgentDetailPanel({
  agent,
  onClose,
}: AgentDetailPanelProps) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isSending, setIsSending] = useState(false)
  const [sendFeedback, setSendFeedback] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const color = agent.color
  const statusColor = STATUS_COLOR[agent.status as keyof typeof STATUS_COLOR] ?? '#6b7280'
  const statusLabel = STATUS_LABEL[agent.status as keyof typeof STATUS_LABEL] ?? agent.status

  // Fechar com Escape
  useEffect(() => {
    function onKey(e: globalThis.KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Focar input ao abrir
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Scroll para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isSending) return

      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        role: 'user',
        text: text.trim(),
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, userMsg])
      setInput('')
      setIsSending(true)
      setSendFeedback(null)

      try {
        const res = await fetch(CELEBRO_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text.trim(), context: 'office-view', agentHint: agent.id }),
        })

        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        const data = (await res.json()) as { response: string }
        const agentMsg: ChatMessage = {
          id: `a-${Date.now()}`,
          role: 'agent',
          text: data.response ?? 'OK',
          timestamp: new Date(),
        }
        setMessages(prev => [...prev, agentMsg])
        setSendFeedback('Mensagem enviada!')
      } catch {
        setSendFeedback('Erro ao enviar. Tente novamente.')
      } finally {
        setIsSending(false)
        setTimeout(() => setSendFeedback(null), 3000)
      }
    },
    [agent.id, isSending],
  )

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    void sendMessage(input)
  }

  return (
    <>
      {/* Overlay para fechar clicando fora */}
      <div
        aria-hidden="true"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 90,
        }}
      />

      {/* Painel */}
      <motion.aside
        role="complementary"
        aria-label={`Detalhes do agente ${agent.name}`}
        variants={PANEL_VARIANTS}
        initial="hidden"
        animate="visible"
        exit="exit"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 280,
          background: '#0d1117',
          borderLeft: `1px solid ${color}33`,
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'JetBrains Mono, monospace',
          boxShadow: `-8px 0 32px ${color}22`,
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '14px 16px 12px',
            borderBottom: `1px solid #1f2937`,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: color,
              boxShadow: `0 0 6px ${color}`,
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, color, fontWeight: 700 }}>{agent.name}</div>
            <div style={{ fontSize: 9, color: '#4b5563', letterSpacing: '0.08em' }}>
              {agent.role}
            </div>
          </div>
          <button
            aria-label="Fechar painel"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#4b5563',
              cursor: 'pointer',
              fontSize: 14,
              lineHeight: 1,
              padding: 4,
            }}
          >
            ✕
          </button>
        </div>

        {/* Status + Zona */}
        <div
          style={{
            padding: '10px 16px',
            borderBottom: '1px solid #1f2937',
            display: 'flex',
            gap: 16,
            fontSize: 10,
          }}
        >
          <div>
            <div style={{ color: '#4b5563', marginBottom: 2 }}>STATUS</div>
            <div style={{ color: statusColor, fontWeight: 700 }}>{statusLabel}</div>
          </div>
          <div>
            <div style={{ color: '#4b5563', marginBottom: 2 }}>ZONA</div>
            <div style={{ color: '#9ca3af' }}>{agent.zoneId}</div>
          </div>
        </div>

        {/* Task atual */}
        {agent.currentTask && (
          <div
            style={{
              padding: '10px 16px',
              borderBottom: '1px solid #1f2937',
              fontSize: 10,
            }}
          >
            <div style={{ color: '#4b5563', marginBottom: 4, letterSpacing: '0.08em' }}>
              TASK ATUAL
            </div>
            <div
              style={{
                color: '#d1d5db',
                lineHeight: 1.5,
                wordBreak: 'break-word',
              }}
            >
              {agent.currentTask}
            </div>
          </div>
        )}

        {/* Mensagens da sessão */}
        <div
          aria-label="histórico de mensagens"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '10px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {messages.length === 0 && (
            <div style={{ color: '#374151', fontSize: 10, textAlign: 'center', marginTop: 20 }}>
              nenhuma mensagem ainda
            </div>
          )}
          <AnimatePresence initial={false}>
            {messages.map(msg => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    maxWidth: '85%',
                    padding: '5px 9px',
                    borderRadius: msg.role === 'user' ? '8px 8px 2px 8px' : '8px 8px 8px 2px',
                    background: msg.role === 'user' ? `${color}22` : '#1f2937',
                    border: `1px solid ${msg.role === 'user' ? `${color}44` : '#374151'}`,
                    fontSize: 10,
                    color: msg.role === 'user' ? color : '#d1d5db',
                    wordBreak: 'break-word',
                    lineHeight: 1.5,
                  }}
                >
                  {msg.text}
                </div>
                <div style={{ fontSize: 8, color: '#374151', marginTop: 2 }}>
                  {formatTime(msg.timestamp)}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Quick messages */}
        <div
          style={{
            padding: '6px 16px 0',
            display: 'flex',
            gap: 4,
            flexWrap: 'wrap',
          }}
        >
          {QUICK_MESSAGES.map(q => (
            <button
              key={q}
              onClick={() => void sendMessage(q)}
              disabled={isSending}
              style={{
                background: 'none',
                border: `1px solid #1f2937`,
                borderRadius: 4,
                color: '#4b5563',
                fontSize: 9,
                padding: '3px 7px',
                cursor: 'pointer',
                fontFamily: 'JetBrains Mono, monospace',
                transition: 'border-color 0.15s, color 0.15s',
              }}
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          style={{
            padding: '8px 16px 14px',
            display: 'flex',
            gap: 8,
            borderTop: '1px solid #1f2937',
            marginTop: 6,
          }}
        >
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="mensagem para o agente..."
            disabled={isSending}
            aria-label="mensagem para o agente"
            style={{
              flex: 1,
              background: '#161b22',
              border: `1px solid #1f2937`,
              borderRadius: 4,
              color: '#d1d5db',
              fontSize: 10,
              padding: '5px 8px',
              fontFamily: 'JetBrains Mono, monospace',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={isSending || !input.trim()}
            aria-label="enviar mensagem"
            style={{
              background: input.trim() && !isSending ? `${color}22` : '#1f2937',
              border: `1px solid ${input.trim() && !isSending ? `${color}44` : '#374151'}`,
              borderRadius: 4,
              color: input.trim() && !isSending ? color : '#4b5563',
              fontSize: 10,
              padding: '5px 10px',
              cursor: input.trim() && !isSending ? 'pointer' : 'not-allowed',
              fontFamily: 'JetBrains Mono, monospace',
              transition: 'all 0.15s',
            }}
          >
            {isSending ? '...' : 'send'}
          </button>
        </form>

        {/* Feedback de envio */}
        <AnimatePresence>
          {sendFeedback && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'absolute',
                bottom: 60,
                left: 16,
                right: 16,
                padding: '4px 10px',
                background: sendFeedback.startsWith('Erro') ? '#7f1d1d' : '#14532d',
                border: `1px solid ${sendFeedback.startsWith('Erro') ? '#991b1b' : '#166534'}`,
                borderRadius: 4,
                fontSize: 10,
                color: sendFeedback.startsWith('Erro') ? '#fca5a5' : '#86efac',
                textAlign: 'center',
              }}
            >
              {sendFeedback}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.aside>
    </>
  )
})
