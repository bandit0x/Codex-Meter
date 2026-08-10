# Verification record

**Status:** Acceptance pending

**Implementation source:** local commit `17802fd` (`feat: implement Codex capacity overlay`)

**Target environment:** Windows 11 x64, Tauri 2.11.5, WebView2, Rust 1.97.1,
Node.js 24.18.0, official `@openai/codex` 0.147.0 runtime

**Artifact:** `release/CodexCapacity-0.1.0-win-x64/` (generated locally and ignored by Git)

## Reproducible checks

| Journey or boundary | Command / action | Actual result |
| --- | --- | --- |
| React state and interaction | `npm.cmd run test` | 7 tests passed: loading parity, healthy values, retry, controls, stale retention, display preferences, refresh-race protection. |
| Type contract | `npm.cmd run typecheck` | Passed with no TypeScript errors. |
| Frontend production build | `npm.cmd run build` | Passed; Vite emitted embedded production assets. |
| Rust and JSON-RPC contract | `cargo test --locked --offline` in the MSVC environment | 11 tests passed: normalization, missing fields, sparse updates, fixture process, logged-out, malformed JSON, early exit, resolver, and preference round-trip. |
| Rust lint and format | `cargo fmt --check`; `cargo clippy --all-targets -- -D warnings` | Passed. The later test linker prints a localized import-library informational warning only. |
| Dependency audit | `npm.cmd audit --omit=dev --offline` | 0 vulnerabilities. Official Codex runtime is pinned to 0.147.0 and Apache-2.0. |
| Impeccable detector | `node .agents/skills/impeccable/scripts/detect.mjs src index.html --viewport 600x260` | 0 findings after replacing layout-affecting liquid-height animation with `clip-path`. Detector ran in documented degraded regex mode because optional parser modules were unavailable. |
| Portable build | `npm.cmd run tauri:build -- --no-bundle`; `scripts/package-portable.ps1` | Produced `Codex Capacity.exe`, sibling `codex-runtime/bin/codex.exe`, notices, README, and SHA-256 manifest. |
| Real Codex read | Launch portable directory without fixture override | Passed. The separate official app-server returned weekly Remaining Capacity and reset time; absent five-hour and reset-credit fields remained visibly unavailable rather than being invented. No credit was redeemed. |
| Failure recovery | Launch against fixture scenario `logged-out` | Passed. One shared liquid-glass failure surface showed actionable text and stable code `CRV-202`, with Retry. |
| Position restore | Launch with isolated `CODEX_CREDITS_CONFIG_DIR`, move to `(120,160)`, close, reopen | Passed. The local JSON contained only opacity, reduced-motion, x, and y; reopened window origin was exactly `(120,160)`. |
| Bounded click-through | Activate `穿透 10 秒`, inspect Win32 extended style immediately and after 11 seconds | Passed. `WS_EX_TRANSPARENT` changed from true to false automatically. |
| Manual-start boundary | Inspect HKCU Run and scheduled tasks; scan implementation for registration calls | 0 matching Run entries, 0 scheduled tasks, and no startup-registration code. |

## Real application screenshots

- [Loading](screenshots/portable-loading.png)
- [Healthy fixture](screenshots/portable-final-healthy.png)
- [Expanded controls](screenshots/portable-expanded.png)
- [Logged-out failure](screenshots/portable-failed-logged-out.png)
- [Real Codex](screenshots/portable-live-codex.png)
- [Isolated-profile reopen](screenshots/portable-isolated-reopen.png)

The screenshots are from the actual packaged Tauri window at 616×269 physical
pixels, not a static HTML preview. The compact and expanded surfaces preserve
the approved Scheme 3 single-capsule split lens, equal five-hour/weekly visual
weight, quiet liquid-glass material, shared failure plane, and single expand
control.

## Known limitations

- The portable directory is about 308 MB because it includes the official
  Windows x64 Codex CLI runtime needed to avoid WindowsApps execution ACLs.
- The first release has no installer, updater, code signature, usage history,
  notifications, or startup registration by design.
- During the live smoke test, the upstream response omitted the five-hour
  window and Full Reset Credit details. Their truthful unavailable rendering
  is verified; a live non-null value for those two fields was not available in
  that snapshot. Deterministic protocol tests cover their populated forms.
- Final human acceptance of the implemented application remains pending.
