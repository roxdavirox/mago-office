# Architecture Overview

## Visão geral

O `mago-office` é um **app React standalone** que consome o backend MAGO como cliente externo via Socket.io e REST. Não modifica o MAGO.

## Diagrama

```
┌──────────────────────────────────────────────┐
│           mago-office (standalone)            │
│                                              │
│  React 19 + Vite 6   →  office.iae.wtf       │
│                                              │
│  App.tsx                                     │
│   └── OfficeCanvas.tsx         [v0.2 ✓]      │
│        ├── OfficeRoom.tsx × 6  [v0.2 ✓]      │
│        │    ├── AgentAvatar.tsx         [wip] │
│        │    │    └── SpeechBubble.tsx   [wip] │
│        │    └── HumanAvatar.tsx (drag)  [v0.4]│
│        ├── OfficeHUD.tsx        [v0.2 ✓]      │
│        └── AgentDetailPanel.tsx         [v0.5]│
│                                              │
│  hooks/                                      │
│   ├── useSocket.ts       [v0.1 ✓]            │
│   └── useOfficeState.ts                [wip] │
│                                              │
│  data/office-layout.ts   [v0.2 ✓]            │
│   ├── OFFICE_ZONES (6 zonas)                 │
│   ├── getAgentZone(status, current_task)      │
│   └── getAgentPosition(zoneId, agentIndex)    │
│                                              │
│  constants/status.ts     [v0.2 ✓]            │
└──────────────────┬───────────────────────────┘
                   │  socket.io-client (autoConnect:false)
                   │  fetch REST
                   ▼
┌──────────────────────────────────────────────┐
│     MAGO Backend (localhost:3002)             │
│                                              │
│  REST endpoints consumidos:                  │
│  • GET /api/dashboard/agents                 │
│                                              │
│  Eventos socket emitidos pelo backend:       │
│  • agent:status:updated                      │
│  • bus:message                               │
│                                              │
│  Eventos socket de presença humana:          │
│  • office:user:joined / moved / left         │
└──────────────────────────────────────────────┘
```

## Shape real do agente (GET /api/dashboard/agents)

```typescript
interface Agent {
  id: string           // 'rx-backend' | 'rx-architect' | 'rx-orchestrator'
  name: string         // 'Backend' | 'Architect' | 'Orchestrator'
  role: string         // 'backend' | 'architect' | 'orchestrator'
  status: string       // 'idle' | 'working' | 'thinking' | 'offline' | 'blocked'
  current_task: string // ex: 'Aguardando próximo ciclo' (equivalente a lastAction)
  progress: number | null
  last_heartbeat: string
  messages_count: number
}
```

> **Nota:** o campo `lastAction` mencionado em issues anteriores corresponde ao `current_task` da API real.

## Mapeamento de zona

`getAgentZone(status, current_task)` em `src/data/office-layout.ts`:

| status | current_task | zona |
|--------|-------------|------|
| `idle` | qualquer | `coffee-corner` |
| `offline` / `blocked` | qualquer | `lobby` |
| null / undefined | qualquer | `lobby` |
| `working` / `thinking` | inclui "review" / "revisando" / "aprovando" | `review-room` |
| `working` / `thinking` | inclui "plan" / "task" / "sprint" / "backlog" | `planning-board` |
| `working` / `thinking` | inclui "analyz" / "analis" / "inspect" / "debug" | `analysis-area` |
| `working` / `thinking` | outros | `dev-zone` |

## Posicionamento anti-sobreposição

`getAgentPosition(zoneId, agentIndex)` retorna `{ x, y }` em % do canvas:

- Índice 0 (rx-architect / Claude): offset `{ x:25%, y:40% }` dentro da zona
- Índice 1 (rx-backend / Gemini): offset `{ x:50%, y:40% }`
- Índice 2 (rx-orchestrator / OpenCode): offset `{ x:75%, y:40% }`

## Fluxo de dados — carga inicial

```
App monta
  → useOfficeState
  → GET /api/dashboard/agents
  → para cada agente: getAgentZone(status, current_task) → zoneId
  → getAgentPosition(zoneId, agentIndex) → { x, y }
  → renderiza AgentAvatar na posição calculada
```

## Fluxo de dados — atualização em tempo real

```
MAGO agent muda estado
  → backend emite agent:status:updated { agentId, status, lastAction }
  → useOfficeState recebe
  → recalcula zona
  → AgentAvatar anima para nova posição (Framer Motion layoutId)
```

## Fluxo de dados — presença humana

```
Usuário abre office.iae.wtf
  → socket conecta → emite office:join { userId, name }
  → backend broadcast office:user:joined para outros clientes
  → usuário arrasta HumanAvatar
  → onDragEnd emite office:user:move { x, y }
  → outros recebem office:user:moved e animam
```

## Estrutura de arquivos

```
mago-office/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── services/socket.ts            ← singleton, autoConnect:false
│   ├── data/office-layout.ts         ← zonas + lógica de posicionamento
│   ├── hooks/
│   │   ├── useSocket.ts              ← 5 estados de conexão
│   │   └── useOfficeState.ts         ← estado central [wip]
│   ├── components/
│   │   ├── OfficeCanvas.tsx          ← canvas full-screen
│   │   ├── OfficeRoom.tsx            ← zona individual
│   │   ├── OfficeHUD.tsx             ← status bar
│   │   ├── AgentAvatar.tsx           ← [wip]
│   │   ├── SpeechBubble.tsx          ← [wip]
│   │   ├── HumanAvatar.tsx           ← [v0.4]
│   │   └── AgentDetailPanel.tsx      ← [v0.5]
│   └── constants/
│       └── status.ts                 ← STATUS_COLOR, STATUS_LABEL
├── .github/workflows/
│   ├── ci.yml                        ← typecheck + lint + test + build
│   ├── deploy.yml                    ← push main → SSH → pnpm build
│   └── ai-review.yml                 ← self-hosted runner, OpenCode
└── scripts/
    ├── branch-create.sh
    ├── pr-create.sh
    ├── pr-check.sh
    ├── pr-merge.sh
    └── pr-review.sh
```

## Deploy

- **URL**: https://office.iae.wtf
- **VPS**: `/home/rx/lab/mago-office/dist/`
- **Trigger**: push em `main` → GitHub Actions → SSH → `pnpm build` → nginx
- **Nginx**: serve `dist/` com `try_files $uri /index.html` (SPA)
- **Runner CI**: self-hosted `vps-mago-office` em `/home/rx/actions-runner-mago-office/`
