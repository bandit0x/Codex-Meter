# Verification record

**Status:** Acceptance pending

The V7 optical build now has current real-window evidence from the packaged
Tauri executable. It keeps the approved 600x260 proportions and the V6 thick
glass shell, while restoring a visibly volumetric liquid model: animated free
surface refraction, Beer-Lambert-style depth transmission, body scattering,
large-scale caustics, a thick meniscus and an independently damped drag slosh.
Liquid height remains linear with the quota percentage. Automated and
real-window checks pass; user visual acceptance is still required.

**Target environment:** Windows 11 x64, Tauri 2.11.5, Rust 1.97.1,
Node.js 24.18.0, official `@openai/codex` 0.147.0 runtime, and bundled
Microsoft Edge WebView2 Fixed Runtime 151.0.4129.78.

**Artifact:** `release/CodexCapacity-0.1.0-win-x64/` (locally generated and
ignored by Git). The current executable SHA-256 is
`9cf1035eb3031e17190316f3963ce14b9ac34dc9e398dd6f2836b0790ed6a877`.

## Current checks

| Journey or boundary | Command / action | Actual result |
| --- | --- | --- |
| React state and interaction | `npm.cmd test` | Passed: 17 tests, including loading, healthy/failure/stale states, settings, layout transitions, linear 18%/95% liquid volume, volume conservation, independent chamber state, pointer-drag position updates, the immediate-drag/native-position race, and required Tauri drag permission. |
| Type and production frontend | `npm.cmd run typecheck`; `npm.cmd run build` | Passed; Vite emitted the production assets. |
| Rust integration | `cargo clippy --all-targets -- -D warnings`; `cargo test` | Passed; Clippy is clean and 13 Rust tests passed, including rejection of an incomplete adjacent WebView2 runtime. The localized linker import-library notice is informational. |
| Impeccable mechanical scan | `node .agents/skills/impeccable/scripts/detect.mjs --json ...` | Passed with zero findings. |
| Static V7 render | Chrome 600x260 development fixture using the production React/CSS/WebGL2 components | Passed as a diagnostic comparison: strict 18%/95% levels, a moving multi-band meniscus, refracted chamber background, depth-dependent transmission/scattering, particles, broad light sheets and animated caustics are visible. Two frames 0.8 seconds apart produced mean absolute RGB differences of 2.374 in the shallow 18% liquid crop and 2.236 in the 95% liquid crop, proving continuous motion rather than a static texture. |
| Release build | `npm.cmd run tauri:build`; `scripts/package-portable.ps1` | Passed; 257 files / 997,551,540 bytes before verification signatures. The portable directory contains the executable, pinned Codex runtime, Microsoft-signed WebView2 Fixed Runtime, README, notices and SHA-256 manifest. |
| WebView2-independent portable launch | Start the release executable, wait 8 seconds, enumerate `msedgewebview2` processes by executable path | Passed; the app remained running and all 6 observed WebView2 processes loaded `release/.../webview2-runtime/msedgewebview2.exe`. The runtime signature is valid and issued to Microsoft Corporation. |
| Real Tauri drag | Win32 pointer drag against the packaged 600x260 window; compare `GetWindowRect` before/after | Passed: a 126x58 pointer path produced a final 237x108 window displacement. Between 25ms and 220ms after release, the shell continued another 79x35, proving window glide rather than a static jump. |
| Real liquid post-release motion | Capture the packaged window before drag and at 25ms, 220ms and 900ms after release; compare the weekly chamber crop | Passed on a real 15% quota. The surface first banked left, then rose sharply at the right wall, then crossed back toward level. Mean absolute RGB differences were 5.209, 9.664 and 8.751 between consecutive frames, proving independent liquid inertia and ongoing optical flow. |
| Real Tauri visual comparison | Compare the current 600x260 packaged-window capture with the approved V4 material at the same composition | Implementation evidence passes: transparent exterior margin, continuous four-sided outer lens, equal chambers, linear liquid height, a visibly thick free surface, refracted shallow volume, moving caustics and inset footer hierarchy are present. **Acceptance pending:** the project owner has not yet approved this V7 capture. |

## Evidence

- [V7 real Tauri pre-drag frame](screenshots/v7-volumetric-tauri-before.png)
- [V7 real Tauri release motion frame A](screenshots/v7-volumetric-tauri-motion-a.png)
- [V7 real Tauri release motion frame B](screenshots/v7-volumetric-tauri-motion-b.png)
- [V7 real Tauri settled frame](screenshots/v7-volumetric-tauri-final.png)
- [Approved V4 material](../../.impeccable/mocks/rework-v4/v4-volumetric-material.png)
- [Approved V4 inertia storyboard](../../.impeccable/mocks/rework-v4/v4-fluid-inertia-storyboard-v2.png)

## Known limitations

- The portable directory is about 998 MB because it includes both the official
  Windows x64 Codex CLI runtime and a complete WebView2 Fixed Runtime. The
  executable must remain beside both runtime directories.
- Expanded, failure and collapsed states still need refreshed packaged
  screenshots if the owner accepts this compact-state V7 visual direction.
- There is intentionally no installer, updater, code signature, usage history,
  notification system, startup registration, or reset redemption.
