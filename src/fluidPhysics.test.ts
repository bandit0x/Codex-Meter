import { describe, expect, it } from "vitest";
import { FluidSurface, linearLiquidLevel } from "./fluidPhysics";

describe("volumetric fluid surface", () => {
  it("maps remaining percentage linearly to the physical liquid level", () => {
    expect(linearLiquidLevel(0, 10, 180)).toBe(190);
    expect(linearLiquidLevel(18, 10, 180)).toBeCloseTo(157.6);
    expect(linearLiquidLevel(95, 10, 180)).toBeCloseTo(19);
    expect(linearLiquidLevel(100, 10, 180)).toBe(10);
  });

  it("conserves represented volume while the free surface sloshes", () => {
    const surface = new FluidSurface();
    surface.disturb(1.8, -0.6, true);
    for (let frame = 0; frame < 180; frame += 1) surface.step();

    const mean = surface.heights.reduce((sum, value) => sum + value, 0) / surface.heights.length;
    expect(Math.abs(mean)).toBeLessThan(0.0001);
  });

  it("keeps the two reservoir states independent", () => {
    const fiveHour = new FluidSurface();
    const weekly = new FluidSurface();
    fiveHour.disturb(2, 0, true);
    fiveHour.step();

    expect(Array.from(fiveHour.heights).some((value) => Math.abs(value) > 0.01)).toBe(true);
    expect(Array.from(weekly.heights).every((value) => value === 0)).toBe(true);
  });
});
