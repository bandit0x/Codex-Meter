# V3 Design Contract — Optical Reservoir

Status: approval candidate. Product UI implementation remains frozen.

## Decision

Rebuild the visual and window-interaction layer while preserving the read-only
Codex app-server integration, equal five-hour/week hierarchy, shared footer,
failure contract, manual launch, and portable Windows target.

## Five acceptance gates

1. **Zero exterior gray chrome:** the CSS shell fills the logical window; DWM
   shadow and whole-window Acrylic are disabled. Rounded-corner pixels outside
   the shell are transparent desktop pixels, never a rectangular gray plate.
2. **Working placement and drag:** first launch starts 24 px from the work-area
   bottom-right; later launches restore the last clamped position. Every
   non-control point of the lens begins drag after a 4 px threshold. The widget
   stays on top but never forces itself back to screen center.
3. **Truthful volume:** `fillRatio = clamp(remainingPercent, 0, 100) / 100`.
   The drawable liquid height is exactly `fillRatio × chamberHeight`; 95% is
   visibly near-full and 1% is a thin bottom film. Numbers remain the exact
   source value and never determine an unrelated decorative band.
4. **Visible dual inertia:** two asynchronous surface waves and caustic drift
   run continuously at low amplitude. On release, the whole reservoir keeps
   the measured pointer velocity, coasts under exponential friction, and stops
   within the current monitor work area. The liquid is a separate damped mass:
   it lags shell acceleration, surges forward during shell deceleration, reacts
   to a constrained edge stop, then performs one or two decaying oscillations.
   A new pointer-down interrupts both motions immediately.
5. **Optical 3D, not flat glass:** one 4 px internal refractive rim, a second
   inner lens edge, convex chamber highlights, deep inner occlusion, moving
   caustics, and a refractive center seam must all survive the real Tauri
   screenshot on both light and dark desktops.

## Interaction boundary

- Pointer movement above the threshold moves the Tauri window and updates a
  smoothed two-axis shell velocity. Release continues the window trajectory for
  a short, bounded coast; exponential friction brings it to rest without snap.
- Liquid tilt and lift are not aliases of window velocity. They are independent
  spring states driven by shell acceleration and deceleration, so the liquid
  visibly trails during drag, overshoots after release, and continues to settle
  after the shell has stopped.
- Work-area collision clamps the shell, cancels only the blocked velocity axis,
  and transfers a bounded impulse into the liquid. The window never bounces or
  leaves an inaccessible sliver offscreen.
- Buttons, settings controls, and the expand control are never drag targets.
- Reduced motion keeps linear fill and direct drag placement but removes shell
  coasting, autonomous waves, bubbles, caustic travel, and spring overshoot.

## Quantitative motion proof

- A release sampled at 800 px/s must move the shell at least 48 px after the
  pointer is up, then settle within 350 ms; the distance is capped by the work
  area rather than by allowing any portion of the window to become unreachable.
- At that same release, the liquid's largest forward surge must occur after the
  shell has begun decelerating. When the shell reaches rest, the liquid must
  still have visible velocity and then settle within 900 ms.
- Re-grabbing during either phase cancels the prior shell trajectory and uses
  the new gesture as the sole input. No queued animation may resume afterward.

## Real-window proof required after approval

- Transparent-corner screenshot on a light desktop and a dark desktop.
- Drag from first-launch bottom-right to a new position, close, and reopen.
- Fixture screenshots at 1%, 50%, and 95%, with measured liquid pixel heights.
- Motion trace showing pointer release, shell coast, shell stop, and later liquid
  settle; plus idle wave A/B, peak slosh, and reduced-motion frame.
- Compact, expanded, collapsed, unavailable, stale, and shared failure states.
