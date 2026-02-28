# claude-astro-lsp

Astro code intelligence for [Claude Code](https://claude.com/claude-code). Ships two plugins from one marketplace:

| Plugin | What | Memory | Install |
|--------|------|--------|---------|
| **`astro-check`** | On-demand diagnostics via `/astro-check:check` | 0 (runs and exits) | Always enabled |
| **`astro-lsp`** | Full language server — real-time diagnostics, go-to-definition, references | ~400MB | Opt-in for heavy sessions |

## Install

```bash
# Add the marketplace
/plugin marketplace add ricardo-nth/claude-astro-lsp

# Install the lightweight check skill (recommended)
/plugin install astro-check@claude-astro-lsp

# Optionally install the full LSP (disabled by default)
/plugin install astro-lsp@claude-astro-lsp
```

## Usage

### `/astro-check:check` (recommended)

Runs `astro check` on demand — catches type errors, missing imports, and invalid syntax across `.astro` and `.ts` files. No persistent process.

```
/astro-check:check
```

You can also add this to your project's `CLAUDE.md` for automatic use:

```markdown
After editing `.astro` files, run `pnpm astro check` before considering the task complete.
```

### Full LSP (heavy sessions)

For sessions with lots of `.astro` edits where you want real-time diagnostics after every edit:

```bash
/plugin enable astro-lsp@claude-astro-lsp   # requires restart
/plugin disable astro-lsp@claude-astro-lsp  # when done
```

The LSP uses a Node.js proxy that auto-resolves `typescript.tsdk` from your project (npm, yarn, pnpm, or global installs).

## Prerequisites

- [Claude Code](https://claude.com/claude-code) v1.0.33+
- An [Astro](https://astro.build) project
- For full LSP mode: [`@astrojs/language-server`](https://github.com/withastro/language-tools) globally installed

```bash
npm install -g @astrojs/language-server
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `astro-ls: command not found` | Install `@astrojs/language-server` globally |
| `Could not resolve typescript` | Install `typescript` in your project or globally |
| High memory (~400MB) | Disable `astro-lsp`, use `/astro-check:check` instead |
| Plugin not loading | `/plugin` → Errors tab |

## License

MIT
