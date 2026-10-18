#!/usr/bin/env bash
# build-skill.sh — Refresh access-to-services.skill, the package Claude loads.
#
# Usage: bash scripts/build-skill.sh           rebuild access-to-services.skill
#        bash scripts/build-skill.sh --check   fail if the package is out of date
#
# The package is a gzipped tar with everything under access-to-services/.
# SKILL.md, references/, templates/ and the other skill-only files exist only
# inside the package, so it is the base. The files the repo owns are copied
# over it (see OWNED below): when one of them changes, rebuild and commit the
# package, or Claude keeps loading the old copy.
#
# The build is deterministic: sorted names, fixed mtime, root owner, gzip -n.
# --check rebuilds into a temp dir and compares the extracted file contents
# with the committed package.

set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
PACKAGE="access-to-services.skill"
TOP="access-to-services"
# repo file -> path inside the package
OWNED=(
  "mo-resources.json:data/mo-resources.json"
  "SCHEMA.md:data/SCHEMA.md"
  "eval-results.md:eval-results.md"
)

mode="build"
[ "${1:-}" = "--check" ] && mode="check"

cd "$REPO"
[ -f "$PACKAGE" ] || { echo "::error::$PACKAGE is missing"; exit 1; }

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
mkdir -p "$tmp/src" "$tmp/committed" "$tmp/fresh"

# Base: the committed package. Overlay: the files the repo owns.
tar -xzf "$PACKAGE" -C "$tmp/src"
tar -xzf "$PACKAGE" -C "$tmp/committed"
for pair in "${OWNED[@]}"; do
  src="${pair%%:*}"
  dest="$tmp/src/$TOP/${pair#*:}"
  [ -f "$src" ] || { echo "::error::missing $src"; exit 1; }
  mkdir -p "$(dirname "$dest")"
  cp "$src" "$dest"
done

find "$tmp/src" -type d -exec chmod 755 {} +
find "$tmp/src" -type f -exec chmod 644 {} +
tar --sort=name --owner=0 --group=0 --numeric-owner \
    --mtime='2026-01-01 00:00:00Z' --format=gnu \
    -C "$tmp/src" -cf - "$TOP" | gzip -9n > "$tmp/$PACKAGE"

if [ "$mode" = "build" ]; then
  cp "$tmp/$PACKAGE" "$REPO/$PACKAGE"
  echo "Built $PACKAGE ($(tar -tzf "$PACKAGE" | grep -vc '/$') files)"
  exit 0
fi

tar -xzf "$tmp/$PACKAGE" -C "$tmp/fresh"
if diff -rq "$tmp/committed" "$tmp/fresh" > "$tmp/diff.txt"; then
  echo "OK: $PACKAGE matches the repo's copies of ${OWNED[*]%%:*}"
  exit 0
fi
sed -E -e "s#^Files $tmp/committed/$TOP/([^ ]+) and .* differ\$#  out of date in package: \1#" \
       -e "s#^Only in $tmp/committed/?#  only in the committed package: #" \
       -e "s#^Only in $tmp/fresh/?#  missing from the committed package: #" "$tmp/diff.txt"
echo "::error::$PACKAGE is out of date — run scripts/build-skill.sh and commit it."
exit 1
