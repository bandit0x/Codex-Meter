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

/**
 * A bounded one-dimensional shallow-water surface. The mean displacement is
 * removed after every step, so slosh changes the free-surface shape without
 * changing the percentage/volume represented by the reservoir.
 */
export class FluidSurface {
  readonly heights: Float32Array;
  private readonly velocities: Float32Array;
  private readonly accelerations: Float32Array;
  private readonly tension: number;
  private readonly damping: number;
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

  disturb(accelerationX: number, accelerationY: number, release = false): void {
    const horizontal = clamp(accelerationX, -2.4, 2.4);
    const vertical = clamp(accelerationY, -2, 2);
    const strength = release ? 1.16 : 0.52;
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
    const scale = clamp(frameScale, 0.35, 2);
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

export function linearLiquidLevel(
  remainingPercent: number,
  top: number,
  height: number,
): number {
  return top + height * (1 - clamp(remainingPercent, 0, 100) / 100);
}
