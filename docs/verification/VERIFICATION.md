# Verification record

**Status:** Acceptance pending

The V4 recovery build now has current real-window evidence from the packaged
Tauri executable. It fixes the missing Tauri position permission, restores the
approved 600x260 optical proportions, prevents readable desktop content from
bleeding through healthy/loading chambers, and deepens the Canvas liquid. The
automated and real-window checks below pass; user visual acceptance is still
required before this build may be called fully accepted.

**Target environment:** Windows 11 x64, Tauri 2.11.5, Rust 1.97.1,
Node.js 24.18.0, official `@openai/codex` 0.147.0 runtime, and bundled
Microsoft Edge WebView2 Fixed Runtime 151.0.4129.78.

**Artifact:** `release/CodexCapacity-0.1.0-win-x64/` (locally generated and
ignored by Git). The current executable SHA-256 is
`43b9238bcafcbcae495a5dc391684515bb862f338d26eadb7ba1f25a3365aa58`.

## Current checks

| Journey or boundary | Command / action | Actual result |
| --- | --- | --- |
| React state and interaction | `npm.cmd test` | Passed: 16 tests, including loading, healthy/failure/stale states, settings, layout transitions, linear 18%/95% liquid volume, volume conservation, independent chamber state, pointer-drag position updates, and required Tauri drag permission. |
| Type and production frontend | `npm.cmd run typecheck`; `npm.cmd run build` | Passed; Vite emitted the production assets. |
| Rust integration | `cargo clippy --all-targets -- -D warnings`; `cargo test` | Passed; Clippy is clean and 13 Rust tests passed, including rejection of an incomplete adjacent WebView2 runtime. The localized linker import-library notice is informational. |
| Impeccable mechanical scan | `node .agents/skills/impeccable/scripts/detect.mjs --json ...` | Passed with zero findings. |
| Static V4 render | Chrome 600x260 development fixture using the production React/CSS/canvas components | Passed as a diagnostic comparison: transparent outer corners, equal quota hierarchy, strict 18%/95% levels, thick optical rims, meniscus, depth absorption, particles and caustics are visible. |
| Release build | `npm.cmd run tauri:build`; `scripts/package-portable.ps1` | Passed; 257 files / 997,567,453 bytes. The portable directory contains the executable, pinned Codex runtime, Microsoft-signed WebView2 Fixed Runtime, README, notices and SHA-256 manifest. |
| WebView2-independent portable launch | Start the release executable, wait 8 seconds, enumerate `msedgewebview2` processes by executable path | Passed; the app remained running and all 7 observed WebView2 processes loaded `release/.../webview2-runtime/msedgewebview2.exe`. The runtime signature is valid and issued to Microsoft Corporation. |
| Real Tauri drag | Win32 pointer drag against the packaged 600x260 window; compare `GetWindowRect` before/after | Passed: a 110x50 pointer path produced a final 182x83 window displacement. At 25ms and 220ms after release, the shell continued another 47x22, proving glide rather than a static jump. |
| Real liquid post-release motion | Capture the packaged window at 25ms, 220ms and 900ms after the same drag; compare the weekly chamber crop | Passed: mean absolute RGB difference was 26.698 from 25ms to 220ms and decayed to 5.981 from 220ms to 900ms. The liquid remained active after shell release and settled rather than freezing. |
| Real Tauri visual comparison | Compare the current 600x260 packaged-window capture with the approved V4 material at the same composition | Automated inspection passed: transparent exterior margin, inset optical shell, equal chambers, linear liquid height, opaque absorption chambers, thick meniscus, organic caustics and footer hierarchy are present. **Acceptance pending:** the project owner has not yet approved this recovery capture. |

## Evidence

- [V4 600x260 diagnostic WebView render](screenshots/v4-webview-render.png)
- [V4 recovery real Tauri release frame](screenshots/v4-recovery-tauri-final.png)
- [V4 recovery release motion frame A](screenshots/v4-recovery-tauri-motion-a.png)
- [V4 recovery release motion frame B](screenshots/v4-recovery-tauri-motion-b.png)
- [Approved V4 material](../../.impeccable/mocks/rework-v4/v4-volumetric-material.png)
- [Approved V4 inertia storyboard](../../.impeccable/mocks/rework-v4/v4-fluid-inertia-storyboard-v2.png)

## Known limitations

- The portable directory is about 998 MB because it includes both the official
  Windows x64 Codex CLI runtime and a complete WebView2 Fixed Runtime. The
  executable must remain beside both runtime directories.
- Expanded, failure and collapsed recovery states still need refreshed packaged
  screenshots if the owner accepts this compact-state visual direction.
- There is intentionally no installer, updater, code signature, usage history,
  notification system, startup registration, or reset redemption.
