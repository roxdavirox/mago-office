#!/bin/bash
# scripts/mago-estimate.sh — Estimativa de issue via OpenCode
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

MODEL="${OPENCODE_MODEL:-opencode/minimax-m2.5-free}"
OPENCODE="${OPENCODE_BIN:-/home/rx/.opencode/bin/opencode}"
PROJECT_ID="PVT_kwHOAPDgbs4BQglq"
SIZE_FIELD_ID="PVTSSF_lAHOAPDgbs4BQglqzg-nNnU"
SIZE_IDS='{"XS":"c4ee0f78","S":"8a34ec7b","M":"fbe25f78","L":"c15fe1d4","XL":"dcefc6fd"}'

if [ ! -f "$OPENCODE" ]; then
  echo "Erro: opencode não encontrado em $OPENCODE"
  exit 1
fi

# Buscar dados da issue
ISSUE=$(gh issue view "$ISSUE_NUMBER" --json title,body,labels)
TITLE=$(echo "$ISSUE" | python3 -c "import sys,json; print(json.load(sys.stdin)['title'])")
BODY=$(echo "$ISSUE"  | python3 -c "import sys,json; print((json.load(sys.stdin)['body'] or '')[:1500])")
LABELS=$(echo "$ISSUE" | python3 -c "import sys,json; print(', '.join(l['name'] for l in json.load(sys.stdin)['labels']))")

echo "📐 Estimando issue #$ISSUE_NUMBER..."
echo "   $TITLE"
echo ""

PROMPT="Estime o esforço desta issue do projeto mago-office (React 19 + Vite + TypeScript + Framer Motion — escritório virtual 2D).

Issue #$ISSUE_NUMBER: $TITLE
Labels: $LABELS

$BODY

Responda SOMENTE em JSON válido, sem texto fora:
{
  \"size\": \"XS|S|M|L|XL\",
  \"minutes\": <número inteiro>,
  \"steps\": [\"passo 1\", \"passo 2\"],
  \"risks\": [\"risco se houver\"],
  \"split\": [\"sub-issue se L ou XL\"]
}

Critérios (issues devem caber em até 30 min):
- XS: <10min — 1 arquivo, mudança trivial
- S:  ~15min — 1-2 arquivos, adição pequena
- M:  ~30min — 2-4 arquivos, feature completa pequena (máximo aceitável)
- L:  >30min — QUEBRAR antes. Liste sub-issues em \"split\"
- XL: nunca aceitar — sempre quebrar"

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

SIZE=$(echo "$PLAN" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('size','S').upper())" 2>/dev/null || echo "S")
MINS=$(echo "$PLAN" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('minutes','?'))" 2>/dev/null || echo "?")

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Size: $SIZE (~${MINS}min)  [máx 30min]"
echo ""
echo "$PLAN" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    for s in d.get('steps', []):
        print(f'  • {s}')
    risks = d.get('risks', [])
    if risks:
        print()
        print('  Riscos:', ', '.join(risks))
    split = d.get('split', [])
    if split:
        print()
        print('  ⚠️  L/XL — quebrar em:')
        for s in split:
            print(f'    - {s}')
except Exception:
    print(sys.stdin.read())
" 2>/dev/null || echo "$PLAN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Atualizar campo Size no board
if [ -n "$UPDATE_BOARD" ]; then
  SIZE_OPTION=$(echo "$SIZE_IDS" | python3 -c \
    "import sys,json; d=json.load(sys.stdin); print(d.get('$SIZE', d['S']))")
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
  # Aplicar label de size na issue também
  SIZE_LOWER=$(echo "$SIZE" | tr '[:upper:]' '[:lower:]')
  gh issue edit "$ISSUE_NUMBER" --add-label "size:$SIZE_LOWER" 2>/dev/null || true
  echo "✅ Board: Size=$SIZE na issue #$ISSUE_NUMBER"
fi

# Postar plano como comentário na issue
if [ -n "$POST_COMMENT" ]; then
  COMMENT=$(echo "$PLAN" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    size  = d.get('size','?')
    mins  = d.get('minutes','?')
    steps = d.get('steps', [])
    risks = d.get('risks', [])
    split = d.get('split', [])
    lines = [
        '## 📐 Estimativa',
        f'**Size:** \`{size}\` (~{mins}min)',
        '',
        '**Passos:**',
    ]
    for s in steps:
        lines.append(f'- {s}')
    if split:
        lines.append('')
        lines.append('**⚠️ Issue grande — quebrar em:**')
        for s in split:
            lines.append(f'- {s}')
    if risks:
        lines.append('')
        lines.append('**Riscos:** ' + ', '.join(risks))
    print('\n'.join(lines))
except Exception:
    print(sys.stdin.read())
")
  gh issue comment "$ISSUE_NUMBER" --body "$COMMENT"
  echo "✅ Plano postado na issue #$ISSUE_NUMBER"
fi
