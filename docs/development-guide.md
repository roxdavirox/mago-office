# Development Guide

## Setup

### Pré-requisitos
- Node.js 20+ (via NVM)
- pnpm 9+
- Redis (via Docker)
- MAGO rodando localmente

### Verificar se o MAGO está funcionando
```bash
# Backend
curl http://localhost:3002/health

# Socket (deve retornar 200)
curl http://localhost:3002/

# Opus Planner
curl http://localhost:3095/health

# Celebro Gateway
curl http://localhost:3099/health
```

## Agentes MAGO

Os agentes estão configurados em `/home/rx/lab/mago/config/agents.yaml`:

| ID | Modelo | Role | Porta |
|----|--------|------|-------|
| agent-1 | claude-sonnet-4 | code-reviewer | PM2 #6 |
| agent-2 | gemini-2.5-flash | analyzer | PM2 #7 |
| agent-3 | opencode/big-pickle | implementer | PM2 #8 |

### Verificar status dos agentes
```bash
# Via API
curl http://localhost:3002/api/dashboard/agents/summary

# Via PM2
pm2 list

# Logs de um agente
pm2 logs mago-agent-1 --lines 50
```

## Flowday Board

O board dos agentes é acessível em:
- **Web**: https://mago.technology
- **API**: `GET http://localhost:3002/api/boards/b1`

### Criar uma task manualmente
```bash
curl -X POST http://localhost:3002/api/boards/b1/items \
  -H "Content-Type: application/json" \
  -d '{
    "title": "feat(office): add AgentAvatar component",
    "description": "Closes #9",
    "priority": "HIGH",
    "assignee": "rx-agent-3"
  }'
```

## MCP Tools disponíveis

O MAGO expõe 27 ferramentas MCP para Claude Code:

```bash
# Listar tasks no board
mcp board_list_items b1

# Criar task
mcp board_create_item b1 "feat(office): add socket events" "Closes #1" HIGH rx-agent-3

# Mover task
mcp scrum_move_task <taskId> CURRENT

# Status dos agentes
mcp agent_list
```

## Opus Planner

Para decompor uma feature em tasks:
```bash
curl -X POST http://localhost:3095/plan \
  -H "Content-Type: application/json" \
  -d '{
    "feature": "Implementar AgentAvatar com animações Framer Motion...",
    "project": "mago",
    "mode": "medium"
  }'
```

## Workflow GitHub ↔ Flowday

```
GitHub Issue criada
    │
    ▼
Task criada no Flowday Board (via MCP ou API)
    │
    ▼
MAGO agent pega a task (loop automático a cada 15s)
    │
    ▼
Agent trabalha em worktree isolada
    │
    ▼
Commit: feat(office): <descrição> (closes #N)
    │
    ▼
Coordinator detecta WORK_COMPLETED
    │
    ▼ (mode=medium: checkpoint por rodada)
PR criada no GitHub
    │
    ▼
CI + Code Review → Aprovação humana
    │
    ▼
Merge → develop
    │
    ▼
Flowday card → Done
    │
    ▼
GitHub Issue fechada
```

## Debugging

### Socket events não chegando
```bash
# Verificar se socket está conectado
# No browser: localStorage.debug = 'socket.io-client:*'

# Verificar logs do backend
pm2 logs flowday-backend --lines 100 | grep office
```

### Agente não está pegando tasks
```bash
# Verificar locks ativos
curl http://localhost:3002/api/locks/active

# Limpar locks expirados
curl -X POST http://localhost:3002/api/locks/cleanup

# Verificar heartbeat dos agentes
curl http://localhost:3002/api/dashboard/agents/summary
```
