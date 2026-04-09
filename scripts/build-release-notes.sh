#!/usr/bin/env bash
#
# Extracts the CHANGELOG.md section for the given version and appends the
# standard Download block + Full Changelog link, printing the result to stdout.
#
# Usage:
#   scripts/build-release-notes.sh v0.2.2 > notes.md
#   scripts/build-release-notes.sh v0.2.2 v0.2.1   # explicit previous tag
#
# The previous tag is optional — if omitted, the Full Changelog link points
# to the closest prior section heading in CHANGELOG.md.

set -euo pipefail

TAG="${1:-}"
PREV_TAG="${2:-}"

if [[ -z "$TAG" ]]; then
  echo "error: tag argument required (e.g. v0.2.2)" >&2
  exit 1
fi

# Strip leading "v" for bare version (0.2.2) used in artifact filenames.
VERSION="${TAG#v}"

CHANGELOG="$(dirname "$0")/../CHANGELOG.md"
if [[ ! -f "$CHANGELOG" ]]; then
  echo "error: CHANGELOG.md not found at $CHANGELOG" >&2
  exit 1
fi

# Extract the section for the matching version heading. The CHANGELOG uses
# "## v0.2.2 — Update UX Polish" style headings, so we match on the literal
# "## v<version>" prefix and stop at the next "## v" heading.
SECTION="$(awk -v tag="$TAG" '
  BEGIN { inside = 0 }
  /^## v/ {
    if (inside) { exit }
    if ($2 == tag) { inside = 1; print; next }
  }
  inside { print }
' "$CHANGELOG")"

if [[ -z "$SECTION" ]]; then
  echo "error: no CHANGELOG.md section found for $TAG" >&2
  echo "hint: make sure there is a '## $TAG — Title' heading in CHANGELOG.md" >&2
  exit 1
fi

# Trim the trailing "---" separator (if present) and any trailing blank lines.
SECTION="$(printf '%s\n' "$SECTION" | awk '
  { lines[NR] = $0 }
  END {
    end = NR
    # Walk backwards, dropping blank lines and a trailing "---" separator.
    while (end > 0 && lines[end] ~ /^[[:space:]]*$/) { end-- }
    if (end > 0 && lines[end] == "---") { end-- }
    while (end > 0 && lines[end] ~ /^[[:space:]]*$/) { end-- }
    for (i = 1; i <= end; i++) { print lines[i] }
  }
')"

# Resolve the previous tag for the Full Changelog link. If not provided, fall
# back to the next "## v" heading below the current one in CHANGELOG.md. If
# that's also missing (first release), omit the link.
if [[ -z "$PREV_TAG" ]]; then
  PREV_TAG="$(awk -v tag="$TAG" '
    BEGIN { passed = 0 }
    /^## v/ {
      if (passed) { print $2; exit }
      if ($2 == tag) { passed = 1 }
    }
  ' "$CHANGELOG")"
fi

# Emit the final notes.
printf '%s\n\n' "$SECTION"

cat <<EOF
### Download

- **macOS (Apple Silicon & Intel)** — \`praxis-${VERSION}-universal.dmg\` or \`praxis-${VERSION}-universal.zip\`
- **Windows** — \`praxis-${VERSION}-setup.exe\`
- **Linux** — \`praxis-${VERSION}-x86_64.AppImage\` or \`praxis-${VERSION}-amd64.deb\`
EOF

if [[ -n "$PREV_TAG" ]]; then
  printf '\n**Full Changelog**: https://github.com/ttiimmaahh/praxis/compare/%s...%s\n' "$PREV_TAG" "$TAG"
fi
