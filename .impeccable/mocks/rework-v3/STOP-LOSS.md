# V2 Stop-Loss Record

Status: V2 visual acceptance withdrawn on 2026-08-11.

## Minimal reproduction

- Input: the packaged V2 window with weekly Remaining Capacity at 95% and the
  five-hour field unavailable.
- Environment: Windows 11 x64, transparent undecorated Tauri/WebView2 window,
  always on top.
- Evidence: `v2-user-rejection.png`.

## First failure boundaries

| Symptom | First boundary | Existing behavior | V3 decision |
| --- | --- | --- | --- |
| Gray rectangle outside capsule | Native window composition | 10 px CSS gutter + `shadow: true` + whole-window Acrylic | Full-bleed shell, native shadow off, internal optical depth only |
| Cannot drag / blocks work | Pointer-to-window movement | Hidden 18 px top rail; initial `center: true` | Whole non-control lens drag, bottom-right first launch, position restore |
| 95% looks half full | Capacity-to-geometry mapping | `level = 88 - percent × 0.46` | Strict 0–100% linear fill ratio |
| No perceived flow | Visual motion | 3 px highlight drift and <5% brightness breathing | Dual waves, caustics, bubbles, velocity-driven slosh |
| Flat material | Layer composition | One dark fill plus hairlines | Back lens, liquid volume, front lens, 4 px rim, seam, internal occlusion |

## End-to-end data flow

`Codex app-server → CapacitySnapshot → validated Remaining Capacity → linear
fill ratio → SVG liquid geometry → front lens and readable numeric overlay`

`pointer down → 4 px drag threshold → Tauri window position → smoothed shell
velocity → release coast → persisted, monitor-clamped coordinates`

`shell acceleration/deceleration → independent liquid tilt/lift velocity →
liquid/caustic transform → post-shell damped oscillation → settle`

## V3 motion-proof correction

The first V3 interaction file did not prove its motion on open. It required a
manual fast flick, allowed a 600×260 preview viewport to clamp shell travel to
zero, and disabled inertia when the host reported reduced motion. The corrected
approval prototype auto-runs and repeats the full sequence, keeps manual replay,
uses an unbounded demonstration stage when the preview is narrow, and labels
each phase. This exception exists only in the approval prototype; the product
still honors reduced motion.

## Scope decision

Remake the UI material and drag controller. Keep the backend protocol,
read-only boundaries, quota semantics, issue-tracker setup, packaging method,
manual startup, and equal five-hour/week information architecture.
