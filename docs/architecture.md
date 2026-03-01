# Architecture Overview

## Diagrama completo

```
┌─────────────────────────────────────────────────────────────┐
│                     MAGO Platform                           │
│                                                             │
│  ┌─────────────────────┐   ┌──────────────────────────┐   │
│  │   Flowday Web       │   │   Flowday Backend        │   │
│  │   (React 19 + Vite) │   │   (Express + Socket.io)  │   │
│  │                     │   │                          │   │
│  │  /app/office ───────┼───┼─→ GET /office/state      │   │
│  │   OfficePage        │   │   office:join            │   │
│  │   OfficeCanvas      │◄──┼───office:user:joined     │   │
│  │   AgentAvatar       │   │   office:user:moved      │   │
│  │   HumanAvatar       │───┼──►office:user:move       │   │
│  │   AgentDetailPanel  │   │                          │   │
│  └─────────────────────┘   └──────────┬───────────────┘   │
│                                        │                    │
│  ┌─────────────────────────────────────▼──────────────┐   │
│  │                MAGO Agents                          │   │
│  │                                                     │   │
│  │  agent-1 (Claude)    ──► agent:status:updated      │   │
│  │  agent-2 (Gemini)    ──► bus:message               │   │
│  │  agent-3 (OpenCode)  ──► board:item:moved          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐   │
│  │ Celebro      │  │ Flowday DB   │  │ Redis          │   │
│  │ Gateway:3099 │  │ (SQLite)     │  │ (Message Bus)  │   │
│  └──────────────┘  └──────────────┘  └────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Fluxo de dados

### Carga inicial da Office View
1. Usuário navega para `/app/office`
2. `useOfficeState` hook monta e chama `GET /api/office/state`
3. Backend retorna snapshot: agentes (do DB) + usuários online (in-memory)
4. Socket emite `office:join` com userId e nome
5. Backend adiciona usuário ao `officeState.users` Map
6. Backend broadcast `office:user:joined` para room `office:view`

### Atualização de agente em tempo real
1. MAGO agent-3 termina uma tarefa → `PATCH /api/items/:id/move`
2. Board service dispara `boardEvents.emit('item:moved', ...)`
3. Socket.io emite `board:item:moved` para todos os clientes
4. `useOfficeState` recebe `agent:status:updated`
5. `getAgentZone(status, lastAction)` calcula nova zona
6. `AgentAvatar` anima transição de posição (Framer Motion layout)

### Movimentação de usuário humano
1. Usuário arrasta `HumanAvatar` no canvas
2. `onDragEnd` calcula nova posição em %
3. `socket.emit('office:user:move', { x, y })`
4. Backend atualiza Map e broadcast `office:user:moved`
5. Outros clientes recebem e animam avatar do usuário

## Estrutura de arquivos (Office View)

```
apps/
├── flowday-backend/src/
│   ├── index.ts                    ← +socket events office:*
│   └── routes/office.routes.ts     ← GET /office/state
│
└── flowday-web/src/pages/office/
    ├── OfficePage.tsx              ← page principal
    ├── OfficeCanvas.tsx            ← container 2D
    ├── data/
    │   └── office-layout.ts        ← zonas + getAgentZone()
    ├── hooks/
    │   └── useOfficeState.ts       ← estado central
    └── components/
        ├── OfficeRoom.tsx          ← zona visual
        ├── AgentAvatar.tsx         ← avatar agente IA
        ├── HumanAvatar.tsx         ← avatar humano (draggable)
        ├── SpeechBubble.tsx        ← balão de atividade
        └── AgentDetailPanel.tsx    ← painel de detalhes
```
