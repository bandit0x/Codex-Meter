import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import type { CapacitySnapshot } from "./capacityTypes";
import { overlayLayoutSizes, type OverlayLayout } from "./windowClient";

const visualFixture: CapacitySnapshot = {
  sourceState: "healthy",
  fiveHour: {
    usedPercent: 82,
    remainingPercent: 18,
    windowDurationMins: 300,
    resetsAt: 1_800_000_000,
  },
  weekly: {
    usedPercent: 5,
    remainingPercent: 95,
    windowDurationMins: 10_080,
    resetsAt: 1_800_172_800,
  },
  fullResetCredits: { availableCount: 2, nearestExpiryAt: 1_800_432_000 },
  observedAtMs: Date.now(),
};

const visualFixtureNames = new Set([
  "v4",
  "v7-healthy",
  "v7-loading",
  "v7-failed",
  "v7-expanded",
  "v7-collapsed",
]);

function resolveFixtureLayout(
  fixtureName: string | null,
  requestedLayout: string | null,
): OverlayLayout {
  if (fixtureName === "v7-expanded") return "expanded";
  if (fixtureName === "v7-collapsed") return "collapsed";
  if (requestedLayout === "expanded" || requestedLayout === "collapsed") return requestedLayout;
  return "compact";
}

function createFixtureLoader(fixtureName: string | null) {
  if (fixtureName === "v7-loading") {
    return () => new Promise<CapacitySnapshot>(() => undefined);
  }
  if (fixtureName === "v7-failed") {
    return async (): Promise<CapacitySnapshot> => {
      throw { code: "CRV-201", message: "无法读取 Codex 配额", detail: null };
    };
  }
  return async () => visualFixture;
}

const query = new URLSearchParams(window.location.search);
const fixtureName = import.meta.env.DEV ? query.get("fixture") : null;
const requestedLayout = query.get("layout");
const fixtureLayout = resolveFixtureLayout(fixtureName, requestedLayout);
const fixtureEnabled = fixtureName !== null && visualFixtureNames.has(fixtureName);

const fixtureProps: React.ComponentProps<typeof App> = fixtureEnabled
  ? {
      initialLayout: fixtureLayout,
      loadSnapshot: createFixtureLoader(fixtureName),
      loadPreferences: async () => ({ opacity: 0.92, reducedMotion: false, x: null, y: null }),
      savePreferences: async () => undefined,
      enableClickThrough: async () => undefined,
      setWindowLayout: async () => undefined,
      getWindowPosition: async () => ({ x: 0, y: 0 }),
      setWindowPosition: async () => undefined,
    }
  : {};

const rootElement = document.getElementById("root") as HTMLElement;
if (fixtureEnabled) {
  const fixtureSize = overlayLayoutSizes[fixtureLayout];
  rootElement.style.width = `${fixtureSize.width}px`;
  rootElement.style.height = `${fixtureSize.height}px`;
}

createRoot(rootElement).render(
  <React.StrictMode>
    <App {...fixtureProps} />
  </React.StrictMode>,
);
