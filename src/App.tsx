import { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";
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

export type CapacityLoader = () => Promise<CapacitySnapshot>;

interface AppProps {
  loadSnapshot?: CapacityLoader;
  loadPreferences?: () => Promise<DisplayPreferences>;
  savePreferences?: (preferences: DisplayPreferences) => Promise<void>;
  enableClickThrough?: (durationMs?: number) => Promise<void>;
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

function QuotaCell({
  label,
  window,
  accent,
}: {
  label: "5 HOUR" | "WEEK";
  window: QuotaWindow | null;
  accent: "cyan" | "mint";
}) {
  const remaining = window?.remainingPercent ?? 0;
  return (
    <section
      className={`quota-cell quota-cell--${accent}`}
      aria-label={`${label} quota`}
      role="group"
    >
      <div
        className="liquid"
        style={{ "--empty-level": `${100 - remaining}%` } as React.CSSProperties}
      />
      <div className="cell-content">
        <span className="quota-label">{label}</span>
        <div className="capacity-value">
          <span>{window ? formatPercent(remaining) : "—"}%</span>
          <small>LEFT</small>
        </div>
        <span className="reset-time">
          {window
            ? `Resets ${formatReset(window.resetsAt, label === "WEEK")}`
            : "Reset unavailable"}
        </span>
        <div className="scale-line" aria-hidden="true" />
      </div>
    </section>
  );
}

function LoadingSurface() {
  return (
    <div className="loading-surface" aria-label="正在读取 Codex 配额">
      {["5 HOUR", "WEEK"].map((label) => (
        <section className="loading-cell" key={label}>
          <span className="quota-label">{label}</span>
          <span className="skeleton skeleton--large" />
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

export function App({
  loadSnapshot = readCapacitySnapshot,
  loadPreferences = loadDisplayPreferences,
  savePreferences = saveDisplayPreferences,
  enableClickThrough = enableTemporaryClickThrough,
}: AppProps) {
  const [view, setView] = useState<ViewState>({ kind: "loading" });
  const [lastSnapshot, setLastSnapshot] = useState<CapacitySnapshot | null>(null);
  const lastSnapshotRef = useRef<CapacitySnapshot | null>(null);
  const loadGenerationRef = useRef(0);
  const [expanded, setExpanded] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [clickThroughSeconds, setClickThroughSeconds] = useState(0);

  const load = useCallback(async () => {
    const generation = ++loadGenerationRef.current;
    if (!lastSnapshotRef.current) setView({ kind: "loading" });
    try {
      const snapshot = await loadSnapshot();
      if (generation !== loadGenerationRef.current) return;
      lastSnapshotRef.current = snapshot;
      setLastSnapshot(snapshot);
      setView({ kind: "healthy", snapshot });
    } catch (error) {
      if (generation !== loadGenerationRef.current) return;
      setView({ kind: "failed", diagnostic: normalizeDiagnostic(error) });
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

  const updatePreferences = useCallback(
    (next: DisplayPreferences) => {
      setPreferences(next);
      void savePreferences(next).catch(() => undefined);
    },
    [savePreferences],
  );

  const startClickThrough = useCallback(async () => {
    await enableClickThrough(CLICK_THROUGH_DURATION_MS);
    setClickThroughSeconds(CLICK_THROUGH_DURATION_MS / 1_000);
  }, [enableClickThrough]);

  const snapshot = view.kind === "healthy" ? view.snapshot : lastSnapshot;
  const stale = view.kind === "failed" && snapshot !== null;

  return (
    <main
      className={`app-frame ${preferences.reducedMotion ? "reduce-motion" : ""}`}
      style={{ "--surface-opacity": preferences.opacity } as React.CSSProperties}
      onContextMenu={(event) => {
        event.preventDefault();
        setSettingsOpen((value) => !value);
      }}
    >
      <div className={`glass-shell ${stale ? "glass-shell--stale" : ""}`}>
        <div className="drag-rail" data-tauri-drag-region aria-hidden="true" />

        {view.kind === "loading" && <LoadingSurface />}
        {view.kind === "failed" && !snapshot && (
          <FailedSurface diagnostic={view.diagnostic} onRetry={() => void load()} />
        )}
        {snapshot && (
          <div className="quota-grid">
            <QuotaCell label="5 HOUR" window={snapshot.fiveHour} accent="cyan" />
            <QuotaCell label="WEEK" window={snapshot.weekly} accent="mint" />
          </div>
        )}

        <footer className={`status-footer ${expanded ? "status-footer--expanded" : ""}`}>
          {view.kind === "loading" && <span>Reading Codex…</span>}
          {view.kind === "failed" && snapshot && (
            <span className="stale-warning">STALE · {view.diagnostic.code}</span>
          )}
          {view.kind === "failed" && !snapshot && <span>数据不可用 · {view.diagnostic.code}</span>}
          {snapshot && !expanded && (
            <>
              <span>FULL RESETS <b>{snapshot.fullResetCredits?.availableCount ?? "—"}</b></span>
              <span>{formatFreshness(snapshot.observedAtMs)}</span>
            </>
          )}
          {snapshot && expanded && (
            <div className="detail-strip">
              <span>FULL RESET EXPIRES <b>{formatExpiry(snapshot.fullResetCredits?.nearestExpiryAt)}</b></span>
              <button type="button" onClick={() => void load()}>刷新</button>
              <button type="button" onClick={() => void startClickThrough()}>
                {clickThroughSeconds > 0 ? `穿透 ${clickThroughSeconds}s` : "穿透 10 秒"}
              </button>
              <button type="button" onClick={() => setSettingsOpen((value) => !value)}>设置</button>
            </div>
          )}
          <button
            className="expand-button"
            type="button"
            aria-label={expanded ? "收起重置详情" : "展开重置详情"}
            aria-expanded={expanded}
            onClick={() => setExpanded((value) => !value)}
            disabled={!snapshot}
          >
            {expanded ? "↙" : "↗"}
          </button>
        </footer>

        {settingsOpen && (
          <aside className="settings-popover" aria-label="显示设置">
            <div className="settings-heading">
              <strong>显示设置</strong>
              <button type="button" aria-label="关闭设置" onClick={() => setSettingsOpen(false)}>×</button>
            </div>
            <label>
              <span>透明度 {Math.round(preferences.opacity * 100)}%</span>
              <input
                aria-label="透明度"
                type="range"
                min="0.7"
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
      </div>
    </main>
  );
}

export default App;
