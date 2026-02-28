# claude-astro-lsp

Astro language server plugin for [Claude Code](https://claude.com/claude-code). Gives Claude real-time code intelligence for `.astro` files — instant diagnostics after edits, go-to-definition, find references, and type information.

## Prerequisites

- [Claude Code](https://claude.com/claude-code) v1.0.33+
- [`@astrojs/language-server`](https://github.com/withastro/language-tools) installed globally:

```bash
# Pick your package manager
npm install -g @astrojs/language-server
pnpm add -g @astrojs/language-server
```

- TypeScript available (project `node_modules` or global install)

## Install

```bash
# Add the marketplace
/plugin marketplace add ricardo-nth/claude-astro-lsp

# Install the plugin
/plugin install astro-lsp@claude-astro-lsp
```

## How it works

The Astro language server requires a `typescript.tsdk` initialization option pointing to TypeScript's `lib` directory. Unlike VS Code or Neovim, Claude Code's LSP config is static JSON with no dynamic resolution.

This plugin uses a lightweight Node.js proxy (~90 lines) that intercepts the LSP `initialize` request and auto-resolves `tsdk` from your project. It checks (in order):

1. `node_modules/typescript/lib` (npm/yarn)
2. `node_modules/.pnpm/typescript@*/node_modules/typescript/lib` (pnpm)
3. Global pnpm install (`~/.config/pnpm-global/`)
4. Homebrew / system Node.js global installs

All other LSP messages pass through transparently with zero overhead.

## What Claude gains

Once installed, Claude gets two capabilities for `.astro` files:

- **Automatic diagnostics** — after every edit, the language server reports errors and warnings. Claude sees type errors, missing imports, and invalid Astro syntax without running a build.
- **Code navigation** — jump to definitions, find references, and hover for type info across `.astro` files.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `astro-ls: command not found` | Install `@astrojs/language-server` globally |
| `Could not resolve typescript` | Install `typescript` in your project or globally |
| Plugin not loading | Run `/plugin` → Errors tab to check for details |

## License

MIT
