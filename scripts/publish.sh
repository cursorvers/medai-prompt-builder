#!/bin/bash
# GuideScope npm publish script
# Usage: ./scripts/publish.sh [token]
# Or: NPM_TOKEN=xxx ./scripts/publish.sh

set -e

echo "=== GuideScope npm publish ==="

# Token from argument or environment
TOKEN="${1:-$NPM_TOKEN}"

if [ -z "$TOKEN" ]; then
  echo "❌ NPM_TOKEN required"
  echo ""
  echo "Usage:"
  echo "  ./scripts/publish.sh npm_xxxx..."
  echo "  NPM_TOKEN=xxx ./scripts/publish.sh"
  echo ""
  echo "Get token: https://www.npmjs.com/settings/tokens"
  exit 1
fi

# Create temporary .npmrc
echo "//registry.npmjs.org/:_authToken=${TOKEN}" > .npmrc.tmp

echo "📦 Building packages..."
pnpm -r build

echo ""
echo "📤 Publishing @cursorvers/guidescope..."
cd packages/core
cp ../../.npmrc.tmp .npmrc
pnpm publish --access public --no-git-checks 2>&1 || echo "  (already published or error)"
rm -f .npmrc
cd ../..

echo ""
echo "📤 Publishing @cursorvers/guidescope-mcp..."
cd packages/mcp
cp ../../.npmrc.tmp .npmrc
pnpm publish --access public --no-git-checks 2>&1 || echo "  (already published or error)"
rm -f .npmrc
cd ../..

# Cleanup
rm -f .npmrc.tmp

echo ""
echo "✅ Done!"
echo ""
echo "Install:"
echo "  npm install @cursorvers/guidescope"
echo "  npx @cursorvers/guidescope-mcp"
