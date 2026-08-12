# GitHub publication handoff

This repository is ready for the owner to publish from the local working tree.
Project policy intentionally leaves the final remote creation and upload to the
owner; no GitHub remote or credential is configured by the project.

## Decide before publishing

1. Choose **private** or **public** visibility. Private is the safer default
   until the repository contents and history have been reviewed on GitHub.
2. Choose a license before making the repository public. There is currently no
   project-level open-source license, so publishing it publicly does not grant
   others permission to copy, modify, or redistribute the project.
3. Decide whether to keep `master` as the default branch or rename it to `main`.
   The commands below preserve the existing `master` branch.

## Local preflight

Run these from the repository root:

```powershell
git status --short
npm.cmd run typecheck
npm.cmd test -- --run
cargo clippy --manifest-path src-tauri\Cargo.toml --all-targets -- -D warnings
cargo test --manifest-path src-tauri\Cargo.toml
```

`git status --short` should be empty after the final local commit. The portable
`release/` directory, bundled Codex/WebView2 runtimes, `node_modules/`, caches,
logs, isolated profiles, and test output are intentionally excluded by
`.gitignore` and must not be force-added.

## Owner-run publication with GitHub CLI

Replace `YOUR_REPOSITORY` and choose either `--private` or `--public`:

```powershell
gh auth login
gh repo create YOUR_REPOSITORY --private --source . --remote origin
git push -u origin master
```

Alternatively, create an empty repository in the GitHub website and use the
exact remote URL shown there:

```powershell
git remote add origin https://github.com/YOUR_ACCOUNT/YOUR_REPOSITORY.git
git push -u origin master
```

Do not commit personal access tokens, Codex credentials, `.env` files, runtime
profiles, logs, or generated portable packages. GitHub Releases is the suitable
place for a deliberately selected binary package if one is published later;
the portable directory itself is intentionally not source-controlled.
