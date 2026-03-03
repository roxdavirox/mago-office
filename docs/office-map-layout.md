# Office Map Layout

## Zonas do Escritório

```
┌──────────────────────────────────────────────────────────────────┐
│ x=0%                                                     x=100% │
│                                                                  │
│ y=5%  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐   │
│       │ DEV ZONE ⚡  │  │ REVIEW 👁   │  │  PLANNING 📋     │   │
│       │ x:2  y:5    │  │ x:34  y:5   │  │  x:66  y:5       │   │
│       │ w:28 h:30   │  │ w:28  h:30  │  │  w:30  h:30      │   │
│ y=35% └─────────────┘  └─────────────┘  └──────────────────┘   │
│                                                                  │
│ y=42% ┌──────────────────────────┐  ┌─────────────────────────┐ │
│       │  ANALYSIS AREA 🔍        │  │  COFFEE CORNER ☕        │ │
│       │  x:2  y:42               │  │  x:50  y:42             │ │
│       │  w:44 h:30               │  │  w:46  h:30             │ │
│ y=72% └──────────────────────────┘  └─────────────────────────┘ │
│                                                                  │
│ y=78% ┌──────────────────────────────────────────────────────┐  │
│       │  LOBBY 🚪                                             │  │
│       │  x:2  y:78  w:94  h:18                               │  │
│ y=96% └──────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

## Zonas — Definição completa

Definidas em `src/data/office-layout.ts` como `OFFICE_ZONES: Zone[]`.

| ID               | Label             | x   | y   | w   | h   | Cor       | Trigger                                         |
| ---------------- | ----------------- | --- | --- | --- | --- | --------- | ----------------------------------------------- |
| `dev-zone`       | Dev Zone ⚡       | 2   | 5   | 28  | 30  | `#1e1b4b` | `working/thinking` — default                    |
| `review-room`    | Review Room 👁    | 34  | 5   | 28  | 30  | `#1a2035` | lastAction inclui "review/revisando/aprovando"  |
| `planning-board` | Planning Board 📋 | 66  | 5   | 30  | 30  | `#1f1635` | lastAction inclui "plan/task/sprint/backlog"    |
| `analysis-area`  | Analysis Area 🔍  | 2   | 42  | 44  | 30  | `#0f2027` | lastAction inclui "analyz/analis/inspect/debug" |
| `coffee-corner`  | Coffee Corner ☕  | 50  | 42  | 46  | 30  | `#1a0f0f` | `status === 'idle'`                             |
| `lobby`          | Lobby 🚪          | 2   | 78  | 94  | 18  | `#0d1117` | `status === 'offline'` ou `'blocked'`           |

Todos os valores são em **% do canvas** (canvas = `100vw × 100vh`).

## Mapeamento status/current_task → zona

```typescript
// src/data/office-layout.ts
export function getAgentZone(status: string | null | undefined, lastAction = ''): string {
  if (!status) return 'lobby'
  if (status === 'idle') return 'coffee-corner'
  if (status === 'offline' || status === 'blocked') return 'lobby'

  const action = lastAction.toLowerCase()

  if (action.includes('review') || action.includes('aprovando') || action.includes('revisando'))
    return 'review-room'
  if (
    action.includes('plan') ||
    action.includes('task') ||
    action.includes('sprint') ||
    action.includes('backlog')
  )
    return 'planning-board'
  if (
    action.includes('analyz') ||
    action.includes('analis') ||
    action.includes('inspect') ||
    action.includes('debug')
  )
    return 'analysis-area'

  return 'dev-zone'
}
```

## Posicionamento anti-sobreposição

`getAgentPosition(zoneId, agentIndex)` retorna `{ x, y }` em % absoluta do canvas.

Cada zona tem offsets fixos por índice de agente:

```typescript
const AGENT_ZONE_OFFSETS = [
  { x: 25, y: 40 }, // rx-architect (índice 0)
  { x: 50, y: 40 }, // rx-backend   (índice 1)
  { x: 75, y: 40 }, // rx-orchestrator (índice 2)
]
```

Posição absoluta = `zone.x + (zone.width * offset.x / 100)` (idem para y).

**Exemplo** — `rx-architect` idle na `coffee-corner`:

```
x = 50 + (46 * 0.25) = 50 + 11.5 = 61.5%
y = 42 + (30 * 0.40) = 42 + 12   = 54%
```

## Identidade dos agentes

| Agente   | ID real           | Índice | Cor       | Ícone |
| -------- | ----------------- | ------ | --------- | ----- |
| Claude   | `rx-architect`    | 0      | `#8b5cf6` | 🤖    |
| Gemini   | `rx-backend`      | 1      | `#10b981` | 🔬    |
| OpenCode | `rx-orchestrator` | 2      | `#f59e0b` | ⚡    |

Definidos em `src/constants/agent.ts` como `AGENT_COLORS`.
