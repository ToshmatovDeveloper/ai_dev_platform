# ai_dev_platform

AI-first development platform. Customer requirements live in `customer-requirements(1).md`.

## Agent skills

### Domain docs

Project vocabulary lives in `DOMAIN.md`; decisions live in `docs/adr/`. See `docs/agents/domain.md`.

### Setup

After cloning, run `node scripts/link-project-skills.mjs` so Claude Code finds the skills in `.opencode/skills/`.

## Branches

A session starts with the first user message of a fresh conversation. Before any other work in
that session, ask in Russian: «Надо ли создать новую ветку?» — and list three branch names derived
from that first prompt, one per line, each with a one-line reason to pick it.

- Shape: `<type>/<kebab-case-slug>`, with `feat/`, `fix/`, `docs/`, or `chore/`.
- The three differ in scope or approach, so the user picks a granularity, not a synonym.
- Name the change, not the mechanics: `docs/domain-md-convention`, not `docs/edit-agents-md`.
- Wait for the pick: create that branch and then start the work; on "no", stay where you are.
