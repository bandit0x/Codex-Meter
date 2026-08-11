# Verification record

**Status:** Acceptance pending

The V6 optical build now has current real-window evidence from the packaged
Tauri executable. It keeps the approved 600x260 proportions, renders both the
outer shell and liquid chambers with WebGL2 optical shaders, preserves linear
liquid height, and fixes the fast-pointer drag race that could discard movement
while the native window position was loading. Automated and real-window checks
pass; user visual acceptance is still required before this build may be called
fully accepted.

**Target environment:** Windows 11 x64, Tauri 2.11.5, Rust 1.97.1,
Node.js 24.18.0, official `@openai/codex` 0.147.0 runtime, and bundled
Microsoft Edge WebView2 Fixed Runtime 151.0.4129.78.

**Artifact:** `release/CodexCapacity-0.1.0-win-x64/` (locally generated and
ignored by Git). The current executable SHA-256 is
`291b5f2a18607b87a4715905638d522f300c50b709f59dd850f5a1cb07029e57`.

## Current checks

| Journey or boundary | Command / action | Actual result |
| --- | --- | --- |
| React state and interaction | `npm.cmd test` | Passed: 17 tests, including loading, healthy/failure/stale states, settings, layout transitions, linear 18%/95% liquid volume, volume conservation, independent chamber state, pointer-drag position updates, the immediate-drag/native-position race, and required Tauri drag permission. |
| Type and production frontend | `npm.cmd run typecheck`; `npm.cmd run build` | Passed; Vite emitted the production assets. |
| Rust integration | `cargo clippy --all-targets -- -D warnings`; `cargo test` | Passed; Clippy is clean and 13 Rust tests passed, including rejection of an incomplete adjacent WebView2 runtime. The localized linker import-library notice is informational. |
| Impeccable mechanical scan | `node .agents/skills/impeccable/scripts/detect.mjs --json ...` | Passed with zero findings. |
| Static V6 render | Chrome 600x260 development fixture using the production React/CSS/WebGL2 components | Passed as a diagnostic comparison: transparent exterior, equal quota hierarchy, strict 18%/95% levels, an 18px rounded-SDF outer wall, 16px chamber walls, multi-band meniscus, depth absorption, moving density refraction, particles and deep-water caustics are visible. The shell and both reservoirs report active WebGL renderers with no console errors. |
| Release build | `npm.cmd run tauri:build`; `scripts/package-portable.ps1` | Passed; 257 files / 997,551,540 bytes before verification signatures. The portable directory contains the executable, pinned Codex runtime, Microsoft-signed WebView2 Fixed Runtime, README, notices and SHA-256 manifest. |
| WebView2-independent portable launch | Start the release executable, wait 8 seconds, enumerate `msedgewebview2` processes by executable path | Passed; the app remained running and all 7 observed WebView2 processes loaded `release/.../webview2-runtime/msedgewebview2.exe`. The runtime signature is valid and issued to Microsoft Corporation. |
| Real Tauri drag | Win32 pointer drag against the packaged 600x260 window; compare `GetWindowRect` before/after | Passed: a 126x58 pointer path produced a final 216x98 window displacement. Between 25ms and 220ms after release, the shell continued another 57x25, proving glide rather than a static jump. |
| Real liquid post-release motion | Capture the packaged window at 25ms, 220ms and 900ms after the same drag; compare the weekly chamber crop | Passed: mean absolute RGB difference was 20.689 from 25ms to 220ms and 16.137 from 220ms to 900ms. The higher settled-frame difference is expected because V6 retains slow internal density/refraction flow after the free surface settles. |
| Real Tauri visual comparison | Compare the current 600x260 packaged-window capture with the approved V4 material at the same composition | Implementation evidence passes: transparent exterior margin, continuous four-sided outer lens, equal chambers, enlarged quota numerals, linear liquid height, visible volume at a real 19% weekly quota, moving thick meniscus, depth caustics and inset footer hierarchy are present. **Acceptance pending:** the project owner has not yet approved this V6 capture. |

## Evidence

- [V6 real Tauri pre-drag frame](screenshots/v6-optical-tauri-before.png)
- [V6 real Tauri settled frame](screenshots/v6-optical-tauri-final.png)
- [V6 real Tauri release motion frame A](screenshots/v6-optical-tauri-motion-a.png)
- [V6 real Tauri release motion frame B](screenshots/v6-optical-tauri-motion-b.png)
- [Approved V4 material](../../.impeccable/mocks/rework-v4/v4-volumetric-material.png)
- [Approved V4 inertia storyboard](../../.impeccable/mocks/rework-v4/v4-fluid-inertia-storyboard-v2.png)

## Known limitations

- The portable directory is about 998 MB because it includes both the official
  Windows x64 Codex CLI runtime and a complete WebView2 Fixed Runtime. The
  executable must remain beside both runtime directories.
- Expanded, failure and collapsed states still need refreshed packaged
  screenshots if the owner accepts this compact-state V6 visual direction.
- There is intentionally no installer, updater, code signature, usage history,
  notification system, startup registration, or reset redemption.
