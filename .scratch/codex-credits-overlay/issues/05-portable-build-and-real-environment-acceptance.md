# 05 — 便携构建与真实环境验收

**What to build:** 用户获得一个可手动启动的 Windows 11 x64 便携构建；该产物在隔离用户数据下完成首次启动、真实 Codex 配额读取、偏好重开、失败恢复和视觉对照，不依赖开发服务器或开发机残留状态。

**Blocked by:** 02 — 连接真实 Codex app-server；03 — 重置详情与故障恢复；04 — Windows 浮窗交互与偏好

**Status:** Blocked

**V2 update (2026-08-11):** the user-approved liquid-glass V2 was implemented
and verified in real Tauri windows. Compact, expanded, settings/Escape,
collapsed, portable live-data, portable failure-recovery, and authored-motion
checks now have current evidence in `docs/verification/VERIFICATION.md`.

**V2 rejection (2026-08-11):** real use exposed gray native chrome, an
unusable drag target, compressed liquid-height mapping, imperceptible motion,
no drag slosh, and insufficient optical/3D depth. Implementation is frozen.
V3 established the dual-inertia interaction but its glass and liquid still
looked like decorative fills; the current V4 material candidate and research
are under `.impeccable/mocks/rework-v4/`.

**V3 approval-proof correction (2026-08-11):** the initial interaction file
could open without any observable inertia because it depended on a manual fast
flick and could clamp motion to zero in a narrow preview. The revised prototype
opens with a repeating, labeled shell-coast + liquid-oscillation sequence.

**V4 implementation (2026-08-11):** the user approved Volumetric Fluid Lens.
The implementation now uses strict linear liquid volume, independent bounded
free-surface solvers, acceleration-driven drag slosh, native window glide,
thick optical walls, depth absorption, particles and caustics. System shadow
and the rectangular Acrylic plate are disabled. Automated frontend, physics,
Rust, production-build and portable-package checks pass.

**Current blocker:** the controlled automation desktop starts the Tauri/WebView2
process but cannot enumerate or capture its window. The 600x260 browser render
is diagnostic only; real-window drag, shell inertia and post-stop liquid motion
still require capture in a visible interactive session.

**WebView2 portability regression and fix (2026-08-11):** the first unpacked
portable directory still depended on a machine-wide WebView2 installation and
failed on the user's target machine. The package now carries Microsoft Edge
WebView2 Fixed Runtime 151.0.4129.78 beside the executable, verifies its
Microsoft Authenticode signature while packaging, and refuses incomplete
runtimes. A release smoke test observed seven `msedgewebview2` processes, all
loaded from the package-local `webview2-runtime` directory. This startup
boundary is Verified; visual and motion acceptance remains blocked separately.

- [x] 当前来源版本可生成明确可定位的便携产物，并通过发布目录启动烟雾测试。
- [x] 目标机器真实 Codex 冒烟检查对照五小时、一周、重置和新鲜度字段，且不消费 Full Reset Credit。
- [x] 隔离数据目录端到端检查覆盖首次启动、重新打开、偏好恢复与至少一个可行动失败路径。
- [ ] 真实运行截图覆盖紧凑、加载、健康、失败和收起状态，并与批准的 V4 图逐项对照；当前自动化桌面无法捕获 Tauri 窗口。
