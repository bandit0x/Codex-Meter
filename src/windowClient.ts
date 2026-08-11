import { getCurrentWindow, LogicalSize } from "@tauri-apps/api/window";

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
