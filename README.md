# Codex Meter

Codex Meter is a manually launched Windows 11 floating overlay for a single
Codex user. It reads the official local Codex `app-server` protocol and shows
five-hour and weekly Remaining Capacity with equal visual priority.

## Run the portable build

1. Keep `Codex Meter.exe`, `codex-runtime`, and `webview2-runtime` together.
2. Double-click `Codex Meter.exe`.
3. Codex must already be authenticated for the same Windows user.
4. Drag the top edge to move the overlay. Click the arrow for reset details,
   refresh, a bounded 10-second click-through mode, and display settings.
5. The overlay does not create a taskbar button. Use the Codex Meter icon in
   the Windows notification area to show, hide, or exit the app. A left click
   toggles the overlay; a right click opens the tray menu.

The app does not register a Run key, scheduled task, service, or other startup
entry. Closing the overlay hides it to the tray; choose **退出** from the tray
menu to stop it completely. Launch it manually when needed.

## Data and safety boundary

- Reads a separately spawned, official Codex `app-server` process.
- Does not attach to Codex Desktop's private stdio.
- Does not inspect process memory, browser cookies, or credentials.
- Does not redeem Full Reset Credits or mutate the account.
- Stores only local display preferences under the current user profile.

## Development checks

```powershell
npm.cmd run test
npm.cmd run typecheck
npm.cmd run build
```

Rust tests and the Tauri build require the Windows MSVC developer environment.
The reproducible portable directory is generated with:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts\package-portable.ps1
```

Before the first portable package on a clean checkout, download and verify the
pinned Microsoft-signed WebView2 Fixed Runtime:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts\fetch-webview2-fixed-runtime.ps1
```

See `PRODUCT.md`, `DESIGN.md`, and `THIRD_PARTY_NOTICES.md` for the approved
scope, visual direction, and runtime license notice.

## 发布到你的 GitHub 账号

仓库已经做好发布前隔离：构建产物、下载的运行时、本地 profile、缓存、日志和测试输出均不会进入 Git。项目没有配置远程地址，也没有自行上传任何源码。

完整步骤见 [`docs/GITHUB_PUBLISH.md`](docs/GITHUB_PUBLISH.md)。请先决定仓库可见性与许可证，再由项目所有者本人执行创建远程仓库和推送命令。
