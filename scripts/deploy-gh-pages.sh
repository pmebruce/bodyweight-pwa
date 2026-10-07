#!/usr/bin/env bash
# Build the app and publish dist/ to the gh-pages branch (GitHub Pages source).
set -euo pipefail
cd "$(dirname "$0")/.."
npm run build
touch dist/.nojekyll
REMOTE_URL="$(git remote get-url origin)"
SHA="$(git rev-parse --short HEAD)"
TMP="$(mktemp -d)"
cp -r dist/. "$TMP"/
cd "$TMP"
git init -q -b gh-pages
git config user.name "$(git -C "$OLDPWD" config user.name)"
git config user.email "$(git -C "$OLDPWD" config user.email)"
git add -A
git commit -qm "Deploy ${SHA}"
git push -f "$REMOTE_URL" gh-pages
cd - >/dev/null
rm -rf "$TMP"
echo "Deployed ${SHA} to gh-pages"
