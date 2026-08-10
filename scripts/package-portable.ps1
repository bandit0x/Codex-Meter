param(
    [string]$Version = "0.1.0"
)

$ErrorActionPreference = "Stop"

$projectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
$sourceExe = Join-Path $projectRoot "src-tauri\target\release\codex-credits-view.exe"
$sourceRuntime = Join-Path $projectRoot "node_modules\@openai\codex-win32-x64\vendor\x86_64-pc-windows-msvc\bin\codex.exe"
$outputRoot = Join-Path $projectRoot "release\CodexCapacity-$Version-win-x64"
$runtimeDir = Join-Path $outputRoot "codex-runtime\bin"

if (-not (Test-Path -LiteralPath $sourceExe -PathType Leaf)) {
    throw "Release executable not found: $sourceExe"
}
if (-not (Test-Path -LiteralPath $sourceRuntime -PathType Leaf)) {
    throw "Pinned official Codex runtime not found. Run npm.cmd install first."
}

[System.IO.Directory]::CreateDirectory($runtimeDir) | Out-Null
Copy-Item -LiteralPath $sourceExe -Destination (Join-Path $outputRoot "Codex Capacity.exe") -Force
Copy-Item -LiteralPath $sourceRuntime -Destination (Join-Path $runtimeDir "codex.exe") -Force
Copy-Item -LiteralPath (Join-Path $projectRoot "README.md") -Destination $outputRoot -Force
Copy-Item -LiteralPath (Join-Path $projectRoot "THIRD_PARTY_NOTICES.md") -Destination $outputRoot -Force

$files = Get-ChildItem -LiteralPath $outputRoot -File -Recurse |
    Where-Object { $_.Name -ne "manifest.json" } |
    Sort-Object FullName
$manifest = [ordered]@{
    product = "Codex Capacity"
    version = $Version
    platform = "windows-x64"
    sourceCommit = (git -c safe.directory=$projectRoot rev-parse --short HEAD 2>$null)
    generatedAt = (Get-Date).ToUniversalTime().ToString("o")
    files = @($files | ForEach-Object {
        [ordered]@{
            path = $_.FullName.Substring($outputRoot.Length).TrimStart('\')
            bytes = $_.Length
            sha256 = (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
        }
    })
}
$manifest | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $outputRoot "manifest.json") -Encoding UTF8

[pscustomobject]@{
    Output = $outputRoot
    Files = $manifest.files.Count + 1
    Bytes = ($files | Measure-Object Length -Sum).Sum
}
