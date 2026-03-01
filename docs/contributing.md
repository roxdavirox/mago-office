# Contributing Guide

## Workflow

```
Issue aberta
    │
    ▼
Branch: feat/issue-N-short-description
    │
    ▼
Desenvolvimento local
    │
    ▼
Commits (conventional)
    │
    ▼
PR → base: develop
    │
    ├─→ CI (typecheck + lint + test + build)
    ├─→ GitHub Copilot Review
    │
    ▼
Human Review (1 aprovação)
    │
    ▼
Merge → develop
    │
    ▼
Issue fechada (closes #N)
```

## Branches

```bash
# Criar branch para issue
git checkout -b feat/issue-3-in-memory-position-store
git checkout -b fix/issue-14-socket-memory-leak

# Padrão: feat|fix|chore|test|docs/issue-N-descricao-curta
```

## Commits

```
TYPE(SCOPE): description

Types:
  feat     - nova funcionalidade
  fix      - correção de bug
  refactor - refatoração
  test     - testes
  docs     - documentação
  chore    - tarefa técnica
  ci       - CI/CD

Scopes:
  office    - componentes da Office View
  backend   - Express routes e socket
  socket    - Socket.io events
  animation - Framer Motion
  ui        - CSS/design
  dx        - developer experience
  ci        - CI/CD workflows

Exemplos:
  feat(office): add AgentAvatar with idle/working animations
  feat(socket): add office:join and office:leave handlers
  fix(backend): fix memory leak in office:leave disconnect cleanup
  test(office): add unit tests for getAgentZone function
  docs(office): update socket protocol documentation
```

## Pull Requests

1. Título segue o mesmo padrão dos commits
2. Referencie a issue: `closes #N`
3. Preencha o PR template completamente
4. Adicione screenshots se houver mudança visual
5. CI deve passar antes do review

## Code Review Checklist

### Para o autor
- [ ] TypeScript sem erros (`pnpm typecheck`)
- [ ] Lint passa (`pnpm lint`)
- [ ] Testes adicionados para nova funcionalidade
- [ ] Testes passando (`pnpm test`)
- [ ] Build funciona (`pnpm build`)
- [ ] Sem `console.log` de debug

### Para o revisor
- [ ] Lógica de negócio correta
- [ ] Sem memory leaks (socket cleanup correto)
- [ ] Animações suaves (sem jank)
- [ ] Acessibilidade mínima (aria-label em botões)
- [ ] Tipos TypeScript corretos (sem `any`)

## Padrões de código

### Frontend (React)
```typescript
// ✅ Correto — props tipadas, FC explícito
interface AgentAvatarProps {
  agent: AgentData
  onClick: () => void
  hackerMode?: boolean
}

export function AgentAvatar({ agent, onClick, hackerMode = false }: AgentAvatarProps) {
  // ...
}

// ❌ Errado — any, sem tipos
export default function({ agent, onClick }: any) { ... }
```

### Backend (Express + FP)
```typescript
// ✅ Correto — Result<T, E> pattern
import { ok, err, Result } from '@mago/fp-core'

async function getOfficeState(): Promise<Result<OfficeState, OfficeError>> {
  try {
    const agents = await getAgentStates()
    return ok({ agents, users: Array.from(officeUsers.values()) })
  } catch (e) {
    return err({ type: 'DB_ERROR', message: String(e) })
  }
}

// ❌ Errado — throw direto
async function getOfficeState() {
  const agents = await getAgentStates() // pode jogar exceção sem tratamento
  return { agents }
}
```

## Setup local

```bash
# No MAGO monorepo
cd ~/code/mago

# Backend
cd apps/flowday-backend
pnpm install
pnpm dev

# Frontend  
cd apps/flowday-web
pnpm install
pnpm dev
```

## Testes

```bash
# Unitários
pnpm test

# Com coverage
pnpm test --coverage

# Watch mode
pnpm test --watch

# E2E (Playwright)
cd e2e-suite
npx playwright test office-view
```
