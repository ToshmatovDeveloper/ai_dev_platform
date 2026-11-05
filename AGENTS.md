# ai_dev_platform

AI-first development platform. The project brief and customer requirements live in
`customer-requirements(1).md` — read it before planning work.

## Agent skills

### Issue tracker

Create, read, and triage issues and specs through `gh`. See `docs/agents/issue-tracker.md`.

### Triage labels

Before assigning or removing a triage label, read `docs/agents/triage-labels.md`.

### Domain docs

Before working with domain terms or architecture decisions, read `docs/agents/domain.md`.

### Agent workflow

Before you take a task labeled `ready-for-agent`, read `docs/agents/agent-workflow.md`.

### Setup

After cloning, run `node scripts/link-project-skills.mjs` so Claude Code finds the skills in `.opencode/skills/`.

## Branches

Ask once per session, right before the first change to files in the repository: an edit, a new
file, or a deletion.

Ask in Russian: «Надо ли создать новую ветку?» — and list three branch names derived from the work
at hand, one per line, each with a one-line reason to pick it.

- Shape: `<type>/<kebab-case-slug>`, with `feat/`, `fix/`, `docs/`, or `chore/`.
- The three differ in scope or approach, so the user picks a granularity, not a synonym.
- Name the change, not the mechanics: `docs/domain-md-convention`, not `docs/edit-agents-md`.
- Wait for the pick: create that branch, then make the change; on "no", stay where you are.
