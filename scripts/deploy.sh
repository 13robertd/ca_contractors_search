#!/usr/bin/env bash
# -----------------------------------------------------------------------------
# TrustBuild — production deploy to Vercel
#
# Usage:
#   ./scripts/deploy.sh             # deploy a Preview (feature branch style)
#   ./scripts/deploy.sh --prod      # deploy to Production
#
# What it does:
#   1. Verifies required env vars exist and look right (scripts/check-env.mjs)
#   2. Runs `next build` locally to catch errors before uploading
#   3. Calls `vercel` (or `vercel --prod`) to deploy
# -----------------------------------------------------------------------------

set -euo pipefail

cd "$(dirname "$0")/.."

PROD_FLAG=""
if [[ "${1:-}" == "--prod" ]]; then
  PROD_FLAG="--prod"
  echo "→ Deploying to PRODUCTION"
else
  echo "→ Deploying a PREVIEW (pass --prod to deploy production)"
fi

echo ""
echo "Step 1/3 — Checking environment variables…"
npm run --silent check-env

echo ""
echo "Step 2/3 — Running production build locally…"
npx next build

echo ""
echo "Step 3/3 — Uploading to Vercel…"
npx vercel $PROD_FLAG

echo ""
echo "✓ Done."
