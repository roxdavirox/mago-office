#!/bin/bash
# Cria branch padronizada a partir de issue + atualiza board para In Progress
# Uso: ./scripts/branch-create.sh <issue-number>

set -e

ISSUE=$1

if [[ -z "$ISSUE" ]]; then
  echo "Uso: $0 <issue-number>"
  echo "Exemplo: $0 5"
  exit 1
fi

cd /home/rx/lab/mago-office

TITLE=$(gh issue view "$ISSUE" --repo roxdavirox/mago-office --json title -q .title)

if [[ -z "$TITLE" ]]; then
  echo "Erro: Issue #$ISSUE não encontrada"
  exit 1
fi

TYPE=$(echo "$TITLE" | grep -oP '^\[?\K\w+' | tr '[:upper:]' '[:lower:]' | head -1)
case $TYPE in
  scaffold|ci|chore|dx) TYPE="chore"    ;;
  test)                  TYPE="test"     ;;
  fix)                   TYPE="fix"      ;;
  refactor)              TYPE="refactor" ;;
  docs)                  TYPE="docs"     ;;
  *)                     TYPE="feat"     ;;
esac

SLUG=$(echo "$TITLE" | sed 's/.*: //' | tr '[:upper:]' '[:lower:]' \
  | tr ' ' '-' | tr -cd 'a-z0-9-' | sed 's/^-*//' | cut -c1-35)

BRANCH="$TYPE/issue-$ISSUE-$SLUG"

git checkout develop
git pull origin develop
git checkout -b "$BRANCH"

echo ""
echo "Branch criada: $BRANCH"

# ── Mover issue para In Progress no board ─────────────────────────────────────
PROJECT_ID="PVT_kwHOAPDgbs4BQglq"
STATUS_FIELD="PVTSSF_lAHOAPDgbs4BQglqzg-m2Sc"
S_IN_PROGRESS="b894fbad"

ISSUE_NODE=$(gh api "repos/roxdavirox/mago-office/issues/$ISSUE" \
  --jq '.node_id' 2>/dev/null || echo "")

if [[ -n "$ISSUE_NODE" ]]; then
  ITEM_ID=$(gh api graphql -f query='
    mutation($p:ID!,$c:ID!){
      addProjectV2ItemById(input:{projectId:$p,contentId:$c}){item{id}}
    }' -f p="$PROJECT_ID" -f c="$ISSUE_NODE" \
    --jq '.data.addProjectV2ItemById.item.id' 2>/dev/null || echo "")

  if [[ -n "$ITEM_ID" ]]; then
    gh api graphql -f query='
      mutation($p:ID!,$i:ID!,$f:ID!,$v:String!){
        updateProjectV2ItemFieldValue(input:{
          projectId:$p itemId:$i fieldId:$f
          value:{singleSelectOptionId:$v}
        }){projectV2Item{id}}
      }' -f p="$PROJECT_ID" -f i="$ITEM_ID" \
      -f f="$STATUS_FIELD" -f v="$S_IN_PROGRESS" > /dev/null 2>&1 \
      && echo "Board: #$ISSUE → In Progress" \
      || echo "⚠️  Board não atualizado (verificar permissões)"
  fi
fi

# ── Consultar rx-architect para estimativa (Celebro ou OpenCode) ──────────────
echo ""
bash "$(dirname "$0")/mago-estimate.sh" "$ISSUE" --board --comment 2>/dev/null \
  || echo "⚠️  Estimativa indisponível (continuando)"

echo ""
echo "Próximo: implemente, commite e rode ./scripts/pr-create.sh $ISSUE"
