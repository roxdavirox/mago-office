#!/bin/bash
# Verifica status, CI e comentários de uma PR
# Uso: ./scripts/pr-check.sh <pr-number>

set -e

PR=${1:-$(gh pr view --json number -q .number 2>/dev/null)}

if [[ -z "$PR" ]]; then
  echo "Uso: $0 <pr-number>"
  exit 1
fi

REPO="roxdavirox/mago-office"

echo "=== PR #$PR ==="
echo ""

echo "--- Status ---"
gh api repos/$REPO/pulls/$PR --jq '"Titulo: \(.title)\nEstado: \(.state)\nMergeable: \(.mergeable_state)\nBranch: \(.head.ref) → \(.base.ref)"'
echo ""

echo "--- CI Checks ---"
gh api repos/$REPO/commits/$(gh api repos/$REPO/pulls/$PR --jq .head.sha)/check-runs \
  --jq '.check_runs[] | "\(.conclusion // .status) - \(.name)"'
echo ""

echo "--- Reviews ---"
gh api repos/$REPO/pulls/$PR/reviews \
  --jq '.[] | "[\(.user.login)] \(.state)"' 2>/dev/null || echo "Nenhum review"
echo ""

echo "--- Comentarios ---"
COMMENTS=$(gh api repos/$REPO/issues/$PR/comments --jq 'length')
if [[ "$COMMENTS" -gt 0 ]]; then
  gh api repos/$REPO/issues/$PR/comments \
    --jq '.[] | "[\(.user.login)]\n\(.body | split("\n")[0:4] | join("\n"))\n---"'
else
  echo "Nenhum comentario"
fi
