param(
    [string]$Executable = ""
)

$ErrorActionPreference = "Stop"

$projectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
if ([string]::IsNullOrWhiteSpace($Executable)) {
    $Executable = Join-Path $projectRoot "release\CodexMeter-0.1.3-win-x64\Codex Meter.exe"
}
$Executable = [System.IO.Path]::GetFullPath($Executable)
if (-not (Test-Path -LiteralPath $Executable -PathType Leaf)) {
    throw "Portable executable not found: $Executable"
}

$evidenceDirectory = Join-Path $projectRoot "docs\verification\screenshots"
[System.IO.Directory]::CreateDirectory($evidenceDirectory) | Out-Null
$profileRoot = Join-Path $env:TEMP ("codex-meter-verification-" + [guid]::NewGuid().ToString("N"))
[System.IO.Directory]::CreateDirectory($profileRoot) | Out-Null

Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName UIAutomationClient
Add-Type @"
using System;
using System.Runtime.InteropServices;
public static class CodexMeterWindowApi {
    [StructLayout(LayoutKind.Sequential)]
    public struct Rect { public int Left; public int Top; public int Right; public int Bottom; }
    [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hWnd, out Rect rect);
    [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hWnd);
    [DllImport("user32.dll", CharSet = CharSet.Unicode)] public static extern int GetWindowText(IntPtr hWnd, System.Text.StringBuilder text, int count);
    [DllImport("user32.dll")] public static extern IntPtr SendMessage(IntPtr hWnd, uint message, IntPtr wParam, IntPtr lParam);
}
"@

$process = $null
try {
    $version = [System.Diagnostics.FileVersionInfo]::GetVersionInfo($Executable)
    if ($version.ProductName -ne "Codex Meter" -or $version.FileDescription -ne "Codex Meter") {
        throw "Executable metadata does not identify Codex Meter."
    }

    $iconPath = Join-Path $evidenceDirectory "codex-meter-exe-icon.png"
    $icon = [System.Drawing.Icon]::ExtractAssociatedIcon($Executable)
    try {
        $bitmap = $icon.ToBitmap()
        try { $bitmap.Save($iconPath, [System.Drawing.Imaging.ImageFormat]::Png) }
        finally { $bitmap.Dispose() }
    }
    finally { $icon.Dispose() }

    $startInfo = [System.Diagnostics.ProcessStartInfo]::new()
    $startInfo.FileName = $Executable
    $startInfo.WorkingDirectory = Split-Path -Parent $Executable
    $startInfo.UseShellExecute = $false
    $startInfo.CreateNoWindow = $true
    $startInfo.EnvironmentVariables["APPDATA"] = Join-Path $profileRoot "Roaming"
    $startInfo.EnvironmentVariables["LOCALAPPDATA"] = Join-Path $profileRoot "Local"
    $process = [System.Diagnostics.Process]::Start($startInfo)

    $deadline = [DateTime]::UtcNow.AddSeconds(30)
    do {
        Start-Sleep -Milliseconds 200
        $process.Refresh()
        if ($process.HasExited) { throw "Codex Meter exited during startup with code $($process.ExitCode)." }
    } while ($process.MainWindowHandle -eq [IntPtr]::Zero -and [DateTime]::UtcNow -lt $deadline)
    if ($process.MainWindowHandle -eq [IntPtr]::Zero) { throw "Codex Meter did not create a main window within 30 seconds." }

    $handle = $process.MainWindowHandle
    $text = [System.Text.StringBuilder]::new(256)
    [void][CodexMeterWindowApi]::GetWindowText($handle, $text, $text.Capacity)
    $rect = [CodexMeterWindowApi+Rect]::new()
    if (-not [CodexMeterWindowApi]::GetWindowRect($handle, [ref]$rect)) { throw "Could not read the window rectangle." }
    if ($text.ToString() -ne "Codex Meter") { throw "Unexpected window title: $($text.ToString())" }
    if (($rect.Right - $rect.Left) -ne 300 -or ($rect.Bottom - $rect.Top) -ne 130) {
        throw "Unexpected compact window size: $($rect.Right - $rect.Left)x$($rect.Bottom - $rect.Top)"
    }

    Start-Sleep -Seconds 3
    $windowPath = Join-Path $evidenceDirectory "codex-meter-real-window.png"
    $windowCaptureStatus = "captured"
    try {
        $windowBitmap = [System.Drawing.Bitmap]::new($rect.Right - $rect.Left, $rect.Bottom - $rect.Top)
        try {
            $graphics = [System.Drawing.Graphics]::FromImage($windowBitmap)
            try { $graphics.CopyFromScreen($rect.Left, $rect.Top, 0, 0, $windowBitmap.Size) }
            finally { $graphics.Dispose() }
            $windowBitmap.Save($windowPath, [System.Drawing.Imaging.ImageFormat]::Png)
        }
        finally { $windowBitmap.Dispose() }
    }
    catch {
        Remove-Item -LiteralPath $windowPath -Force -ErrorAction SilentlyContinue
        $windowCaptureStatus = "not-captured: $($_.Exception.Message)"
    }

    $root = [System.Windows.Automation.AutomationElement]::RootElement
    $nameCondition = [System.Windows.Automation.PropertyCondition]::new(
        [System.Windows.Automation.AutomationElement]::NameProperty,
        "Codex Meter"
    )
    $namedElements = $root.FindAll([System.Windows.Automation.TreeScope]::Descendants, $nameCondition)
    $taskbarButtons = @($namedElements | Where-Object {
        $_.Current.ClassName -eq "TaskListButton" -or
        $_.Current.AutomationId -like "Taskbar.TaskListButtonAutomationPeer*"
    })
    if ($taskbarButtons.Count -ne 0) { throw "Codex Meter unexpectedly created a taskbar button." }

    [void][CodexMeterWindowApi]::SendMessage($handle, 0x0010, [IntPtr]::Zero, [IntPtr]::Zero)
    Start-Sleep -Milliseconds 800
    $process.Refresh()
    if ($process.HasExited) { throw "Closing the overlay terminated Codex Meter instead of hiding it to the tray." }
    if ([CodexMeterWindowApi]::IsWindowVisible($handle)) { throw "Closing the overlay did not hide the main window." }

    [pscustomobject]@{
        Executable = $Executable
        ProductName = $version.ProductName
        WindowTitle = $text.ToString()
        WindowSize = "$(($rect.Right - $rect.Left))x$(($rect.Bottom - $rect.Top))"
        TaskbarButtons = $taskbarButtons.Count
        CloseBehavior = "hidden-to-tray"
        IconEvidence = $iconPath
        WindowEvidence = $windowPath
        WindowCapture = $windowCaptureStatus
    }
}
finally {
    if ($null -ne $process -and -not $process.HasExited) {
        Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
    }
    if (Test-Path -LiteralPath $profileRoot) {
        [System.IO.Directory]::Delete($profileRoot, $true)
    }
}
