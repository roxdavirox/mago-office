# Architecture Overview

## Visão geral

O `mago-office` é um **app React standalone** que consome o backend MAGO como cliente externo via Socket.io e REST. Não modifica o MAGO.

## Diagrama

```
┌──────────────────────────────────────────────────────────┐
│              mago-office (standalone)                     │
│                                                          │
│  React 19 + Vite 6   →  office.iae.wtf                   │
│                                                          │
│  main.tsx                                                │
│   └── ErrorBoundary                                      │
│        └── App.tsx                                       │
│             ├── OfficeCanvas                             │
│             │    ├── OfficeRoom × 6                      │
│             │    ├── AgentAvatar × N                     │
│             │    │    ├── SpeechBubble                   │
│             │    │    └── AvatarTooltip                  │
│             │    ├── HumanAvatar × N (drag)              │
│             │    ├── OfficeHUD                           │
│             │    └── OfficeOverlay (loading/error)       │
│             ├── OnlineUsersList                          │
│             └── AgentDetailPanel (slide-in)              │
│                                                          │
│  hooks/                                                  │
│   ├── useSocket.ts        — 5 estados de conexão         │
│   └── useOfficeState.ts   — REST + socket + overrides    │
│                                                          │
│  data/office-layout.ts                                   │
│   ├── OFFICE_ZONES (6 zonas)                             │
│   ├── getAgentZone(status, current_task) → zoneId        │
│   └── getAgentPosition(zoneId, agentIndex) → {x,y}      │
│                                                          │
│  constants/                                              │
│   ├── agent.ts   — AGENT_COLORS, AGENT_STATUS_LABEL      │
│   ├── status.ts  — STATUS_COLOR                          │
│   └── theme.ts   — COLORS (dark theme)                   │
└──────────────────────┬───────────────────────────────────┘
                       │  socket.io-client (autoConnect:false)
                       │  fetch REST
                       ▼
┌──────────────────────────────────────────────────────────┐
│     MAGO Backend (localhost:3002)                         │
│                                                          │
│  REST:                                                   │
│  • GET /api/dashboard/agents                             │
│                                                          │
│  Socket → cliente:                                       │
│  • agent:status:updated                                  │
│  • bus:message                                           │
│  • office:user:joined / moved / left                     │
│                                                          │
│  Socket ← cliente:                                       │
│  • office:join / office:leave / office:user:move         │
└──────────────────────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│     Celebro (localhost:3099)                              │
│  • POST /chat  — mensagens do AgentDetailPanel           │
└──────────────────────────────────────────────────────────┘
```

## Shape real do agente (GET /api/dashboard/agents)

```typescript
// src/hooks/useOfficeState.ts
interface RawAgent {
  id: string // 'rx-architect' | 'rx-backend' | 'rx-orchestrator'
  name: string
  role: string // 'architect' | 'backend' | 'orchestrator'
  status: string // 'idle' | 'working' | 'thinking' | 'offline' | 'blocked'
  current_task: string // equivalente a lastAction nos eventos de socket
  progress: number | null
  last_heartbeat: string
  messages_count: number
}

// Enriquecido pelo hook
interface AgentOfficeData {
  id: string
  name: string
  role: string
  status: string
  currentTask: string
  zoneId: string
  position: { x: number; y: number } // % do canvas
  color: string
  speechText: string | null
  isManualOverride: boolean // true após drag manual
}
```

## Mapeamento status/current_task → zona

`getAgentZone(status, current_task)` em `src/data/office-layout.ts`:

| status                 | current_task                                     | zona             |
| ---------------------- | ------------------------------------------------ | ---------------- |
| `idle`                 | qualquer                                         | `coffee-corner`  |
| `offline` / `blocked`  | qualquer                                         | `lobby`          |
| `null` / `undefined`   | qualquer                                         | `lobby`          |
| `working` / `thinking` | inclui "review" / "revisando" / "aprovando"      | `review-room`    |
| `working` / `thinking` | inclui "plan" / "task" / "sprint" / "backlog"    | `planning-board` |
| `working` / `thinking` | inclui "analyz" / "analis" / "inspect" / "debug" | `analysis-area`  |
| `working` / `thinking` | outros                                           | `dev-zone`       |

## Posicionamento anti-sobreposição

`getAgentPosition(zoneId, agentIndex)` retorna `{ x, y }` em % do canvas:

- Índice 0 (`rx-architect`): offset `{ x:25%, y:40% }` dentro da zona
- Índice 1 (`rx-backend`): offset `{ x:50%, y:40% }`
- Índice 2 (`rx-orchestrator`): offset `{ x:75%, y:40% }`

## Override manual de zona (drag)

O usuário pode arrastar um `AgentAvatar` para qualquer zona do canvas:

```
Drag do agente
  → onDragEnd → detecta zona pelo ponto de soltura
  → (zona válida) → dispatch AGENT_ZONE_OVERRIDE → isManualOverride=true
  → badge ⚓ aparece + botão "reset ↺"
  → (zona inválida) → shake animation, snap back
  → (próximo agent:status:updated) → override limpo automaticamente
  → (click em reset) → dispatch AGENT_ZONE_CLEAR_OVERRIDE
```

## Fluxo de dados — carga inicial

```
App monta
  → dispatch FETCH_START (isLoading=true)
  → GET /api/dashboard/agents
  → (sucesso) → dispatch AGENTS_LOADED → agentes calculados
  → (erro)    → dispatch FETCH_ERROR → OfficeOverlay mostra erro + retry
  → retry() → retryCount++ → useEffect re-executa fetch
```

## Fluxo de dados — atualização em tempo real

```
MAGO agent muda estado
  → backend emite agent:status:updated { agentId, status, lastAction }
  → dispatch AGENT_STATUS_UPDATED
  → override manual desse agente limpo
  → AgentAvatar anima para nova posição (Framer Motion layoutId)
```

## Fluxo de dados — presença humana

```
Usuário abre office.iae.wtf
  → socket conecta → emite office:join { userId, name }
  → backend broadcast office:user:joined para outros clientes
  → usuário arrasta HumanAvatar
  → onDragEnd (debounce 100ms) → emite office:user:move { x, y }
  → outros recebem office:user:moved e animam
```

## Tratamento de erros

- **Fetch falha** → `OfficeOverlay` mostra `role="alert"` + botão retry
- **Render throw** → `ErrorBoundary` captura, mostra tela de fallback + botão reload
- **Socket desconectado** → `OfficeHUD` mostra estado "connecting" / "reconnecting"

## Testes

| Camada    | Ferramenta                      | Contagem                 |
| --------- | ------------------------------- | ------------------------ |
| Unitários | Vitest + @testing-library/react | 176 testes / 15 arquivos |
| E2E       | Playwright (Chromium)           | 15 testes / 3 specs      |
| Cobertura | v8                              | ~99% código de produto   |

## Deploy

- **URL**: https://office.iae.wtf
- **VPS**: `~/lab/mago-office/dist/`
- **Trigger**: push em `main` → GitHub Actions → SSH → `pnpm build` → nginx
- **Nginx**: serve `dist/` com `try_files $uri /index.html` (SPA)
- **Node**: 22 LTS (`nvm use 22` no `scripts/deploy.sh`)
