import { getCurrentWindow, LogicalPosition, LogicalSize } from "@tauri-apps/api/window";

export type OverlayLayout = "collapsed" | "compact" | "expanded";

const layoutSizes: Record<OverlayLayout, { width: number; height: number }> = {
  collapsed: { width: 520, height: 96 },
  compact: { width: 600, height: 260 },
  expanded: { width: 600, height: 320 },
};

export async function setOverlayWindowLayout(layout: OverlayLayout): Promise<void> {
  const { width, height } = layoutSizes[layout];
  await getCurrentWindow().setSize(new LogicalSize(width, height));
}

export interface OverlayPosition {
  x: number;
  y: number;
}

export async function getOverlayWindowPosition(): Promise<OverlayPosition> {
  const window = getCurrentWindow();
  const [position, scaleFactor] = await Promise.all([window.outerPosition(), window.scaleFactor()]);
  return position.toLogical(scaleFactor);
}

export async function setOverlayWindowPosition(position: OverlayPosition): Promise<void> {
  await getCurrentWindow().setPosition(new LogicalPosition(position.x, position.y));
}
