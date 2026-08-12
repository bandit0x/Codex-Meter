Status: ready-for-agent

# Codex Meter Floating Window

## Product Contract

- **Target user:** the project owner during personal Codex work on Windows 11 x64.
- **Environment:** manually launched portable desktop utility; Codex Desktop or CLI is installed and authenticated for the same Windows user. The app never starts with Windows.
- **Journey 1 — glance at capacity:** input is the latest Codex rate-limit snapshot; result is an always-on-top floating surface where five-hour and weekly Remaining Capacity have equal, immediate prominence. Acceptance: both values and their freshness can be understood without expanding the surface.
- **Journey 2 — inspect reset readiness:** input is a click on the compact surface; result is an expanded view with both Window Reset Times, available Full Reset Credits, and the nearest Credit Expiry Time. Acceptance: values are labeled unambiguously and missing upstream fields are not invented.
- **Journey 3 — recover from unavailable data:** input is missing Codex, logged-out state, timeout, disconnection, or stale data; result is an actionable message with a stable diagnostic identifier and a safe retry path. Acceptance: the last known value is visibly stale or absent, never presented as current.
- **Must have:** read-only app-server integration, compact and expanded liquid-glass surfaces, drag, always-on-top, mouse click-through toggle, manual refresh, truthful freshness, failure recovery, portable Windows executable.
- **Should have:** configurable opacity, remembered position, system-tray access, and reduced-motion behavior.
- **Later:** installer, history, analytics, notifications, additional providers, and reset redemption.
- **Explicitly not built in the first release:** startup registration, browser-cookie scraping, credential storage, process-memory inspection, interception of Codex Desktop's private stdio, automatic or manual reset-credit redemption, multi-account support, or source upload.
- **Design gate:** satisfied on 2026-08-10. The user approved 方案 3 · 单胶囊中央分舱 and the saved compact, expanded/loading, healthy, failure, and narrow/collapsed state board.

## Problem Statement

While working in Codex, the user cannot continuously see both short-window and weekly capacity, their automatic reset timing, and earned full-reset availability without leaving the active workflow. Existing dashboards and broad multi-provider tools expose more surface area than this personal use case needs.

## Solution

Provide a manually launched Windows floating companion that reads the official local Codex app-server protocol through a separate read-only session. It presents five-hour and weekly Remaining Capacity at equal top-level prominence, expands for reset details, and remains honest about data freshness and upstream failures.

## User Stories

1. As the Codex user, I want five-hour Remaining Capacity visible at a glance, so that I can judge immediate working headroom.
2. As the Codex user, I want weekly Remaining Capacity equally visible, so that short-term availability never hides longer-term risk.
3. As the Codex user, I want each Quota Window labeled explicitly, so that I never confuse five-hour and weekly values.
4. As the Codex user, I want both remaining percentages rendered with stable tabular figures, so that updates do not cause layout jitter.
5. As the Codex user, I want Window Reset Times as both countdowns and local absolute times, so that I can plan work accurately.
6. As the Codex user, I want the available Full Reset Credit count, so that I know whether an earned reset exists.
7. As the Codex user, I want the nearest known Credit Expiry Time, so that a reset does not expire unnoticed.
8. As the Codex user, I want missing credit details distinguished from zero credits, so that absent backend data is not misrepresented.
9. As the Codex user, I want to expand the floating surface on demand, so that secondary details do not crowd the glance view.
10. As the Codex user, I want to drag the surface, so that it does not cover active code or controls.
11. As the Codex user, I want the surface to remain above other windows, so that capacity stays visible while I work.
12. As the Codex user, I want to toggle mouse click-through, so that the overlay cannot block interactions underneath it.
13. As the Codex user, I want a manual refresh action, so that I can request a new snapshot when timing matters.
14. As the Codex user, I want the last successful refresh time, so that I can judge data freshness.
15. As the Codex user, I want stale values marked clearly, so that cached data is never mistaken for live data.
16. As the Codex user, I want actionable missing-Codex and logged-out messages, so that I know how to restore monitoring.
17. As the Codex user, I want timeouts to preserve the last known snapshot with a warning, so that a transient failure does not erase useful context.
18. As the Codex user, I want stable diagnostic identifiers on failures, so that a recurring problem can be located in logs.
19. As the Codex user, I want the app to remember its position and display preferences, so that manual launch restores my working setup.
20. As the Codex user, I want the app to remain absent until I launch it, so that it never adds startup work or unwanted background activity.
21. As the Codex user, I want a quiet liquid-glass material treatment, so that the utility feels integrated with Windows without becoming a distracting game HUD.
22. As the Codex user, I want keyboard-operable controls and reduced motion, so that the surface remains usable across Windows accessibility preferences.
23. As the Codex user, I want a portable executable, so that I can validate the utility before adopting an installer.
24. As the Codex user, I want the utility to remain read-only, so that viewing capacity cannot alter my Codex account or consume a Full Reset Credit.

## Implementation Decisions

- Use a Tauri 2 desktop shell with a Rust backend and a React/TypeScript interface.
- Use a separately launched Codex app-server process and the documented JSON-RPC account rate-limit surface.
- Treat the app-server executable as the single injectable external seam. Production resolves the installed Codex executable; automated tests substitute a deterministic fixture process.
- Do not attach to the already running desktop app-server because its stdio transport is privately owned by the Codex Desktop parent process.
- Normalize backend responses into one snapshot model that preserves unavailable fields, snapshot time, source state, and diagnostic metadata.
- Derive Remaining Capacity from backend used percentage without silently clamping or inventing missing data.
- Consume sparse rate-limit update notifications by merging only fields actually present; use a bounded periodic refresh as recovery rather than aggressive polling.
- Keep Full Reset Credit display read-only. No redemption command or account mutation is part of the first release.
- Keep compact and expanded surfaces in one shared task model so UI, logs, tests, and the data adapter use the same meanings.
- Store only local display preferences and last-known non-secret snapshot metadata. Never store Codex access tokens or browser cookies.
- Launch only when the user requests it. Do not register startup tasks or Run-key entries.
- Use a restrained liquid-glass material system with semantic tokens, equal visual weight for both Quota Windows, and explicit healthy, stale, loading, and failure states.

## Testing Decisions

- Test external behavior through the single injectable app-server executable seam rather than mocking internal Rust functions throughout the codebase.
- The deterministic fixture must speak the real newline-delimited JSON-RPC shape and cover healthy snapshots, sparse updates, null fields, zero credits, credit-detail truncation, malformed messages, timeout, early exit, and logged-out responses.
- Contract tests verify protocol parsing, sparse-merge behavior, Remaining Capacity derivation, time conversion, freshness, and diagnostic identifiers.
- Full-app end-to-end tests launch the actual packaged UI against the fixture from an isolated user-data directory and verify first launch, compact view, expansion, manual refresh, click-through toggle, remembered position, and failure recovery.
- A target-machine integration smoke test launches against the user's installed and authenticated Codex app-server and compares visible five-hour, weekly, reset, and freshness fields with the returned snapshot.
- Release verification uses the portable build, not a development server, and reopens persisted preferences after restart.
- UI verification captures the real running application at the approved target scale and compares compact, expanded/loading, healthy, failure, and narrow/collapsed screenshots with the approved design drawings.
- At least one failure-path test must assert an actionable explanation and stable diagnostic identifier rather than a generic retry message.
- Tests must not consume Full Reset Credits, modify Codex authentication, or depend on existing developer cache state.

## Out of Scope

- Starting automatically with Windows.
- Reset-credit redemption or any other account mutation.
- Multi-provider, multi-account, team, billing, or API-cost dashboards.
- Per-session token attribution, forecasts, history charts, alerts, webhooks, or usage exports.
- Browser login automation, cookie extraction, token storage, or direct undocumented backend calls.
- Process-memory inspection or transport interception.
- Installer, updater, code signing, and remote distribution in the first vertical slice.
- Mobile, macOS, Linux, or browser versions.

## Further Notes

- OpenAI's app-server response can legitimately omit window or reset-credit details; unavailable and zero are distinct domain states.
- The Windows Store Codex binary is protected by WindowsApps ACLs. The shipped app must resolve and launch it in the interactive user's context; the current Codex sandbox cannot itself prove that launch path.
- Existing MIT/Apache-licensed projects are reference implementations. Any reused source must retain the applicable notices and be limited to the narrow provider/window behavior needed here.
- The implementation reference is `.impeccable/mocks/composition/split-lens-bar.png`; `.impeccable/mocks/states/twin-cells-state-board.png` defines the required state coverage. The approved comp must not be regenerated from scratch.
