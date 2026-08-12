# Codex Meter GitHub 发布指南

本文用于把本地 `Codex Meter` 源码仓库发布到你自己的 GitHub 账号。

> 项目规则要求最终的远程仓库创建、远程地址配置和上传操作必须由项目所有者本人执行。因此，下面的命令需要你在本机 PowerShell 中手动运行。本项目不会替你执行 `git push`、创建远程仓库或上传 Release。

## 一、当前状态

截至本指南编写时：

- 本地仓库路径：`D:\bandit\projects\codex-credits-view`
- 当前分支：`master`
- 当前产品名：`Codex Meter`
- 尚未配置 Git 远程仓库
- `release/`、WebView2 运行时、Codex 运行时、`node_modules/`、缓存和日志均已被 `.gitignore` 排除
- 项目目前没有根目录 `LICENSE` 文件

建议第一次发布时使用：

- 仓库名：`codex-meter`
- 可见性：先设为 **Private**
- 默认分支：可以保留 `master`，也可以在首次推送前改成更常见的 `main`
- 二进制程序：先不要上传，确认源码仓库无敏感信息并决定许可证后，再单独创建 GitHub Release

## 二、发布前必须决定的事情

### 1. Private 还是 Public

推荐先创建 **Private** 仓库。确认 GitHub 上的文件、提交历史和说明都正确后，再决定是否公开。

如果公开，任何人都能阅读源码和提交历史。把仓库设为 Public 并不自动授予别人复制、修改或再发布代码的权利。

### 2. 是否添加开源许可证

当前项目没有根目录 `LICENSE`，因此不应把它描述成开源项目。

- 仅自己使用：可以保持私有，不添加许可证。
- 公开展示但暂不授权复用：可以保持无许可证，但应在 README 中明确“保留所有权利”。
- 允许他人使用和修改：先选择合适许可证，例如 MIT、Apache-2.0 或 GPL-3.0，再单独提交 `LICENSE`。

不要在不理解条款的情况下直接选择许可证。项目还包含第三方组件和运行时说明，已有文件 `THIRD_PARTY_NOTICES.md` 不能替代项目自身许可证。

### 3. 是否发布便携 EXE

源码仓库和程序安装包应分开处理：

- 源码通过 Git 提交和推送。
- `release/` 永远不要强制加入 Git。
- 如果需要提供可下载程序，应压缩后作为 GitHub Release 附件上传。

GitHub 会阻止普通 Git 仓库中的单个文件超过 100 MiB；GitHub Release 的单个附件必须小于 2 GiB。本项目便携目录约 1 GB，因此不能提交进 Git，但压缩包通常可以作为 Release 附件。发布二进制前，还应确认捆绑的 Codex 和 Microsoft WebView2 运行时允许以你选择的方式再分发。

## 三、本地发布前检查

打开 PowerShell：

```powershell
Set-Location -LiteralPath 'D:\bandit\projects\codex-credits-view'
```

### 1. 确认工作树干净

```powershell
git status --short --branch
```

理想结果只显示分支名，例如：

```text
## master
```

如果下面还有 `M`、`A` 或 `??`，说明存在尚未提交的修改。先检查它们，不要直接全量提交未知文件：

```powershell
git diff
git diff --staged
```

### 2. 确认没有远程地址

```powershell
git remote -v
```

首次发布前正常结果应为空。如果这里出现你不认识的地址，先停止，不要推送。

### 3. 确认大目录没有进入 Git

```powershell
git ls-files release node_modules dist src-tauri/target .scratch/tools
```

正常结果应为空。不要执行以下命令：

```powershell
git add -f release
git add -f node_modules
```

### 4. 检查仓库体积

```powershell
git count-objects -vH
```

如果 `.git` 目录异常巨大，先检查历史中是否曾提交运行时、安装包或日志，不要带着问题首次推送。

### 5. 检查敏感信息

至少人工检查以下内容：

- `.env`、API Key、Personal Access Token
- Codex/OpenAI 登录凭据
- 浏览器 Cookie、用户配置和本地 profile
- 绝对路径中的个人信息
- 日志、崩溃转储、截图中的隐私数据

可以先检查常见高风险文件名：

```powershell
git ls-files | Select-String -Pattern '\.env|credential|secret|token|cookie|profile|dump|\.log$'
```

有匹配不代表一定泄密，但必须逐项确认。

### 6. 运行项目验证

```powershell
npm.cmd run typecheck
npm.cmd run test
npm.cmd run build
cargo clippy --manifest-path src-tauri\Cargo.toml --all-targets -- -D warnings
cargo test --manifest-path src-tauri\Cargo.toml
```

如需验证最终便携程序：

```powershell
npm.cmd run tauri:build
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts\package-portable.ps1
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts\verify-portable-brand.ps1
```

任一必需检查失败时，不要把版本描述成已验证。

## 四、选择默认分支

### 方案 A：保留 `master`

不需要做任何修改，后面的推送命令使用 `master`。

### 方案 B：改为 `main`

如果你希望使用 GitHub 当前更常见的命名，在创建远程仓库前运行：

```powershell
git branch -m master main
git status --short --branch
```

后面的命令相应使用 `main`。

## 五、推荐发布方法：GitHub CLI

### 1. 安装并登录 GitHub CLI

检查是否已经安装：

```powershell
gh --version
```

如果未安装，可以从 GitHub CLI 官方页面安装。安装后登录：

```powershell
gh auth login
gh auth status
```

按提示选择：

1. `GitHub.com`
2. `HTTPS`
3. 通过浏览器登录

不要把访问令牌粘贴进项目文件或提交记录。

### 2. 创建私有仓库并推送

保留 `master` 时：

```powershell
gh repo create codex-meter --private --source . --remote origin
git remote -v
git push -u origin master
```

已经改为 `main` 时：

```powershell
gh repo create codex-meter --private --source . --remote origin
git remote -v
git push -u origin main
```

你也可以让 `gh` 创建仓库并立即推送：

```powershell
gh repo create codex-meter --private --source . --remote origin --push
```

为了在上传前最后检查一次远程地址，本指南更推荐分开执行创建和推送。

如确定要公开，把 `--private` 改为 `--public`。不要同时提供两个可见性参数。

## 六、备选方法：GitHub 网页创建仓库

1. 登录 GitHub。
2. 打开右上角 `+`，选择 `New repository`。
3. Repository name 填写 `codex-meter`。
4. 建议先选择 `Private`。
5. **不要勾选** Add a README、Add `.gitignore` 或 Add a license。本地仓库已经存在这些项目文件；远程预先初始化可能产生不必要的历史冲突。
6. 点击 `Create repository`。
7. 复制 GitHub 显示的 HTTPS 地址。

然后在项目根目录执行：

```powershell
git remote add origin https://github.com/YOUR_ACCOUNT/codex-meter.git
git remote -v
```

确认账号和仓库名完全正确，再推送：

```powershell
git push -u origin master
```

如果本地分支已改为 `main`，则执行：

```powershell
git push -u origin main
```

## 七、首次推送后的 GitHub 检查

在网页上逐项确认：

- 仓库可见性符合预期。
- 默认分支正确。
- README 能正常显示 `Codex Meter`。
- `release/`、`node_modules/`、WebView2 运行时和 Codex 运行时没有出现在文件列表中。
- 没有 `.env`、Token、日志、用户 profile 或本地缓存。
- `PRODUCT.md`、`DESIGN.md`、`THIRD_PARTY_NOTICES.md` 均存在。
- 提交历史没有陌生作者、敏感提交信息或误入的大文件。

如果推送错了仓库，先停止继续操作。不要用强制推送试图掩盖问题；先确认远程地址：

```powershell
git remote -v
```

需要移除错误的本地远程配置时：

```powershell
git remote remove origin
```

这只会删除本地远程映射，不会删除 GitHub 上已经上传的内容。

## 八、可选：发布 Codex Meter 便携版本

### 1. 重新构建并验证

```powershell
npm.cmd run tauri:build
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts\package-portable.ps1
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts\verify-portable-brand.ps1
```

### 2. 生成 ZIP

```powershell
$source = 'release\CodexMeter-0.1.0-win-x64'
$archive = 'release\CodexMeter-0.1.0-win-x64-portable.zip'
Compress-Archive -LiteralPath $source -DestinationPath $archive -CompressionLevel Optimal -Force
Get-FileHash -LiteralPath $archive -Algorithm SHA256
```

记录输出的 SHA-256，并在 Release Notes 中提供。下载者可以用以下命令核验：

```powershell
Get-FileHash -LiteralPath '.\CodexMeter-0.1.0-win-x64-portable.zip' -Algorithm SHA256
```

### 3. 创建版本标签

确认当前提交正是要发布的版本：

```powershell
git status --short --branch
git log -1 --oneline
```

然后由你本人创建并推送标签：

```powershell
git tag -a v0.1.0 -m 'Codex Meter v0.1.0'
git push origin v0.1.0
```

### 4. 创建 Draft Release

推荐先创建草稿，不要直接正式发布：

```powershell
gh release create v0.1.0 `
  'release\CodexMeter-0.1.0-win-x64-portable.zip' `
  --title 'Codex Meter v0.1.0' `
  --notes 'Windows 11 x64 便携预览版。手动启动，无开机启动；关闭窗口后驻留通知区域。' `
  --draft
```

在 GitHub 网页打开 Draft Release，确认：

- ZIP 能完整下载。
- Release Notes 写明 Windows 11 x64、便携版、约 1 GB。
- 写明需要保持 EXE、`codex-runtime` 和 `webview2-runtime` 在同一目录。
- 写明应用读取本地 Codex `app-server`，不会兑换重置额度。
- 附上 ZIP 的 SHA-256。
- 确认第三方运行时的再分发条件后，再点击 Publish release。

## 九、以后更新源码

日常流程：

```powershell
git status --short
git diff
git add <明确确认过的文件>
git commit -m '说明本次修改'
git push
```

不要习惯性执行 `git add .`。先检查差异，再只加入明确要提交的文件。

## 十、常见问题

### `remote origin already exists`

先检查：

```powershell
git remote -v
```

如果地址正确，无需再次添加；如果地址错误，使用：

```powershell
git remote set-url origin https://github.com/YOUR_ACCOUNT/codex-meter.git
```

### `src refspec main does not match any`

说明本地分支并不叫 `main`。查看实际名称：

```powershell
git branch --show-current
```

然后推送真实分支，或者先按本文步骤重命名。

### GitHub 拒绝超过 100 MiB 的文件

不要用 `git add -f` 重试。这通常表示生成物或运行时已经进入提交。先检查：

```powershell
git status --short
git ls-files release node_modules src-tauri/target
```

如果大文件已经进入历史，即使后来删除，首次推送仍可能失败。此时应先清理本地历史，并在操作前备份仓库。

### 想撤销一次尚未推送的远程配置

```powershell
git remote remove origin
```

该命令不会删除本地提交。

## 官方参考

- [GitHub：创建新仓库](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-new-repository)
- [GitHub：把本地代码添加到 GitHub](https://docs.github.com/en/migrations/importing-source-code/using-the-command-line-to-import-source-code/adding-locally-hosted-code-to-github)
- [GitHub：仓库及单文件限制](https://docs.github.com/en/repositories/creating-and-managing-repositories/repository-limits)
- [GitHub：关于大型文件](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github)
- [GitHub：关于 Releases](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases)
- [GitHub：管理 Releases](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository)
