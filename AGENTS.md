## Agent skills

### Issue tracker

Issues and specs live as Markdown files under `.scratch/<feature-slug>/` (relative to this directory). See `docs/agents/issue-tracker.md`.

### Triage labels

Five canonical triage roles, label string equals role name (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

This is a single-context repo; shared domain docs live in root `CONTEXT.md` and `docs/adr/`. See `docs/agents/domain.md`.

## Git rules

- Commit locally on feature branches as needed.
- **Never run `git push`** (or any other command that publishes to a remote, e.g. `gh pr create`) without explicit user approval in the current session.
