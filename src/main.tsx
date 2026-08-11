import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import type { CapacitySnapshot } from "./capacityTypes";

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

const useVisualFixture = import.meta.env.DEV
  && new URLSearchParams(window.location.search).get("fixture") === "v4";

const fixtureProps = useVisualFixture
  ? {
      loadSnapshot: async () => visualFixture,
      loadPreferences: async () => ({ opacity: 0.92, reducedMotion: false, x: null, y: null }),
      savePreferences: async () => undefined,
      enableClickThrough: async () => undefined,
      setWindowLayout: async () => undefined,
      getWindowPosition: async () => ({ x: 0, y: 0 }),
      setWindowPosition: async () => undefined,
    }
  : {};

createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App {...fixtureProps} />
  </React.StrictMode>,
);
