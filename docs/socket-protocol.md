# Socket Protocol

Conexão: `ws://localhost:3002` via `socket.io-client`.
O socket usa `autoConnect: false` — conectado manualmente via `connectSocket()` ao montar.

## Eventos consumidos (Backend → Cliente)

| Evento | Payload | Uso |
|--------|---------|-----|
| `agent:status:updated` | `{ agentId, status, lastAction, timestamp }` | Recalcula zona do agente |
| `bus:message` | `{ from, type, payload: { content? }, timestamp }` | Dispara SpeechBubble no agente sender |
| `office:user:joined` | `{ socketId, userId, name, x, y }` | Adiciona avatar humano |
| `office:user:left` | `{ socketId }` | Remove avatar humano |
| `office:user:moved` | `{ socketId, x, y }` | Anima avatar humano para nova posição |

## Eventos emitidos (Cliente → Backend)

| Evento | Payload | Quando |
|--------|---------|--------|
| `office:join` | `{ userId: string, name: string }` | Ao montar a Office View |
| `office:leave` | _(sem payload)_ | Ao desmontar / fechar aba |
| `office:user:move` | `{ x: number, y: number }` | `onDragEnd` do HumanAvatar |

## Schemas TypeScript

```typescript
// agent:status:updated
interface AgentStatusUpdated {
  agentId: string
  status: string
  lastAction: string   // equivalente a current_task na REST API
  timestamp: string
}

// bus:message
interface BusMessage {
  from: string
  type: string
  payload: { content?: string; [key: string]: unknown }
  timestamp: string
}

// office:user:joined / office:user:moved
interface OfficeUserJoined {
  socketId: string
  userId: string
  name: string
  x: number   // 0–100 (% do canvas)
  y: number
  joinedAt?: string
}

interface OfficeUserMoved {
  socketId: string
  x: number
  y: number
}

interface OfficeUserLeft {
  socketId: string
}
```

## Notas de implementação

- Rate limit sugerido: 1 evento `office:user:move` por 50ms por socket
- `x` e `y` devem estar entre 0 e 100
- Cleanup no unmount: `socket.emit('office:leave')` + remover listeners
- Não usar `socket.disconnect()` no unmount — a instância é singleton reutilizada
