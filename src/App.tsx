import { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";
import { FluidReservoir } from "./FluidReservoir";
import { OpticalShell } from "./OpticalShell";
import {
  enableTemporaryClickThrough,
  loadDisplayPreferences,
  readCapacitySnapshot,
  saveDisplayPreferences,
} from "./capacityClient";
import type {
  CapacitySnapshot,
  Diagnostic,
  DisplayPreferences,
  QuotaWindow,
} from "./capacityTypes";
import { IDLE_FLUID_MOTION, type FluidMotionSample } from "./fluidPhysics";
import {
  getOverlayWindowPosition,
  setOverlayWindowLayout,
  setOverlayWindowPosition,
  type OverlayLayout,
  type OverlayPosition,
} from "./windowClient";

export type CapacityLoader = () => Promise<CapacitySnapshot>;

interface AppProps {
  initialLayout?: OverlayLayout;
  loadSnapshot?: CapacityLoader;
  loadPreferences?: () => Promise<DisplayPreferences>;
  savePreferences?: (preferences: DisplayPreferences) => Promise<void>;
  enableClickThrough?: (durationMs?: number) => Promise<void>;
  setWindowLayout?: (layout: OverlayLayout) => Promise<void>;
  getWindowPosition?: () => Promise<OverlayPosition>;
  setWindowPosition?: (position: OverlayPosition) => Promise<void>;
}

type ViewState =
  | { kind: "loading" }
  | { kind: "healthy"; snapshot: CapacitySnapshot }
  | { kind: "failed"; diagnostic: Diagnostic };

const defaultPreferences: DisplayPreferences = {
  opacity: 0.92,
  reducedMotion: false,
  x: null,
  y: null,
};
const REFRESH_INTERVAL_MS = 60_000;
const CLICK_THROUGH_DURATION_MS = 10_000;

function formatPercent(value: number): string {
  return Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1);
}

function formatReset(timestamp: number, includeWeekday: boolean): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: includeWeekday ? "short" : undefined,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(timestamp * 1000));
}

function formatExpiry(timestamp?: number | null): string {
  if (!timestamp) return "到期时间不可用";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(timestamp * 1000));
}

function formatFreshness(observedAtMs: number): string {
  const seconds = Math.max(0, Math.round((Date.now() - observedAtMs) / 1000));
  if (seconds < 5) return "Updated now";
  if (seconds < 60) return `Updated ${seconds}s ago`;
  return `Updated ${Math.floor(seconds / 60)}m ago`;
}

function normalizeDiagnostic(error: unknown): Diagnostic {
  if (typeof error === "object" && error !== null) {
    const candidate = error as Partial<Diagnostic>;
    if (typeof candidate.code === "string" && typeof candidate.message === "string") {
      return {
        code: candidate.code,
        message: candidate.message,
        detail: candidate.detail ?? null,
      };
    }
  }

  return {
    code: "CRV-100",
    message: "无法读取 Codex 配额",
    detail: error instanceof Error ? error.message : String(error),
  };
}

function Icon({ name }: { name: "chevron" | "settings" | "close" }) {
  if (name === "settings") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 8.3a3.7 3.7 0 1 0 0 7.4 3.7 3.7 0 0 0 0-7.4Z" />
        <path d="M19.2 13.4a7.8 7.8 0 0 0 .1-1.4 7.8 7.8 0 0 0-.1-1.4l2-1.5-2-3.4-2.4 1a8.6 8.6 0 0 0-2.4-1.4L14 2.8h-4l-.4 2.5a8.6 8.6 0 0 0-2.4 1.4l-2.4-1-2 3.4 2 1.5A7.8 7.8 0 0 0 4.7 12c0 .5 0 .9.1 1.4l-2 1.5 2 3.4 2.4-1a8.6 8.6 0 0 0 2.4 1.4l.4 2.5h4l.4-2.5a8.6 8.6 0 0 0 2.4-1.4l2.4 1 2-3.4-2-1.5Z" />
      </svg>
    );
  }

  if (name === "close") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m7.5 7.5 9 9m0-9-9 9" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m8 9.5 4 4 4-4" />
    </svg>
  );
}

function QuotaCell({
  label,
  window,
  accent,
  motion,
  reducedMotion,
}: {
  label: "5 HOUR" | "WEEK";
  window: QuotaWindow | null;
  accent: "cyan" | "mint";
  motion: FluidMotionSample;
  reducedMotion: boolean;
}) {
  const remaining = window?.remainingPercent ?? 0;

  return (
    <section
      className={`quota-cell quota-cell--${accent} ${window ? "" : "quota-cell--unavailable"}`}
      aria-label={`${label} quota${window ? "" : " unavailable"}`}
      role="group"
    >
      {window && (
        <FluidReservoir
          remainingPercent={remaining}
          accent={accent}
          motion={motion}
          reducedMotion={reducedMotion}
        />
      )}
      <div className="cell-content">
        <span className="quota-label">{label}</span>
        <div className="capacity-value">
          <span>{window ? `${formatPercent(remaining)}%` : "—"}</span>
          {window && <small>LEFT</small>}
        </div>
        <span className="reset-time">
          {window ? `Resets ${formatReset(window.resetsAt, label === "WEEK")}` : "Data unavailable"}
        </span>
        <div className="scale-line" aria-hidden="true" />
      </div>
    </section>
  );
}

function LoadingSurface() {
  return (
    <div className="loading-surface" role="status" aria-live="polite" aria-label="正在读取 Codex 配额">
      <span className="loading-scan" aria-hidden="true" />
      {["5 HOUR", "WEEK"].map((label) => (
        <section className="loading-cell" key={label}>
          <span className="quota-label">{label}</span>
          <span className="skeleton skeleton--large" />
          <span className="skeleton skeleton--medium" />
          <span className="skeleton skeleton--small" />
        </section>
      ))}
    </div>
  );
}

function FailedSurface({ diagnostic, onRetry }: { diagnostic: Diagnostic; onRetry: () => void }) {
  return (
    <section className="failed-surface" aria-live="assertive">
      <span className="error-mark" aria-hidden="true">!</span>
      <strong>无法读取 Codex 配额</strong>
      <span>检查 Codex 是否已安装并登录 · 诊断码 {diagnostic.code}</span>
      <button type="button" onClick={onRetry}>重试</button>
    </section>
  );
}

function CollapsedSurface({ snapshot, onRestore }: { snapshot: CapacitySnapshot; onRestore: () => void }) {
  return (
    <button className="collapsed-surface" type="button" onClick={onRestore} aria-label="恢复标准视图">
      <span>
        <strong>{snapshot.fiveHour ? `${formatPercent(snapshot.fiveHour.remainingPercent)}%` : "—"}</strong>
        <i className="status-dot status-dot--cyan" aria-hidden="true" />
      </span>
      <span>
        <strong>{snapshot.weekly ? `${formatPercent(snapshot.weekly.remainingPercent)}%` : "—"}</strong>
        <i className="status-dot status-dot--mint" aria-hidden="true" />
      </span>
    </button>
  );
}

function freshnessText(snapshot: CapacitySnapshot, stale: boolean, diagnostic?: Diagnostic): string {
  const unavailable = [
    snapshot.fiveHour ? null : "5-hour unavailable",
    snapshot.weekly ? null : "Week unavailable",
  ].filter(Boolean);

  if (stale) return `STALE · ${diagnostic?.code ?? "cached snapshot"}`;
  if (unavailable.length > 0) return `${formatFreshness(snapshot.observedAtMs)} · ${unavailable.join(" · ")}`;
  return formatFreshness(snapshot.observedAtMs);
}

export function App({
  initialLayout = "compact",
  loadSnapshot = readCapacitySnapshot,
  loadPreferences = loadDisplayPreferences,
  savePreferences = saveDisplayPreferences,
  enableClickThrough = enableTemporaryClickThrough,
  setWindowLayout = setOverlayWindowLayout,
  getWindowPosition = getOverlayWindowPosition,
  setWindowPosition = setOverlayWindowPosition,
}: AppProps) {
  const [view, setView] = useState<ViewState>({ kind: "loading" });
  const [lastSnapshot, setLastSnapshot] = useState<CapacitySnapshot | null>(null);
  const lastSnapshotRef = useRef<CapacitySnapshot | null>(null);
  const loadGenerationRef = useRef(0);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const [layoutMode, setLayoutMode] = useState<OverlayLayout>(initialLayout);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [clickThroughSeconds, setClickThroughSeconds] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [controlMessage, setControlMessage] = useState<string | null>(null);
  const [fluidMotion, setFluidMotion] = useState<FluidMotionSample>(IDLE_FLUID_MOTION);
  const [isWindowDragging, setIsWindowDragging] = useState(false);
  const dragRef = useRef({
    pointerId: -1,
    ready: false,
    lastPointerX: 0,
    lastPointerY: 0,
    lastTime: 0,
    positionX: 0,
    positionY: 0,
    velocityX: 0,
    velocityY: 0,
    pendingDeltaX: 0,
    pendingDeltaY: 0,
  });
  const inertiaFrameRef = useRef<number | null>(null);
  const motionSequenceRef = useRef(0);
  const previousMotionVelocityRef = useRef({ x: 0, y: 0 });

  const load = useCallback(async () => {
    const generation = ++loadGenerationRef.current;
    const hasCachedSnapshot = lastSnapshotRef.current !== null;
    if (hasCachedSnapshot) setIsRefreshing(true);
    else setView({ kind: "loading" });

    try {
      const snapshot = await loadSnapshot();
      if (generation !== loadGenerationRef.current) return;
      lastSnapshotRef.current = snapshot;
      setLastSnapshot(snapshot);
      setView({ kind: "healthy", snapshot });
    } catch (error) {
      if (generation !== loadGenerationRef.current) return;
      setView({ kind: "failed", diagnostic: normalizeDiagnostic(error) });
    } finally {
      if (generation === loadGenerationRef.current) setIsRefreshing(false);
    }
  }, [loadSnapshot]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const timer = window.setInterval(() => void load(), REFRESH_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [load]);

  useEffect(() => {
    void loadPreferences().then(setPreferences).catch(() => undefined);
  }, [loadPreferences]);

  useEffect(() => {
    if (clickThroughSeconds <= 0) return;
    const timer = window.setInterval(
      () => setClickThroughSeconds((value) => Math.max(0, value - 1)),
      1_000,
    );
    return () => window.clearInterval(timer);
  }, [clickThroughSeconds]);

  useEffect(() => {
    if (!settingsOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setSettingsOpen(false);
      settingsButtonRef.current?.focus();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [settingsOpen]);

  useEffect(() => () => {
    if (inertiaFrameRef.current !== null) cancelAnimationFrame(inertiaFrameRef.current);
  }, []);

  const publishFluidMotion = useCallback(
    (velocityX: number, velocityY: number, phase: FluidMotionSample["phase"]) => {
      const previous = previousMotionVelocityRef.current;
      const accelerationX = (velocityX - previous.x) * 8;
      const accelerationY = (velocityY - previous.y) * 8;
      previousMotionVelocityRef.current = { x: velocityX, y: velocityY };
      motionSequenceRef.current += 1;
      setFluidMotion({ sequence: motionSequenceRef.current, accelerationX, accelerationY, phase });
    },
    [],
  );

  const stopWindowInertia = useCallback(() => {
    if (inertiaFrameRef.current !== null) cancelAnimationFrame(inertiaFrameRef.current);
    inertiaFrameRef.current = null;
  }, []);

  const handleDragStart = useCallback((event: React.PointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    const target = event.target as HTMLElement;
    if (target.closest("button, input, [role='dialog']")) return;
    event.preventDefault();
    stopWindowInertia();
    event.currentTarget.setPointerCapture(event.pointerId);
    const drag = dragRef.current;
    drag.pointerId = event.pointerId;
    drag.ready = false;
    drag.lastPointerX = event.screenX;
    drag.lastPointerY = event.screenY;
    drag.lastTime = performance.now();
    drag.velocityX = 0;
    drag.velocityY = 0;
    drag.pendingDeltaX = 0;
    drag.pendingDeltaY = 0;
    previousMotionVelocityRef.current = { x: 0, y: 0 };
    setIsWindowDragging(true);

    void getWindowPosition()
      .then((position) => {
        if (drag.pointerId !== event.pointerId) return;
        drag.positionX = position.x + drag.pendingDeltaX;
        drag.positionY = position.y + drag.pendingDeltaY;
        drag.ready = true;
        if (drag.pendingDeltaX !== 0 || drag.pendingDeltaY !== 0) {
          void setWindowPosition({ x: drag.positionX, y: drag.positionY });
        }
      })
      .catch(() => {
        drag.pointerId = -1;
        setIsWindowDragging(false);
        setControlMessage("窗口无法拖动 · CRV-307");
      });
  }, [getWindowPosition, setWindowPosition, stopWindowInertia]);

  const handleDragMove = useCallback((event: React.PointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (drag.pointerId !== event.pointerId) return;
    const now = performance.now();
    const elapsed = Math.max(8, now - drag.lastTime);
    const deltaX = event.screenX - drag.lastPointerX;
    const deltaY = event.screenY - drag.lastPointerY;
    const sampleX = deltaX / elapsed;
    const sampleY = deltaY / elapsed;
    drag.velocityX = drag.velocityX * 0.38 + sampleX * 0.62;
    drag.velocityY = drag.velocityY * 0.38 + sampleY * 0.62;
    if (drag.ready) {
      drag.positionX += deltaX;
      drag.positionY += deltaY;
    } else {
      drag.pendingDeltaX += deltaX;
      drag.pendingDeltaY += deltaY;
    }
    drag.lastPointerX = event.screenX;
    drag.lastPointerY = event.screenY;
    drag.lastTime = now;
    if (drag.ready) void setWindowPosition({ x: drag.positionX, y: drag.positionY });
    publishFluidMotion(drag.velocityX, drag.velocityY, "dragging");
  }, [publishFluidMotion, setWindowPosition]);

  const handleDragEnd = useCallback((event: React.PointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (drag.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    drag.pointerId = -1;
    drag.ready = false;
    setIsWindowDragging(false);
    const staleSample = performance.now() - drag.lastTime > 90;
    let velocityX = staleSample || preferences.reducedMotion ? 0 : drag.velocityX;
    let velocityY = staleSample || preferences.reducedMotion ? 0 : drag.velocityY;
    publishFluidMotion(velocityX, velocityY, "released");
    if (Math.hypot(velocityX, velocityY) < 0.035) return;

    let positionX = drag.positionX;
    let positionY = drag.positionY;
    let lastFrame = performance.now();
    const screenWithOffsets = window.screen as Screen & { availLeft?: number; availTop?: number };
    const minimumX = screenWithOffsets.availLeft ?? 0;
    const minimumY = screenWithOffsets.availTop ?? 0;
    const maximumX = minimumX + window.screen.availWidth - window.outerWidth;
    const maximumY = minimumY + window.screen.availHeight - window.outerHeight;

    const glide = (time: number) => {
      const elapsed = Math.min(32, Math.max(8, time - lastFrame));
      lastFrame = time;
      const friction = Math.exp(-elapsed / 145);
      velocityX *= friction;
      velocityY *= friction;
      positionX += velocityX * elapsed;
      positionY += velocityY * elapsed;
      const nextX = Math.max(minimumX, Math.min(maximumX, positionX));
      const nextY = Math.max(minimumY, Math.min(maximumY, positionY));
      if (nextX !== positionX) velocityX = 0;
      if (nextY !== positionY) velocityY = 0;
      positionX = nextX;
      positionY = nextY;
      void setWindowPosition({ x: positionX, y: positionY });
      publishFluidMotion(velocityX, velocityY, "dragging");
      if (Math.hypot(velocityX, velocityY) < 0.018) {
        inertiaFrameRef.current = null;
        publishFluidMotion(0, 0, "idle");
        return;
      }
      inertiaFrameRef.current = requestAnimationFrame(glide);
    };
    inertiaFrameRef.current = requestAnimationFrame(glide);
  }, [preferences.reducedMotion, publishFluidMotion, setWindowPosition]);

  const updatePreferences = useCallback(
    (next: DisplayPreferences) => {
      setPreferences(next);
      void savePreferences(next).catch(() => setControlMessage("显示设置未保存 · CRV-303"));
    },
    [savePreferences],
  );

  const changeLayout = useCallback(
    (next: OverlayLayout) => {
      setLayoutMode(next);
      setSettingsOpen(false);
      void setWindowLayout(next).catch(() => setControlMessage("窗口布局未能调整 · CRV-302"));
    },
    [setWindowLayout],
  );

  const startClickThrough = useCallback(async () => {
    try {
      await enableClickThrough(CLICK_THROUGH_DURATION_MS);
      setClickThroughSeconds(CLICK_THROUGH_DURATION_MS / 1_000);
    } catch {
      setControlMessage("穿透模式未能开启 · CRV-304");
    }
  }, [enableClickThrough]);

  const snapshot = view.kind === "healthy" ? view.snapshot : lastSnapshot;
  const staleFromFailure = view.kind === "failed" && snapshot !== null;
  const stale = staleFromFailure || snapshot?.sourceState === "stale";
  const failureDiagnostic = view.kind === "failed" ? view.diagnostic : undefined;
  const collapsed = layoutMode === "collapsed" && snapshot !== null;
  const expanded = layoutMode === "expanded";

  return (
    <main
      className={`app-frame app-frame--${layoutMode} ${preferences.reducedMotion ? "reduce-motion" : ""} ${isWindowDragging ? "is-dragging" : ""}`}
      style={{ "--surface-opacity": preferences.opacity } as React.CSSProperties}
      onContextMenu={(event) => {
        event.preventDefault();
        if (collapsed) changeLayout("compact");
        setSettingsOpen((value) => !value);
      }}
      onPointerDown={handleDragStart}
      onPointerMove={handleDragMove}
      onPointerUp={handleDragEnd}
      onPointerCancel={handleDragEnd}
    >
      <div className={`glass-shell glass-shell--${layoutMode} ${stale ? "glass-shell--stale" : ""}`}>
        <OpticalShell
          dragging={isWindowDragging}
          reducedMotion={preferences.reducedMotion}
          opacity={preferences.opacity}
        />
        <span className="rim-glint" aria-hidden="true" />
        <div className="drag-rail" aria-hidden="true" />

        {collapsed && snapshot ? (
          <CollapsedSurface snapshot={snapshot} onRestore={() => changeLayout("compact")} />
        ) : (
          <>
            {view.kind === "loading" && <LoadingSurface />}
            {view.kind === "failed" && !snapshot && (
              <FailedSurface diagnostic={view.diagnostic} onRetry={() => void load()} />
            )}
            {snapshot && (
              <div className="quota-grid">
                <span className="refractive-seam" aria-hidden="true" />
                <QuotaCell label="5 HOUR" window={snapshot.fiveHour} accent="cyan" motion={fluidMotion} reducedMotion={preferences.reducedMotion} />
                <QuotaCell label="WEEK" window={snapshot.weekly} accent="mint" motion={fluidMotion} reducedMotion={preferences.reducedMotion} />
              </div>
            )}

            <footer className={`status-footer ${expanded ? "status-footer--expanded" : ""}`}>
              {view.kind === "loading" && <span>Reading Codex…</span>}
              {view.kind === "failed" && !snapshot && <span>数据不可用 · {view.diagnostic.code}</span>}
              {snapshot && !expanded && (
                <>
                  <span>FULL RESETS <b>{snapshot.fullResetCredits?.availableCount ?? "—"}</b></span>
                  <span className={isRefreshing ? "freshness freshness--refreshing" : "freshness"}>
                    {isRefreshing ? "正在刷新" : freshnessText(snapshot, stale, failureDiagnostic)}
                  </span>
                </>
              )}
              {snapshot && expanded && (
                <div className="detail-strip">
                  <span>FULL RESET EXPIRES <b>{formatExpiry(snapshot.fullResetCredits?.nearestExpiryAt)}</b></span>
                  {stale && <span className="stale-warning">STALE · {failureDiagnostic?.code ?? "cached snapshot"}</span>}
                  <div className="detail-actions">
                    <button type="button" onClick={() => void load()} disabled={isRefreshing}>
                      {isRefreshing ? "刷新中" : "刷新"}
                    </button>
                    <button type="button" onClick={() => void startClickThrough()}>
                      {clickThroughSeconds > 0 ? `穿透 ${clickThroughSeconds}s` : "穿透 10 秒"}
                    </button>
                    <button type="button" onClick={() => changeLayout("collapsed")}>收起为窄条</button>
                    <button ref={settingsButtonRef} type="button" onClick={() => setSettingsOpen((value) => !value)}>
                      <Icon name="settings" />
                      <span>设置</span>
                    </button>
                  </div>
                </div>
              )}
              <button
                className="expand-button"
                type="button"
                aria-label={expanded ? "收起重置详情" : "展开重置详情"}
                aria-expanded={expanded}
                title={expanded ? "收起重置详情" : "展开重置详情"}
                onClick={() => changeLayout(expanded ? "compact" : "expanded")}
                disabled={!snapshot}
              >
                <Icon name="chevron" />
              </button>
            </footer>
          </>
        )}

        {settingsOpen && (
          <aside className="settings-popover" role="dialog" aria-modal="false" aria-labelledby="settings-title">
            <div className="settings-heading">
              <strong id="settings-title">显示设置</strong>
              <button type="button" aria-label="关闭设置" onClick={() => setSettingsOpen(false)}><Icon name="close" /></button>
            </div>
            <label>
              <span>透明度 {Math.round(preferences.opacity * 100)}%</span>
              <input
                aria-label="透明度"
                type="range"
                min="0.86"
                max="1"
                step="0.02"
                value={preferences.opacity}
                onChange={(event) => updatePreferences({ ...preferences, opacity: Number(event.target.value) })}
              />
            </label>
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={preferences.reducedMotion}
                onChange={(event) => updatePreferences({ ...preferences, reducedMotion: event.target.checked })}
              />
              <span>减少动效</span>
            </label>
            <small>右键可再次打开 · 不会注册开机启动</small>
          </aside>
        )}
        {controlMessage && <span className="control-message" role="status">{controlMessage}</span>}
      </div>
    </main>
  );
}

export default App;
