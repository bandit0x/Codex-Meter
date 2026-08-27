export interface QuotaWindow {
  usedPercent: number;
  remainingPercent: number;
  windowDurationMins: number;
  resetsAt: number;
}

export interface FullResetCredits {
  availableCount: number;
  nearestExpiryAt: number | null;
}

export interface CapacitySnapshot {
  sourceState: "healthy" | "stale";
  fiveHour: QuotaWindow | null;
  weekly: QuotaWindow | null;
  fullResetCredits: FullResetCredits | null;
  observedAtMs: number;
}

export interface ZCodeQuotaWindow {
  usedPercent: number;
  remainingPercent: number;
  windowDurationMins: number;
  resetsAt: number;
  quotaTotal: number;
  quotaUsed: number;
  quotaRemaining: number;
}

export interface ZCodeQuotaSnapshot {
  sourceState: "healthy";
  fiveHour: ZCodeQuotaWindow | null;
  weekly: ZCodeQuotaWindow | null;
  planLevel: string | null;
  observedAtMs: number;
}

export type MeterSource = "codex" | "zcode";
export type SourceSelection = MeterSource | "carousel";

export interface DisplayPreferences {
  opacity: number;
  reducedMotion: boolean;
  x: number | null;
  y: number | null;
  source?: SourceSelection;
}

export interface Diagnostic {
  code: string;
  message: string;
  detail: string | null;
}

export interface TomatoConnectionSnapshot {
  state: "healthy" | "blocked";
  countryCode: string | null;
  latencyMs: number | null;
  observedAtMs: number;
  diagnostic: Diagnostic | null;
}
