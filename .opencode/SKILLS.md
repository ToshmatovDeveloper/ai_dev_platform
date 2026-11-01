# Agent skills

Project skills in `.opencode/skills/` are copied from
[mattpocock/skills](https://github.com/mattpocock/skills).

- Source commit: `4ae2317ddb22b046e26455e4f9c9b3aaaf62212d` (2026-10-31)
- Installed: 2026-11-01
- Scope: `skills/engineering` and `skills/productivity` only. No plugins, no global install.
- `mattpocock/skills` skill `setup-matt-pocock-skills` is installed but **not run**: the issue tracker
  and domain-doc layout are not configured yet.

## Update

Re-copy the directories from a fresh clone of the upstream repo, then update the commit above.

```sh
git clone --depth 1 https://github.com/mattpocock/skills "$TMP/mattpocock-skills"
```

Copy every directory from `skills/engineering` and `skills/productivity` into `.opencode/skills/`.
