# Codex Capacity

Codex Capacity is a manually launched Windows 11 floating overlay for a single
Codex user. It reads the official local Codex `app-server` protocol and shows
five-hour and weekly Remaining Capacity with equal visual priority.

## Run the portable build

1. Keep `Codex Capacity.exe`, `codex-runtime`, and `webview2-runtime` together.
2. Double-click `Codex Capacity.exe`.
3. Codex must already be authenticated for the same Windows user.
4. Drag the top edge to move the overlay. Click the arrow for reset details,
   refresh, a bounded 10-second click-through mode, and display settings.
5. The overlay does not create a taskbar button. Use the Codex Capacity icon in
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

## Publish to your GitHub account

The repository is prepared for local-to-GitHub publication: generated builds,
downloaded runtimes, local profiles, caches, logs, and test output are ignored.
No remote is configured and no source has been uploaded by this project.

See [`docs/GITHUB_PUBLISH.md`](docs/GITHUB_PUBLISH.md) for the final local
checks and the commands you can run yourself after choosing repository
visibility and a license policy.
