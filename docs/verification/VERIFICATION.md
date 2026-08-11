# Verification record

**Status:** Blocked

V4 Volumetric Fluid Lens is implemented and its automated checks pass, but the
required real-window visual acceptance is blocked in the current automation
desktop. `tauri dev` starts the executable and WebView2 without a logged startup
error, while the process exposes no enumerable window handle and does not appear
in a full Windows desktop capture. Per the project UI rules, the browser render
below is diagnostic evidence only and cannot make UI acceptance green.

**Target environment:** Windows 11 x64, Tauri 2.11.5, WebView2, Rust 1.97.1,
Node.js 24.18.0, official `@openai/codex` 0.147.0 runtime.

**Artifact:** `release/CodexCapacity-0.1.0-win-x64/` (locally generated and
ignored by Git). The current executable SHA-256 is
`664329dfc1e8f628f80413dbe5e4c9ca933e9858eddd95ade557f85051c50623`.

## Current checks

| Journey or boundary | Command / action | Actual result |
| --- | --- | --- |
| React state and interaction | `npm.cmd test` | Passed: 14 tests, including loading, healthy/failure/stale states, settings, layout transitions, linear 18%/95% liquid volume, volume conservation and independent chamber state. |
| Type and production frontend | `npm.cmd run typecheck`; `npm.cmd run build` | Passed; Vite emitted the production assets. |
| Rust integration | `cargo check`; `cargo test` | Passed; 12 Rust tests passed. The localized linker import-library notice is informational. |
| Impeccable mechanical scan | `node .agents/skills/impeccable/scripts/detect.mjs --json ...` | Passed with zero findings. |
| Static V4 render | Chrome 600x260 development fixture using the production React/CSS/canvas components | Passed as a diagnostic comparison: transparent outer corners, equal quota hierarchy, strict 18%/95% levels, thick optical rims, meniscus, depth absorption, particles and caustics are visible. |
| Release build | `npm.cmd run tauri:build`; `scripts/package-portable.ps1` | Passed; the portable directory contains the executable, pinned Codex runtime, README, notices and SHA-256 manifest. |
| Real Tauri launch | `npm.cmd run tauri:dev` | Process and WebView2 started without a logged startup error. |
| Real Tauri visual/drag/motion acceptance | Locate the actual floating window, drag/release it, record shell glide and post-stop liquid settling, then compare with V4 drawings | **Blocked:** the controlled desktop session could not enumerate or capture the window. No claim of visual or motion acceptance is made. |

## Evidence

- [V4 600x260 diagnostic WebView render](screenshots/v4-webview-render.png)
- [Approved V4 material](../../.impeccable/mocks/rework-v4/v4-volumetric-material.png)
- [Approved V4 inertia storyboard](../../.impeccable/mocks/rework-v4/v4-fluid-inertia-storyboard-v2.png)

## Known limitations

- The portable directory is about 308 MB because it includes the official
  Windows x64 Codex CLI runtime needed to avoid WindowsApps execution ACLs.
- Real-window compact, expanded, failure, collapsed, drag and motion screenshots
  must be recaptured from a visible interactive Windows session before V4 can be
  called `Verified`.
- There is intentionally no installer, updater, code signature, usage history,
  notification system, startup registration, or reset redemption.
