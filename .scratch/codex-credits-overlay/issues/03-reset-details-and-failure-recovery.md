# 03 — 重置详情与故障恢复

**What to build:** 用户展开浮窗即可查看两个 Window Reset Time、Full Reset Credit 数量及最近 Credit Expiry Time；当数据不可用、超时或陈旧时，界面保留诚实状态，给出可行动原因、稳定诊断码和安全重试。

**Blocked by:** 02 — 连接真实 Codex app-server

**Status:** Verified

- [x] 展开视图明确区分两个窗口重置、信用数量、最近到期、零值与字段缺失。
- [x] 用户可以手动刷新；稀疏更新和临时断线不会把陈旧数据伪装成当前数据。
- [x] 缺失 Codex、未登录、超时、畸形消息与进程退出均产生可定位诊断码和恢复动作。
- [x] fixture 驱动的集成与端到端测试覆盖健康、陈旧、失败、重试成功及重新连接。
