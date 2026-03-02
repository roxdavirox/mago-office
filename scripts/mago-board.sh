#!/bin/bash
# scripts/mago-board.sh — Gerenciamento completo do GitHub Projects board
#
# Subcomandos:
#   status               — Visão geral por coluna (Status)
#   backfill             — Preencher Priority+Size em itens sem esses campos
#   sync                 — Adicionar issues/PRs/discussions faltando no board
#   report               — Relatório markdown completo
#   set <N> <campo> <v>  — Atualizar campo de um item (priority|size|status)
#   discuss              — Listar discussions e estado no board
#
# Exemplos:
#   bash scripts/mago-board.sh status
#   bash scripts/mago-board.sh backfill
#   bash scripts/mago-board.sh sync
#   bash scripts/mago-board.sh set 47 priority high
#   bash scripts/mago-board.sh set 47 size m

set -e

# ── Constantes ────────────────────────────────────────────────────────────────
PROJECT_ID="PVT_kwHOAPDgbs4BQglq"
REPO="roxdavirox/mago-office"

# Fields
STATUS_FIELD="PVTSSF_lAHOAPDgbs4BQglqzg-m2Sc"
PRIORITY_FIELD="PVTSSF_lAHOAPDgbs4BQglqzg-nNm4"
SIZE_FIELD="PVTSSF_lAHOAPDgbs4BQglqzg-nNnU"

# Status options
S_BACKLOG="8df12426"
S_TODO="532fc3d8"
S_IN_PROGRESS="b894fbad"
S_IN_REVIEW="c999db95"
S_DONE="c841d7a3"

# Priority options
P_URGENT="fd57bfad"
P_HIGH="e9333909"
P_MEDIUM="8cb7a262"
P_LOW="373ced67"

# Size options
SZ_XS="c4ee0f78"
SZ_S="8a34ec7b"
SZ_M="fbe25f78"
SZ_L="c15fe1d4"
SZ_XL="dcefc6fd"

CMD="${1:-status}"
shift || true

# ── Helpers ───────────────────────────────────────────────────────────────────

# Busca todos os itens do board com campos preenchidos
get_items() {
  gh api graphql -f query="
  {
    node(id: \"$PROJECT_ID\") {
      ... on ProjectV2 {
        items(first: 100) {
          nodes {
            id
            content {
              ... on Issue        { number title state labels(first:8){nodes{name}} }
              ... on PullRequest  { number title state }
              ... on DraftIssue  { title }
            }
            fieldValues(first: 10) {
              nodes {
                ... on ProjectV2ItemFieldSingleSelectValue {
                  name optionId
                  field { ... on ProjectV2SingleSelectField { name } }
                }
              }
            }
          }
        }
      }
    }
  }"
}

# Atualiza um campo single-select de um item do board
set_field() {
  local ITEM_ID="$1" FIELD_ID="$2" VALUE_ID="$3"
  gh api graphql -f query='
    mutation($p:ID!,$i:ID!,$f:ID!,$v:String!){
      updateProjectV2ItemFieldValue(input:{
        projectId:$p itemId:$i fieldId:$f
        value:{singleSelectOptionId:$v}
      }){projectV2Item{id}}
    }' \
    -f p="$PROJECT_ID" -f i="$ITEM_ID" \
    -f f="$FIELD_ID" -f v="$VALUE_ID" > /dev/null 2>&1
}

# Adiciona um item ao board pelo node_id (idempotente)
add_to_board() {
  local CONTENT_ID="$1"
  gh api graphql -f query='
    mutation($p:ID!,$c:ID!){
      addProjectV2ItemById(input:{projectId:$p,contentId:$c}){
        item{id}
      }
    }' \
    -f p="$PROJECT_ID" -f c="$CONTENT_ID" \
    --jq '.data.addProjectV2ItemById.item.id' 2>/dev/null || echo ""
}

# ── Comandos ──────────────────────────────────────────────────────────────────

case "$CMD" in

# ── status ────────────────────────────────────────────────────────────────────
status)
  echo "━━━ Board: mago-office ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  get_items | python3 -c "
import sys, json
data = json.load(sys.stdin)
items = data['data']['node']['items']['nodes']

by_status = {}
missing_fields = []

for item in items:
    c = item.get('content', {})
    if not c: continue
    num = c.get('number', '?')
    title = c.get('title', '?')[:52]
    fvs = {fv.get('field',{}).get('name'): fv.get('name','—') for fv in item['fieldValues']['nodes'] if fv}
    status   = fvs.get('Status',   '—')
    priority = fvs.get('Priority', '—')
    size     = fvs.get('Size',     '—')
    by_status.setdefault(status, []).append((num, title, priority, size))
    if priority == '—' or size == '—':
        missing_fields.append(num)

icons = {'Todo':'📋','In Progress':'🔄','In Review':'👀','Backlog':'🗂️','Done':'✅','—':'❓'}
order = ['Todo','In Progress','In Review','Backlog','Done','—']

for s in order:
    if s not in by_status: continue
    lst = by_status[s]
    print(f'\n{icons.get(s,\"\")} {s} ({len(lst)})')
    for num, title, p, sz in lst:
        p_flag  = '⚠️ ' if p  == '—' else ''
        sz_flag = '⚠️ ' if sz == '—' else ''
        print(f'  #{num:3}  [{sz_flag}{sz:3}]  {p_flag}{p:8}  {title}')

total = sum(len(v) for v in by_status.values())
print(f'\nTotal: {total} itens')
if missing_fields:
    print(f'⚠️  Campos faltando em: #{\", #\".join(str(n) for n in missing_fields)}')
    print('   → Execute: bash scripts/mago-board.sh backfill')
"
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  ;;

# ── backfill ──────────────────────────────────────────────────────────────────
backfill)
  echo "⚙️  Backfill: preenchendo Priority + Size em todos os itens..."
  echo ""

  get_items | python3 -c "
import sys, json, subprocess

data = json.load(sys.stdin)
items = data['data']['node']['items']['nodes']

PROJECT_ID    = 'PVT_kwHOAPDgbs4BQglq'
PRIORITY_FIELD = 'PVTSSF_lAHOAPDgbs4BQglqzg-nNm4'
SIZE_FIELD     = 'PVTSSF_lAHOAPDgbs4BQglqzg-nNnU'

P  = {'urgent':'fd57bfad','high':'e9333909','medium':'8cb7a262','low':'373ced67'}
SZ = {'xs':'c4ee0f78','s':'8a34ec7b','m':'fbe25f78','l':'c15fe1d4','xl':'dcefc6fd'}

def infer_priority(labels, title):
    for l in labels:
        if l == 'priority:urgent': return 'urgent'
        if l == 'priority:high':   return 'high'
        if l == 'priority:medium': return 'medium'
        if l == 'priority:low':    return 'low'
    t = title.lower()
    high_kw = ['scaffold','vite.config','eslint','socket.io-client','useofficestate',
                'humanavatar','agentdetailpanel','officecanvas','broadcast','office-layout',
                'github actions','ci.yml','in-memory','position store','office:join',
                'websocket.service','office state endpoint']
    med_kw  = ['speechbubble','lista de usuarios','hacker mode','input de mensagem',
                'agentavatar','officeroom','socket','playwright','getagentposition']
    low_kw  = ['tooltip','aria','docs','readme','anti-','role=status']
    if any(k in t for k in high_kw): return 'high'
    if any(k in t for k in med_kw):  return 'medium'
    if any(k in t for k in low_kw):  return 'low'
    return 'medium'

def infer_size(labels, title):
    # Labels size:* têm prioridade absoluta
    for l in labels:
        if l == 'size:xs': return 'xs'
        if l == 'size:s':  return 's'
        if l == 'size:m':  return 'm'
        if l == 'size:l':  return 'l'
        if l == 'size:xl': return 'xl'
    t = title.lower()
    xs_kw = ['aria','readme','docs:','anti-','click no agent','role=status',
              'configurar vite','getagentposition','atributos aria','extrair constantes',
              'tooltip','configurar eslint','ajust','fix typo','renomear',
              'office:join','office:move','office:leave','get /office']
    m_kw  = ['officecanvas','officeroom','useofficestate','humanavatar','agentdetailpanel',
              'agentavatar','office-layout.ts','estado central','conexao com',
              'playwright','e2e','arrastar','setup playwright','position store',
              'websocket.service','extend websocket']
    if any(k in t for k in xs_kw): return 'xs'
    if any(k in t for k in m_kw):  return 'm'
    return 's'

def set_field(item_id, field_id, value_id):
    mutation = ('mutation($p:ID!,$i:ID!,$f:ID!,$v:String!){'
                'updateProjectV2ItemFieldValue(input:{projectId:$p,itemId:$i,'
                'fieldId:$f,value:{singleSelectOptionId:$v}}){projectV2Item{id}}}')
    subprocess.run(
        ['gh','api','graphql','-f',f'query={mutation}',
         '-f',f'p={PROJECT_ID}','-f',f'i={item_id}',
         '-f',f'f={field_id}','-f',f'v={value_id}'],
        capture_output=True)

updated = 0
for item in items:
    c = item.get('content', {})
    if not c: continue
    item_id = item['id']
    num     = c.get('number', '?')
    title   = c.get('title',  '?')
    labels  = [l['name'] for l in c.get('labels', {}).get('nodes', [])]

    fvs      = {fv.get('field',{}).get('name'): fv.get('name','—') for fv in item['fieldValues']['nodes'] if fv}
    priority = fvs.get('Priority', '—')
    size     = fvs.get('Size',     '—')

    changed = []

    if priority == '—':
        p = infer_priority(labels, title)
        set_field(item_id, PRIORITY_FIELD, P[p])
        changed.append(f'Priority→{p}')

    if size == '—':
        s = infer_size(labels, title)
        set_field(item_id, SIZE_FIELD, SZ[s])
        changed.append(f'Size→{s}')

    if changed:
        print(f'  #{num:3}  {\" | \".join(changed)}  — {title[:55]}')
        updated += 1

print(f'\n✅ {updated} itens atualizados')
if updated == 0:
    print('Todos os itens já estão com Priority e Size preenchidos.')
"
  ;;

# ── sync ──────────────────────────────────────────────────────────────────────
sync)
  echo "🔄 Sync: verificando itens fora do board..."
  echo ""

  # Itens já no board
  BOARD_NUMS=$(get_items | python3 -c "
import sys, json
data = json.load(sys.stdin)
nums = set()
for item in data['data']['node']['items']['nodes']:
    c = item.get('content', {})
    n = c.get('number')
    if n: nums.add(str(n))
print(' '.join(sorted(nums, key=int)))
")
  echo "Itens no board: $BOARD_NUMS"
  echo ""

  # Issues abertas não no board
  echo "── Issues ──────────────────────────────────────────────────"
  gh issue list --state all --json number,id,title,state --limit 100 | \
  python3 -c "
import sys, json, subprocess
board = set(sys.argv[1].split())
issues = json.load(sys.stdin)
PROJECT_ID   = 'PVT_kwHOAPDgbs4BQglq'
STATUS_FIELD  = 'PVTSSF_lAHOAPDgbs4BQglqzg-m2Sc'
S_TODO = '532fc3d8'
S_DONE = 'c841d7a3'

missing = [i for i in issues if str(i['number']) not in board]
if not missing:
    print('  ✅ Todas as issues já estão no board')
else:
    for i in missing:
        print(f'  Adicionando #{i[\"number\"]} ({i[\"state\"]}) — {i[\"title\"][:55]}')
        m = 'mutation($p:ID!,$c:ID!){addProjectV2ItemById(input:{projectId:$p,contentId:$c}){item{id}}}'
        r = subprocess.run(['gh','api','graphql','-f',f'query={m}',
                            '-f',f'p={PROJECT_ID}','-f',f'c={i[\"id\"]}'],
                           capture_output=True, text=True)
        try:
            item_id = json.loads(r.stdout)['data']['addProjectV2ItemById']['item']['id']
            status_val = S_DONE if i['state'] == 'CLOSED' else S_TODO
            m2 = ('mutation($p:ID!,$i:ID!,$f:ID!,$v:String!){'
                  'updateProjectV2ItemFieldValue(input:{projectId:$p,itemId:$i,'
                  'fieldId:$f,value:{singleSelectOptionId:$v}}){projectV2Item{id}}}')
            subprocess.run(['gh','api','graphql','-f',f'query={m2}',
                            '-f',f'p={PROJECT_ID}','-f',f'i={item_id}',
                            '-f',f'f={STATUS_FIELD}','-f',f'v={status_val}'],
                           capture_output=True)
            label = 'Done' if i['state'] == 'CLOSED' else 'Todo'
            print(f'    ✅ Adicionado → {label}')
        except Exception as e:
            print(f'    ❌ Erro: {e}')
" -- "$BOARD_NUMS"

  # Discussions
  echo ""
  echo "── Discussions ─────────────────────────────────────────────"
  gh api graphql -f query='
  {
    repository(owner:"roxdavirox",name:"mago-office"){
      discussions(first:30){
        nodes{ id number title category{name} }
      }
    }
  }' | python3 -c "
import sys, json, subprocess
data = json.load(sys.stdin)
discussions = data['data']['repository']['discussions']['nodes']
PROJECT_ID  = 'PVT_kwHOAPDgbs4BQglq'
STATUS_FIELD = 'PVTSSF_lAHOAPDgbs4BQglqzg-m2Sc'
S_BACKLOG   = '8df12426'
S_DONE      = 'c841d7a3'

# Discussions resolvidas (decisão tomada)
resolved = {27, 28, 29}  # Office View → standalone, Hacker Mode → feito, Sprint #1 → passado

for d in discussions:
    num    = d['number']
    cat    = d['category']['name']
    title  = d['title'][:55]
    print(f'  Discussion #{num} [{cat}] {title}')
    m = 'mutation($p:ID!,$c:ID!){addProjectV2ItemById(input:{projectId:$p,contentId:$c}){item{id}}}'
    r = subprocess.run(['gh','api','graphql','-f',f'query={m}',
                        '-f',f'p={PROJECT_ID}','-f',f'c={d[\"id\"]}'],
                       capture_output=True, text=True)
    try:
        result = json.loads(r.stdout)
        item_id = result['data']['addProjectV2ItemById']['item']['id']
        status_val = S_DONE if num in resolved else S_BACKLOG
        label = 'Done' if num in resolved else 'Backlog'
        m2 = ('mutation($p:ID!,$i:ID!,$f:ID!,$v:String!){'
              'updateProjectV2ItemFieldValue(input:{projectId:$p,itemId:$i,'
              'fieldId:$f,value:{singleSelectOptionId:$v}}){projectV2Item{id}}}')
        subprocess.run(['gh','api','graphql','-f',f'query={m2}',
                        '-f',f'p={PROJECT_ID}','-f',f'i={item_id}',
                        '-f',f'f={STATUS_FIELD}','-f',f'v={status_val}'],
                       capture_output=True)
        print(f'    ✅ Board → {label}')
    except Exception as e:
        print(f'    ⚠️  Discussions não suportadas via API: {e}')
        if r.stderr:
            print(f'       {r.stderr[:100]}')
"
  echo ""
  echo "✅ Sync concluído. Execute 'backfill' para preencher Priority+Size."
  ;;

# ── report ────────────────────────────────────────────────────────────────────
report)
  echo ""
  get_items | python3 -c "
import sys, json
from datetime import date

data = json.load(sys.stdin)
items = data['data']['node']['items']['nodes']

by_status = {}
for item in items:
    c = item.get('content', {})
    if not c: continue
    num   = c.get('number','?')
    title = c.get('title','?')
    fvs   = {fv.get('field',{}).get('name'): fv.get('name','—') for fv in item['fieldValues']['nodes'] if fv}
    status   = fvs.get('Status','—')
    priority = fvs.get('Priority','—')
    size     = fvs.get('Size','—')
    by_status.setdefault(status,[]).append({'num':num,'title':title,'priority':priority,'size':size})

total = sum(len(v) for v in by_status.values())
done  = len(by_status.get('Done',[]))
todo  = len(by_status.get('Todo',[]))

print(f'# 📊 Board Report — mago-office')
print(f'> Gerado em {date.today()} · Total: {total} itens · Done: {done} · Todo: {todo}')
print()

order = ['Todo','In Progress','In Review','Backlog','Done','—']
icons = {'Todo':'📋','In Progress':'🔄','In Review':'👀','Backlog':'🗂️','Done':'✅','—':'❓'}

for s in order:
    if s not in by_status: continue
    lst = by_status[s]
    print(f'## {icons.get(s,\"\")} {s} ({len(lst)})')
    print()
    print('| # | Size | Priority | Título |')
    print('|---|------|----------|--------|')
    for i in lst:
        p_flag  = '⚠️' if i['priority'] == '—' else ''
        sz_flag = '⚠️' if i['size']     == '—' else ''
        print(f'| #{i[\"num\"]} | {sz_flag}{i[\"size\"]} | {p_flag}{i[\"priority\"]} | {i[\"title\"][:70]} |')
    print()
"
  ;;

# ── discuss ───────────────────────────────────────────────────────────────────
discuss)
  echo "💬 Discussions do repositório:"
  echo ""
  gh api graphql -f query='
  {
    repository(owner:"roxdavirox",name:"mago-office"){
      discussions(first:30){
        nodes{
          number title url
          category{name}
          comments{totalCount}
          isAnswered
        }
      }
    }
  }' | python3 -c "
import sys, json
data = json.load(sys.stdin)
for d in data['data']['repository']['discussions']['nodes']:
    answered = '✅' if d['isAnswered'] else '💬'
    print(f'  {answered} #{d[\"number\"]} [{d[\"category\"][\"name\"]}] {d[\"title\"]}')
    print(f'     {d[\"url\"]} ({d[\"comments\"][\"totalCount\"]} comentários)')
    print()
"
  ;;

# ── set ───────────────────────────────────────────────────────────────────────
set)
  ISSUE_NUM="${1:?'Uso: mago-board.sh set <N> priority|size|status <valor>'}"
  FIELD_NAME="${2:?'Campo obrigatório: priority|size|status'}"; FIELD_NAME="${FIELD_NAME,,}"
  FIELD_VALUE="${3:?'Valor obrigatório'}"; FIELD_VALUE="${FIELD_VALUE,,}"

  # Achar item_id no board pelo número da issue/PR
  ITEM_ID=$(get_items | python3 -c "
import sys, json
data = json.load(sys.stdin)
for item in data['data']['node']['items']['nodes']:
    c = item.get('content',{})
    if str(c.get('number','')) == '$ISSUE_NUM':
        print(item['id'])
        break
" 2>/dev/null)

  if [ -z "$ITEM_ID" ]; then
    echo "❌ #$ISSUE_NUM não encontrado no board. Execute 'sync' primeiro."
    exit 1
  fi

  case "$FIELD_NAME" in
    priority)
      case "$FIELD_VALUE" in
        urgent) set_field "$ITEM_ID" "$PRIORITY_FIELD" "$P_URGENT" ;;
        high)   set_field "$ITEM_ID" "$PRIORITY_FIELD" "$P_HIGH"   ;;
        medium) set_field "$ITEM_ID" "$PRIORITY_FIELD" "$P_MEDIUM" ;;
        low)    set_field "$ITEM_ID" "$PRIORITY_FIELD" "$P_LOW"    ;;
        *) echo "Priority: urgent|high|medium|low"; exit 1 ;;
      esac
      echo "✅ #$ISSUE_NUM Priority → $FIELD_VALUE"
      ;;
    size)
      case "$FIELD_VALUE" in
        xs) set_field "$ITEM_ID" "$SIZE_FIELD" "$SZ_XS" ;;
        s)  set_field "$ITEM_ID" "$SIZE_FIELD" "$SZ_S"  ;;
        m)  set_field "$ITEM_ID" "$SIZE_FIELD" "$SZ_M"  ;;
        l)  set_field "$ITEM_ID" "$SIZE_FIELD" "$SZ_L"  ;;
        xl) set_field "$ITEM_ID" "$SIZE_FIELD" "$SZ_XL" ;;
        *) echo "Size: xs|s|m|l|xl"; exit 1 ;;
      esac
      echo "✅ #$ISSUE_NUM Size → $FIELD_VALUE"
      # Aplica label de size também na issue
      gh issue edit "$ISSUE_NUM" --add-label "size:$FIELD_VALUE" 2>/dev/null || true
      ;;
    status)
      case "$FIELD_VALUE" in
        backlog)      set_field "$ITEM_ID" "$STATUS_FIELD" "$S_BACKLOG"     ;;
        todo)         set_field "$ITEM_ID" "$STATUS_FIELD" "$S_TODO"        ;;
        "in progress"|inprogress) set_field "$ITEM_ID" "$STATUS_FIELD" "$S_IN_PROGRESS" ;;
        "in review"|inreview)     set_field "$ITEM_ID" "$STATUS_FIELD" "$S_IN_REVIEW"   ;;
        done)         set_field "$ITEM_ID" "$STATUS_FIELD" "$S_DONE"        ;;
        *) echo "Status: backlog|todo|in progress|in review|done"; exit 1 ;;
      esac
      echo "✅ #$ISSUE_NUM Status → $FIELD_VALUE"
      ;;
    *)
      echo "Campo inválido. Use: priority | size | status"
      exit 1
      ;;
  esac
  ;;

*)
  echo "Uso: bash scripts/mago-board.sh <subcomando>"
  echo ""
  echo "  status              Visão geral por coluna"
  echo "  backfill            Preencher Priority+Size faltando"
  echo "  sync                Adicionar issues/discussions faltando"
  echo "  report              Relatório markdown completo"
  echo "  discuss             Listar discussions"
  echo "  set <N> <campo> <v> Atualizar campo (priority|size|status)"
  echo ""
  echo "Exemplos:"
  echo "  bash scripts/mago-board.sh set 47 priority high"
  echo "  bash scripts/mago-board.sh set 23 size l"
  exit 1
  ;;

esac
