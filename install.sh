#!/usr/bin/env bash
# Installs the Fable-Mode pack into a target project's .claude directory
# and wires the doctrine into its CLAUDE.md via an @import line.
#
# Usage:  ./install.sh [--force] /path/to/project
set -euo pipefail

force=0
if [ "${1:-}" = "--force" ]; then force=1; shift; fi
target="${1:?usage: install.sh [--force] /path/to/project}"

src="$(cd "$(dirname "$0")" && pwd)/.claude"
[ -d "$src" ] || { echo "pack .claude directory not found next to install.sh" >&2; exit 1; }
[ -d "$target" ] || { echo "target directory does not exist: $target" >&2; exit 1; }

dest="$target/.claude"
copied=0
skipped=0
while IFS= read -r -d '' f; do
    rel="${f#"$src"/}"
    out="$dest/$rel"
    if [ -e "$out" ] && [ "$force" -ne 1 ]; then
        echo "skip (exists): .claude/$rel"
        skipped=$((skipped + 1))
        continue
    fi
    mkdir -p "$(dirname "$out")"
    cp "$f" "$out"
    copied=$((copied + 1))
done < <(find "$src" -type f -print0)

claude_md="$target/CLAUDE.md"
import='@.claude/fable/FABLE.md'
if [ ! -f "$claude_md" ]; then
    printf '# Fable Mode\n%s\n' "$import" > "$claude_md"
    echo "created CLAUDE.md with the Fable Mode import"
elif ! grep -qF "$import" "$claude_md"; then
    printf '\n# Fable Mode\n%s\n' "$import" >> "$claude_md"
    echo "appended the Fable Mode import to CLAUDE.md"
else
    echo "CLAUDE.md already imports Fable Mode"
fi

echo "done: $copied file(s) copied, $skipped skipped (use --force to overwrite existing files)"
