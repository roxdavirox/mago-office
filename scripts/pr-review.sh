#!/bin/bash
# scripts/pr-review.sh - AI Code Review usando OpenCode CLI
#
# Uso: ./scripts/pr-review.sh <PR_NUMBER> [--post]
#   --post: Posta o review como comentário na PR
#
# Modelos disponíveis (via OPENCODE_MODEL env):
#   - opencode/minimax-m2.5-free (default, FREE)
#   - anthropic/claude-sonnet-4-20250514 (via subscription)

set -e

PR_NUMBER=""
POST_COMMENT=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --post) POST_COMMENT="--post"; shift ;;
    *) PR_NUMBER="$1"; shift ;;
  esac
done

if [ -z "$PR_NUMBER" ]; then
  echo "Uso: ./scripts/pr-review.sh <PR_NUMBER> [--post]"
  echo ""
  echo "Modelos (via OPENCODE_MODEL env):"
  echo "  opencode/minimax-m2.5-free (default, FREE)"
  echo "  anthropic/claude-sonnet-4-20250514 (subscription)"
  exit 1
fi

if ! command -v gh &>/dev/null; then
  echo "Erro: gh CLI nao encontrado"
  exit 1
fi

MODEL="${OPENCODE_MODEL:-opencode/minimax-m2.5-free}"
OPENCODE="${OPENCODE_BIN:-/home/rx/.opencode/bin/opencode}"
REPO_DIR="${REPO_DIR:-$(git rev-parse --show-toplevel)}"

if [ ! -f "$OPENCODE" ]; then
  echo "Erro: opencode nao encontrado em $OPENCODE"
  echo "Instale com: curl -fsSL https://opencode.ai/install | bash"
  exit 1
fi

cd "$REPO_DIR"

PR_TITLE=$(gh pr view "$PR_NUMBER" --json title --jq '.title')
PR_BODY=$(gh pr view "$PR_NUMBER" --json body --jq '.body // ""' | head -c 2000)
PR_DIFF=$(gh pr diff "$PR_NUMBER" | head -c 40000)

echo "📝 Analisando PR #$PR_NUMBER: $PR_TITLE"
echo "🤖 Modelo: $MODEL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

PROMPT="Faça code review desta PR do projeto mago-office (app React standalone estilo Gather.town — escritório virtual 2D com avatares animados dos agentes MAGO. Stack: React 19 + Vite 6 + TypeScript strict + Framer Motion + socket.io-client).

**PR #$PR_NUMBER: $PR_TITLE**

**Descrição:**
$PR_BODY

\`\`\`diff
$PR_DIFF
\`\`\`

Analise considerando:
1. Bugs ou problemas potenciais (🐛)
2. Boas práticas TypeScript/React (⚠️)
3. Convenções do projeto: commits em pt-BR, componentes funcionais, hooks customizados (⚠️)
4. Performance: re-renders desnecessários, animações Framer Motion, socket listeners (⚠️)
5. Sugestões de melhoria: legibilidade, acessibilidade, UX (💡)

Seja conciso (máx 10 pontos).

## Formato obrigatório de output

Produza EXATAMENTE neste formato — sem variações, sem seções extras antes do JSON:

### Resumo em prosa (2-3 frases)
<resumo livre aqui>

### Itens

\`\`\`json
[
  {
    \"kind\": \"bug\" | \"warning\" | \"suggestion\" | \"good\",
    \"title\": \"<titulo curto em lowercase, max 60 chars, sem paths, sem markdown>\",
    \"detail\": \"<descricao tecnica completa, pode conter paths e codigo>\"
  }
]
\`\`\`

Regras do JSON:
- \"kind\": exatamente um dos 4 valores acima
- \"title\": sem emojis, sem backticks, sem nomes de arquivo, sem numero de linha
- \"detail\": pode ser longo e tecnico
- Maximo 10 itens no array
- JSON valido, sem comentarios"

REVIEW=$(timeout 120 "$OPENCODE" run -m "$MODEL" "$PROMPT" 2>&1 \
  | sed 's/\x1b\[[0-9;]*m//g; s/\x1b\[[0-9;]*[A-Za-z]//g' \
  | grep -v "Review automático via OpenCode" \
  | sed '/^---$/{ N; /^---\n$/d }')

echo ""
echo "$REVIEW"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$POST_COMMENT" = "--post" ]; then
  echo "📤 Postando review na PR #$PR_NUMBER..."

  FORMAT_REVIEW=$(echo "$REVIEW" | python3 -c "
import sys, json, re

text = sys.stdin.read()

match = re.search(r'\`\`\`json\s*([\s\S]*?)\s*\`\`\`', text)
summary_match = re.search(r'### Resumo.*?\n([\s\S]*?)(?=###|\Z)', text)

summary = summary_match.group(1).strip() if summary_match else ''

output = ['## 🤖 AI Code Review']
if summary:
    output.append('')
    output.append(summary)

if match:
    try:
        items = json.loads(match.group(1))
        emoji_map = {'bug': '🐛', 'warning': '⚠️', 'suggestion': '💡', 'good': '✅'}
        if items:
            output.append('')
            output.append('### Pontos de Review')
            for item in items:
                emoji = emoji_map.get(item.get('kind', ''), '•')
                output.append('')
                output.append(f'**{emoji} {item[\"title\"]}**')
                output.append(f'{item[\"detail\"]}')
    except:
        output.append('')
        output.append(text)
else:
    output.append('')
    output.append(text)

import os
model = os.environ.get('MODEL', 'opencode')
output.append('')
output.append('---')
output.append(f'*Review automático via OpenCode ({model})*')
print('\n'.join(output))
" MODEL="$MODEL" 2>/dev/null || echo "## 🤖 AI Code Review

$REVIEW

---
*Review automático via OpenCode ($MODEL)*")

  # Deletar comentários anteriores de AI Review para evitar duplicatas
  REPO=$(gh repo view --json nameWithOwner --jq '.nameWithOwner')
  EXISTING_IDS=$(gh api "repos/$REPO/issues/$PR_NUMBER/comments" \
    --jq '.[] | select(.user.login == "github-actions[bot]") | select(.body | startswith("## 🤖 AI Code Review")) | .id')
  for CID in $EXISTING_IDS; do
    gh api -X DELETE "repos/$REPO/issues/comments/$CID" && echo "🗑️  Comentário anterior removido ($CID)"
  done

  gh pr comment "$PR_NUMBER" --body "$FORMAT_REVIEW"
  echo "✅ Review postado na PR #$PR_NUMBER!"
fi
