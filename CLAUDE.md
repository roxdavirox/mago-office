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

## GitHub Projects Board

**ID:** `PVT_kwHOAPDgbs4BQglq`

### Campos e IDs

| Campo | Field ID | Opções |
|-------|----------|--------|
| Status | `PVTSSF_lAHOAPDgbs4BQglqzg-m2Sc` | Backlog `8df12426`, Todo `532fc3d8`, In Progress `b894fbad`, In Review `c999db95`, Done `c841d7a3` |
| Priority | `PVTSSF_lAHOAPDgbs4BQglqzg-nNm4` | Urgent `fd57bfad`, High `e9333909`, Medium `8cb7a262`, Low `373ced67` |
| Size | `PVTSSF_lAHOAPDgbs4BQglqzg-nNnU` | XS `c4ee0f78`, S `8a34ec7b`, M `fbe25f78`, L `c15fe1d4`, XL `dcefc6fd` |
| Sprint | `PVTIF_lAHOAPDgbs4BQglqzg-nNnQ` | Iteration field |

### Automações (`.github/workflows/project-automation.yml`)

| Trigger | Ação |
|---------|------|
| Issue aberta | Adiciona ao board → Status **Todo** + Priority da label `priority:*` |
| Issue reaberta | Status → **Todo** |
| Issue fechada | Status → **Done** |
| PR aberta / ready_for_review | PR + issues linkadas → **In Review** |
| PR mergeada | PR + issues linkadas → **Done** |

### Labels de Priority (usar ao criar issues)

`priority:urgent` · `priority:high` · `priority:medium` · `priority:low`

## Milestones

| Milestone | Escopo |
|-----------|--------|
| v0.1 – Foundation | Scaffold, ESLint, Socket.io config |
| v0.2 – Office Map | office-layout.ts, OfficeCanvas, OfficeRoom |
| v0.3 – Agent Avatars | AgentAvatar, SpeechBubble, useOfficeState |
| v0.4 – Human Presence | HumanAvatar draggable + socket |
| v0.5 – Interactions | AgentDetailPanel + Celebro |
| v1.0 – Deploy | Hacker Mode, testes, nginx |
