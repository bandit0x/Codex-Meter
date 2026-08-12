import { getCurrentWindow, LogicalPosition, LogicalSize } from "@tauri-apps/api/window";

export type OverlayLayout = "collapsed" | "compact" | "expanded";

export const overlayLayoutSizes: Record<OverlayLayout, { width: number; height: number }> = {
  collapsed: { width: 260, height: 48 },
  compact: { width: 300, height: 130 },
  expanded: { width: 300, height: 160 },
};

export async function setOverlayWindowLayout(layout: OverlayLayout): Promise<void> {
  const { width, height } = overlayLayoutSizes[layout];
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
