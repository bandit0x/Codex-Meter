param(
    [string]$Version = "151.0.4129.78",
    [string]$DownloadUrl = "https://msedge.sf.dl.delivery.mp.microsoft.com/filestreamingservice/files/355004fc-ebbc-42d3-b319-d43be39f8d39/Microsoft.WebView2.FixedVersionRuntime.151.0.4129.78.x64.cab"
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

$projectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
$cacheRoot = Join-Path $projectRoot ".scratch\tools\webview2-fixed"
$runtimeName = "Microsoft.WebView2.FixedVersionRuntime.$Version.x64"
$runtimeRoot = Join-Path $cacheRoot $runtimeName
$cabPath = Join-Path $cacheRoot "$runtimeName.cab"
$partialPath = "$cabPath.download"

if (-not $DownloadUrl.StartsWith("https://msedge.sf.dl.delivery.mp.microsoft.com/", [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "WebView2 Fixed Runtime must be downloaded from Microsoft's official delivery host."
}

[System.IO.Directory]::CreateDirectory($cacheRoot) | Out-Null
if (-not (Test-Path -LiteralPath $cabPath -PathType Leaf)) {
    Invoke-WebRequest -UseBasicParsing -Uri $DownloadUrl -OutFile $partialPath
    Move-Item -LiteralPath $partialPath -Destination $cabPath -Force
}

if (-not (Test-Path -LiteralPath (Join-Path $runtimeRoot "msedgewebview2.exe") -PathType Leaf)) {
    if (Test-Path -LiteralPath $runtimeRoot) {
        Remove-Item -LiteralPath $runtimeRoot -Recurse -Force
    }
    & "$env:SystemRoot\System32\expand.exe" $cabPath -F:* $cacheRoot | Out-Null
}

$runtimeExecutable = Join-Path $runtimeRoot "msedgewebview2.exe"
$engine = Join-Path $runtimeRoot "msedge.dll"
if (-not (Test-Path -LiteralPath $runtimeExecutable -PathType Leaf) -or
    -not (Test-Path -LiteralPath $engine -PathType Leaf)) {
    throw "Extracted WebView2 runtime is incomplete: $runtimeRoot"
}

$signature = Get-AuthenticodeSignature -LiteralPath $runtimeExecutable
if ($signature.Status -ne "Valid" -or $signature.SignerCertificate.Subject -notmatch "Microsoft Corporation") {
    throw "WebView2 runtime signature is not a valid Microsoft signature."
}

[pscustomobject]@{
    Version = $Version
    Runtime = $runtimeRoot
    CabSha256 = (Get-FileHash -LiteralPath $cabPath -Algorithm SHA256).Hash.ToLowerInvariant()
    Signer = $signature.SignerCertificate.Subject
}
