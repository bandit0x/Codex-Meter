# 05 — 便携构建与真实环境验收

**What to build:** 用户获得一个可手动启动的 Windows 11 x64 便携构建；该产物在隔离用户数据下完成首次启动、真实 Codex 配额读取、偏好重开、失败恢复和视觉对照，不依赖开发服务器或开发机残留状态。

**Blocked by:** 02 — 连接真实 Codex app-server；03 — 重置详情与故障恢复；04 — Windows 浮窗交互与偏好

**Status:** Acceptance pending

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

**Current acceptance boundary:** the recovery run can now enumerate, move and
capture the real packaged Tauri window. Compact drag, shell glide and liquid
settling evidence is current; the owner still needs to accept the refreshed
compact visual before expanded, failure and collapsed recovery captures proceed.

**WebView2 portability regression and fix (2026-08-11):** the first unpacked
portable directory still depended on a machine-wide WebView2 installation and
failed on the user's target machine. The package now carries Microsoft Edge
WebView2 Fixed Runtime 151.0.4129.78 beside the executable, verifies its
Microsoft Authenticode signature while packaging, and refuses incomplete
runtimes. A release smoke test observed seven `msedgewebview2` processes, all
loaded from the package-local `webview2-runtime` directory. This startup
boundary is Verified; the refreshed visual direction remains Acceptance pending.

**V4 stop-loss recovery (2026-08-11):** the owner rejected the packaged visual
fidelity and reported that the window could not move. The first failing boundary
was the Tauri capability contract: frontend drag code called `set_position`, but
the main window had no `core:window:allow-set-position` permission, and the
rejected Promise was discarded. A red configuration test captured the defect;
the permission fix and a Pointer Move-to-window-position regression test now
pass. The material stack was rebuilt against the approved 600x260 composition:
28px exterior breathing room, inset thick optical walls, opaque absorption
chambers, a stronger meniscus, and organic rather than grid-like caustics.

The packaged executable then passed a real Win32 drag run. A 110x50 pointer path
produced a final 182x83 window displacement, including 47x22 of post-release
glide. Three real-window captures recorded continued liquid change through
220ms and decay toward rest by 900ms. Status is Acceptance pending, not Verified,
until the owner accepts the refreshed real Tauri frame.

- [x] 当前来源版本可生成明确可定位的便携产物，并通过发布目录启动烟雾测试。
- [x] 目标机器真实 Codex 冒烟检查对照五小时、一周、重置和新鲜度字段，且不消费 Full Reset Credit。
- [x] 隔离数据目录端到端检查覆盖首次启动、重新打开、偏好恢复与至少一个可行动失败路径。
- [ ] 真实运行截图覆盖紧凑、加载、健康、失败和收起状态，并与批准的 V4 图逐项对照；当前自动化桌面无法捕获 Tauri 窗口。
