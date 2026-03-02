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

# Consultar rx-architect para estimativa e plano de implementação
CELEBRO_URL="${CELEBRO_URL:-http://localhost:3099/chat}"
if curl -s --connect-timeout 2 "$CELEBRO_URL" > /dev/null 2>&1 || true; then
  echo ""
  echo "🏗️  Consultando rx-architect..."
  bash "$(dirname "$0")/mago-estimate.sh" "$ISSUE" --board --comment 2>/dev/null \
    || echo "⚠️  rx-architect indisponível (continuando sem estimativa)"
fi

echo ""
echo "Próximo: git add . && git commit && ./scripts/pr-create.sh"
