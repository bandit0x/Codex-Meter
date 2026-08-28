export interface FluidMotionSample {
  sequence: number;
  accelerationX: number;
  accelerationY: number;
  phase: "idle" | "dragging" | "released";
}

export const IDLE_FLUID_MOTION: FluidMotionSample = {
  sequence: 0,
  accelerationX: 0,
  accelerationY: 0,
  phase: "idle",
};

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.max(minimum, Math.min(maximum, value));

export interface FluidDynamics {
  tension: number;
  damping: number;
  surfaceImpulse: number;
  bodyImpulse: number;
  timeScale: number;
  phaseOffset: number;
}

function seededVariation(seed: number, salt: number): number {
  const value = Math.sin((seed + salt) * 12_989.8) * 43_758.5453;
  return (value - Math.floor(value)) * 2 - 1;
}

export function createFluidSessionSeed(): number {
  const randomValues = new Uint32Array(1);
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(randomValues);
    return randomValues[0] / 0x1_0000_0000;
  }
  return (Date.now() % 0x1_0000_0000) / 0x1_0000_0000;
}

export function deriveChamberSeed(sessionSeed: number, chamberKey: string): number {
  let hash = 2_166_136_261;
  for (let index = 0; index < chamberKey.length; index += 1) {
    hash ^= chamberKey.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  const normalizedSessionSeed = ((sessionSeed % 1) + 1) % 1;
  return (normalizedSessionSeed + (hash >>> 0) / 0x1_0000_0000) % 1;
}

export function deriveFluidDynamics(
  remainingPercent: number,
  chamberSeed: number,
): FluidDynamics {
  const depth = clamp(remainingPercent, 0, 100) / 100;
  const seed = ((chamberSeed % 1) + 1) % 1;
  return {
    tension: 0.205 - depth * 0.035 + seededVariation(seed, 0.17) * 0.006,
    damping: 0.975 + depth * 0.01 + seededVariation(seed, 0.41) * 0.0015,
    surfaceImpulse: 1.12 - depth * 0.18 + seededVariation(seed, 0.63) * 0.04,
    bodyImpulse: 0.84 + depth * 0.28 + seededVariation(seed, 0.79) * 0.025,
    timeScale: 0.96 + (1 - depth) * 0.06 + seededVariation(seed, 0.93) * 0.045,
    phaseOffset: seed * Math.PI * 2,
  };
}

export const AMBIENT_BREEZE = {
  primarySpatialFrequency: 8.5,
  primaryTemporalFrequency: 0.28,
  primaryWeight: 0.42,
  secondarySpatialFrequency: 15.5,
  secondaryTemporalFrequency: 0.19,
  secondaryWeight: 0.16,
  idleStrength: 0.72,
  activeStrength: 0.18,
} as const;

/** Logical pixels reserved below the chamber for the sinking liquid tail. */
export const FLUID_TAIL_EXTENSION = 14;

/**
 * A sub-pixel, long-wavelength breeze for an otherwise settled surface.
 * Drag-driven shallow-water motion remains separate and visually dominant.
 */
export function ambientBreezeOffset(
  normalizedX: number,
  timeMs: number,
  active: boolean,
  phaseOffset = 0,
): number {
  const x = clamp(normalizedX, 0, 1);
  const timeSeconds = timeMs / 1_000;
  const wave =
    Math.sin(
      x * AMBIENT_BREEZE.primarySpatialFrequency
        + timeSeconds * AMBIENT_BREEZE.primaryTemporalFrequency
        + phaseOffset,
    ) * AMBIENT_BREEZE.primaryWeight
    + Math.sin(
      x * AMBIENT_BREEZE.secondarySpatialFrequency
        - timeSeconds * AMBIENT_BREEZE.secondaryTemporalFrequency
        - phaseOffset * 0.73,
    ) * AMBIENT_BREEZE.secondaryWeight;
  return wave * (active ? AMBIENT_BREEZE.activeStrength : AMBIENT_BREEZE.idleStrength);
}

/**
 * A bounded one-dimensional shallow-water surface. The mean displacement is
 * removed after every step, so slosh changes the free-surface shape without
 * changing the percentage/volume represented by the reservoir.
 */
export class FluidSurface {
  readonly heights: Float32Array;
  private readonly velocities: Float32Array;
  private readonly accelerations: Float32Array;
  private tension: number;
  private damping: number;
  private surfaceImpulse = 1;
  private timeScale = 1;
  private energy = 0;

  constructor(
    nodeCount = 56,
    options: { tension?: number; damping?: number } = {},
  ) {
    this.heights = new Float32Array(nodeCount);
    this.velocities = new Float32Array(nodeCount);
    this.accelerations = new Float32Array(nodeCount);
    this.tension = options.tension ?? 0.185;
    this.damping = options.damping ?? 0.982;
  }

  configure(dynamics: FluidDynamics): void {
    this.tension = dynamics.tension;
    this.damping = dynamics.damping;
    this.surfaceImpulse = dynamics.surfaceImpulse;
    this.timeScale = dynamics.timeScale;
  }

  disturb(accelerationX: number, accelerationY: number, release = false): void {
    const horizontal = clamp(accelerationX, -2.4, 2.4);
    const vertical = clamp(accelerationY, -2, 2);
    const strength = (release ? 1.16 : 0.52) * this.surfaceImpulse;
    const last = this.heights.length - 1;

    for (let index = 0; index <= last; index += 1) {
      const normalized = index / last;
      const wallBias = (normalized - 0.5) * 2;
      const pressurePulse = Math.sin(normalized * Math.PI) * vertical * 0.12;
      this.velocities[index] += (-horizontal * wallBias * strength) + pressurePulse;
    }

    this.energy = Math.max(this.energy, Math.abs(horizontal) * 8 + Math.abs(vertical) * 3 + 0.8);
  }

  step(frameScale = 1): boolean {
    const count = this.heights.length;
    const scale = clamp(frameScale * this.timeScale, 0.35, 2);
    let total = 0;
    let kinetic = 0;

    for (let index = 0; index < count; index += 1) {
      const left = index === 0 ? this.heights[1] : this.heights[index - 1];
      const right = index === count - 1 ? this.heights[count - 2] : this.heights[index + 1];
      const laplacian = left + right - 2 * this.heights[index];
      const wallSpring = index === 0 || index === count - 1 ? 0.048 : 0.034;
      this.accelerations[index] = laplacian * this.tension - this.heights[index] * wallSpring;
    }

    for (let index = 0; index < count; index += 1) {
      this.velocities[index] += this.accelerations[index] * scale;
      this.velocities[index] *= Math.pow(this.damping, scale);
      this.heights[index] = clamp(this.heights[index] + this.velocities[index] * scale, -18, 18);
      total += this.heights[index];
      kinetic += Math.abs(this.velocities[index]) + Math.abs(this.heights[index]) * 0.035;
    }

    const mean = total / count;
    for (let index = 0; index < count; index += 1) {
      this.heights[index] -= mean;
    }

    this.energy = this.energy * Math.pow(0.974, scale) + kinetic / count;
    if (this.energy < 0.055 && kinetic / count < 0.045) {
      this.energy = 0;
      this.heights.fill(0);
      this.velocities.fill(0);
      return false;
    }
    return true;
  }

  get isActive(): boolean {
    return this.energy > 0;
  }

  reset(): void {
    this.energy = 0;
    this.heights.fill(0);
    this.velocities.fill(0);
  }
}

/**
 * Low-frequency momentum carried by the liquid body beneath the free surface.
 * The offset is integrated from drag impulses and then coasts to rest, giving
 * the optical density field the same inertia as the visible surface slosh.
 */
export class FluidBodyMomentum {
  private momentumX = 0;
  private momentumY = 0;
  private displacementX = 0;
  private displacementY = 0;
  private impulseScale = 1;
  private timeScale = 1;

  configure(dynamics: FluidDynamics): void {
    this.impulseScale = dynamics.bodyImpulse;
    this.timeScale = dynamics.timeScale;
  }

  disturb(accelerationX: number, accelerationY: number, release = false): void {
    const impulse = (release ? 0.18 : 0.085) * this.impulseScale;
    this.momentumX = clamp(this.momentumX + clamp(accelerationX, -2.4, 2.4) * impulse, -2.8, 2.8);
    this.momentumY = clamp(this.momentumY + clamp(accelerationY, -2, 2) * impulse, -2.2, 2.2);
  }

  step(frameScale = 1): boolean {
    const scale = clamp(frameScale * this.timeScale, 0.35, 2);
    this.displacementX += this.momentumX * scale * 0.032;
    this.displacementY += this.momentumY * scale * 0.025;
    this.momentumX *= Math.pow(0.966, scale);
    this.momentumY *= Math.pow(0.961, scale);
    return this.agitation > 0.008;
  }

  get offset(): readonly [number, number] {
    return [this.displacementX, this.displacementY];
  }

  get agitation(): number {
    return clamp(Math.hypot(this.momentumX, this.momentumY) / 2.2, 0, 1);
  }

  reset(): void {
    this.momentumX = 0;
    this.momentumY = 0;
    this.displacementX = 0;
    this.displacementY = 0;
  }
}

export function linearLiquidLevel(
  remainingPercent: number,
  top: number,
  height: number,
): number {
  return top + height * (1 - clamp(remainingPercent, 0, 100) / 100);
}
