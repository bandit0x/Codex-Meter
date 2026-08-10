# 01 — 可运行的配额浮窗闭环

**What to build:** 用户手动启动一个真正的 Windows 浮窗，并通过讲真实 newline-delimited JSON-RPC 的确定性 fixture 进程，从加载态进入健康态；方案 3 的单胶囊中央分舱以完全同级的视觉层级显示五小时与一周 Remaining Capacity。

**Blocked by:** None — can start immediately

**Status:** ready-for-agent

- [ ] Tauri、Rust 与 React 应用可手动启动，并显示透明、置顶的紧凑浮窗。
- [ ] 可注入的 app-server executable seam 能启动 fixture 进程并完成真实协议形状的请求与响应。
- [ ] 加载态与健康态严格保持两个 Quota Window 等宽、同级，并显示更新时间。
- [ ] 单元、契约与应用级测试证明首次启动、加载和健康闭环，不依赖现有用户缓存。

