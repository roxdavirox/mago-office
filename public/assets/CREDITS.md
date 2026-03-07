# Assets — Créditos e Licenças

## Decisões de arquitetura de assets

### Tileset (mapa do escritório)

**Decisão:** Kenney CC0 (Top-Down) — seguro para repositório público.

| Campo | Valor |
|-------|-------|
| Autor | Kenney (kenney.nl) |
| Licença | Creative Commons Zero (CC0 1.0) |
| URL | https://kenney.nl/assets/tiny-town |
| Comprometível | ✅ Sim (domínio público) |
| Crédito obrigatório | Não (mas recomendado) |

**Placeholder atual:** `tileset-office.png` — gerado programaticamente, 8 tiles 16×16.
**Substituição planejada:** Issue #90 (mapa real com Kenney Tiny Town).

### Spritesheet de personagem/agente

**Decisão:** Cute Fantasy RPG 16×16 (kenmi-art) — free, 16px compatível com tileset.

| Campo | Valor |
|-------|-------|
| Autor | kenmi-art |
| Licença | Free (uso em projetos pessoais e comerciais) |
| URL | https://kenmi-art.itch.io/cute-fantasy-rpg |
| Comprometível | ✅ Sim (licença permite distribuição) |
| Crédito obrigatório | Recomendado |

**Placeholder atual:** `spritesheet-agent.png` — gerado programaticamente, 3 frames × 4 direções.
**Substituição planejada:** Issue #92 (AgentSprite com animações reais).

### Spritesheet de jogador humano

**Decisão:** Mana Seed Character Base (seliel-the-shaper) — free com crédito.

| Campo | Valor |
|-------|-------|
| Autor | Seliel the Shaper |
| Licença | Free (crédito obrigatório) |
| URL | https://seliel-the-shaper.itch.io/character-base |
| Comprometível | ✅ Sim (licença permite redistribuição com crédito) |
| Crédito obrigatório | ✅ Sim |

**Substituição planejada:** Issue #94 (HumanSprite WASD).

---

## Arquivos gerados (placeholders)

| Arquivo | Tipo | Dimensões | Descrição |
|---------|------|-----------|-----------|
| `tileset-office.png` | Tileset | 128×16 (8 tiles 16×16) | Floor, wall, desk, chair, plant, door, window |
| `spritesheet-agent.png` | Spritesheet | 48×64 (3×4 frames 16×16) | 4 direções × 3 frames (idle, walk A, walk B) |
| `agent-placeholder.png` | Sprite | 16×16 | Quadrado roxo — legado, será removido |
