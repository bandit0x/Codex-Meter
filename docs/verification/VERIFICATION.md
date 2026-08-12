# Verification record

**Status:** Acceptance pending

V9 keeps the approved V8 half-scale liquid implementation and adds quiet
Windows notification-area lifecycle behavior. Compact, expanded and
collapsed windows are now 300x130, 300x160 and 260x48 logical pixels. The
original CSS composition is rendered at 0.5 scale, so typography, spacing,
glass walls, liquid amplitude and interaction geometry remain proportional.

The liquid volume no longer uses the rejected Voronoi/grid filaments. It uses
a continuous advected density field, curl-derived velocity, density-gradient
lighting and soft bottom-focused caustics. Window acceleration drives both the
conserved free-surface model and a separately damped body-momentum field, so
the internal optical density continues moving after pointer release.

Every Codex app-server read now uses the Windows `CREATE_NO_WINDOW` creation
flag, so neither first launch nor the 60-second refresh creates a console.
The overlay is excluded from the normal taskbar, registers a notification-area
icon with show/hide/exit actions, and converts window close into hide-to-tray.
Only an explicit tray exit is allowed to terminate the event loop.

**Source:** local commit `a4e59f1` (`fix: run quietly from the system tray`).

**Target environment:** Windows 11 x64, Tauri 2.11.5, Rust 1.97.1,
Node.js 24.18.0, official `@openai/codex` 0.147.0 runtime, and bundled
Microsoft Edge WebView2 Fixed Runtime 151.0.4129.78.

**Artifact:** `release/CodexCapacity-0.1.0-win-x64/` (locally generated and
ignored by Git), 257 files / 998,099,198 bytes. `Codex Capacity.exe` SHA-256:
`80ed5920d033fad3d8c63984b8a33c3623045d462a763a830314c80345c69f96`.

## Current checks

| Journey or boundary | Command / action | Actual result |
| --- | --- | --- |
| React state and interaction | `npm.cmd test -- --run` | Passed: 19 tests across 4 files, including exact half-scale layout sizes, linear quota-to-volume mapping, surface-volume conservation, independent chambers, body-momentum decay, state rendering and pointer drag behavior. |
| Type and production frontend | `npm.cmd run typecheck`; production build inside `npm.cmd run tauri:build` | Passed; Vite emitted the production assets. |
| Rust integration | `cargo clippy --all-targets -- -D warnings`; `cargo test` | Passed; Clippy is clean and all 14 Rust tests passed, including the no-taskbar configuration contract. The localized MSVC import-library linker notice is informational. |
| Impeccable mechanical scan | `node .agents/skills/impeccable/scripts/detect.mjs --json ...` | Passed with zero findings. |
| Five visual states | Deterministic Chromium/WebGL2 fixtures at the physical target sizes | Passed: healthy, loading, failed, expanded and collapsed screenshots use 300x130, 300x160 or 260x48 crops. No liquid grid or mid-volume hard lines remain. |
| Release build | `npm.cmd run tauri:build`; `scripts/package-portable.ps1` | Passed; the manifest records source commit `a4e59f1`, the pinned Codex runtime and WebView2 Fixed Runtime. |
| Quiet child processes | Monitor every visible top-level window belonging to the packaged app and its descendants for 65 seconds | Passed across initial load and the 60-second automatic refresh: zero `ConsoleWindowClass` windows were created. |
| Taskbar exclusion | Inspect the live Windows 11 taskbar UI Automation tree while the packaged app is running | Passed: zero `Taskbar.TaskListButtonAutomationPeer` elements matched `Codex Capacity`. |
| Close-to-tray lifecycle | Send a real `WM_CLOSE` to the packaged Tauri window and inspect visibility/process state | Passed: the 300x130 window changed from visible to hidden while the process remained alive. The tray is built with an explicit 32x32 PNG, left-click toggle, and show/hide/exit menu; setup failure would terminate startup. |
| WebView2-independent portable launch | Start the packaged executable with isolated AppData and inspect processes created after launch | Passed; the app created a 300x130 real window and 7 WebView2 processes from the bundled runtime, so the machine-wide WebView2 installation is not required. |
| Real Tauri drag inertia | Drag the packaged window 81x45 px, then compare `GetWindowRect` after release | Passed: the window was displaced 94x52 by 25 ms, coasted another 61x34 by 220 ms, then another 16x9 by 900 ms. |
| Real liquid post-release motion | Capture the packaged window before drag and at 25 ms, 220 ms and 900 ms; compare the weekly chamber at matching local coordinates | Passed on a real 88% weekly quota. The surface banks and rebounds across all four frames. Mean absolute RGB changes for the full weekly chamber were 9.232, 14.969 and 5.372; the lower body-only crop still changed by 1.350, 1.951 and 0.825, confirming continuing internal density movement rather than only a moving edge. |
| Reference and license review | Review `D:/bandit/refs/ui-refs/webgl-fluid-simulation/script.js` and MIT license | Passed. The implementation adapts backward-advection, curl/vorticity and density-gradient-lighting concepts without copying the reference framebuffer solver; attribution is in `THIRD_PARTY_NOTICES.md`. |

## Evidence

- [V8 real Tauri pre-drag frame](screenshots/v8-half-tauri-before.png)
- [V8 real Tauri release frame at 25 ms](screenshots/v8-half-tauri-motion-25ms.png)
- [V8 real Tauri release frame at 220 ms](screenshots/v8-half-tauri-motion-220ms.png)
- [V8 real Tauri release frame at 900 ms](screenshots/v8-half-tauri-motion-900ms.png)
- [V8 deterministic healthy state](screenshots/v8-half-healthy.png)
- [V8 deterministic loading state](screenshots/v8-half-loading.png)
- [V8 deterministic failed state](screenshots/v8-half-failed.png)
- [V8 deterministic expanded state](screenshots/v8-half-expanded.png)
- [V8 deterministic collapsed state](screenshots/v8-half-collapsed.png)
- [Approved half-scale contract](../../.impeccable/mocks/rework-v5/half-scale-contract.png)
- [Approved V4 material](../../.impeccable/mocks/rework-v4/v4-volumetric-material.png)

## Known limitations

- The portable directory is about 998 MB because it includes both the official
  Windows x64 Codex CLI runtime and a complete WebView2 Fixed Runtime. The
  executable must remain beside both runtime directories.
- Strict 50% scaling also halves small secondary copy and control targets; this
  is faithful to the approved contract but is denser than standard desktop
  accessibility guidance.
- There is intentionally no installer, updater, code signature, usage history,
  notification system, startup registration, or reset redemption.
