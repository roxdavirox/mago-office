#!/bin/bash
# Verifica checks e mergeia PR se tudo verde
# Uso: ./scripts/pr-merge.sh <pr-number>

set -e

PR=${1:-$(gh pr view --json number -q .number 2>/dev/null)}
REPO="roxdavirox/mago-office"

if [[ -z "$PR" ]]; then
  echo "Uso: $0 <pr-number>"
  exit 1
fi

echo "==> Verificando PR #$PR..."

# Checar se todos os checks passaram
FAILED=$(gh api repos/$REPO/commits/$(gh api repos/$REPO/pulls/$PR --jq .head.sha)/check-runs \
  --jq '[.check_runs[] | select(.conclusion != "success" and .conclusion != "skipped" and .status != "queued")] | length')

PENDING=$(gh api repos/$REPO/commits/$(gh api repos/$REPO/pulls/$PR --jq .head.sha)/check-runs \
  --jq '[.check_runs[] | select(.status == "in_progress" or .status == "queued")] | length')

if [[ "$PENDING" -gt 0 ]]; then
  echo "⏳ $PENDING check(s) ainda em progresso. Aguarde."
  exit 1
fi

if [[ "$FAILED" -gt 0 ]]; then
  echo "❌ $FAILED check(s) falharam. Corrija antes de mergear."
  ./scripts/pr-check.sh "$PR"
  exit 1
fi

echo "✅ Todos os checks passaram."
echo ""

# Squash merge para manter histórico limpo
gh pr merge "$PR" --squash --delete-branch \
  --repo "$REPO" \
  --subject "$(gh api repos/$REPO/pulls/$PR --jq .title)"

echo ""
echo "==> PR #$PR mergeada com sucesso!"
