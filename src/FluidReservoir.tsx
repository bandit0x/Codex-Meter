import { useEffect, useRef } from "react";
import { FluidSurface, type FluidMotionSample, linearLiquidLevel } from "./fluidPhysics";

interface FluidReservoirProps {
  remainingPercent: number;
  accent: "cyan" | "mint";
  motion: FluidMotionSample;
  reducedMotion: boolean;
}

interface Palette {
  top: string;
  middle: string;
  bottom: string;
  deep: string;
  edge: string;
  caustic: string;
}

const palettes: Record<FluidReservoirProps["accent"], Palette> = {
  cyan: {
    top: "rgba(77, 220, 255, .93)",
    middle: "rgba(3, 139, 194, .86)",
    bottom: "rgba(0, 35, 67, .98)",
    deep: "rgba(0, 18, 42, .99)",
    edge: "rgba(218, 251, 255, .96)",
    caustic: "rgba(112, 229, 255, .14)",
  },
  mint: {
    top: "rgba(111, 242, 215, .94)",
    middle: "rgba(8, 151, 126, .88)",
    bottom: "rgba(0, 49, 51, .98)",
    deep: "rgba(0, 29, 34, .99)",
    edge: "rgba(226, 255, 247, .96)",
    caustic: "rgba(132, 255, 224, .14)",
  },
};

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
}

function traceSurface(
  context: CanvasRenderingContext2D,
  nodes: Float32Array,
  x: number,
  width: number,
  baseY: number,
) {
  const last = nodes.length - 1;
  const meniscus = Array.from(nodes, (node, index) => {
    const normalized = index / last;
    const wallRise = -4.2 * (Math.exp(-normalized * 18) + Math.exp(-(1 - normalized) * 18));
    return node + wallRise;
  });
  const meniscusMean = meniscus.reduce((sum, value) => sum + value, 0) / meniscus.length;
  context.moveTo(x, baseY + meniscus[0] - meniscusMean);
  for (let index = 1; index <= last; index += 1) {
    const previousX = x + ((index - 1) / last) * width;
    const previousY = baseY + meniscus[index - 1] - meniscusMean;
    const nextX = x + (index / last) * width;
    const nextY = baseY + meniscus[index] - meniscusMean;
    context.quadraticCurveTo(previousX, previousY, (previousX + nextX) / 2, (previousY + nextY) / 2);
  }
  context.lineTo(x + width, baseY + meniscus[last] - meniscusMean);
}

function drawReservoir(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  percent: number,
  surface: FluidSurface,
  palette: Palette,
  time: number,
  active: boolean,
) {
  context.clearRect(0, 0, width, height);
  const insetX = 9;
  const insetTop = 7;
  const insetBottom = 8;
  const innerWidth = width - insetX * 2;
  const innerHeight = height - insetTop - insetBottom;
  const baseY = linearLiquidLevel(percent, insetTop, innerHeight);
  const liquidDepth = insetTop + innerHeight - baseY;

  context.save();
  roundedRect(context, insetX, insetTop, innerWidth, innerHeight, 24);
  context.clip();

  const chamberLight = context.createRadialGradient(width * 0.5, -4, 4, width * 0.5, 0, width * 0.75);
  chamberLight.addColorStop(0, "rgba(187, 237, 255, .13)");
  chamberLight.addColorStop(0.54, "rgba(26, 76, 102, .045)");
  chamberLight.addColorStop(1, "rgba(0, 4, 10, .12)");
  context.fillStyle = chamberLight;
  context.fillRect(insetX, insetTop, innerWidth, innerHeight);

  context.beginPath();
  traceSurface(context, surface.heights, insetX, innerWidth, baseY);
  context.lineTo(insetX + innerWidth, insetTop + innerHeight + 2);
  context.lineTo(insetX, insetTop + innerHeight + 2);
  context.closePath();

  const body = context.createLinearGradient(0, baseY, 0, insetTop + innerHeight);
  body.addColorStop(0, palette.top);
  body.addColorStop(0.16, palette.middle);
  body.addColorStop(0.76, palette.bottom);
  body.addColorStop(1, palette.deep);
  context.fillStyle = body;
  context.fill();

  const volumeGlow = context.createRadialGradient(
    width * 0.52,
    baseY + Math.max(12, liquidDepth * 0.2),
    2,
    width * 0.52,
    baseY + liquidDepth * 0.38,
    Math.max(40, width * 0.72),
  );
  volumeGlow.addColorStop(0, palette.caustic);
  volumeGlow.addColorStop(0.58, "rgba(255, 255, 255, .018)");
  volumeGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
  context.fillStyle = volumeGlow;
  context.fillRect(insetX, baseY, innerWidth, liquidDepth);

  context.save();
  context.globalCompositeOperation = "screen";
  const lateralRefraction = context.createLinearGradient(insetX, 0, insetX + innerWidth, 0);
  lateralRefraction.addColorStop(0, "rgba(231, 253, 255, .3)");
  lateralRefraction.addColorStop(0.075, "rgba(83, 218, 255, .08)");
  lateralRefraction.addColorStop(0.45, "rgba(255, 255, 255, .015)");
  lateralRefraction.addColorStop(0.92, "rgba(72, 222, 203, .07)");
  lateralRefraction.addColorStop(1, "rgba(233, 255, 251, .28)");
  context.fillStyle = lateralRefraction;
  context.fillRect(insetX, baseY, innerWidth, insetTop + innerHeight - baseY);

  const causticHeight = Math.min(68, liquidDepth * 0.52);
  const causticStart = insetTop + innerHeight - causticHeight;
  context.lineWidth = 0.75;
  context.strokeStyle = palette.caustic;
  context.shadowColor = palette.caustic;
  context.shadowBlur = 5;
  for (let strand = 0; strand < 11; strand += 1) {
    const seed = strand * 0.79;
    const drift = active ? Math.sin(time * 0.0011 + seed) * 5 : Math.sin(seed) * 3;
    const startX = insetX + ((strand + 0.25) / 11) * innerWidth + drift;
    context.beginPath();
    context.moveTo(startX - 10, insetTop + innerHeight + 3);
    context.bezierCurveTo(
      startX + Math.sin(seed * 2.4) * 18,
      causticStart + causticHeight * 0.76,
      startX - 20 + Math.cos(seed * 3.2) * 12,
      causticStart + causticHeight * 0.35,
      startX + Math.sin(seed * 4) * 12,
      causticStart + 3,
    );
    context.stroke();
  }
  context.shadowBlur = 3;
  for (let row = 0; row < 4; row += 1) {
    const y = causticStart + ((row + 0.65) / 4) * causticHeight;
    context.beginPath();
    context.moveTo(insetX - 4, y);
    for (let column = 1; column <= 12; column += 1) {
      const x = insetX + (column / 12) * innerWidth;
      const wobble = Math.sin(column * 1.73 + row * 2.1 + (active ? time * 0.0009 : 0)) * 4;
      context.lineTo(x, y + wobble);
    }
    context.stroke();
  }
  context.restore();

  context.save();
  context.globalCompositeOperation = "screen";
  context.filter = "blur(6px)";
  context.globalAlpha = 0.38;
  for (let glow = 0; glow < 6; glow += 1) {
    const centerX = insetX + ((glow + 0.55) / 6) * innerWidth;
    const centerY = insetTop + innerHeight - 5 - (glow % 2) * 7;
    context.fillStyle = palette.caustic;
    context.beginPath();
    context.ellipse(centerX, centerY, 24 + (glow % 3) * 8, 5 + (glow % 2) * 2, -0.16 + glow * 0.05, 0, Math.PI * 2);
    context.fill();
  }
  context.restore();

  context.save();
  context.globalCompositeOperation = "screen";
  for (let index = 0; index < 38; index += 1) {
    const seedX = ((index * 47) % 97) / 97;
    const seedY = ((index * 29 + 11) % 101) / 101;
    const particleY = baseY + 8 + seedY * Math.max(0, liquidDepth - 16);
    if (particleY >= insetTop + innerHeight) continue;
    context.globalAlpha = 0.11 + (index % 5) * 0.028;
    context.fillStyle = "#eaffff";
    context.beginPath();
    context.arc(insetX + 8 + seedX * (innerWidth - 16), particleY, 0.35 + (index % 3) * 0.15, 0, Math.PI * 2);
    context.fill();
  }
  context.restore();

  context.save();
  context.beginPath();
  traceSurface(context, surface.heights, insetX, innerWidth, baseY);
  context.strokeStyle = palette.edge;
  context.lineWidth = 1.35;
  context.shadowColor = palette.edge;
  context.shadowBlur = 8;
  context.stroke();
  context.translate(0, 3.5);
  context.strokeStyle = "rgba(0, 22, 31, .64)";
  context.lineWidth = 3.5;
  context.shadowBlur = 0;
  context.stroke();
  context.restore();

  const bubbleCount = percent < 8 ? 0 : percent > 70 ? 9 : 5;
  for (let index = 0; index < bubbleCount; index += 1) {
    const seed = (index * 0.61803398875 + (palette === palettes.mint ? 0.17 : 0.03)) % 1;
    const bubbleX = insetX + 18 + seed * (innerWidth - 36);
    const depth = 0.18 + ((index * 0.37) % 0.72);
    const travel = active ? ((time * (0.003 + index * 0.00013) + index * 17) % Math.max(10, liquidDepth - 8)) : depth * liquidDepth;
    const bubbleY = insetTop + innerHeight - 7 - travel;
    if (bubbleY <= baseY + 7) continue;
    const radius = 0.7 + (index % 3) * 0.55;
    context.beginPath();
    context.arc(bubbleX, bubbleY, radius, 0, Math.PI * 2);
    context.strokeStyle = "rgba(226, 255, 255, .42)";
    context.lineWidth = 0.65;
    context.stroke();
  }

  const frontLens = context.createLinearGradient(0, baseY, width, insetTop + innerHeight);
  frontLens.addColorStop(0, "rgba(230, 252, 255, .055)");
  frontLens.addColorStop(0.34, "rgba(255, 255, 255, 0)");
  frontLens.addColorStop(0.72, "rgba(167, 245, 233, .045)");
  frontLens.addColorStop(1, "rgba(255, 255, 255, .11)");
  context.fillStyle = frontLens;
  context.fillRect(insetX, baseY, innerWidth, liquidDepth);
  context.restore();
}

export function FluidReservoir({
  remainingPercent,
  accent,
  motion,
  reducedMotion,
}: FluidReservoirProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const surfaceRef = useRef(
    new FluidSurface(56, accent === "mint" ? { tension: 0.175, damping: 0.981 } : undefined),
  );
  const frameRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);
  const drawRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const surface = surfaceRef.current;
    const palette = palettes[accent];

    const render = (time = performance.now()) => {
      const bounds = canvas.getBoundingClientRect();
      if (bounds.width <= 0 || bounds.height <= 0) return;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const pixelWidth = Math.max(1, Math.round(bounds.width * ratio));
      const pixelHeight = Math.max(1, Math.round(bounds.height * ratio));
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }
      const context = canvas.getContext("2d");
      if (!context) return;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      drawReservoir(context, bounds.width, bounds.height, remainingPercent, surface, palette, time, surface.isActive);
    };
    drawRef.current = () => render();
    render();

    if (typeof ResizeObserver === "undefined") return;
    const resizeObserver = new ResizeObserver(() => render());
    resizeObserver.observe(canvas);
    return () => resizeObserver.disconnect();
  }, [accent, remainingPercent]);

  useEffect(() => {
    const surface = surfaceRef.current;
    if (reducedMotion) {
      surface.reset();
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
      drawRef.current();
      return;
    }
    if (motion.sequence === 0) return;
    surface.disturb(motion.accelerationX, motion.accelerationY, motion.phase === "released");
    if (frameRef.current !== null) return;
    lastTimeRef.current = performance.now();

    const animate = (time: number) => {
      const frameScale = Math.min(2, Math.max(0.35, (time - lastTimeRef.current) / 16.667));
      lastTimeRef.current = time;
      const active = surface.step(frameScale);
      drawRef.current();
      frameRef.current = active ? requestAnimationFrame(animate) : null;
    };
    frameRef.current = requestAnimationFrame(animate);
  }, [motion, reducedMotion]);

  useEffect(() => () => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
  }, []);

  return <canvas ref={canvasRef} className="fluid-reservoir" aria-hidden="true" />;
}
