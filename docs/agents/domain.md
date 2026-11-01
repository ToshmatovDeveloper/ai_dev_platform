# Domain Docs

How the engineering skills consume this repo's domain documentation when exploring the codebase.

## Before exploring, read these

- **`DOMAIN.md`** at the repo root, or
- **`DOMAIN-MAP.md`** at the repo root if it exists: it points at one `DOMAIN.md` per context. Read each one relevant to the topic.
- **`docs/adr/`**: read ADRs that touch the area you're about to work in. In multi-context repos, also check `src/<context>/docs/adr/` for context-scoped decisions.

If any of these files don't exist, **proceed silently**. Don't flag their absence; don't suggest creating them upfront. The `/domain-modeling` skill (reached via `/grill-with-docs` and `/improve-codebase-architecture`) creates them lazily when terms or decisions actually get resolved.

## Layout

This repo is **single-context**:

- `DOMAIN.md` at the repo root — the project vocabulary: terms, definitions, and the synonyms each term rules out.
- `docs/adr/` — architecture decision records, one file per decision.

Multi-context layout is not in use. Adopt it only when the repo splits into separately named contexts: a root `DOMAIN-MAP.md` pointing at one `DOMAIN.md` per context, each with its own `docs/adr/`.

## Use the domain vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in `DOMAIN.md`. Don't drift to synonyms the term entry explicitly avoids.

If the concept you need isn't in `DOMAIN.md` yet, that's a signal: either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/domain-modeling`).

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR-0007 (event-sourced orders), but worth reopening because…_
