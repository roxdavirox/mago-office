# Development Guide

## Setup local

### Pré-requisitos

- Node.js 22 (via NVM)
- pnpm 9+
- MAGO backend rodando em `localhost:3002` (opcional — app funciona sem ele)

```bash
nvm use 22
pnpm install
pnpm dev         # dev server em localhost:3010
```

### Variáveis de ambiente

```bash
# .env (opcional — defaults já funcionam localmente)
VITE_MAGO_BACKEND_URL=http://localhost:3002
VITE_CELEBRO_URL=http://localhost:3099
```

## Comandos

```bash
pnpm dev          # dev server — localhost:3010 (hot reload)
pnpm build        # build prod → dist/
pnpm preview      # serve dist/ em localhost:3010 (usado pelo E2E)
pnpm typecheck    # tsc --noEmit
pnpm lint         # eslint src/
pnpm test         # vitest run (176 unit tests)
pnpm test --watch # vitest watch mode
pnpm test --coverage  # cobertura v8 (~99% código de produto)
npx playwright test              # E2E Chromium (15 tests)
npx playwright test --ui         # Playwright UI mode
npx playwright show-report       # último report HTML
```

## Testar sem o backend MAGO

O app funciona offline com estado de erro/retry:

1. Inicie o dev server: `pnpm dev`
2. Abra `localhost:3010`
3. `OfficeOverlay` mostra "connecting to MAGO..." enquanto tenta o fetch
4. Após falha, mostra "failed to load agents" + botão retry

Para testar com dados mockados, edite temporariamente `src/hooks/useOfficeState.ts` ou use as fixtures E2E (`e2e/fixtures.ts`) como referência.

## Verificar se o MAGO está funcionando

```bash
# Agentes
curl http://localhost:3002/api/dashboard/agents | python3 -m json.tool

# Socket (deve retornar 200)
curl http://localhost:3002/

# Celebro
curl http://localhost:3099/health
```

## Agentes MAGO

| ID real           | Nome     | Role         | Ícone |
| ----------------- | -------- | ------------ | ----- |
| `rx-architect`    | Claude   | architect    | 🤖    |
| `rx-backend`      | Gemini   | backend      | 🔬    |
| `rx-orchestrator` | OpenCode | orchestrator | ⚡    |

## CI/CD

O pipeline (`.github/workflows/ci.yml`) roda em push/PR para `develop` ou `main`:

```
1. typecheck     — tsc --noEmit
2. lint          — eslint src/
3. test          — vitest run
4. build         — vite build
5. e2e           — playwright test (needs: ci)
```

O deploy (`.github/workflows/deploy.yml`) roda em push para `main`:

```
SSH → VPS → nvm use 22 → pnpm install → pnpm build → nginx recarrega
```

## Debugging

### Socket events não chegando

```bash
# No browser DevTools console:
localStorage.debug = 'socket.io-client:*'
# Recarregue a página para ver logs detalhados
```

### Agentes não aparecem

```bash
# Verificar se o endpoint responde
curl http://localhost:3002/api/dashboard/agents

# Verificar CORS (se usar URL diferente de localhost:3002)
# Ajustar VITE_MAGO_BACKEND_URL no .env
```

### Testes falhando

```bash
# Rodar um arquivo específico
npx vitest run src/components/AgentAvatar.test.tsx

# Rodar com verbose
npx vitest run --reporter=verbose

# E2E — ver screenshots de falhas
npx playwright test --headed   # modo com browser visível
ls test-results/               # screenshots + traces
```

### Build com erro de tipo

```bash
npx tsc --noEmit 2>&1 | head -30
```

## Estrutura de arquivos relevantes

```
mago-office/
├── src/
│   ├── main.tsx                 ← ErrorBoundary + App
│   ├── App.tsx                  ← orquestra tudo
│   ├── services/socket.ts       ← singleton socket.io-client
│   ├── data/office-layout.ts    ← zonas + lógica de posicionamento
│   ├── hooks/
│   │   ├── useSocket.ts         ← 5 estados de conexão
│   │   └── useOfficeState.ts    ← estado central completo
│   ├── components/              ← todos com .test.tsx ao lado
│   └── constants/               ← theme, agent, status
├── e2e/
│   ├── fixtures.ts              ← MOCK_AGENTS, setupMocks()
│   └── *.spec.ts
├── .github/workflows/
│   ├── ci.yml                   ← CI completo + E2E
│   └── deploy.yml               ← SSH deploy
├── scripts/
│   └── deploy.sh                ← nvm use 22 + pnpm build
├── playwright.config.ts         ← webServer port 3010
└── vite.config.ts               ← port 3010, preview port 3010
```
