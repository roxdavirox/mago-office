# Office Map Layout

## Zonas do Escritório

```
┌─────────────────────────────────────────────────────────────────┐
│ x=0%                                                    x=100% │
│                                                                 │
│ y=5%  ┌──────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│       │  DEV ZONE ⚡  │  │  REVIEW 👁  │  │  PLANNING 📋    │  │
│       │  x:2 y:5     │  │  x:34 y:5   │  │  x:66 y:5       │  │
│       │  w:28 h:30   │  │  w:28 h:30  │  │  w:30 h:30      │  │
│ y=35% └──────────────┘  └─────────────┘  └─────────────────┘  │
│                                                                 │
│ y=42% ┌──────────────────────────┐  ┌─────────────────────┐   │
│       │  ANALYSIS AREA 🔍        │  │  COFFEE CORNER ☕    │   │
│       │  x:2 y:42                │  │  x:50 y:42          │   │
│       │  w:44 h:30               │  │  w:22 h:30          │   │
│ y=72% └──────────────────────────┘  └─────────────────────┘   │
│                                                                 │
│ y=78% ┌─────────────────────────────────────────────────────┐  │
│       │  LOBBY / CORREDOR 🚪                                 │  │
│       │  x:2 y:78  w:94 h:18                                │  │
│ y=96% └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Zonas — Definição completa

| ID | Label | Coordenadas (x,y,w,h) | Cor | Trigger |
|----|-------|----------------------|-----|---------|
| `dev-zone` | Dev Zone ⚡ | 2,5,28,30 | #1e1b4b | status=active + default |
| `review-room` | Review Room 👁 | 34,5,28,30 | #1a2035 | lastAction inclui "review" |
| `planning-board` | Planning Board 📋 | 66,5,30,30 | #1f1635 | lastAction inclui "plan/opus/sprint" |
| `analysis-area` | Analysis Area 🔍 | 2,42,44,30 | #0f2027 | lastAction inclui "analyz/inspect/check" |
| `coffee-corner` | Coffee Corner ☕ | 50,42,22,30 | #1a0f0f | status=idle |
| `lobby` | Lobby 🚪 | 2,78,94,18 | #0d1117 | status=offline/error |

## Mapeamento: status/lastAction → zona

```typescript
export function getAgentZone(status: string, lastAction: string): string {
  if (status === 'idle')    return 'coffee-corner'
  if (status === 'offline' || status === 'error') return 'lobby'

  const action = lastAction.toLowerCase()
  if (action.includes('review') || action.includes('code review')) return 'review-room'
  if (action.includes('plan') || action.includes('opus') || action.includes('sprint')) return 'planning-board'
  if (action.includes('analyz') || action.includes('inspect') || action.includes('check')) return 'analysis-area'

  return 'dev-zone'  // default para active/working
}
```

## Posicionamento de múltiplos agentes na mesma zona

Para evitar sobreposição quando 2+ agentes estão na mesma zona:

```typescript
const AGENT_OFFSETS = [
  { x: 20, y: 50 },  // agent-1: esquerda
  { x: 50, y: 50 },  // agent-2: centro
  { x: 80, y: 50 },  // agent-3: direita
]
```

## Identidade dos Agentes

| Agente | ID | Cor | Ícone | Role |
|--------|-----|-----|-------|------|
| Claude | rx-agent-1 | #8b5cf6 | 🤖 | code-reviewer |
| Gemini | rx-agent-2 | #10b981 | 🔬 | analyzer |
| OpenCode | rx-agent-3 | #f59e0b | ⚡ | implementer |
