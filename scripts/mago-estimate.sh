#!/bin/bash
# scripts/mago-estimate.sh — Estimativa de issue via rx-architect (Celebro) com fallback OpenCode
#
# Uso: ./scripts/mago-estimate.sh <ISSUE_NUMBER> [--board] [--comment]
#   --board:   Atualiza campo Size no GitHub Projects board
#   --comment: Posta plano como comentário na issue

set -e

ISSUE_NUMBER=""
UPDATE_BOARD=""
POST_COMMENT=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --board)   UPDATE_BOARD=1; shift ;;
    --comment) POST_COMMENT=1; shift ;;
    *)         ISSUE_NUMBER="$1"; shift ;;
  esac
done

if [ -z "$ISSUE_NUMBER" ]; then
  echo "Uso: ./scripts/mago-estimate.sh <ISSUE_NUMBER> [--board] [--comment]"
  exit 1
fi

CELEBRO_URL="${CELEBRO_URL:-http://localhost:3099/chat}"
MODEL="${OPENCODE_MODEL:-opencode/minimax-m2.5-free}"
OPENCODE="${OPENCODE_BIN:-/home/rx/.opencode/bin/opencode}"
PROJECT_ID="PVT_kwHOAPDgbs4BQglq"
SIZE_FIELD_ID="PVTSSF_lAHOAPDgbs4BQglqzg-nNnU"
SIZE_IDS='{"XS":"c4ee0f78","S":"8a34ec7b","M":"fbe25f78","L":"c15fe1d4","XL":"dcefc6fd"}'

# Buscar dados da issue
ISSUE=$(gh issue view "$ISSUE_NUMBER" --json title,body,labels)
TITLE=$(echo "$ISSUE" | python3 -c "import sys,json; print(json.load(sys.stdin)['title'])")
BODY=$(echo "$ISSUE"  | python3 -c "import sys,json; print(json.load(sys.stdin)['body'] or '')" | head -c 1000)
LABELS=$(echo "$ISSUE" | python3 -c "import sys,json; print(', '.join(l['name'] for l in json.load(sys.stdin)['labels']))")

echo "🏗️  Consultando rx-architect para issue #$ISSUE_NUMBER..."
echo "   $TITLE"
echo ""

PROMPT="Você é rx-architect do MAGO. Estime esforço e planeje implementação desta issue do projeto mago-office (app React 19 + Vite 6 + TypeScript strict + Framer Motion + socket.io-client — escritório virtual 2D com avatares de agentes IA).

**Issue #$ISSUE_NUMBER: $TITLE**
Labels: $LABELS

$BODY

Responda EXATAMENTE neste JSON (sem texto fora do JSON):
{
  \"size\": \"XS\" | \"S\" | \"M\" | \"L\" | \"XL\",
  \"hours\": \"<estimativa ex: 1-2h>\",
  \"steps\": [
    {\"order\": 1, \"title\": \"<titulo>\", \"detail\": \"<detalhe tecnico>\"},
    ...
  ],
  \"risks\": [\"<risco se houver>\"],
  \"dependencies\": [\"<dep se houver>\"]
}

Critérios de size:
- XS: 1-2h trivial
- S: meio dia pequeno
- M: 1 dia médio
- L: 2-3 dias grande
- XL: semana+ (sugerir quebrar)"

# ── Tentar Celebro primeiro ────────────────────────────────────────────────────
PLAN=""
BACKEND=""

if curl -s --connect-timeout 2 "$CELEBRO_URL" > /dev/null 2>&1; then
  echo "   via rx-architect (Celebro)..."
  TMPFILE=$(mktemp)
  printf '%s' "$PROMPT" > "$TMPFILE"
  PAYLOAD=$(python3 -c "
import json, sys
text = open(sys.argv[1]).read()
print(json.dumps({'text': text, 'agent': 'rx-architect'}))
" "$TMPFILE")
  rm -f "$TMPFILE"

  RESPONSE=$(curl -s --max-time 30 -X POST "$CELEBRO_URL" \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD" \
    | python3 -c "import sys,json; print(json.load(sys.stdin).get('response',''))" 2>/dev/null || echo "")

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
fi

# ── Fallback para OpenCode se Celebro falhou ──────────────────────────────────
if [[ -z "$PLAN" ]]; then
  if [ ! -f "$OPENCODE" ]; then
    echo "⚠️  Celebro indisponível e OpenCode não encontrado em $OPENCODE"
    exit 0
  fi
  echo "   via OpenCode (fallback)..."
  TMPFILE=$(mktemp)
  printf '%s' "$PROMPT" > "$TMPFILE"
  RAW=$(timeout 60 "$OPENCODE" run -m "$MODEL" "$(cat "$TMPFILE")" 2>&1 \
    | sed 's/\x1b\[[0-9;]*[A-Za-z]//g')
  rm -f "$TMPFILE"

  # Normalizar JSON do OpenCode para formato Celebro (steps como objetos)
  PLAN=$(echo "$RAW" | python3 -c "
import sys, json, re
text = sys.stdin.read()
match = re.search(r'\{[\s\S]*\}', text)
if match:
    try:
        d = json.loads(match.group(0))
        steps = d.get('steps', [])
        if steps and isinstance(steps[0], str):
            d['steps'] = [{'order': i+1, 'title': s, 'detail': ''} for i, s in enumerate(steps)]
        if 'minutes' in d and 'hours' not in d:
            mins = d.get('minutes', 0)
            d['hours'] = f'{mins}min' if mins < 60 else f'{mins//60}h'
        if 'split' in d and 'dependencies' not in d:
            d['dependencies'] = d.pop('split')
        print(json.dumps(d, indent=2, ensure_ascii=False))
    except Exception:
        print(text)
" 2>/dev/null || echo "")
  [[ -n "$PLAN" ]] && BACKEND="opencode"
fi

if [[ -z "$PLAN" ]]; then
  echo "⚠️  Nenhum backend disponível — estimativa indisponível"
  exit 0
fi

SIZE=$(echo "$PLAN" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('size','M'))" 2>/dev/null || echo "M")
HOURS=$(echo "$PLAN" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('hours','?'))" 2>/dev/null || echo "?")

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📐 Estimativa rx-architect"
echo "   Size: $SIZE ($HOURS) [via $BACKEND]"
echo ""
echo "$PLAN" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    for s in d.get('steps', []):
        if isinstance(s, dict):
            print(f\"  {s.get('order','•')}. {s.get('title','')}\")
            if s.get('detail'):
                print(f\"     {s['detail']}\")
            print()
        else:
            print(f'  • {s}')
    risks = d.get('risks', [])
    if risks:
        print('  ⚠️  Riscos:', ', '.join(risks))
    deps = d.get('dependencies', [])
    if deps:
        print('  🔗 Deps:', ', '.join(deps))
except:
    print(sys.stdin.read())
" 2>/dev/null || echo "$PLAN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── Atualizar campo Size no board ─────────────────────────────────────────────
if [ -n "$UPDATE_BOARD" ]; then
  SIZE_OPTION=$(echo "$SIZE_IDS" | python3 -c \
    "import sys,json; d=json.load(sys.stdin); print(d.get('$SIZE', d['M']))")
  ISSUE_NODE=$(gh api "repos/roxdavirox/mago-office/issues/$ISSUE_NUMBER" --jq '.node_id')
  ITEM_ID=$(gh api graphql -f query='
    mutation($p:ID!,$c:ID!){addProjectV2ItemById(input:{projectId:$p,contentId:$c}){item{id}}}
  ' -f p="$PROJECT_ID" -f c="$ISSUE_NODE" --jq '.data.addProjectV2ItemById.item.id')

  gh api graphql -f query='
    mutation($p:ID!,$i:ID!,$f:ID!,$v:String!){
      updateProjectV2ItemFieldValue(input:{
        projectId:$p itemId:$i fieldId:$f value:{singleSelectOptionId:$v}
      }){projectV2Item{id}}
    }
  ' -f p="$PROJECT_ID" -f i="$ITEM_ID" -f f="$SIZE_FIELD_ID" -f v="$SIZE_OPTION" > /dev/null
  SIZE_LOWER=$(echo "$SIZE" | tr '[:upper:]' '[:lower:]')
  gh issue edit "$ISSUE_NUMBER" --add-label "size:$SIZE_LOWER" 2>/dev/null || true
  echo "✅ Board atualizado: Size=$SIZE na issue #$ISSUE_NUMBER"
fi

# ── Postar plano como comentário na issue ─────────────────────────────────────
if [ -n "$POST_COMMENT" ]; then
  COMMENT=$(echo "$PLAN" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    size  = d.get('size','?')
    hours = d.get('hours','?')
    steps = d.get('steps', [])
    risks = d.get('risks', [])
    deps  = d.get('dependencies', [])
    lines = [
        '## 🏗️ Plano rx-architect',
        '',
        f'**Size:** \`{size}\` ({hours})',
        '',
        '### Passos',
    ]
    for s in steps:
        if isinstance(s, dict):
            lines.append(f\"{s.get('order','•')}. **{s.get('title','')}**\")
            if s.get('detail'):
                lines.append(f\"   {s['detail']}\")
        else:
            lines.append(f'- {s}')
    if risks:
        lines.append('')
        lines.append('### Riscos')
        for r in risks: lines.append(f'- ⚠️ {r}')
    if deps:
        lines.append('')
        lines.append('### Dependências')
        for dep in deps: lines.append(f'- 🔗 {dep}')
    lines.append('')
    lines.append('---')
    lines.append('*Estimativa automática via rx-architect (MAGO)*')
    print('\n'.join(lines))
except Exception:
    print(sys.stdin.read())
")
  gh issue comment "$ISSUE_NUMBER" --body "$COMMENT"
  echo "✅ Plano postado na issue #$ISSUE_NUMBER"
fi
