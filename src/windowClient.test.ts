import { describe, expect, it } from "vitest";
import { overlayLayoutSizes } from "./windowClient";

describe("half-scale overlay layouts", () => {
  it("keeps every approved window state at exactly half its previous size", () => {
    expect(overlayLayoutSizes).toEqual({
      collapsed: { width: 260, height: 48 },
      compact: { width: 300, height: 130 },
      expanded: { width: 300, height: 160 },
    });
  });
});
