# Installs the Fable-Mode pack into a target project's .claude directory
# and wires the doctrine into its CLAUDE.md via an @import line.
#
# Usage:  .\install.ps1 -Target C:\path\to\project [-Force]
param(
    [Parameter(Mandatory = $true)][string]$Target,
    [switch]$Force
)

$src = Join-Path $PSScriptRoot '.claude'
if (-not (Test-Path $src)) { throw "Pack .claude directory not found next to install.ps1 ($src)" }
if (-not (Test-Path $Target -PathType Container)) { throw "Target is not an existing directory: $Target" }

$dest = Join-Path $Target '.claude'
New-Item -ItemType Directory -Force $dest | Out-Null

$copied = 0
$skipped = 0
Get-ChildItem -Path $src -Recurse -File | ForEach-Object {
    $rel = $_.FullName.Substring($src.Length).TrimStart('\', '/')
    $out = Join-Path $dest $rel
    if ((Test-Path $out) -and -not $Force) {
        Write-Host "skip (exists): .claude\$rel"
        $script:skipped++
        return
    }
    New-Item -ItemType Directory -Force (Split-Path $out) | Out-Null
    Copy-Item $_.FullName $out -Force
    $script:copied++
}

$claudeMd = Join-Path $Target 'CLAUDE.md'
$import = '@.claude/fable/FABLE.md'
if (-not (Test-Path $claudeMd)) {
    Set-Content -Path $claudeMd -Value "# Fable Mode`n$import`n"
    Write-Host 'created CLAUDE.md with the Fable Mode import'
}
elseif (-not (Select-String -Path $claudeMd -Pattern ([regex]::Escape($import)) -Quiet)) {
    Add-Content -Path $claudeMd -Value "`n# Fable Mode`n$import"
    Write-Host 'appended the Fable Mode import to CLAUDE.md'
}
else {
    Write-Host 'CLAUDE.md already imports Fable Mode'
}

Write-Host "done: $copied file(s) copied, $skipped skipped (use -Force to overwrite existing files)"
Write-Host 'restart any open Claude Code session in the target project - agent types register at session start'
