#!/usr/bin/env bash
# Publie une release GitHub du jeu web.  Usage : bash tools/release.sh v0.80 [commit] [--dry-run]
# Prérequis : `gh` (GitHub CLI) connecté à votre compte (gh auth login) ; texte de la release dans docs/releases/<tag>.md
set -euo pipefail
cd "$(dirname "$0")/.."
TAG="${1:?usage: bash tools/release.sh v0.80 [commit] [--dry-run]}"
COMMIT="${2:-HEAD}"; [ "$COMMIT" = "--dry-run" ] && COMMIT=HEAD
DRY=0; for a in "$@"; do [ "$a" = "--dry-run" ] && DRY=1; done
REPO="Ghoster-001/Zombie-Survivor-By-C02"
TITLE="The Infected Grounds: Zombies Siege"
NOTES="docs/releases/${TAG}.md"
[ -f "$NOTES" ] || { echo "texte manquant : $NOTES"; exit 1; }
ZIP="Zombie-Survivor-By-C02-${TAG#v}.zip"
git archive --format=zip --prefix="Zombie-Survivor-By-C02-${TAG#v}/" -o "$ZIP" "$COMMIT" -- index.html js assets README.md
echo "archive : $ZIP ($(du -h "$ZIP" | cut -f1))"
if [ "$DRY" = 1 ]; then echo "(essai à blanc : rien n'est publié)"; exit 0; fi
SHA="$(git rev-parse "$COMMIT")"
git push origin "$SHA:refs/heads/main" >/dev/null 2>&1 || true   # le commit doit exister sur GitHub
gh release create "$TAG" "$ZIP" --repo "$REPO" --target "$SHA" --title "$TITLE" --notes-file "$NOTES" --latest
echo "release publiée : https://github.com/$REPO/releases/tag/$TAG"
