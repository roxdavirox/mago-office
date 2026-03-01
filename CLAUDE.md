# CLAUDE.md — mago-office

## Projeto

App React standalone — virtual office view estilo Gather.town para o MAGO.
Conecta ao backend MAGO via Socket.io e REST. **Não modifica o MAGO.**

## Stack

- React 19 + Vite 6 + TypeScript strict
- Framer Motion (animações)
- socket.io-client (connect a localhost:3002)
- Vitest (testes)
- pnpm

## Comandos

```bash
pnpm dev          # dev server em localhost:3010
pnpm build        # build prod → dist/
pnpm typecheck    # tsc --noEmit
pnpm lint         # eslint
pnpm test         # vitest run
```

## Estrutura

```
src/
├── main.tsx
├── App.tsx
├── HackerMode.tsx
├── services/socket.ts        ← socket.io-client → localhost:3002
├── data/office-layout.ts     ← zonas + getAgentZone()
├── hooks/
│   ├── useOfficeState.ts     ← estado central (REST + socket)
│   └── useHackerMode.ts
└── components/
    ├── OfficeCanvas.tsx
    ├── OfficeRoom.tsx
    ├── AgentAvatar.tsx
    ├── SpeechBubble.tsx
    ├── HumanAvatar.tsx
    └── AgentDetailPanel.tsx
```

## Regras de Git

- **NUNCA commitar sem autorização explícita**
- Mensagens em português: `feat(canvas): adicionar OfficeCanvas`
- Branch: `feat/issue-N-descricao` a partir de `develop`
- PR sempre para `develop`, nunca direto em `main`

## Convenção de commits

```
tipo(escopo): descrição em português

Tipos: feat, fix, docs, style, refactor, test, chore, ci
Escopos: canvas, avatar, socket, layout, hacker, deploy, scaffold
```

## Backend MAGO (referência — não modificar)

| Recurso | URL |
|---------|-----|
| Socket.io | `ws://localhost:3002` |
| Agentes | `GET http://localhost:3002/api/dashboard/agents` |
| Celebro | `POST http://localhost:3099/chat` |

## Eventos socket consumidos

| Evento | Uso |
|--------|-----|
| `agent:status:updated` | Atualizar zona do agente |
| `bus:message` | SpeechBubble com lastAction |
| `office:user:joined` | Presença humana |
| `office:user:moved` | Mover avatar humano |
| `office:user:left` | Remover avatar |

## Deploy

- **URL**: https://office.iae.wtf
- **Trigger**: merge em `main` → GitHub Actions → SSH VPS → `pnpm build` → nginx
- **Path no VPS**: `~/lab/mago-office/dist/`

## Milestones

| Milestone | Escopo |
|-----------|--------|
| v0.1 – Foundation | Scaffold, ESLint, Socket.io config |
| v0.2 – Office Map | office-layout.ts, OfficeCanvas, OfficeRoom |
| v0.3 – Agent Avatars | AgentAvatar, SpeechBubble, useOfficeState |
| v0.4 – Human Presence | HumanAvatar draggable + socket |
| v0.5 – Interactions | AgentDetailPanel + Celebro |
| v1.0 – Deploy | Hacker Mode, testes, nginx |
