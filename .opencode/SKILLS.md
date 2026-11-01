# Agent skills

Project skills are copied from [mattpocock/skills](https://github.com/mattpocock/skills).

- Source commit: `4ae2317ddb22b046e26455e4f9c9b3aaaf62212d` (2026-10-31)
- Installed: 2026-11-01
- Scope: `skills/engineering` and `skills/productivity` only. No plugins, no global install.
- `mattpocock/skills` skill `setup-matt-pocock-skills` is installed but **not run**: the issue tracker
  and domain-doc layout are not configured yet.

## Layout

`.opencode/skills/` is the single source of truth. Each subdirectory is one skill:

```text
.opencode/skills/<skill-id>/SKILL.md
```

`.claude/skills` is a link to `.opencode/skills`, so Claude Code finds the same skills through its
native project discovery path. The link is not committed; recreate it after cloning:

```sh
node scripts/link-project-skills.mjs
```

On Windows the script creates a directory junction, so no admin rights or Developer Mode are needed.
It is idempotent and refuses to replace a real `.claude/skills` directory.

| Agent       | Discovery path       | How it is satisfied            |
| ----------- | -------------------- | ------------------------------ |
| OpenCode    | `.opencode/skills`   | native directory (source)      |
| Claude Code | `.claude/skills`     | junction/symlink to the source |

OpenCode also reads `.claude/skills` as a compatibility source, so it sees the same IDs twice.
That is harmless: `.opencode/skills` has higher precedence, so the copy it loads is the source itself.

## Update

Re-copy the directories from a fresh clone of the upstream repo, then update the commit above.

```sh
git clone --depth 1 https://github.com/mattpocock/skills "$TMP/mattpocock-skills"
```

Copy every directory from `skills/engineering` and `skills/productivity` into `.opencode/skills/`.
Links keep working because the source path does not change.
