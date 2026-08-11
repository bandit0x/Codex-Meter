import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { App } from "./App";
import type { CapacitySnapshot } from "./capacityTypes";

const inertPreferences = {
  loadPreferences: async () => ({ opacity: 0.92, reducedMotion: false, x: null, y: null }),
  savePreferences: async () => undefined,
  enableClickThrough: async () => undefined,
  setWindowLayout: async () => undefined,
};

const healthySnapshot: CapacitySnapshot = {
  sourceState: "healthy",
  fiveHour: {
    usedPercent: 24,
    remainingPercent: 76,
    windowDurationMins: 300,
    resetsAt: 1_800_000_000,
  },
  weekly: {
    usedPercent: 58,
    remainingPercent: 42,
    windowDurationMins: 10_080,
    resetsAt: 1_800_172_800,
  },
  fullResetCredits: {
    availableCount: 2,
    nearestExpiryAt: 1_800_432_000,
  },
  observedAtMs: 1_800_000_000_000,
};

describe("Codex capacity overlay", () => {
  it("keeps both quota windows present with equal loading treatment", () => {
    render(<App {...inertPreferences} loadSnapshot={() => new Promise(() => undefined)} />);

    expect(screen.getByLabelText("正在读取 Codex 配额")).toBeInTheDocument();
    expect(screen.getByText("5 HOUR")).toBeInTheDocument();
    expect(screen.getByText("WEEK")).toBeInTheDocument();
  });

  it("renders five-hour and weekly remaining capacity as co-primary values", async () => {
    render(<App {...inertPreferences} loadSnapshot={async () => healthySnapshot} />);

    const fiveHour = await screen.findByRole("group", { name: "5 HOUR quota" });
    const weekly = screen.getByRole("group", { name: "WEEK quota" });
    expect(within(fiveHour).getByText("76%", { exact: false })).toBeInTheDocument();
    expect(within(weekly).getByText("42%", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("FULL RESETS", { exact: false })).toHaveTextContent("2");
  });

  it("uses one shared actionable failure surface and retries", async () => {
    const user = userEvent.setup();
    let attempt = 0;
    const loadSnapshot = async () => {
      attempt += 1;
      if (attempt === 1) {
        throw { code: "CRV-201", message: "无法读取 Codex 配额", detail: null };
      }
      return healthySnapshot;
    };

    render(<App {...inertPreferences} loadSnapshot={loadSnapshot} />);
    expect(await screen.findByText("诊断码 CRV-201", { exact: false })).toBeInTheDocument();
    expect(screen.getAllByText("无法读取 Codex 配额")).toHaveLength(1);

    await user.click(screen.getByRole("button", { name: "重试" }));
    expect(await screen.findByText("76%", { exact: false })).toBeInTheDocument();
  });

  it("reveals refresh, bounded click-through, and settings after expansion", async () => {
    const user = userEvent.setup();
    let clickThroughCalls = 0;
    render(
      <App
        {...inertPreferences}
        loadSnapshot={async () => healthySnapshot}
        enableClickThrough={async () => { clickThroughCalls += 1; }}
      />,
    );

    await screen.findByText("76%", { exact: false });
    await user.click(screen.getByRole("button", { name: "展开重置详情" }));
    expect(screen.getByRole("button", { name: "刷新" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "穿透 10 秒" }));
    expect(clickThroughCalls).toBe(1);
    await user.click(screen.getByRole("button", { name: "设置" }));
    expect(screen.getByRole("dialog", { name: "显示设置" })).toBeInTheDocument();
  });

  it("moves between compact, expanded, and collapsed window layouts", async () => {
    const user = userEvent.setup();
    const layouts: string[] = [];
    render(
      <App
        {...inertPreferences}
        loadSnapshot={async () => healthySnapshot}
        setWindowLayout={async (layout) => { layouts.push(layout); }}
      />,
    );

    await screen.findByText("76%", { exact: false });
    await user.click(screen.getByRole("button", { name: "展开重置详情" }));
    expect(layouts[layouts.length - 1]).toBe("expanded");

    await user.click(screen.getByRole("button", { name: "收起为窄条" }));
    expect(layouts[layouts.length - 1]).toBe("collapsed");
    expect(screen.getByRole("button", { name: "恢复标准视图" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "恢复标准视图" }));
    expect(layouts[layouts.length - 1]).toBe("compact");
  });

  it("moves the native window while the reservoir surface is dragged", async () => {
    const positions: Array<{ x: number; y: number }> = [];
    const { container } = render(
      <App
        {...inertPreferences}
        loadSnapshot={async () => healthySnapshot}
        getWindowPosition={async () => ({ x: 100, y: 200 })}
        setWindowPosition={async (position) => {
          positions.push(position);
        }}
      />,
    );

    await screen.findByText("76%", { exact: false });
    const surface = container.querySelector(".app-frame") as HTMLElement;
    surface.setPointerCapture = () => undefined;
    surface.hasPointerCapture = () => false;

    fireEvent.pointerDown(surface, { button: 0, pointerId: 7, screenX: 20, screenY: 30 });
    await waitFor(() => expect(surface).toHaveClass("is-dragging"));
    fireEvent.pointerMove(surface, { pointerId: 7, screenX: 48, screenY: 44 });

    await waitFor(() => expect(positions[positions.length - 1]).toEqual({ x: 128, y: 214 }));
  });

  it("preserves immediate drag movement while the native position is still loading", async () => {
    const positions: Array<{ x: number; y: number }> = [];
    let resolvePosition: ((position: { x: number; y: number }) => void) | undefined;
    const pendingPosition = new Promise<{ x: number; y: number }>((resolve) => {
      resolvePosition = resolve;
    });
    const { container } = render(
      <App
        {...inertPreferences}
        loadSnapshot={async () => healthySnapshot}
        getWindowPosition={() => pendingPosition}
        setWindowPosition={async (position) => {
          positions.push(position);
        }}
      />,
    );

    await screen.findByText("76%", { exact: false });
    const surface = container.querySelector(".app-frame") as HTMLElement;
    surface.setPointerCapture = () => undefined;
    surface.hasPointerCapture = () => false;

    fireEvent.pointerDown(surface, { button: 0, pointerId: 11, screenX: 20, screenY: 30 });
    fireEvent.pointerMove(surface, { pointerId: 11, screenX: 48, screenY: 44 });
    expect(positions).toHaveLength(0);

    resolvePosition?.({ x: 100, y: 200 });
    await waitFor(() => expect(positions[positions.length - 1]).toEqual({ x: 128, y: 214 }));
  });

  it("keeps the last successful snapshot visibly stale after a refresh failure", async () => {
    const user = userEvent.setup();
    let attempt = 0;
    render(
      <App
        {...inertPreferences}
        loadSnapshot={async () => {
          attempt += 1;
          if (attempt === 1) return healthySnapshot;
          throw { code: "CRV-111", message: "读取 Codex 配额超时", detail: null };
        }}
      />,
    );

    await screen.findByText("76%", { exact: false });
    await user.click(screen.getByRole("button", { name: "展开重置详情" }));
    await user.click(screen.getByRole("button", { name: "刷新" }));
    expect(await screen.findByText("STALE · CRV-111")).toBeInTheDocument();
    expect(screen.getByText("76%", { exact: false })).toBeInTheDocument();
  });

  it("labels an upstream stale snapshot instead of presenting it as healthy", async () => {
    render(
      <App
        {...inertPreferences}
        loadSnapshot={async () => ({ ...healthySnapshot, sourceState: "stale" })}
      />,
    );

    expect(await screen.findByText("STALE · cached snapshot")).toBeInTheDocument();
  });

  it("renders a missing quota window as unavailable without a broken percentage", async () => {
    render(
      <App
        {...inertPreferences}
        loadSnapshot={async () => ({ ...healthySnapshot, fiveHour: null })}
      />,
    );

    const fiveHour = await screen.findByRole("group", { name: "5 HOUR quota unavailable" });
    expect(within(fiveHour).getByText("Data unavailable")).toBeInTheDocument();
    expect(within(fiveHour).queryByText("LEFT")).not.toBeInTheDocument();
    expect(screen.getByText(/5-hour unavailable/)).toBeInTheDocument();
  });

  it("persists opacity and reduced-motion choices as display-only preferences", async () => {
    const user = userEvent.setup();
    const saves: Array<{ opacity: number; reducedMotion: boolean }> = [];
    render(
      <App
        {...inertPreferences}
        loadSnapshot={async () => healthySnapshot}
        savePreferences={async (preferences) => {
          saves.push({ opacity: preferences.opacity, reducedMotion: preferences.reducedMotion });
        }}
      />,
    );

    await screen.findByText("76%", { exact: false });
    await user.click(screen.getByRole("button", { name: "展开重置详情" }));
    await user.click(screen.getByRole("button", { name: "设置" }));
    await user.click(screen.getByRole("checkbox", { name: "减少动效" }));
    expect(saves[saves.length - 1]).toEqual({ opacity: 0.92, reducedMotion: true });
  });

  it("closes the settings dialog with Escape", async () => {
    const user = userEvent.setup();
    render(<App {...inertPreferences} loadSnapshot={async () => healthySnapshot} />);

    await screen.findByText("76%", { exact: false });
    await user.click(screen.getByRole("button", { name: "展开重置详情" }));
    await user.click(screen.getByRole("button", { name: "设置" }));
    expect(screen.getByRole("dialog", { name: "显示设置" })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "显示设置" })).not.toBeInTheDocument();
  });

  it("prevents a second manual refresh while the first refresh is pending", async () => {
    const user = userEvent.setup();
    let attempt = 0;
    render(
      <App
        {...inertPreferences}
        loadSnapshot={() => {
          attempt += 1;
          if (attempt === 1) return Promise.resolve(healthySnapshot);
          return new Promise(() => undefined);
        }}
      />,
    );

    await screen.findByText("76%", { exact: false });
    await user.click(screen.getByRole("button", { name: "展开重置详情" }));
    await user.click(screen.getByRole("button", { name: "刷新" }));
    const refreshButton = screen.getByRole("button", { name: "刷新中" });
    expect(refreshButton).toBeDisabled();
    await user.click(refreshButton);
    expect(attempt).toBe(2);
  });
});
