# Agent Avatar States

## Estados e Animações

| Status     | Zona padrão        | Animação (inner)                             | Badge                  |
| ---------- | ------------------ | -------------------------------------------- | ---------------------- |
| `idle`     | Coffee Corner      | Bob vertical `y [0, -4, 0]` repeat 2s        | cinza `#6b7280`        |
| `working`  | Dev Zone (default) | Pulse `scale [1, 1.06, 1]` repeat 0.8s       | verde `#00ff41`        |
| `thinking` | Dev Zone (default) | Pulse suave `scale [1, 1.04, 1]` repeat 1.2s | âmbar `#f59e0b`        |
| `blocked`  | Lobby              | Shake `x [-2, 2, -2, 2, 0]` 0.4s             | vermelho `#ef4444`     |
| `offline`  | Lobby              | Nenhuma                                      | cinza escuro `#374151` |

Além da animação inner, quando o agente é **dropped fora de uma zona** durante drag, uma animação de shake outer é disparada:

```
x: [-6, 6, -6, 6, -3, 3, 0]  duration: 0.4s
```

## Framer Motion — implementação real

```typescript
// src/components/AgentAvatar.tsx

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
```

## Layout Animation (mudança de zona)

Ao receber `agent:status:updated`, o agente migra suavemente para a nova zona via `layoutId`:

```typescript
// AgentAvatar.tsx
<motion.div
  layoutId={`agent-${agent.id}`}
  style={{ position: 'absolute', left: `${agent.position.x}%`, top: `${agent.position.y}%` }}
  // ...
>
```

## Override manual de zona (drag)

O usuário pode arrastar qualquer agente para outra zona:

```
[drag] → onDragEnd → zona válida → isManualOverride=true
  → badge ⚓ aparece (aria-label="manual override")
  → botão "reset ↺" aparece
  → próximo agent:status:updated → override removido automaticamente
  → click em "reset ↺" → clearZoneOverride(agentId)
```

## Identidade Visual

```
     ┌──────────────────────┐
     │  [Tooltip ao hover]  │  ← AvatarTooltip (role/status/task/zone)
     └──────────────────────┘

  ┌─────────────────────┐
  │   "Analyzing..."    │  ← SpeechBubble (auto-dismiss 5s)
  └────────┬────────────┘

       ⚓   ← anchor badge (isManualOverride)
  ┌────────┐
  │   🤖   │  ← ícone do role
  │ #8b5cf6│  ← cor do agente
  └────────┘
      ●     ← status badge (cor por status)
   rx-arch  ← nome do agente

  [reset ↺] ← botão reset (isManualOverride)
```

## Agentes — identidade

| Agente   | ID real           | Role         | Ícone | Cor               |
| -------- | ----------------- | ------------ | ----- | ----------------- |
| Claude   | `rx-architect`    | architect    | 🤖    | `#8b5cf6` (roxo)  |
| Gemini   | `rx-backend`      | backend      | 🔬    | `#10b981` (verde) |
| OpenCode | `rx-orchestrator` | orchestrator | ⚡    | `#f59e0b` (âmbar) |

## SpeechBubble

Aparece por **5 segundos** quando `bus:message` é recebido:

```
     ┌──────────────────────────────┐
     │  Implementing feature X...   │  ← payload.content (truncado)
     └──────────────┬───────────────┘
                    ▼
                 [Avatar]
```

- Acionado pelo evento socket `bus:message { from, payload: { content } }`
- Timer reiniciado a cada nova mensagem do mesmo agente
- `speechText` volta a `null` após 5s via `AGENT_SPEECH_CLEAR`
