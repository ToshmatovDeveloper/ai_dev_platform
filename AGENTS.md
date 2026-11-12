# ai_dev_platform

AI-first development platform. The project brief and customer requirements live in
`customer-requirements(1).md` — read it before planning work.

## Agent skills

### Issue tracker

Create, read, and triage issues and specs. See `docs/agents/issue-tracker.md`.

### Triage labels

Before assigning or removing a triage label, read `docs/agents/triage-labels.md`.

### Domain docs

Before working with domain terms or architecture decisions, read `docs/agents/domain.md`.

### Agent workflow

Before implementation, read `docs/agents/agent-workflow.md`. It defines the explicit start, delivery, and merge rules.

### Human review

Before planning a human check or handing over a result, read `docs/agents/human-review.md`.

### Coding standards

Before a Standards review, read `CODING_STANDARDS.md`.

### Testing

Before you write, change, or review tests, read `docs/agents/testing.md` and `docs/adr/0012-tests-at-public-seams-on-real-infrastructure.md`.

### Setup

After cloning, run `node scripts/link-project-skills.mjs` so Claude Code finds the skills in `.opencode/skills/`.

## Start and authority

Implementation starts only when the owner explicitly selects `implement` or `implement-spec`, including ordinary language that names the skill. If a request names neither, propose the entrypoint and wait for selection. An issue, a `ready-for-agent` label, preparation, or a review comment does not start implementation.

Diagnosis alone does not authorize a fix. Research and prototypes authorize only their agreed scope. Within a started implementation, routine commits, push, PR updates, and confirmed review or CI fixes may proceed. Requirements changes need the owner's decision. Merge authority is defined in `docs/agents/agent-workflow.md`.

## Branches

Ask once per session, right before the first change to files in the repository: an edit, a new
file, or a deletion.

Ask in Russian: «Надо ли создать новую ветку?» — and list three branch names derived from the work
at hand, one per line, each with a one-line reason to pick it.

- Shape: `<type>/<kebab-case-slug>`, with `feat/`, `fix/`, `docs/`, or `chore/`.
- The three differ in scope or approach, so the user picks a granularity, not a synonym.
- Name the change, not the mechanics: `docs/domain-md-convention`, not `docs/edit-agents-md`.
- Wait for the pick: create that branch, then make the change; on "no", stay where you are.

A global copy of this rule lives at `~/.codex/AGENTS.md`. Keep both copies in sync.
