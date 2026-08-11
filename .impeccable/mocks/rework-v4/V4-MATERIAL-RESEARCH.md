# V4 材质调研与取舍

状态：设计候选，产品代码继续冻结。

## GitHub 对比

| 项目 | 可借鉴内容 | 许可证 / 状态 | 本项目决策 |
| --- | --- | --- | --- |
| [rdev/liquid-glass-react](https://github.com/rdev/liquid-glass-react) | Chromium 下的边缘位移、折射模式、霜化、色差与弹性 | MIT；约 5.9k stars；React 适配直接，但历史较浅且 shader 模式自述不稳定 | 借鉴折射参数和边缘光学，不直接依赖其桌面背景采样 |
| [PavelDoGreat/WebGL-Fluid-Simulation](https://github.com/PavelDoGreat/WebGL-Fluid-Simulation) | GPU 速度场、压力求解、对流与涡量 | MIT；约 16.6k stars；成熟、广泛验证，但完整演示规模对常驻浮窗过重 | 复用低分辨率 Navier–Stokes 思路，裁剪成每舱独立小型求解器 |
| [tauri-apps/window-vibrancy](https://github.com/tauri-apps/window-vibrancy) | Windows 原生 blur / Acrylic / Mica 与透明 Tauri 窗口集成 | MIT / Apache-2.0；约 1k stars；持续维护；README 明示 Windows 拖动/缩放时 Acrylic 性能较差 | 仅作可选背景基底并设置性能门槛，不用它承担全部玻璃质感 |
| [archisvaze/liquid-glass](https://github.com/archisvaze/liquid-glass) | IOR、壁厚、bevel、specular 的可视化参数关系 | 仓库未展示许可证 | 只观察效果，不复制代码或资源 |
| [DavidHDev/canvas-ui](https://github.com/DavidHDev/canvas-ui) | live DOM 上的 WebGL liquid / glass 架构 | MIT + Commons Clause；约 3.7k stars；依赖实验性 HTML-in-canvas，并提供 fallback | 仅作架构参考，不作为首选依赖 |

## 已确认的平台边界

透明 WebView 中的 CSS `backdrop-filter` 只能处理应用自身 DOM，不能读取
窗口后方的真实 Windows 桌面像素。因此 V4 不再伪装成“真实桌面折射”：
原生 blur/Mica 负责可选背景基底，WebGL 负责舱壁厚度、Fresnel、焦散和液体
体积；两层各自承担能真实完成的部分。

## 推荐组合

1. 玻璃：自主的小型 WebGL 光学层，参考 MIT 项目的参数关系，避免引入整套
   组件库。
2. 液体：从 MIT 流体求解器裁剪出的双 160×96 或 192×112 速度/压力场，
   只在拖动和回荡阶段以 60 Hz 运行，稳定后暂停。
3. Windows 基底：先用透明无阴影窗口；只有圆角区域与拖动性能均通过真实
   Tauri 证明后，才启用原生 Acrylic/Mica。
