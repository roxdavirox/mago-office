#!/bin/bash
# scripts/mago-sprint.sh — Planejamento de sprint via rx-orchestrator (MAGO)
#
# Uso: ./scripts/mago-sprint.sh [--post]
#   --post: Posta plano como discussion ou issue no repo

set -e

POST_COMMENT=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --post) POST_COMMENT=1; shift ;;
    *) shift ;;
  esac
done

CELEBRO_URL="${CELEBRO_URL:-http://localhost:3099/chat}"

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
    kind = next((l for l in labels if l not in ['feature','frontend','backend','ui','animation','test','chore'] and not l.startswith('priority:')), '')
    lines.append(f\"#{i['number']} [{priority}] {i['title']}\")
print('\n'.join(lines))
")

echo "Issues abertas:"
echo "$OPEN_ISSUES"
echo ""

# Montar request e chamar Celebro via Python (evita problemas de escaping no shell)
RESPONSE=$(python3 - "$CELEBRO_URL" <<PYEOF
import sys, json, urllib.request

celebro_url = sys.argv[1]
open_issues = """$OPEN_ISSUES"""

prompt = f"""Você é rx-orchestrator do MAGO. Planeje o próximo sprint (2 semanas) para o projeto mago-office.

Contexto: App React 19 + Framer Motion — escritório virtual 2D com avatares de agentes IA.

Issues abertas:
{open_issues}

Critérios: priority:high primeiro, dependências técnicas antes de feat, equilibrar feat/test/chore, sprint realista 1 dev 80h.

Responda EXATAMENTE neste JSON (sem texto fora do JSON):
{{
  "sprint_goal": "<objetivo em 1 frase>",
  "capacity": "<estimativa total>",
  "selected": [{{"issue": 0, "priority": "alta|media|baixa", "reason": "<justificativa>", "size": "XS|S|M|L|XL"}}],
  "deferred": [{{"issue": 0, "reason": "<motivo>"}}],
  "risks": ["<risco>"]
}}"""

payload = json.dumps({{"text": prompt, "agent": "rx-orchestrator"}}).encode()
req = urllib.request.Request(celebro_url, data=payload,
      headers={{"Content-Type": "application/json"}})
try:
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read())
        print(data.get("response", ""))
except Exception as e:
    print(f"ERRO: {{e}}", file=sys.stderr)
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
        print(text)
else:
    print(text)
")

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎯 Plano rx-orchestrator"
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
        print(f\"  #{s['issue']} [{s['size']}] {s['priority'].upper()} — {s['reason']}\")
    deferred = d.get('deferred', [])
    if deferred:
        print()
        print('⏭️  Adiadas:')
        for s in deferred:
            print(f\"  #{s['issue']} — {s['reason']}\")
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

# Postar como issue de sprint no repo
if [ -n "$POST_COMMENT" ]; then
  SPRINT_BODY=$(echo "$PLAN" | python3 -c "
import sys, json
from datetime import date, timedelta
try:
    d = json.load(sys.stdin)
    today = date.today()
    end = today + timedelta(days=14)
    goal = d.get('sprint_goal','?')
    capacity = d.get('capacity','?')
    selected = d.get('selected', [])
    deferred = d.get('deferred', [])
    risks = d.get('risks', [])

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
        lines.append(f\"| #{s['issue']} | {s['size']} | {s['priority']} | {s['reason']} |\")
    if deferred:
        lines.append('')
        lines.append('## Adiadas')
        for s in deferred:
            lines.append(f\"- #{s['issue']}: {s['reason']}\")
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
