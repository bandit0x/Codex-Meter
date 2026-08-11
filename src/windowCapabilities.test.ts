import { describe, expect, it } from "vitest";
import capability from "../src-tauri/capabilities/default.json";

describe("portable window interaction capabilities", () => {
  it("allows every Tauri window command used by pointer dragging", () => {
    expect(capability.permissions).toEqual(
      expect.arrayContaining(["core:window:allow-set-position"]),
    );
  });
});
