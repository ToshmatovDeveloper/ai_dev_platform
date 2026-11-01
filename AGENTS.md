# ai_dev_platform

AI-first development platform. The project brief and customer requirements live in
`customer-requirements(1).md` — read it before planning work.

## Agent skills

### Issue tracker

Issues and specs live as GitHub issues in `ToshmatovDeveloper/ai_dev_platform`, via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Five canonical roles with default strings: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `DOMAIN.md` at the repo root and decisions in `docs/adr/`. See `docs/agents/domain.md`.

### Setup

After cloning, run `node scripts/link-project-skills.mjs` so Claude Code finds the skills in `.opencode/skills/`.

## Branches

Ask about a branch once per session, right before the first change to files in the repository — an
edit, a new file, a deletion. Discussion, questions, and read-only exploration get no question.

Ask in Russian: «Надо ли создать новую ветку?» — and list three branch names derived from the work
at hand, one per line, each with a one-line reason to pick it.

- Shape: `<type>/<kebab-case-slug>`, with `feat/`, `fix/`, `docs/`, or `chore/`.
- The three differ in scope or approach, so the user picks a granularity, not a synonym.
- Name the change, not the mechanics: `docs/domain-md-convention`, not `docs/edit-agents-md`.
- Wait for the pick: create that branch, then make the change; on "no", stay where you are and
  don't raise the question again in this session.
