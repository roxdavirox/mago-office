# mago-office

> Virtual office 2D para visualização dos agentes MAGO em tempo real.

App React standalone estilo Gather.town. Mostra os agentes de IA se movendo entre zonas conforme o status deles, com animações Framer Motion e conexão Socket.io ao backend MAGO.

**URL**: https://office.iae.wtf

---

## Mapa do escritório

```
┌──────────────────────────────────────────────────────────────┐
│  DEV ZONE ⚡         REVIEW ROOM 👁      PLANNING BOARD 📋   │
│  [working/default]   [revisando/review]  [plan/sprint]       │
│                                                              │
│  ANALYSIS AREA 🔍                   COFFEE CORNER ☕         │
│  [analyz/debug]                     [idle agents]           │
│                                                              │
│  ─────────────────── LOBBY 🚪 ──────────────────────────────│
│  [offline/blocked agents]    [humanos — draggáveis]         │
└──────────────────────────────────────────────────────────────┘
```

Agentes se movem automaticamente: `status` + `current_task` → zona.

---

## Features

| Feature                                                            | Status    |
| ------------------------------------------------------------------ | --------- |
| Scaffold + ESLint + Commitlint + CI                                | Concluído |
| Socket.io-client + `useSocket` (5 estados)                         | Concluído |
| `office-layout.ts` — 6 zonas + `getAgentZone` + `getAgentPosition` | Concluído |
| `OfficeCanvas` + `OfficeRoom` + `OfficeHUD`                        | Concluído |
| `AgentAvatar` — animações por status, tooltip, SpeechBubble        | Concluído |
| `useOfficeState` — REST + socket, reducer, overrides, retry        | Concluído |
| `HumanAvatar` — draggable, debounce, socket emit                   | Concluído |
| `AgentDetailPanel` — slide-in, quick messages, Celebro             | Concluído |
| Drag de agente para zona — override manual, badge ⚓, reset        | Concluído |
| `OfficeOverlay` — loading spinner + error alert + retry            | Concluído |
| `ErrorBoundary` — captura erros de render, botão reload            | Concluído |
| Deploy SSH → nginx → office.iae.wtf                                | Concluído |
| CI com typecheck + lint + unit tests + E2E Playwright              | Concluído |

---

## Stack

- **React 19** + **Vite 6** + **TypeScript strict**
- **Framer Motion** — animações de avatar e transições de zona
- **socket.io-client** — conexão ao MAGO backend (localhost:3002)
- **Vitest** + **@testing-library/react** — 176 testes unitários
- **Playwright** — 15 testes E2E (Chromium)
- **pnpm** — gerenciador de pacotes
- **Node 22 LTS**

---

## Setup

```bash
# Requisitos: Node 22, pnpm 9+
nvm use 22
pnpm install
pnpm dev         # dev em localhost:3010
```

```bash
pnpm typecheck   # tsc --noEmit
pnpm lint        # eslint
pnpm test        # vitest run (176 testes)
pnpm build       # build prod → dist/
npx playwright test   # E2E (requer pnpm build antes)
```

---

## Estrutura

```
src/
├── main.tsx                        ← entry-point, monta ErrorBoundary + App
├── App.tsx                         ← orquestra estado e renderiza canvas
├── services/
│   └── socket.ts                   ← singleton socket.io-client (autoConnect:false)
├── data/
│   └── office-layout.ts            ← 6 zonas, getAgentZone, getAgentPosition
├── hooks/
│   ├── useSocket.ts                ← status de conexão (5 estados)
│   └── useOfficeState.ts           ← estado central (REST + socket + overrides)
├── components/
│   ├── OfficeCanvas.tsx            ← container full-screen + grid + HUD
│   ├── OfficeRoom.tsx              ← zona posicionada por %
│   ├── OfficeHUD.tsx               ← status de conexão + contagem
│   ├── OfficeOverlay.tsx           ← loading spinner + error alert + retry
│   ├── AgentAvatar.tsx             ← avatar animado, tooltip, drag, ⚓ badge
│   ├── SpeechBubble.tsx            ← balão de fala com auto-dismiss (5s)
│   ├── AvatarTooltip.tsx           ← tooltip hover com role/status/task/zone
│   ├── HumanAvatar.tsx             ← avatar humano draggável + socket emit
│   ├── AgentDetailPanel.tsx        ← painel slide-in, mensagens, Celebro
│   ├── OnlineUsersList.tsx         ← lista lateral de usuários online
│   └── ErrorBoundary.tsx           ← captura erros de render, botão reload
├── constants/
│   ├── agent.ts                    ← AGENT_COLORS, AGENT_STATUS_LABEL
│   ├── status.ts                   ← STATUS_COLOR
│   └── theme.ts                    ← COLORS (dark theme)
└── utils/
    └── avatar.ts                   ← hashColor, initials, toPercent
```

---

## Backend MAGO (referência)

O mago-office **não modifica o backend** — apenas consome como cliente.

| Recurso   | URL                                              |
| --------- | ------------------------------------------------ |
| Agentes   | `GET http://localhost:3002/api/dashboard/agents` |
| Socket.io | `ws://localhost:3002`                            |
| Celebro   | `POST http://localhost:3099/chat`                |

### Shape do agente (GET /api/dashboard/agents)

```typescript
interface RawAgent {
  id: string // 'rx-architect' | 'rx-backend' | 'rx-orchestrator'
  name: string
  role: string // 'architect' | 'backend' | 'orchestrator'
  status: string // 'idle' | 'working' | 'thinking' | 'offline' | 'blocked'
  current_task: string // equivalente a lastAction
  progress: number | null
  last_heartbeat: string
  messages_count: number
}
```

---

## Agentes

| Agente   | ID                | Role         | Ícone | Cor       |
| -------- | ----------------- | ------------ | ----- | --------- |
| Claude   | `rx-architect`    | architect    | 🤖    | `#8b5cf6` |
| Gemini   | `rx-backend`      | backend      | 🔬    | `#10b981` |
| OpenCode | `rx-orchestrator` | orchestrator | ⚡    | `#f59e0b` |

---

## Deploy

Merge em `main` → GitHub Actions → SSH VPS → `pnpm build` → nginx serve `dist/`

- **Nginx config**: `/etc/nginx/sites-available/office.iae.wtf`
- **Dist path**: `~/lab/mago-office/dist/`
- **Node no deploy**: `nvm use 22` (script `scripts/deploy.sh`)
