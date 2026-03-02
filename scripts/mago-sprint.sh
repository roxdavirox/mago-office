#!/bin/bash
# scripts/mago-sprint.sh — Planejamento de sprint via OpenCode
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

MODEL="${OPENCODE_MODEL:-opencode/minimax-m2.5-free}"
OPENCODE="${OPENCODE_BIN:-/home/rx/.opencode/bin/opencode}"

if [ ! -f "$OPENCODE" ]; then
  echo "Erro: opencode não encontrado em $OPENCODE"
  exit 1
fi

echo "🎯 Planejando sprint..."
echo ""

# Coletar issues abertas com priority e size labels
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

PROMPT="Planeje o próximo sprint do projeto mago-office (React 19 + Vite + TypeScript — escritório virtual 2D).

REGRA: cada issue cabe em no máximo 30min. Sprint = sessão de ~2h (4-6 issues XS/S/M).

Issues abertas:
$OPEN_ISSUES

Sizes: XS<10min | S~15min | M~30min(máx) | L/XL=quebrar antes

Selecione 4-6 issues priorizando: priority:high > medium > low.
Se uma issue for grande demais, indique para quebrar.

Responda SOMENTE em JSON válido:
{
  \"goal\": \"objetivo do sprint em 1 frase\",
  \"capacity\": \"~2h, N issues\",
  \"selected\": [{\"issue\": 0, \"reason\": \"motivo curto\"}],
  \"defer\": [{\"issue\": 0, \"reason\": \"motivo ou quebrar\"}]
}"

TMPFILE=$(mktemp)
printf '%s' "$PROMPT" > "$TMPFILE"

RAW=$(timeout 60 "$OPENCODE" run -m "$MODEL" "$(cat "$TMPFILE")" 2>&1 \
  | sed 's/\x1b\[[0-9;]*[A-Za-z]//g')
rm -f "$TMPFILE"

PLAN=$(echo "$RAW" | python3 -c "
import sys, json, re
text = sys.stdin.read()
match = re.search(r'\{[\s\S]*\}', text)
if match:
    try:
        print(json.dumps(json.loads(match.group(0)), indent=2, ensure_ascii=False))
    except Exception:
        print(text)
else:
    print(text)
")

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "$PLAN" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print(f\"Goal: {d.get('goal','?')}\")
    print(f\"Capacidade: {d.get('capacity','?')}\")
    print()
    print('✅ Selecionadas:')
    for s in d.get('selected', []):
        print(f\"  #{s['issue']} — {s['reason']}\")
    defer = d.get('defer', [])
    if defer:
        print()
        print('⏭  Adiadas:')
        for s in defer:
            print(f\"  #{s['issue']} — {s['reason']}\")
except Exception:
    print(sys.stdin.read())
" 2>/dev/null || echo "$PLAN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -n "$POST_COMMENT" ]; then
  BODY=$(echo "$PLAN" | python3 -c "
import sys, json
from datetime import date, timedelta
try:
    d = json.load(sys.stdin)
    today = date.today()
    end   = today + timedelta(days=14)
    lines = [
        f'## Sprint {today} → {end}',
        f'**Goal:** {d.get(\"goal\",\"?\")}',
        f'**Capacidade:** {d.get(\"capacity\",\"?\")}',
        '',
        '## Issues',
        '| # | Motivo |',
        '|---|--------|',
    ]
    for s in d.get('selected', []):
        lines.append(f'| #{s[\"issue\"]} | {s[\"reason\"]} |')
    defer = d.get('defer', [])
    if defer:
        lines.append('')
        lines.append('## Adiadas')
        for s in defer:
            lines.append(f'- #{s[\"issue\"]}: {s[\"reason\"]}')
    print('\n'.join(lines))
except Exception:
    print(sys.stdin.read())
")
  gh issue create \
    --title "chore(sprint): planejamento $(date +%Y-%m-%d)" \
    --body "$BODY" \
    --label "chore" \
    && echo "✅ Issue de sprint criada!"
fi
