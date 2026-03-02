#!/bin/bash
# Cria PR com labels e milestone herdados da issue vinculada
# Uso: ./scripts/pr-create.sh [issue-number]

set -e

cd /home/rx/lab/mago-office

BRANCH=$(git branch --show-current)

if [[ -n "$1" ]]; then
  ISSUE=$1
else
  ISSUE=$(echo "$BRANCH" | grep -oP 'issue-\K\d+' || echo "")
fi

if [[ -z "$ISSUE" ]]; then
  echo "Aviso: Nenhum issue number encontrado na branch: $BRANCH"
  echo "Uso: $0 <issue-number>"
  exit 1
fi

echo "==> Buscando dados da issue #$ISSUE..."

ISSUE_LABELS=$(gh issue view "$ISSUE" --repo roxdavirox/mago-office --json labels \
  -q '.labels[].name' 2>/dev/null | tr '\n' ',' | sed 's/,$//')
MILESTONE=$(gh issue view "$ISSUE" --repo roxdavirox/mago-office --json milestone \
  -q '.milestone.title' 2>/dev/null || echo "")
ISSUE_BODY=$(gh issue view "$ISSUE" --repo roxdavirox/mago-office --json body \
  -q '.body' 2>/dev/null || echo "")

TYPE=$(echo "$BRANCH" | cut -d'/' -f1)
case $TYPE in
  feat)    EXTRA_LABELS="enhancement" ;;
  fix)     EXTRA_LABELS="bug"         ;;
  test)    EXTRA_LABELS="test"        ;;
  chore)   EXTRA_LABELS="dx"          ;;
  ci)      EXTRA_LABELS="ci"          ;;
  refactor) EXTRA_LABELS="chore"      ;;
  *)       EXTRA_LABELS=""            ;;
esac

if [[ -n "$ISSUE_LABELS" && -n "$EXTRA_LABELS" ]]; then
  LABELS=$(echo "$ISSUE_LABELS,$EXTRA_LABELS" | tr ',' '\n' | sort -u | tr '\n' ',' | sed 's/,$//')
elif [[ -n "$ISSUE_LABELS" ]]; then
  LABELS="$ISSUE_LABELS"
else
  LABELS="$EXTRA_LABELS"
fi

# Título: pegar do último commit da branch (excluindo commits de develop)
TITLE=$(git log develop..HEAD --format=%s | head -1)
if [[ -z "$TITLE" ]]; then
  # Fallback: título da issue
  TITLE=$(gh issue view "$ISSUE" --repo roxdavirox/mago-office --json title -q .title 2>/dev/null || echo "")
fi

if ! git ls-remote --heads origin "$BRANCH" | grep -q "$BRANCH"; then
  echo "==> Push da branch..."
  git push -u origin "$BRANCH"
fi

PR_BODY="Closes #$ISSUE"
if [[ -n "$ISSUE_BODY" ]]; then
  PR_BODY="Closes #$ISSUE

## Contexto

$ISSUE_BODY"
fi

echo ""
echo "==> Criando PR..."
echo "  Titulo:    $TITLE"
echo "  Labels:    ${LABELS:-nenhum}"
echo "  Milestone: ${MILESTONE:-nenhum}"
echo "  Issue:     #$ISSUE"
echo ""

# Usar array para evitar problemas de escaping com eval
CMD=(gh pr create --title "$TITLE" --body "$PR_BODY" --base develop)
[[ -n "$LABELS" ]]    && CMD+=(--label "$LABELS")
[[ -n "$MILESTONE" ]] && CMD+=(--milestone "$MILESTONE")

"${CMD[@]}"

echo ""
echo "==> PR criada!"
