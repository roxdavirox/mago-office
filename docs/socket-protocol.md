# Socket Protocol

## Eventos de Office (novos)

### Cliente → Servidor

| Evento | Payload | Descrição |
|--------|---------|-----------|
| `office:join` | `{ userId: string, name: string }` | Usuário entra na Office View |
| `office:user:move` | `{ x: number, y: number }` | Usuário move seu avatar (0-100%) |
| `office:leave` | _(sem payload)_ | Usuário sai da Office View |

### Servidor → Cliente

| Evento | Payload | Descrição |
|--------|---------|-----------|
| `office:state` | `{ agents: Agent[], users: User[] }` | Snapshot inicial (emitido ao `office:join`) |
| `office:user:joined` | `{ socketId, userId, name, x, y }` | Novo usuário entrou |
| `office:user:left` | `{ socketId }` | Usuário saiu |
| `office:user:moved` | `{ socketId, x, y }` | Usuário moveu avatar |

## Eventos existentes (reutilizados)

| Evento | Quem emite | Uso na Office View |
|--------|-----------|-------------------|
| `agent:status:updated` | Backend | Atualiza zona do agente |
| `bus:message` | Backend | Dispara SpeechBubble |
| `board:item:moved` | Backend | Indicador de trabalho |

## Schemas completos

```typescript
// office:state (payload)
interface OfficeStatePayload {
  agents: Array<{
    id: string           // 'rx-agent-1'
    name: string         // 'Agent 1'
    role: string         // 'code-reviewer'
    status: string       // 'working' | 'idle' | 'blocked' | 'offline'
    lastAction: string   // 'Moving task #47 to Done'
    zone: string         // 'dev-zone'
    color: string        // '#8b5cf6'
  }>
  users: Array<{
    socketId: string
    userId: string
    name: string
    x: number           // 0-100 (% do canvas)
    y: number           // 0-100
    joinedAt: string    // ISO timestamp
  }>
}

// agent:status:updated (payload existente)
interface AgentStatusEvent {
  agentId: string
  status: string
  lastAction: string
  timestamp: string
}

// bus:message (payload existente)
interface BusMessage {
  from: string
  type: string
  payload: { content?: string; [key: string]: unknown }
  timestamp: string
}
```

## Validações no servidor

- `x` e `y` devem ser números entre 0 e 100
- Rate limit: 1 evento `office:user:move` por 50ms por socket
- Máximo de 50 usuários simultâneos na room `office:view`
- Cleanup automático de usuário ao `disconnect`

## Exemplo de implementação (backend)

```typescript
// index.ts
const officeUsers = new Map<string, OfficeUser>()

socket.on('office:join', ({ userId, name }) => {
  socket.join('office:view')
  const user = { socketId: socket.id, userId, name, x: 50, y: 88, joinedAt: new Date() }
  officeUsers.set(socket.id, user)
  
  // Snapshot para o novo usuário
  socket.emit('office:state', {
    agents: await getAgentStates(),
    users: Array.from(officeUsers.values())
  })
  
  // Broadcast para os outros
  socket.to('office:view').emit('office:user:joined', user)
})

socket.on('office:user:move', ({ x, y }) => {
  if (x < 0 || x > 100 || y < 0 || y > 100) return
  const user = officeUsers.get(socket.id)
  if (!user) return
  user.x = x
  user.y = y
  socket.to('office:view').emit('office:user:moved', { socketId: socket.id, x, y })
})

socket.on('office:leave', () => {
  socket.leave('office:view')
  officeUsers.delete(socket.id)
  io.to('office:view').emit('office:user:left', { socketId: socket.id })
})

socket.on('disconnect', () => {
  if (officeUsers.has(socket.id)) {
    officeUsers.delete(socket.id)
    io.to('office:view').emit('office:user:left', { socketId: socket.id })
  }
})
```
