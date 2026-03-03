# Socket Protocol

Conexão: `ws://localhost:3002` via `socket.io-client`.

O socket usa `autoConnect: false` — conectado manualmente via `connectSocket()` ao montar o app. A instância é um **singleton** reutilizado por toda a aplicação (`src/services/socket.ts`).

## Eventos consumidos (Backend → Cliente)

| Evento                 | Payload                                                    | Handler em                                   |
| ---------------------- | ---------------------------------------------------------- | -------------------------------------------- |
| `agent:status:updated` | `{ agentId, status, lastAction, currentTask?, timestamp }` | `useOfficeState` → `AGENT_STATUS_UPDATED`    |
| `bus:message`          | `{ from, type, payload: { content? }, timestamp }`         | `useOfficeState` → `AGENT_SPEECH` + timer 5s |
| `office:user:joined`   | `{ socketId, userId, name, x, y }`                         | `useOfficeState` → `USER_JOINED`             |
| `office:user:left`     | `{ socketId }`                                             | `useOfficeState` → `USER_LEFT`               |
| `office:user:moved`    | `{ socketId, x, y }`                                       | `useOfficeState` → `USER_MOVED`              |

## Eventos emitidos (Cliente → Backend)

| Evento             | Payload                            | Quando                                      |
| ------------------ | ---------------------------------- | ------------------------------------------- |
| `office:join`      | `{ userId: string, name: string }` | Ao montar a Office View                     |
| `office:leave`     | _(sem payload)_                    | Ao desmontar / fechar aba                   |
| `office:user:move` | `{ x: number, y: number }`         | `onDragEnd` do HumanAvatar (debounce 100ms) |

## Schemas TypeScript

```typescript
// src/services/socket.ts

export interface AgentStatus {
  agentId: string
  status: string
  lastAction?: string
  currentTask?: string // fallback se lastAction não vier
  timestamp?: string
}

export interface BusMessage {
  from: string
  type?: string
  payload: { content?: string; [key: string]: unknown }
  timestamp?: string
}

export interface OfficeUser {
  socketId: string
  userId: string
  name: string
  x: number // 0–100 (% do canvas)
  y: number // 0–100 (% do canvas)
}
```

## Estados de conexão (`useSocket`)

```typescript
// src/hooks/useSocket.ts
type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'error'
```

Exibidos pelo `OfficeHUD` com indicador colorido e texto.

## Notas de implementação

- `x` e `y` estão sempre entre 0 e 100 (% do canvas)
- Debounce de 100ms no `office:user:move` para evitar flood de eventos
- Cleanup no unmount: remover todos os listeners via `socket.off()`
- **Não chamar** `socket.disconnect()` no unmount — a instância é singleton
- `lastAction` no evento de socket corresponde a `current_task` da REST API
- Ao receber `agent:status:updated`, qualquer override manual desse agente é removido
