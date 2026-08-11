# Motion contract — Split Lens Bar v2

Status: user-approved V2 implementation contract; visual acceptance remains pending real-window verification.

## Authored motion

| Moment | Duration | Curve | Visual change | Purpose |
| --- | ---: | --- | --- | --- |
| Manual launch | 420 ms | `cubic-bezier(0.16, 1, 0.3, 1)` | Shell enters from 98.2% scale, 5 px blur and 0 opacity | Make the manually launched object feel physically present without stealing focus |
| Liquid settle | 720 ms, 120 ms delay | same exponential ease, 2 px overshoot | Each liquid body rises from 22 px below its measured position | Connect the live quota reading to the calibrated liquid level |
| Meniscus drift | 6.8 s alternate | ease-in-out | Surface highlight travels only 3 px and rotates under 0.6 degrees | Keep the fluid visibly alive without changing the perceived value |
| Liquid breathing | 8 s alternate | ease-in-out | Saturation/brightness varies by less than 5% | Prevent a dead flat fill while remaining peripheral |
| Rim glint | 9 s loop, mostly idle | ease-in-out | One narrow highlight crosses the top optical rim | Reveal glass curvature; never competes with the numbers |
| Expand/collapse | 300 ms enter / 210 ms exit | exponential ease-out / ease-in | Window height, footer reveal, and chevron rotation move as one shared transition | Preserve spatial continuity between compact and detailed modes |
| Refresh with cached data | 240 ms | ease-out | Freshness label crossfades to a small progress trace; values remain stable | Confirm the action without blanking known data |
| Value update | 360 ms | exponential ease-out | Tabular numerals interpolate; liquid level follows 70 ms later | Make data change legible as cause then physical response |
| Loading | 1.6 s loop | ease-in-out | One refractive scan passes through both equal chambers | Communicate shared upstream work without two unrelated spinners |
| Failure | 260 ms | exponential ease-out | Both chambers dim into one shared coral-edged plane | Preserve the single-capsule model and focus recovery on one Retry action |

## Reduced motion

- Remove meniscus drift, liquid breathing, rim glint, numeric interpolation, and overshoot.
- Keep state changes as 80 ms opacity crossfades so feedback is not lost.
- Never move the window automatically after launch or on focus loss.

## Performance boundary

- Continuous motion may animate only `transform`, `opacity`, `filter`, `clip-path`, and masked highlights.
- No animation may trigger window-size oscillation, layout reflow per frame, or obscure a value.
- Stop continuous drift while the window is fully occluded or minimized.
