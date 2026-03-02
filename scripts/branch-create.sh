#!/bin/bash
# Cria branch padronizada a partir de issue
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
  echo "Erro: Issue #$ISSUE nao encontrada"
  exit 1
fi

TYPE=$(echo "$TITLE" | grep -oP '^\[?\K\w+' | tr '[:upper:]' '[:lower:]' | head -1)
case $TYPE in
  scaffold|ci|chore|dx) TYPE="chore" ;;
  test) TYPE="test" ;;
  fix) TYPE="fix" ;;
  *) TYPE="feat" ;;
esac

SLUG=$(echo "$TITLE" | sed 's/.*: //' | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr -cd 'a-z0-9-' | cut -c1-35)

BRANCH="$TYPE/issue-$ISSUE-$SLUG"

git checkout develop
git pull origin develop
git checkout -b "$BRANCH"

echo ""
echo "Branch criada: $BRANCH"
echo "Próximo: git add . && git commit && ./scripts/pr-create.sh"
