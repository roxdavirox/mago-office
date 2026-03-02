#!/bin/bash
# scripts/mago-estimate.sh — Estimativa de issue via rx-architect (MAGO)
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
- M: 1 dia medio
- L: 2-3 dias grande
- XL: semana+ (sugerir quebrar)"

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
  | python3 -c "import sys,json; print(json.load(sys.stdin).get('response',''))")

# Extrair JSON da resposta
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

SIZE=$(echo "$PLAN" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('size','M'))" 2>/dev/null || echo "M")
HOURS=$(echo "$PLAN" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('hours','?'))" 2>/dev/null || echo "?")

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📐 Estimativa rx-architect"
echo "   Size: $SIZE ($HOURS)"
echo ""
echo "$PLAN" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    for s in d.get('steps', []):
        print(f\"  {s['order']}. {s['title']}\")
        print(f\"     {s['detail']}\")
        print()
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

# Atualizar campo Size no board
if [ -n "$UPDATE_BOARD" ]; then
  SIZE_OPTION=$(echo "$SIZE_IDS" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('$SIZE', d['M']))")
  ISSUE_NODE=$(gh api "repos/$(gh repo view --json nameWithOwner --jq '.nameWithOwner')/issues/$ISSUE_NUMBER" --jq '.node_id')
  ITEM_ID=$(gh api graphql -f query='
    mutation($p:ID!,$c:ID!){addProjectV2ItemById(input:{projectId:$p,contentId:$c}){item{id}}}
  ' -f p="$PROJECT_ID" -f c="$ISSUE_NODE" --jq '.data.addProjectV2ItemById.item.id')

  gh api graphql -f query='
    mutation($p:ID!,$i:ID!,$f:ID!,$v:String!){
      updateProjectV2ItemFieldValue(input:{projectId:$p,itemId:$i,fieldId:$f,value:{singleSelectOptionId:$v}}){
        projectV2Item{id}
      }
    }
  ' -f p="$PROJECT_ID" -f i="$ITEM_ID" -f f="$SIZE_FIELD_ID" -f v="$SIZE_OPTION" > /dev/null
  echo "✅ Board atualizado: Size=$SIZE para issue #$ISSUE_NUMBER"
fi

# Postar plano como comentário na issue
if [ -n "$POST_COMMENT" ]; then
  COMMENT=$(echo "$PLAN" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    size = d.get('size','?')
    hours = d.get('hours','?')
    steps = d.get('steps', [])
    risks = d.get('risks', [])
    deps = d.get('dependencies', [])

    lines = [
        '## 🏗️ Plano rx-architect',
        '',
        f'**Size:** \`{size}\` ({hours})',
        '',
        '### Passos',
    ]
    for s in steps:
        lines.append(f\"{s['order']}. **{s['title']}**\")
        lines.append(f\"   {s['detail']}\")
    if risks:
        lines.append('')
        lines.append('### Riscos')
        for r in risks:
            lines.append(f'- ⚠️ {r}')
    if deps:
        lines.append('')
        lines.append('### Dependências')
        for dep in deps:
            lines.append(f'- 🔗 {dep}')
    lines.append('')
    lines.append('---')
    lines.append('*Estimativa automática via rx-architect (MAGO)*')
    print('\n'.join(lines))
except Exception as e:
    print(sys.stdin.read())
")
  gh issue comment "$ISSUE_NUMBER" --body "$COMMENT"
  echo "✅ Plano postado na issue #$ISSUE_NUMBER"
fi
