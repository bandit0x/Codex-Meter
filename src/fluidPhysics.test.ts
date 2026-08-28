import { describe, expect, it } from "vitest";
import {
  ambientBreezeOffset,
  deriveChamberSeed,
  deriveFluidDynamics,
  FluidBodyMomentum,
  FluidSurface,
  linearLiquidLevel,
} from "./fluidPhysics";

describe("volumetric fluid surface", () => {
  it("derives stable liquid dynamics from chamber seed and remaining capacity", () => {
    const shallow = deriveFluidDynamics(20, 0.35);
    const repeated = deriveFluidDynamics(20, 0.35);
    const deep = deriveFluidDynamics(80, 0.35);

    expect(repeated).toEqual(shallow);
    expect(shallow.tension).toBeGreaterThan(deep.tension);
    expect(shallow.damping).toBeLessThan(deep.damping);
    expect(shallow.surfaceImpulse).toBeGreaterThan(deep.surfaceImpulse);
    expect(deep.bodyImpulse).toBeGreaterThan(shallow.bodyImpulse);
  });

  it("derives stable but distinct chamber seeds within one launch", () => {
    const sessionSeed = 0.314159;
    const fiveHour = deriveChamberSeed(sessionSeed, "zcode-five-hour");
    const repeated = deriveChamberSeed(sessionSeed, "zcode-five-hour");
    const weekly = deriveChamberSeed(sessionSeed, "zcode-weekly");

    expect(repeated).toBe(fiveHour);
    expect(weekly).not.toBe(fiveHour);
    expect(fiveHour).toBeGreaterThanOrEqual(0);
    expect(fiveHour).toBeLessThan(1);
  });

  it("maps remaining percentage linearly to the physical liquid level", () => {
    expect(linearLiquidLevel(0, 10, 180)).toBe(190);
    expect(linearLiquidLevel(18, 10, 180)).toBeCloseTo(157.6);
    expect(linearLiquidLevel(95, 10, 180)).toBeCloseTo(19);
    expect(linearLiquidLevel(100, 10, 180)).toBe(10);
  });

  it("keeps the settled surface within a sub-pixel sea-breeze range", () => {
    let largestIdleOffset = 0;
    let largestActiveOffset = 0;

    for (let frame = 0; frame <= 120; frame += 1) {
      for (let sample = 0; sample <= 56; sample += 1) {
        const x = sample / 56;
        const timeMs = frame * 250;
        largestIdleOffset = Math.max(
          largestIdleOffset,
          Math.abs(ambientBreezeOffset(x, timeMs, false)),
        );
        largestActiveOffset = Math.max(
          largestActiveOffset,
          Math.abs(ambientBreezeOffset(x, timeMs, true)),
        );
      }
    }

    expect(largestIdleOffset).toBeLessThan(0.42);
    expect(largestIdleOffset).toBeGreaterThan(0.3);
    expect(largestActiveOffset).toBeLessThan(0.11);
  });

  it("conserves represented volume while the free surface sloshes", () => {
    const surface = new FluidSurface();
    surface.disturb(1.8, -0.6, true);
    for (let frame = 0; frame < 180; frame += 1) surface.step();

    const mean = surface.heights.reduce((sum, value) => sum + value, 0) / surface.heights.length;
    expect(Math.abs(mean)).toBeLessThan(0.0001);
  });

  it("gives two chamber seeds visibly different responses to the same drag", () => {
    const fiveHour = new FluidSurface();
    const weekly = new FluidSurface();
    fiveHour.configure(deriveFluidDynamics(72, 0.18));
    weekly.configure(deriveFluidDynamics(41, 0.81));

    fiveHour.disturb(1.9, -0.45, true);
    weekly.disturb(1.9, -0.45, true);
    for (let frame = 0; frame < 48; frame += 1) {
      fiveHour.step();
      weekly.step();
    }

    const fiveHourHeights = Array.from(fiveHour.heights);
    const weeklyHeights = Array.from(weekly.heights);
    const fiveHourMean = fiveHourHeights.reduce((sum, value) => sum + value, 0) / fiveHourHeights.length;
    const weeklyMean = weeklyHeights.reduce((sum, value) => sum + value, 0) / weeklyHeights.length;

    expect(fiveHourHeights).not.toEqual(weeklyHeights);
    expect(Math.abs(fiveHourMean)).toBeLessThan(0.0001);
    expect(Math.abs(weeklyMean)).toBeLessThan(0.0001);
  });

  it("keeps the two reservoir states independent", () => {
    const fiveHour = new FluidSurface();
    const weekly = new FluidSurface();
    fiveHour.disturb(2, 0, true);
    fiveHour.step();

    expect(Array.from(fiveHour.heights).some((value) => Math.abs(value) > 0.01)).toBe(true);
    expect(Array.from(weekly.heights).every((value) => value === 0)).toBe(true);
  });

  it("carries drag momentum into the liquid body and decays after release", () => {
    const body = new FluidBodyMomentum();
    body.disturb(2.1, -0.8, true);
    body.step();

    const firstOffset = body.offset;
    const firstAgitation = body.agitation;
    for (let frame = 0; frame < 180; frame += 1) body.step();

    expect(firstOffset[0]).toBeGreaterThan(0);
    expect(firstOffset[1]).toBeLessThan(0);
    expect(body.offset[0]).toBeGreaterThan(firstOffset[0]);
    expect(body.agitation).toBeLessThan(firstAgitation);
  });
});
