#!/bin/bash
# scripts/mago-sprint.sh — Planejamento de sprint via rx-orchestrator (Celebro) com fallback OpenCode
#
# Uso: ./scripts/mago-sprint.sh [--post]
#   --post: Cria issue de sprint no repo com o plano

set -e

POST_COMMENT=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --post) POST_COMMENT=1; shift ;;
    *) shift ;;
  esac
done

CELEBRO_URL="${CELEBRO_URL:-http://localhost:3099/chat}"
MODEL="${OPENCODE_MODEL:-opencode/minimax-m2.5-free}"
OPENCODE="${OPENCODE_BIN:-/home/rx/.opencode/bin/opencode}"

echo "🎯 Consultando rx-orchestrator para planejamento de sprint..."
echo ""

# Coletar issues abertas com campos do board
OPEN_ISSUES=$(gh issue list --state open --json number,title,labels --limit 30 \
  | python3 -c "
import sys, json
issues = json.load(sys.stdin)
lines = []
for i in issues:
    labels = [l['name'] for l in i['labels']]
    priority = next((l for l in labels if l.startswith('priority:')), 'priority:medium')
    size = next((l for l in labels if l.startswith('size:')), '')
    entry = f\"#{i['number']} [{priority}]{' [' + size + ']' if size else ''} {i['title']}\"
    lines.append(entry)
print('\n'.join(lines))
")

echo "Issues abertas:"
echo "$OPEN_ISSUES"
echo ""

PROMPT="Você é rx-orchestrator do MAGO. Planeje o próximo sprint (2 semanas) para o projeto mago-office.

Contexto: App React 19 + Framer Motion — escritório virtual 2D com avatares de agentes IA.

Issues abertas:
$OPEN_ISSUES

Critérios: priority:high primeiro, dependências técnicas antes de feat, equilibrar feat/test/chore, sprint realista 1 dev 80h.

Responda EXATAMENTE neste JSON (sem texto fora do JSON):
{
  \"sprint_goal\": \"<objetivo em 1 frase>\",
  \"capacity\": \"<estimativa total>\",
  \"selected\": [{\"issue\": 0, \"priority\": \"alta|media|baixa\", \"reason\": \"<justificativa>\", \"size\": \"XS|S|M|L|XL\"}],
  \"deferred\": [{\"issue\": 0, \"reason\": \"<motivo>\"}],
  \"risks\": [\"<risco>\"]
}"

# ── Tentar Celebro primeiro ────────────────────────────────────────────────────
PLAN=""
BACKEND=""

RESPONSE=$(python3 - "$CELEBRO_URL" <<PYEOF
import sys, json, urllib.request

celebro_url = sys.argv[1]

prompt = """$PROMPT"""

payload = json.dumps({"text": prompt, "agent": "rx-orchestrator"}).encode()
req = urllib.request.Request(celebro_url, data=payload,
      headers={"Content-Type": "application/json"})
try:
    with urllib.request.urlopen(req, timeout=5) as resp:
        data = json.loads(resp.read())
        print(data.get("response", ""))
except Exception:
    pass
PYEOF
)

PLAN=$(echo "$RESPONSE" | python3 -c "
import sys, json, re
text = sys.stdin.read()
match = re.search(r'\{[\s\S]*\}', text)
if match:
    try:
        print(json.dumps(json.loads(match.group(0)), indent=2, ensure_ascii=False))
    except:
        pass
" 2>/dev/null || echo "")
[[ -n "$PLAN" ]] && BACKEND="celebro"

# ── Fallback para OpenCode se Celebro falhou ──────────────────────────────────
if [[ -z "$PLAN" ]]; then
  if [ ! -f "$OPENCODE" ]; then
    echo "⚠️  Celebro indisponível e OpenCode não encontrado em $OPENCODE"
    exit 1
  fi
  echo "   Celebro indisponível — usando OpenCode..."
  TMPFILE=$(mktemp)
  printf '%s' "$PROMPT" > "$TMPFILE"
  RAW=$(timeout 60 "$OPENCODE" run -m "$MODEL" "$(cat "$TMPFILE")" 2>&1 \
    | sed 's/\x1b\[[0-9;]*[A-Za-z]//g')
  rm -f "$TMPFILE"

  # Normalizar JSON do OpenCode para formato Celebro
  PLAN=$(echo "$RAW" | python3 -c "
import sys, json, re
text = sys.stdin.read()
match = re.search(r'\{[\s\S]*\}', text)
if match:
    try:
        d = json.loads(match.group(0))
        # Normalizar: goal -> sprint_goal
        if 'goal' in d and 'sprint_goal' not in d:
            d['sprint_goal'] = d.pop('goal')
        # Normalizar: defer -> deferred
        if 'defer' in d and 'deferred' not in d:
            d['deferred'] = d.pop('defer')
        # Normalizar selected: adicionar campos faltantes
        for s in d.get('selected', []):
            if 'priority' not in s: s['priority'] = 'media'
            if 'size' not in s: s['size'] = 'M'
        print(json.dumps(d, indent=2, ensure_ascii=False))
    except Exception:
        print(text)
" 2>/dev/null || echo "")
  [[ -n "$PLAN" ]] && BACKEND="opencode"
fi

if [[ -z "$PLAN" ]]; then
  echo "⚠️  Nenhum backend disponível — planejamento indisponível"
  exit 1
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎯 Plano rx-orchestrator [via $BACKEND]"
echo ""
echo "$PLAN" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print(f\"Sprint Goal: {d.get('sprint_goal','?')}\")
    print(f\"Capacidade: {d.get('capacity','?')}\")
    print()
    print('✅ Selecionadas:')
    for s in d.get('selected', []):
        print(f\"  #{s['issue']} [{s.get('size','?')}] {s.get('priority','?').upper()} — {s.get('reason','')}\")
    deferred = d.get('deferred', [])
    if deferred:
        print()
        print('⏭️  Adiadas:')
        for s in deferred:
            print(f\"  #{s['issue']} — {s.get('reason','')}\")
    risks = d.get('risks', [])
    if risks:
        print()
        print('⚠️  Riscos:')
        for r in risks:
            print(f'  - {r}')
except:
    print(sys.stdin.read())
" 2>/dev/null || echo "$PLAN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── Postar como issue de sprint no repo ───────────────────────────────────────
if [ -n "$POST_COMMENT" ]; then
  SPRINT_BODY=$(echo "$PLAN" | python3 -c "
import sys, json
from datetime import date, timedelta
try:
    d = json.load(sys.stdin)
    today = date.today()
    end = today + timedelta(days=14)
    goal     = d.get('sprint_goal','?')
    capacity = d.get('capacity','?')
    selected = d.get('selected', [])
    deferred = d.get('deferred', [])
    risks    = d.get('risks', [])

    lines = [
        f'## Sprint {today} → {end}',
        '',
        f'**Goal:** {goal}',
        f'**Capacidade:** {capacity}',
        '',
        '## Issues do Sprint',
        '',
        '| Issue | Size | Prioridade | Justificativa |',
        '|-------|------|------------|---------------|',
    ]
    for s in selected:
        lines.append(f\"| #{s['issue']} | {s.get('size','?')} | {s.get('priority','?')} | {s.get('reason','')} |\")
    if deferred:
        lines.append('')
        lines.append('## Adiadas')
        for s in deferred:
            lines.append(f\"- #{s['issue']}: {s.get('reason','')}\")
    if risks:
        lines.append('')
        lines.append('## Riscos do Sprint')
        for r in risks:
            lines.append(f'- ⚠️ {r}')
    lines.append('')
    lines.append('---')
    lines.append('*Planejamento automático via rx-orchestrator (MAGO)*')
    print('\n'.join(lines))
except Exception as e:
    print(f'Erro ao formatar: {e}')
    print(sys.stdin.read())
")

  SPRINT_TITLE="chore(sprint): planejamento $(date +%Y-%m-%d)"
  gh issue create \
    --title "$SPRINT_TITLE" \
    --body "$SPRINT_BODY" \
    --label "chore" \
    && echo "✅ Issue de sprint criada!"
fi
