# Installs the Fable Mode pack into a target project's .claude directory
# and wires the doctrine into its CLAUDE.md via an @import line.
#
# Usage:  .\install.ps1 -Target C:\path\to\project [-Update]
#   -Update   overwrite pack-owned files with this version (never touches
#             files the pack does not ship); -Force is a deprecated alias
param(
    [Parameter(Mandatory = $true, Position = 0)][string]$Target,
    [switch]$Update,
    [switch]$Force
)

if ($Force -and -not $Update) { Write-Warning '-Force is deprecated; use -Update'; $Update = $true }

$src = Join-Path $PSScriptRoot '.claude'
if (-not (Test-Path -LiteralPath $src)) { throw "Pack .claude directory not found next to install.ps1 ($src)" }
if (-not (Test-Path -LiteralPath $Target -PathType Container)) { throw "Target is not an existing directory: $Target" }

$dest = Join-Path $Target '.claude'

$readVersion = {
    param($path)
    if (Test-Path -LiteralPath $path) {
        $line = Get-Content -LiteralPath $path -TotalCount 1
        if ($line) { $line.Trim() }
    }
}
$packVersion = (& $readVersion (Join-Path $src 'fable\VERSION'))
if (-not $packVersion) { $packVersion = 'unknown' }
if ($Update) {
    $oldVersion = (& $readVersion (Join-Path $dest 'fable\VERSION'))
    if (-not $oldVersion) { $oldVersion = 'unversioned pre-1.0 install' }
    Write-Host "updating Fable Mode $oldVersion -> $packVersion in $Target"
}
else {
    Write-Host "installing Fable Mode v$packVersion into $Target"
}

# Read before the copy loop: a fresh copy of VERSION must not mask a stale install.
$installedVersion = (& $readVersion (Join-Path $dest 'fable\VERSION'))

$copied = 0
$skipped = 0
foreach ($f in Get-ChildItem -Path $src -Recurse -File) {
    $rel = $f.FullName.Substring($src.Length).TrimStart('\', '/')
    # Session-local / OS droppings are not pack files — never ship them.
    if ($f.Name -in @('settings.local.json', 'scheduled_tasks.lock', '.DS_Store')) { Write-Host "skip (session-local): .claude\$rel"; continue }
    $out = Join-Path $dest $rel
    if ((Test-Path -LiteralPath $out) -and -not $Update) {
        Write-Host "skip (exists): .claude\$rel"
        $skipped++
        continue
    }
    New-Item -ItemType Directory -Force (Split-Path $out) | Out-Null
    Copy-Item -LiteralPath $f.FullName -Destination $out -Force
    $copied++
}

$claudeMd = Join-Path $Target 'CLAUDE.md'
$import = '@.claude/fable/FABLE.md'
if (-not (Test-Path -LiteralPath $claudeMd)) {
    Set-Content -LiteralPath $claudeMd -Value "# Fable Mode`n$import`n"
    Write-Host 'created CLAUDE.md with the Fable Mode import'
}
elseif (-not (Select-String -LiteralPath $claudeMd -Pattern ([regex]::Escape($import)) -Quiet)) {
    Add-Content -LiteralPath $claudeMd -Value "`n# Fable Mode`n$import"
    Write-Host 'appended the Fable Mode import to CLAUDE.md'
}
else {
    Write-Host 'CLAUDE.md already imports Fable Mode'
}

Write-Host "done: $copied file(s) copied, $skipped skipped"
if ($skipped -gt 0 -and -not $Update -and $installedVersion -ne $packVersion) { Write-Host "run with -Update to refresh pack files to v$packVersion" }
Write-Host 'restart any open Claude Code session in the target project - agent types register at session start'
