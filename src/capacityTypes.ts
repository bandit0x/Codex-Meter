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

export interface DisplayPreferences {
  opacity: number;
  reducedMotion: boolean;
  x: number | null;
  y: number | null;
}

export interface Diagnostic {
  code: string;
  message: string;
  detail: string | null;
}
