import { describe, expect, it } from "vitest";
import capability from "../src-tauri/capabilities/default.json";
import tauriConfig from "../src-tauri/tauri.conf.json";
import { overlayLayoutSizes, SETTINGS_WINDOW_EXTRA_HEIGHT } from "./windowClient";

describe("portable window interaction capabilities", () => {
  it("allows every Tauri window command used by pointer dragging", () => {
    expect(capability.permissions).toEqual(
      expect.arrayContaining(["core:window:allow-set-position"]),
    );
  });

  it("allows the expanded settings presentation without clipping", () => {
    const mainWindow = tauriConfig.app.windows[0];
    expect(mainWindow.maxHeight).toBeGreaterThanOrEqual(
      overlayLayoutSizes.expanded.height + SETTINGS_WINDOW_EXTRA_HEIGHT,
    );
  });
});
