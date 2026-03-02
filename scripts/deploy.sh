#!/usr/bin/env bash
# scripts/deploy.sh — deploy manual de mago-office no VPS
# Usado pelo GitHub Actions (deploy.yml) ou manualmente

set -e

REPO_DIR="$HOME/lab/mago-office"
NVM_DIR="$HOME/.nvm"

echo "=== Deploy mago-office ==="
cd "$REPO_DIR"

echo "--- Git pull ---"
git pull origin main --ff-only

echo "--- Node.js via NVM ---"
# shellcheck source=/dev/null
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 20

echo "--- Instalar dependências ---"
COREPACK_ENABLE_STRICT=0 pnpm install --frozen-lockfile

echo "--- Build ---"
COREPACK_ENABLE_STRICT=0 pnpm build

if [ ! -f "dist/index.html" ]; then
  echo "❌ Build falhou: dist/index.html não encontrado"
  exit 1
fi

echo "=== Deploy concluído ==="
echo "URL: https://office.iae.wtf"
