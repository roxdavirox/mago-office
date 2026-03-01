# Agent Avatar States

## Estados e Animações

| Status | Zona | Animação | Indicador visual |
|--------|------|----------|-----------------|
| `working` (active) | Dev/Review/Planning/Analysis | Pulse suave (scale 1→1.05→1) | Badge verde piscante |
| `idle` | Coffee Corner | Bob vertical (y 0→-4→0) | Badge cinza estático |
| `blocked` (error) | Lobby | Shake horizontal (x -2→2→0) | Badge vermelho + ícone ⚠ |
| `offline` | Lobby | Opacidade 30% | Badge cinza escuro |

## Framer Motion variants

```typescript
export const agentAnimations: Record<string, MotionProps['animate']> = {
  working: {
    scale: [1, 1.05, 1],
    transition: { repeat: Infinity, duration: 0.8, ease: 'easeInOut' }
  },
  idle: {
    y: [0, -4, 0],
    transition: { repeat: Infinity, duration: 2, ease: 'easeInOut' }
  },
  blocked: {
    x: [-2, 2, -2, 2, 0],
    transition: { duration: 0.4, repeat: 3 }
  },
  offline: {
    opacity: 0.3,
    transition: { duration: 0.3 }
  }
}
```

## Layout Animation (mudança de zona)

```typescript
// AgentAvatar.tsx — transição suave ao mudar de zona
<motion.div
  layout                          // ativa layout animation
  layoutId={`agent-${agent.id}`} // único por agente
  style={{ position: 'absolute', left: `${pos.x}%`, top: `${pos.y}%` }}
  transition={{ type: 'spring', stiffness: 200, damping: 20 }}
>
```

## Identidade Visual

```
╔═══════════════╗
║               ║
║   ┌───────┐   ║
║   │  🤖   │   ← ícone do agente
║   │ #8b5  │   ← cor do agente
║   └───────┘   ║
║  ● Agent 1    ║  ← badge de status + nome
║   Claude      ║  ← modelo/role
╚═══════════════╝
```

### Cores por agente

| Agente | Cor principal | Cor badge working | Cor badge idle |
|--------|--------------|-----------------|----------------|
| agent-1 (Claude) | `#8b5cf6` (roxo) | `#10b981` | `#6b7280` |
| agent-2 (Gemini) | `#10b981` (verde) | `#10b981` | `#6b7280` |
| agent-3 (OpenCode) | `#f59e0b` (laranja) | `#10b981` | `#6b7280` |

## SpeechBubble

Aparece por 5 segundos quando `lastAction` muda:

```
     ┌─────────────────────────────┐
     │  Moving task #47 to Done... │
     └───────────┬─────────────────┘
                 │  (seta CSS)
              [Avatar]
```

### Conteúdo exibido

- `lastAction` do agente (truncado em 40 chars)
- Ao receber `bus:message`: content da mensagem
- Indicador de "digitando" (3 pontos animados) quando status=working e sem lastAction recente

## Hacker Mode

No Hacker Mode, todos os visuais mudam para tema terminal:

| Elemento | Normal | Hacker Mode |
|----------|--------|-------------|
| Fundo avatar | Cor do agente | `#001100` |
| Borda | nenhuma | `#00ff41` 1px solid |
| Ícone | Emoji | `[A1]` `[A2]` `[A3]` |
| Fonte nome | Inter | JetBrains Mono |
| Animação | Suave | Digitalizada (step) |
| SpeechBubble | Dark | `#00ff41` texto, `#000` fundo |
