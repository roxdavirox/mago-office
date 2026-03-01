# Architecture Overview

## Visão geral

O `mago-office` é um **app React standalone** que se conecta ao backend MAGO existente como cliente externo. Não modifica o MAGO — apenas consome os eventos Socket.io e endpoints REST já disponíveis.

## Diagrama

```
┌──────────────────────────────────────────────┐
│           mago-office (standalone)            │
│                                              │
│  React 19 + Vite   →  office.iae.wtf         │
│                                              │
│  App.tsx                                     │
│   └── OfficeCanvas.tsx                       │
│        ├── OfficeRoom.tsx × 6                │
│        │    ├── AgentAvatar.tsx              │
│        │    │    └── SpeechBubble.tsx        │
│        │    └── HumanAvatar.tsx (draggable)  │
│        └── AgentDetailPanel.tsx (slide-in)   │
│                                              │
│  hooks/useOfficeState.ts                     │
│   ├── REST: GET /api/dashboard/agents        │
│   └── Socket.io: agent:status:updated        │
│                  bus:message                 │
│                  office:user:*               │
└──────────────────┬───────────────────────────┘
                   │  Socket.io-client
                   │  REST (fetch)
                   ▼
┌──────────────────────────────────────────────┐
│        MAGO Backend (localhost:3002)          │
│                                              │
│  Eventos emitidos (já existentes):           │
│  • agent:status:updated                      │
│  • bus:message                               │
│  • board:item:moved                          │
│  • office:user:joined / moved / left         │
│                                              │
│  Endpoints REST:                             │
│  • GET /api/dashboard/agents                 │
│  • POST /api/office/join (emite para room)   │
└──────────────────────────────────────────────┘
```

## Fluxo de dados

### Carga inicial
1. App monta → `useOfficeState` chama `GET /api/dashboard/agents`
2. Retorna snapshot dos 3 agentes com status + lastAction
3. `getAgentZone(status, lastAction)` calcula zona de cada agente
4. Socket conecta e emite `office:join` com userId do usuário humano
5. Backend broadcast `office:user:joined` → outros clientes recebem

### Atualização de agente em tempo real
1. MAGO agent muda de estado → backend emite `agent:status:updated`
2. `useOfficeState` recebe → recalcula zona
3. `AgentAvatar` anima transição (Framer Motion `layoutId`)

### Movimentação humana
1. Usuário arrasta `HumanAvatar`
2. `onDragEnd` emite `office:user:move` com `{ x, y }`
3. Outros clientes recebem `office:user:moved` e animam

## Estrutura de arquivos

```
mago-office/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── HackerMode.tsx
│   ├── services/
│   │   └── socket.ts              ← conexão Socket.io-client
│   ├── data/
│   │   └── office-layout.ts       ← zonas + getAgentZone()
│   ├── hooks/
│   │   ├── useOfficeState.ts      ← estado central (REST + socket)
│   │   └── useHackerMode.ts
│   └── components/
│       ├── OfficeCanvas.tsx
│       ├── OfficeRoom.tsx
│       ├── AgentAvatar.tsx
│       ├── SpeechBubble.tsx
│       ├── HumanAvatar.tsx
│       └── AgentDetailPanel.tsx
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
└── .github/
    └── workflows/
        ├── ci.yml                 ← typecheck + lint + test + build
        └── deploy.yml             ← SSH → VPS → nginx office.iae.wtf
```

## Deploy

- **URL**: https://office.iae.wtf
- **VPS**: 147.79.111.174 — `/home/rx/lab/mago-office/dist/`
- **Trigger**: push em `main` → GitHub Actions → SSH → `pnpm build` → nginx
- **Nginx**: serve `dist/` com `try_files $uri /index.html` (SPA)
