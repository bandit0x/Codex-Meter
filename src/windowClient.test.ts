import { describe, expect, it } from "vitest";
import {
  overlayLayoutSizes,
  planSettingsWindowPresentation,
  SETTINGS_WINDOW_EXTRA_HEIGHT,
} from "./windowClient";

describe("half-scale overlay layouts", () => {
  it("keeps every approved window state at exactly half its previous size", () => {
    expect(overlayLayoutSizes).toEqual({
      collapsed: { width: 260, height: 48 },
      compact: { width: 300, height: 130 },
      expanded: { width: 300, height: 160 },
    });
  });

  it("keeps the quota shell anchored while settings open above it", () => {
    const presentation = planSettingsWindowPresentation(
      "compact",
      { x: 1480, y: 840 },
      { left: 0, top: 0, width: 1920, height: 1040 },
    );

    expect(presentation.placement).toBe("above");
    expect(presentation.windowPosition).toEqual({
      x: 1480,
      y: 840 - SETTINGS_WINDOW_EXTRA_HEIGHT,
    });
    expect(presentation.windowSize).toEqual({
      width: 300,
      height: 130 + SETTINGS_WINDOW_EXTRA_HEIGHT,
    });
    expect(presentation.restore).toEqual({
      layout: "compact",
      position: { x: 1480, y: 840 },
    });
  });

  it("opens settings below the shell when the screen top has no room", () => {
    const presentation = planSettingsWindowPresentation(
      "collapsed",
      { x: 32, y: 20 },
      { left: 0, top: 0, width: 1920, height: 1040 },
    );

    expect(presentation.placement).toBe("below");
    expect(presentation.baseLayout).toBe("compact");
    expect(presentation.windowPosition).toEqual({ x: 32, y: 20 });
    expect(presentation.restore.layout).toBe("collapsed");
  });

  it("keeps a widened collapsed presentation inside the work area", () => {
    const presentation = planSettingsWindowPresentation(
      "collapsed",
      { x: 1660, y: 20 },
      { left: 0, top: 0, width: 1920, height: 1040 },
    );

    expect(presentation.windowPosition.x).toBe(1620);
    expect(presentation.restore.position).toEqual({ x: 1660, y: 20 });
  });
});
