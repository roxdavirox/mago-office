# mago-office

> Virtual office visualization for MAGO agents and human collaborators — 2D workspace with real-time presence.

A feature of the [MAGO platform](https://mago.technology) that adds a **Gather.town-style 2D virtual office** to the Flowday Web interface, showing AI agents and human collaborators interacting in real-time.

---

## Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ╔═══════════════╗  ╔══════════════╗  ╔═══════════════════╗   │
│  ║  DEV ZONE ⚡  ║  ║ REVIEW 👁    ║  ║  PLANNING 📋      ║   │
│  ║   [agent-3]   ║  ║  [agent-1]   ║  ║                   ║   │
│  ╚═══════════════╝  ╚══════════════╝  ╚═══════════════════╝   │
│                                                                 │
│  ╔═══════════════════════════╗   ╔═══════════════════╗        │
│  ║     ANALYSIS AREA 🔍     ║   ║  COFFEE ☕         ║        │
│  ║        [agent-2]          ║   ║                   ║        │
│  ╚═══════════════════════════╝   ╚═══════════════════╝        │
│                                                                 │
│  ─────────────── LOBBY 🚪 ─── [você] ──────────────────────── │
└─────────────────────────────────────────────────────────────────┘
```

**Agentes de IA** se movem automaticamente entre zonas conforme seu `status` e `lastAction`. **Usuários humanos** aparecem como avatares draggáveis. Clicar num agente abre um painel com a task atual e um input para enviar mensagens via Celebro.

---

## Features

| Feature | Status | Milestone |
|---------|--------|-----------|
| Socket presence events | Planejado | v0.1 |
| Office Map 2D (zones) | Planejado | v0.2 |
| Agent Avatars animados | Planejado | v0.3 |
| Human Presence + drag | Planejado | v0.4 |
| Interactions + messages | Planejado | v0.5 |
| Hacker Mode theme | Planejado | v1.0 |

---

## Tech Stack

- **Frontend**: React 19 + Vite 6 + Framer Motion 12
- **Backend**: Express 4 + Socket.io 4 + Prisma 6
- **State**: Zustand 5 + React hooks
- **Tests**: Vitest + Playwright
- **CI**: GitHub Actions

---

## Milestones

| Versão | Escopo | Deadline |
|--------|--------|----------|
| [v0.1 — Foundation](../../milestone/1) | Socket presence events, `/office/state` endpoint | 15/03/2026 |
| [v0.2 — Office Map](../../milestone/2) | Layout 2D, zonas, rota `/app/office` | 22/03/2026 |
| [v0.3 — Agent Avatars](../../milestone/3) | Avatares animados dos 3 agentes | 29/03/2026 |
| [v0.4 — Human Presence](../../milestone/4) | Avatar humano draggable, broadcast | 05/04/2026 |
| [v0.5 — Interactions](../../milestone/5) | AgentDetailPanel, mensagens | 12/04/2026 |
| [v1.0 — Polish](../../milestone/6) | Hacker Mode, testes, CI/CD | 19/04/2026 |

---

## Workflow

```
Issue → feat/issue-N-description branch
    → Código + commits (conventional commits)
    → PR aberta → base: develop
    → GitHub Copilot Review (automático)
    → CI: typecheck + lint + test + build
    → Human Review (1 aprovação)
    → Merge → develop
    → Issue fechada (closes #N)
```

### Commit Convention

```
TYPE(SCOPE): descrição

Types: feat, fix, docs, refactor, test, ci, chore
Scopes: office, backend, socket, animation, ui, dx, ci

Exemplos:
  feat(office): add AgentAvatar with Framer Motion animations
  fix(socket): fix memory leak in office:leave handler
  test(office): add E2E tests for human presence
```

### Branch Naming

```
feat/issue-N-short-description
fix/issue-N-short-description
```

---

## Setup Local

```bash
# As mudanças de código vão no MAGO monorepo em:
# apps/flowday-web/src/pages/office/
# apps/flowday-backend/src/routes/office.routes.ts
# apps/flowday-backend/src/index.ts (socket events)
```

---

## Agentes MAGO

| Agente | Modelo | Role | Cor |
|--------|--------|------|-----|
| agent-1 | Claude Sonnet | code-reviewer | #8b5cf6 |
| agent-2 | Gemini Flash | analyzer | #10b981 |
| agent-3 | OpenCode | implementer | #f59e0b |

---

## Links

- [Flowday Board](https://mago.technology) — tasks dos agentes
- [Discussions](../../discussions) — design decisions
- [Wiki](../../wiki) — documentação técnica
- [Project Board](https://github.com/users/roxdavirox/projects/2) — status geral
