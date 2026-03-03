# Contributing Guide

## Workflow

```
Issue aberta no GitHub
    │
    ▼
Branch: feat/issue-N-descricao-curta
    │
    ▼
Implementação + testes
    │
    ▼
Commits (conventional commits em português lowercase)
    │
    ▼
PR → base: develop
    │
    ├─→ CI (typecheck + lint + unit tests + E2E + build)
    │
    ▼
Merge squash → develop
    │
    ▼
Issue fechada (closes #N no footer do commit)
```

## Branches

```bash
# Padrão: tipo/issue-N-descricao-curta
git checkout -b feat/issue-69-loading-error-state
git checkout -b fix/issue-74-deploy-node-version
git checkout -b test/issue-70-drag-handler-coverage
```

## Commits

```
tipo(escopo): descrição em português lowercase

Tipos:
  feat     - nova funcionalidade
  fix      - correção de bug
  refactor - refatoração
  test     - testes
  docs     - documentação
  chore    - tarefa técnica
  ci       - CI/CD

Escopos:
  canvas    - OfficeCanvas, OfficeRoom
  avatar    - AgentAvatar, HumanAvatar, SpeechBubble, AvatarTooltip
  socket    - useSocket, socket.ts, eventos
  layout    - office-layout.ts, zonas
  ui        - OfficeOverlay, ErrorBoundary, OfficeHUD
  panel     - AgentDetailPanel
  deploy    - scripts, CI, nginx
  scaffold  - vite, tsconfig, eslint, deps

Exemplos:
  feat(avatar): arrastar agente para zona — override manual de zona
  fix(deploy): atualizar node para v22 no deploy.sh
  test(coverage): drag handler em agentavatar e humanavatardragend
  feat(ui): loading/error state visível na office view
```

### Regras commitlint

- Header máx. 72 caracteres
- Subject lowercase
- Blank line antes do footer (`closes #N`)

```
feat(ui): error boundary em app.tsx
                                       ← linha em branco obrigatória
closes #73
```

## Pull Requests

1. Título segue o mesmo padrão dos commits
2. Referencie a issue no footer: `closes #N`
3. CI deve passar antes do merge
4. Merge via **squash** (`gh pr merge N --squash --delete-branch`)

## Checklist antes do PR

```bash
pnpm typecheck        # tsc --noEmit — deve estar limpo
pnpm lint             # eslint — sem warnings
pnpm test             # vitest run — todos passando
pnpm build            # build sem erros
npx playwright test   # E2E — todos passando (requer build)
```

## Padrões de código

### Componentes React

```typescript
// ✅ Interfaces tipadas + memo para componentes puros
interface AgentAvatarProps {
  agent: AgentOfficeData
  onClick?: (agent: AgentOfficeData) => void
  isSelected?: boolean
  canvasRef?: RefObject<HTMLDivElement | null>
}

export const AgentAvatar = memo(function AgentAvatar({
  agent,
  onClick,
  isSelected = false,
}: AgentAvatarProps) {
  // ...
})
```

### Estilos

```typescript
// ✅ STYLES como const no topo do arquivo
const STYLES = {
  overlay: {
    position: 'absolute',
    inset: 0,
    zIndex: 50,
  } as React.CSSProperties,
}

// ✅ Cores via COLORS de src/constants/theme.ts
import { COLORS } from '../constants/theme'
```

### Testes

```typescript
// ✅ describe aninhados por comportamento
describe('ComponentName — estado X', () => {
  it('faz Y quando Z', () => {
    render(<ComponentName prop="value" />)
    expect(screen.getByRole('button')).toBeTruthy()
  })
})

// ✅ Mockar framer-motion para testes unitários de componentes
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual(...)
  return { ...actual, motion: { div: ({ children, ...rest }) => <div {...rest}>{children}</div> } }
})
```

## Estrutura de testes

```
src/
├── components/
│   ├── ComponentName.tsx
│   └── ComponentName.test.tsx     ← unitários ao lado do componente
├── hooks/
│   ├── useHookName.ts
│   └── useHookName.test.ts
└── utils/
    ├── utils.ts
    └── utils.test.ts

e2e/
├── fixtures.ts                    ← MOCK_AGENTS + setupMocks()
├── office-view-load.spec.ts
├── office-agent-interaction.spec.ts
└── office-agent-drag.spec.ts
```
