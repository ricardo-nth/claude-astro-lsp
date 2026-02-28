---
name: check
description: Run Astro diagnostics on the project. Use when working with .astro files and you need to check for type errors, missing imports, or invalid syntax. Lightweight alternative to the full LSP — runs on demand with zero persistent memory cost.
disable-model-invocation: true
---

# Astro Check

Run `astro check` to get diagnostics for all `.astro` and `.ts` files in the project.

## Instructions

1. Detect the package manager by checking for lock files in the project root:
   - `pnpm-lock.yaml` → `pnpm exec astro check`
   - `yarn.lock` → `yarn astro check`
   - `bun.lockb` → `bun run astro check`
   - `package-lock.json` or fallback → `npx astro check`

2. Run the check command from the project root.

3. If there are errors, analyze the output and fix them. If $ARGUMENTS contains specific file paths, focus on errors in those files.

4. If there are no errors, confirm the project is clean.

## Notes

- This is a **zero-cost alternative** to the full Astro LSP plugin. No persistent language server process — just runs the check and exits.
- `astro check` uses the Astro compiler and TypeScript under the hood, catching the same errors the LSP would.
- For heavy editing sessions where you want persistent real-time diagnostics instead, enable the full LSP: `/plugin enable astro-lsp@claude-astro-lsp` (requires session restart).
