# Verification record

**Status:** Blocked

V4 Volumetric Fluid Lens is implemented and its automated checks pass, but the
required real-window visual acceptance is blocked in the current automation
desktop. `tauri dev` starts the executable and WebView2 without a logged startup
error, while the process exposes no enumerable window handle and does not appear
in a full Windows desktop capture. Per the project UI rules, the browser render
below is diagnostic evidence only and cannot make UI acceptance green.

**Target environment:** Windows 11 x64, Tauri 2.11.5, Rust 1.97.1,
Node.js 24.18.0, official `@openai/codex` 0.147.0 runtime, and bundled
Microsoft Edge WebView2 Fixed Runtime 151.0.4129.78.

**Artifact:** `release/CodexCapacity-0.1.0-win-x64/` (locally generated and
ignored by Git). The current executable SHA-256 is
`77f3f548ceb594bc737e444c586418aa80c3b37f814c4c96e63bba38d9a638b7`.

## Current checks

| Journey or boundary | Command / action | Actual result |
| --- | --- | --- |
| React state and interaction | `npm.cmd test` | Passed: 14 tests, including loading, healthy/failure/stale states, settings, layout transitions, linear 18%/95% liquid volume, volume conservation and independent chamber state. |
| Type and production frontend | `npm.cmd run typecheck`; `npm.cmd run build` | Passed; Vite emitted the production assets. |
| Rust integration | `cargo clippy --all-targets -- -D warnings`; `cargo test` | Passed; Clippy is clean and 13 Rust tests passed, including rejection of an incomplete adjacent WebView2 runtime. The localized linker import-library notice is informational. |
| Impeccable mechanical scan | `node .agents/skills/impeccable/scripts/detect.mjs --json ...` | Passed with zero findings. |
| Static V4 render | Chrome 600x260 development fixture using the production React/CSS/canvas components | Passed as a diagnostic comparison: transparent outer corners, equal quota hierarchy, strict 18%/95% levels, thick optical rims, meniscus, depth absorption, particles and caustics are visible. |
| Release build | `npm.cmd run tauri:build`; `scripts/package-portable.ps1` | Passed; 257 files / 997,567,453 bytes. The portable directory contains the executable, pinned Codex runtime, Microsoft-signed WebView2 Fixed Runtime, README, notices and SHA-256 manifest. |
| WebView2-independent portable launch | Start the release executable, wait 8 seconds, enumerate `msedgewebview2` processes by executable path | Passed; the app remained running and all 7 observed WebView2 processes loaded `release/.../webview2-runtime/msedgewebview2.exe`. The runtime signature is valid and issued to Microsoft Corporation. |
| Real Tauri visual/drag/motion acceptance | Locate the actual floating window, drag/release it, record shell glide and post-stop liquid settling, then compare with V4 drawings | **Blocked:** the controlled desktop session could not enumerate or capture the window. No claim of visual or motion acceptance is made. |

## Evidence

- [V4 600x260 diagnostic WebView render](screenshots/v4-webview-render.png)
- [Approved V4 material](../../.impeccable/mocks/rework-v4/v4-volumetric-material.png)
- [Approved V4 inertia storyboard](../../.impeccable/mocks/rework-v4/v4-fluid-inertia-storyboard-v2.png)

## Known limitations

- The portable directory is about 998 MB because it includes both the official
  Windows x64 Codex CLI runtime and a complete WebView2 Fixed Runtime. The
  executable must remain beside both runtime directories.
- Real-window compact, expanded, failure, collapsed, drag and motion screenshots
  must be recaptured from a visible interactive Windows session before V4 can be
  called `Verified`.
- There is intentionally no installer, updater, code signature, usage history,
  notification system, startup registration, or reset redemption.
