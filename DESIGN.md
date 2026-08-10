# Design System — Split Lens Bar

## Approved direction

The approved composition is **方案 3 · 单胶囊中央分舱 (Split Lens Bar)**. One continuous optical-glass capsule is divided by a restrained central refractive seam into two exactly equal capacity fields. The five-hour and weekly Quota Windows are co-primary and must remain identical in width, typography, spacing, lighting, and interaction priority.

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

## Material and motion

- Use real window transparency/acrylic where supported, backed by restrained CSS blur and edge refraction.
- Liquid levels communicate Remaining Capacity without replacing the numeric value.
- No neon gaming HUD, purple gradient, ornamental gauges, excessive glow, or decorative charts.
- Transitions are short and layout-stable; reduced-motion removes liquid drift and nonessential interpolation.

## Interaction

- The compact surface is glanceable without focus. Expanding exposes reset and credit details.
- Dragging, keyboard focus, manual refresh, settings, and mouse click-through must remain discoverable and reversible.
- Controls require visible focus, at least a practical 32 px desktop target, and semantic labels.

## Approval references

- Final composition: `.impeccable/mocks/composition/split-lens-bar.png`
- State coverage: `.impeccable/mocks/states/twin-cells-state-board.png`
- Approved by the user on 2026-08-10. Do not regenerate the composition from scratch.

