import { currentMonitor, getCurrentWindow, LogicalPosition, LogicalSize } from "@tauri-apps/api/window";

export type OverlayLayout = "collapsed" | "compact" | "expanded";

export const overlayLayoutSizes: Record<OverlayLayout, { width: number; height: number }> = {
  collapsed: { width: 260, height: 48 },
  compact: { width: 300, height: 130 },
  expanded: { width: 300, height: 160 },
};

export const SETTINGS_WINDOW_EXTRA_HEIGHT = 160;

export interface OverlayPosition {
  x: number;
  y: number;
}

export interface OverlayWorkArea {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface SettingsWindowPresentation {
  baseLayout: Exclude<OverlayLayout, "collapsed">;
  placement: "above" | "below";
  windowPosition: OverlayPosition;
  windowSize: { width: number; height: number };
  restore: {
    layout: OverlayLayout;
    position: OverlayPosition;
  };
}

export function planSettingsWindowPresentation(
  layout: OverlayLayout,
  position: OverlayPosition,
  workArea: OverlayWorkArea,
): SettingsWindowPresentation {
  const baseLayout = layout === "collapsed" ? "compact" : layout;
  const baseSize = overlayLayoutSizes[baseLayout];
  const workAreaRight = workArea.left + workArea.width;
  const workAreaBottom = workArea.top + workArea.height;
  const spaceAbove = position.y - workArea.top;
  const spaceBelow = workAreaBottom - (position.y + baseSize.height);
  const placement = spaceAbove >= SETTINGS_WINDOW_EXTRA_HEIGHT || spaceAbove >= spaceBelow
    ? "above"
    : "below";
  const preferredY = placement === "above"
    ? position.y - SETTINGS_WINDOW_EXTRA_HEIGHT
    : position.y;
  const maximumY = workAreaBottom - baseSize.height - SETTINGS_WINDOW_EXTRA_HEIGHT;
  const maximumX = workAreaRight - baseSize.width;

  return {
    baseLayout,
    placement,
    windowPosition: {
      x: Math.max(workArea.left, Math.min(maximumX, position.x)),
      y: Math.max(workArea.top, Math.min(maximumY, preferredY)),
    },
    windowSize: {
      width: baseSize.width,
      height: baseSize.height + SETTINGS_WINDOW_EXTRA_HEIGHT,
    },
    restore: { layout, position },
  };
}

export async function setOverlayWindowLayout(layout: OverlayLayout): Promise<void> {
  const { width, height } = overlayLayoutSizes[layout];
  await getCurrentWindow().setSize(new LogicalSize(width, height));
}

export async function getOverlayWindowPosition(): Promise<OverlayPosition> {
  const window = getCurrentWindow();
  const [position, scaleFactor] = await Promise.all([window.outerPosition(), window.scaleFactor()]);
  return position.toLogical(scaleFactor);
}

export async function setOverlayWindowPosition(position: OverlayPosition): Promise<void> {
  await getCurrentWindow().setPosition(new LogicalPosition(position.x, position.y));
}

export async function getOverlayWorkArea(): Promise<OverlayWorkArea> {
  // WKWebView 不暴露 Chromium 专属的 screen.availLeft/availTop，优先用 Tauri
  // 的 currentMonitor 拿跨平台工作区；坐标统一折算成逻辑像素。
  const monitor = await currentMonitor().catch(() => null);
  if (monitor) {
    const scale = monitor.scaleFactor || 1;
    return {
      left: monitor.workArea.position.x / scale,
      top: monitor.workArea.position.y / scale,
      width: monitor.workArea.size.width / scale,
      height: monitor.workArea.size.height / scale,
    };
  }
  const screenWithOffsets = window.screen as Screen & { availLeft?: number; availTop?: number };
  return {
    left: screenWithOffsets.availLeft ?? 0,
    top: screenWithOffsets.availTop ?? 0,
    width: screenWithOffsets.availWidth,
    height: screenWithOffsets.availHeight,
  };
}

export async function openOverlaySettings(
  layout: OverlayLayout,
): Promise<SettingsWindowPresentation> {
  const appWindow = getCurrentWindow();
  const [physicalPosition, scaleFactor] = await Promise.all([
    appWindow.outerPosition(),
    appWindow.scaleFactor(),
  ]);
  const position = physicalPosition.toLogical(scaleFactor);
  const workArea = await getOverlayWorkArea();
  const presentation = planSettingsWindowPresentation(layout, position, workArea);

  try {
    await appWindow.setPosition(new LogicalPosition(
      presentation.windowPosition.x,
      presentation.windowPosition.y,
    ));
    await appWindow.setSize(new LogicalSize(
      presentation.windowSize.width,
      presentation.windowSize.height,
    ));
    return presentation;
  } catch (error) {
    const restoreSize = overlayLayoutSizes[layout];
    await Promise.allSettled([
      appWindow.setSize(new LogicalSize(restoreSize.width, restoreSize.height)),
      appWindow.setPosition(new LogicalPosition(position.x, position.y)),
    ]);
    throw error;
  }
}

export async function closeOverlaySettings(
  presentation: SettingsWindowPresentation,
): Promise<void> {
  const appWindow = getCurrentWindow();
  const restoreSize = overlayLayoutSizes[presentation.restore.layout];
  await appWindow.setSize(new LogicalSize(restoreSize.width, restoreSize.height));
  await appWindow.setPosition(new LogicalPosition(
    presentation.restore.position.x,
    presentation.restore.position.y,
  ));
}
