# Design System — Volumetric Fluid Lens

## Approved direction

The approved V4 composition is **Volumetric Fluid Lens**, confirmed by the user on 2026-08-11. One continuous thick-wall optical reservoir is divided into two exactly equal capacity chambers. The five-hour and weekly quota windows are co-primary and remain identical in width, typography, spacing, lighting, and interaction priority.

## Surface and layout

- Use one continuous, transparent dark-navy surface; do not introduce nested generic cards.
- The default compact surface is a wide, low floating capsule. Both capacity fields occupy equal halves above one shared footer.
- Expanded content grows within the same task model and preserves the equal split. Loading, healthy, stale, failed, and collapsed states must not move the primary labels unexpectedly.
- Failure uses one shared full-width message with one cause, one stable diagnostic identifier, and one recovery action.

## Tokens

- Deep glass: `rgba(7, 19, 30, 0.76)`
- Cyan capacity: `#50D8FF`
- Mint capacity: `#74EFD2`
- Primary text: `#F6FCFF`
- Secondary text: `#AFC3D2`
- Error: `#FF8067`
- Hairline: `rgba(180, 230, 255, 0.24)`
- Typography: `Segoe UI Variable`, `Segoe UI`, system sans-serif; percentages use tabular numerals.

## Brand mark

- Display name: **Codex Meter**.
- The approved icon is the sevenfold interlace: seven long cyan-to-mint telemetry ribbons alternate over and under around a warped dark observation aperture.
- Two central quota points use signal red `#FF5C62`; they represent the five-hour and weekly windows with equal priority.
- The mark contains no literal monitor, screen, stand, sixfold knot, or central hexagonal negative space.
- At tray sizes, preserve the sevenfold silhouette and the two red points; omit nonessential optical highlights before changing the geometry.

## Material and motion

- The shell has an outer wall, inner wall, Fresnel rim, local internal reflection and a refractive central seam. Transparent pixels outside the rounded shell stay transparent; no rectangular system shadow or acrylic plate may remain around it.
- Liquid height is a strict linear mapping of remaining percentage to chamber volume. The animated free surface is normalized every frame so slosh never changes the represented volume.
- Each chamber owns independent velocity, pressure-like surface coupling, damping and free-surface state. Window acceleration drives reverse wall climb; after release the shell glides with friction while the liquid continues through front surge, backflow and at least one damped secondary oscillation.
- Static liquid must show a curved meniscus, depth absorption, front-wall refraction, caustic structure and sparse micro-bubbles. A flat color fill, simple vertical gradient or decorative sine-wave edge is not acceptable.
- Physics runs only while disturbed and sleeps after settling. Reduced Motion keeps the true static volume/material but removes window glide and liquid slosh.
- No neon gaming HUD, purple gradient, ornamental gauges, excessive glow, or decorative charts.
- Transitions are short and layout-stable; reduced-motion removes liquid drift and nonessential interpolation.

## Interaction

- The compact surface is glanceable without focus. Expanding exposes reset and credit details.
- Dragging, keyboard focus, manual refresh, settings, and mouse click-through must remain discoverable and reversible.
- Controls require visible focus, at least a practical 32 px desktop target, and semantic labels.

## Approval references

- Final compact state: `docs/verification/screenshots/v8-half-healthy.png`.
- State coverage: the five `v8-half-*` screenshots retained under
  `docs/verification/screenshots/`.
- Brand mark: `src-tauri/icons/icon.png` and its generated Windows icon sizes.
- Motion contract: `src/fluidPhysics.ts` and `src/fluidPhysics.test.ts`.
- V4 approved by the user on 2026-08-11. Implementation must be validated in the real WebView2/Tauri product rather than by a static SVG.
- Codex Meter name and sevenfold interlace mark approved by the user on 2026-08-12.
