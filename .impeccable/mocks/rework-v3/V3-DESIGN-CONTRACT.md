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
4. **Visible physical motion:** two asynchronous surface waves and caustic
   drift run continuously at low amplitude. Drag velocity tilts the meniscus
   opposite movement up to ±6° and shifts it vertically up to 7 px; release
   settles with an interruptible 520 ms spring. Window position itself does
   not coast after release.
5. **Optical 3D, not flat glass:** one 4 px internal refractive rim, a second
   inner lens edge, convex chamber highlights, deep inner occlusion, moving
   caustics, and a refractive center seam must all survive the real Tauri
   screenshot on both light and dark desktops.

## Interaction boundary

- Pointer movement above the threshold moves the Tauri window and updates two
  motion variables: horizontal velocity and vertical velocity.
- Pointer release stops window movement immediately; only the liquid and
  specular layers keep their spring response.
- Buttons, settings controls, and the expand control are never drag targets.
- Reduced motion keeps linear fill and drag placement but removes autonomous
  waves, bubbles, caustic travel, and spring overshoot.

## Real-window proof required after approval

- Transparent-corner screenshot on a light desktop and a dark desktop.
- Drag from first-launch bottom-right to a new position, close, and reopen.
- Fixture screenshots at 1%, 50%, and 95%, with measured liquid pixel heights.
- Three frames: idle wave A/B and peak drag-slosh; plus reduced-motion frame.
- Compact, expanded, collapsed, unavailable, stale, and shared failure states.

