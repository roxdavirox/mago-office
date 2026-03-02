# mago-office

> Virtual office 2D para visualização dos agentes MAGO em tempo real.

App React standalone estilo Gather.town. Mostra os agentes de IA se movendo entre zonas conforme o status deles, com animações Framer Motion e conexão Socket.io ao backend MAGO.

**URL**: https://office.iae.wtf

---

## Mapa do escritório

```
┌──────────────────────────────────────────────────────────────┐
│  DEV ZONE ⚡         REVIEW ROOM 👁      PLANNING BOARD 📋   │
│  [implementer]       [code-reviewer]     [planner]           │
│                                                              │
│  ANALYSIS AREA 🔍                   COFFEE CORNER ☕         │
│  [analyzer]                         [idle agents]           │
│                                                              │
│  ─────────────────── LOBBY 🚪 ──────────────────────────────│
│  [offline/blocked agents]    [você — draggable]             │
└──────────────────────────────────────────────────────────────┘
```

Agentes se movem automaticamente: `status` + `current_task` → zona.

---

## Status das features

| Feature | Status | Milestone |
|---------|--------|-----------|
| Scaffold + ESLint + CI | Concluído | v0.1 |
| Socket.io-client + `useSocket` | Concluído | v0.1 |
| `office-layout.ts` (6 zonas + `getAgentZone` + `getAgentPosition`) | Concluído | v0.2 |
| `OfficeCanvas` + `OfficeRoom` + `OfficeHUD` | Concluído | v0.2 |
| `AgentAvatar.tsx` (animações Framer Motion) | Em desenvolvimento | v0.3 |
| `SpeechBubble.tsx` (balão de fala) | Em desenvolvimento | v0.3 |
| `useOfficeState.ts` (estado central REST + socket) | Em desenvolvimento | v0.3 |
| `HumanAvatar` draggable | Planejado | v0.4 |
| `AgentDetailPanel` + mensagens Celebro | Planejado | v0.5 |
| Hacker Mode theme | Planejado | v1.0 |

---

## Stack

- **React 19** + **Vite 6** + **TypeScript strict**
- **Framer Motion** — animações de avatar e transições
- **socket.io-client** — conexão ao MAGO backend (localhost:3002)
- **Vitest** + **@testing-library/react** — testes unitários
- **pnpm** — gerenciador de pacotes
- **Node 22 LTS**

---

## Backend MAGO (referência)

O mago-office **não modifica o backend** — apenas consome como cliente.

| Recurso | URL |
|---------|-----|
| Agentes | `GET http://localhost:3002/api/dashboard/agents` |
| Socket.io | `ws://localhost:3002` |

### Shape do agente (real)

```typescript
interface Agent {
  id: string           // 'rx-backend', 'rx-architect', 'rx-orchestrator'
  name: string         // 'Backend', 'Architect', 'Orchestrator'
  role: string         // 'backend', 'architect', 'orchestrator'
  status: string       // 'idle' | 'working' | 'thinking' | 'offline' | 'blocked'
  current_task: string // equivalente a lastAction — ex: 'Aguardando próximo ciclo'
  progress: number | null
  last_heartbeat: string // ISO timestamp
  messages_count: number
}
```

### Eventos socket consumidos

| Evento | Direção | Uso |
|--------|---------|-----|
| `agent:status:updated` | Backend → Cliente | Atualiza zona do agente |
| `bus:message` | Backend → Cliente | Dispara SpeechBubble |
| `office:user:joined` | Backend → Cliente | Adiciona avatar humano |
| `office:user:left` | Backend → Cliente | Remove avatar humano |
| `office:user:moved` | Backend → Cliente | Anima avatar humano |
| `office:join` | Cliente → Backend | Registra presença humana |
| `office:leave` | Cliente → Backend | Remove presença ao sair |
| `office:user:move` | Cliente → Backend | Broadcast posição do avatar |

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
pnpm test        # vitest run
pnpm build       # build prod → dist/
```

---

## Estrutura

```
src/
├── main.tsx
├── App.tsx                         ← socket status + OfficeCanvas
├── services/
│   └── socket.ts                   ← singleton socket.io-client (autoConnect:false)
├── data/
│   └── office-layout.ts            ← 6 zonas, getAgentZone, getAgentPosition
├── hooks/
│   ├── useSocket.ts                ← status de conexão (5 estados)
│   └── useOfficeState.ts           ← estado central (REST + socket) [wip]
├── components/
│   ├── OfficeCanvas.tsx            ← container full-screen + grid + HUD
│   ├── OfficeRoom.tsx              ← zona posicionada por %
│   ├── OfficeHUD.tsx               ← status de conexão + contagem
│   ├── AgentAvatar.tsx             ← avatar animado por status [wip]
│   └── SpeechBubble.tsx            ← balão de fala com auto-dismiss [wip]
└── constants/
    └── status.ts                   ← STATUS_COLOR, STATUS_LABEL
```

---

## Workflow de desenvolvimento

```
Issue → scripts/branch-create.sh N
     → Código + commits (conventional commits em português)
     → git push → PR para develop
     → CI: typecheck + lint + test + build
     → AI Review (self-hosted runner, OpenCode)
     → Resolver todos os bugs/warnings do review
     → scripts/pr-merge.sh N → squash merge
     → Issue fechada → git checkout develop → git pull
```

### Convenção de commits

```
tipo(escopo): descrição em português lowercase

feat | fix | refactor | test | chore | ci | docs
escopo: canvas, avatar, socket, layout, hacker, deploy, scaffold
```

---

## Agentes

| Agente | ID real | Role | Cor |
|--------|---------|------|-----|
| Claude | rx-architect | architect | #8b5cf6 |
| Gemini | rx-backend | backend | #10b981 |
| OpenCode | rx-orchestrator | orchestrator | #f59e0b |

---

## Deploy

Merge em `main` → GitHub Actions → SSH VPS → `pnpm build` → nginx serve `dist/`

Nginx config: `/etc/nginx/sites-available/office.iae.wtf`
