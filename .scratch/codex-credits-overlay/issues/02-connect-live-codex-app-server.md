# 02 — 连接真实 Codex app-server

**What to build:** 浮窗在当前 Windows 用户上下文中定位并独立启动已安装的 Codex app-server，通过官方只读账户配额协议读取初始快照与后续更新；它不会连接桌面应用拥有的私有 stdio，也不会读取或保存凭据。

**Blocked by:** 01 — 可运行的配额浮窗闭环

**Status:** Verified

- [x] 生产模式可解析 Codex executable，并允许测试或诊断时显式覆盖 executable 路径。
- [x] 进程监督完成初始化、配额读取、稀疏更新合并、超时和安全退出。
- [x] Remaining Capacity、Window Reset Time、Full Reset Credit 与字段缺失均映射为统一快照模型。
- [x] 契约测试覆盖正常响应、稀疏通知、空字段、畸形消息、提前退出和登录缺失。
