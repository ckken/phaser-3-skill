#!/bin/bash
# One-click build & deploy to GitHub Pages
set -e

PROJ_DIR="$(cd "$(dirname "$0")" && pwd)"
PKG_DIR="$PROJ_DIR/packages/slot-machine-9grid"

echo "🔨 Building slot-machine-9grid..."
cd "$PKG_DIR"
rm -rf dist
npx vite build

echo "🚀 Deploying to gh-pages..."
cd "$PROJ_DIR"
CURRENT_BRANCH=$(git branch --show-current)
git stash -q 2>/dev/null || true
git checkout gh-pages

# Clean old assets
rm -rf assets index.html

# Copy new build
cp "$PKG_DIR/dist/index.html" .
cp -r "$PKG_DIR/dist/assets" .
cp -f .nojekyll . 2>/dev/null || touch .nojekyll

# Commit & push
git add -A
VERSION=$(grep "BUILD_VERSION" "$PKG_DIR/src/main.ts" | head -1 | sed "s/.*'\(.*\)'.*/\1/")
git commit -m "deploy: $VERSION" --allow-empty
GH_TOKEN=$(gh auth token) git push "https://$(gh auth token)@github.com/ckken/phaser-3-skill.git" gh-pages --force

# Return to original branch
git checkout "$CURRENT_BRANCH"
git stash pop -q 2>/dev/null || true

echo "✅ Deployed $VERSION to https://ckken.github.io/phaser-3-skill/"
