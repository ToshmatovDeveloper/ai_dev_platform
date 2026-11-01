# ai_dev_platform

AI-first development platform. Customer requirements live in `customer-requirements(1).md`.

## Agent skills

### Domain docs

Project vocabulary lives in `DOMAIN.md`; decisions live in `docs/adr/`. See `docs/agents/domain.md`.

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
