#!/usr/bin/env bash
# Installs the Fable-Mode pack into a target project's .claude directory
# and wires the doctrine into its CLAUDE.md via an @import line.
#
# Usage:  ./install.sh [--update] /path/to/project
#   --update   overwrite pack-owned files with this version (never touches
#              files the pack does not ship); --force is a deprecated alias
set -euo pipefail

update=0
target=""
for arg in "$@"; do
    case "$arg" in
        --update) update=1 ;;
        --force) update=1; echo "note: --force is deprecated; use --update" >&2 ;;
        --*) echo "unknown option: $arg" >&2; exit 1 ;;
        *)
            [ -z "$target" ] || { echo "unexpected extra argument: $arg" >&2; exit 1; }
            target="$arg"
            ;;
    esac
done
[ -n "$target" ] || { echo "usage: install.sh [--update] /path/to/project" >&2; exit 1; }

src="$(cd "$(dirname "$0")" && pwd)/.claude"
[ -d "$src" ] || { echo "pack .claude directory not found next to install.sh" >&2; exit 1; }
[ -d "$target" ] || { echo "target directory does not exist: $target" >&2; exit 1; }

dest="$target/.claude"
pack_version="$(cat "$src/fable/VERSION" 2>/dev/null || true)"
[ -n "$pack_version" ] || pack_version=unknown
if [ "$update" -eq 1 ]; then
    old_version="$(cat "$dest/fable/VERSION" 2>/dev/null || true)"
    [ -n "$old_version" ] || old_version='unversioned pre-1.0 install'
    echo "updating Fable-Mode $old_version -> $pack_version in $target"
else
    echo "installing Fable-Mode v$pack_version into $target"
fi

copied=0
skipped=0
while IFS= read -r -d '' f; do
    rel="${f#"$src"/}"
    out="$dest/$rel"
    if [ -e "$out" ] && [ "$update" -ne 1 ]; then
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

echo "done: $copied file(s) copied, $skipped skipped"
if [ "$skipped" -gt 0 ] && [ "$update" -ne 1 ]; then
    echo "run with --update to refresh pack files to v$pack_version"
fi
echo "restart any open Claude Code session in the target project - agent types register at session start"
