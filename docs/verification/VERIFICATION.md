# Verification record

**Status:** Blocked

V2 automatic checks remain historical evidence, but the user rejected its real
window on 2026-08-11. The current portable directory is not an accepted visual
deliverable. Product implementation is frozen until the V4 Volumetric Fluid
Lens material in `.impeccable/mocks/rework-v4/` is approved.

The rejection covers five material failures: rectangular gray native chrome,
an effectively unusable 18 px drag rail, a compressed non-linear liquid-height
mapping, imperceptible fluid motion with no drag slosh, and insufficient glass
refraction/3D depth.

**Target environment:** Windows 11 x64, Tauri 2.11.5, WebView2, Rust 1.97.1,
Node.js 24.18.0, official `@openai/codex` 0.147.0 runtime.

**Artifact:** `release/CodexCapacity-0.1.0-win-x64/` (locally generated and
ignored by Git). `Codex Capacity.exe` SHA-256:
`796aaf8c44a1f4002dcf169d5816a3cde31c908b06890062afd660d91a01a4c3`.
The final local source revision is recorded in the portable `manifest.json`.

## Reproducible checks

| Journey or boundary | Command / action | Actual result |
| --- | --- | --- |
| React state and interaction | `npm.cmd run test` | 11 passed: loading, healthy values, retry, stale retention, unavailable values, preferences, refresh race, compact/expanded/collapsed transitions, and Escape recovery. |
| Type and production frontend | `npm.cmd run typecheck`; `npm.cmd run build` | Passed; Vite emitted the embedded production assets. |
| Rust contract and quality | `cargo fmt --check`; `cargo clippy --offline --all-targets -- -D warnings`; `cargo test --locked --offline` | Passed; 12 Rust tests passed, including the V2 liquid-glass default preference contract. The localized linker import-library notice is informational only. |
| Tauri window-size capability | V2 expand, collapse, and restore in a live Tauri debug window | Passed: outer size changed 616x269 -> 616x329 -> 536x105 -> 616x269 (Windows non-client frame included). |
| Real compact / expanded / settings | Live Tauri debug window, including right-click and Escape | Passed. The 600x260 compact surface, 600x320 detail surface, settings dialog, and keyboard close path rendered and operated. |
| Portable build | `npm.cmd run tauri:build`; `scripts/package-portable.ps1` | Passed. The directory contains the executable, pinned official Codex runtime, notices, README, and SHA-256 manifest. |
| Portable live data | Launch the portable executable with an isolated `CODEX_CREDITS_CONFIG_DIR` | Passed. It read weekly capacity from the official app-server; an absent five-hour field rendered truthfully as unavailable. No reset was redeemed. |
| Portable failure recovery | Launch portable executable against local `logged-out` fixture | Passed. One shared error surface rendered with actionable text, `CRV-202`, and Retry. |
| Authored motion | Two screenshots of the same new portable window, four seconds apart | Passed: 25,466 of 165,704 pixels changed (15.37%). The explicit “减少动效” preference remains the opt-out; no global rule silently disables V2 motion. |

## Real application evidence

- [V2 compact healthy](screenshots/v2-compact-healthy.png)
- [V2 expanded](screenshots/v2-expanded.png)
- [V2 collapsed](screenshots/v2-collapsed.png)
- [V2 settings](screenshots/v2-settings.png)
- [Portable live data](screenshots/v2-portable-live.png)
- [Portable failure](screenshots/v2-portable-failed.png)
- [Portable motion frame A](screenshots/v2-portable-motion-a.png)
- [Portable motion frame B](screenshots/v2-portable-motion-b.png)

## Known limitations

- The portable directory is about 308 MB because it includes the official
  Windows x64 Codex CLI runtime needed to avoid WindowsApps execution ACLs.
- There is intentionally no installer, updater, code signature, usage history,
  notification system, startup registration, or reset redemption.
