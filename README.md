# Codex Capacity

Codex Capacity is a manually launched Windows 11 floating overlay for a single
Codex user. It reads the official local Codex `app-server` protocol and shows
five-hour and weekly Remaining Capacity with equal visual priority.

## Run the portable build

1. Keep `Codex Capacity.exe` and the `codex-runtime` directory together.
2. Double-click `Codex Capacity.exe`.
3. Codex must already be authenticated for the same Windows user.
4. Drag the top edge to move the overlay. Click the arrow for reset details,
   refresh, a bounded 10-second click-through mode, and display settings.

The app does not register a Run key, scheduled task, service, or other startup
entry. Close it normally and launch it manually when needed.

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

See `PRODUCT.md`, `DESIGN.md`, and `THIRD_PARTY_NOTICES.md` for the approved
scope, visual direction, and runtime license notice.
