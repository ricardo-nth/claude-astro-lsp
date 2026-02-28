#!/usr/bin/env node

// LSP proxy for astro-ls that auto-resolves typescript.tsdk from the project.
// The Astro language server requires typescript.tsdk as an init option but
// Claude Code's .lsp.json is static JSON — no dynamic resolution. This proxy
// intercepts the LSP `initialize` request, injects the correct tsdk path
// based on the project's rootUri, then pipes everything through transparently.

import { spawn } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const child = spawn("astro-ls", ["--stdio"], {
  stdio: ["pipe", "pipe", "inherit"],
});

child.on("error", (err) => {
  process.stderr.write(`[astro-lsp] Failed to start astro-ls: ${err.message}\n`);
  process.exit(1);
});

child.stdout.pipe(process.stdout);
child.on("exit", (code) => process.exit(code ?? 1));
process.on("SIGTERM", () => child.kill("SIGTERM"));
process.on("SIGINT", () => child.kill("SIGINT"));

// Buffer incoming data to intercept the first LSP message (initialize request).
let buffer = Buffer.alloc(0);
let intercepted = false;

process.stdin.on("data", (chunk) => {
  if (intercepted) {
    child.stdin.write(chunk);
    return;
  }

  buffer = Buffer.concat([buffer, chunk]);

  // LSP messages: "Content-Length: N\r\n\r\n{...}"
  const headerEnd = buffer.indexOf("\r\n\r\n");
  if (headerEnd === -1) return;

  const header = buffer.subarray(0, headerEnd).toString();
  const match = header.match(/Content-Length:\s*(\d+)/i);
  if (!match) {
    // Not a valid LSP message — pass through and stop intercepting.
    intercepted = true;
    child.stdin.write(buffer);
    buffer = Buffer.alloc(0);
    return;
  }

  const contentLength = parseInt(match[1], 10);
  const bodyStart = headerEnd + 4;
  const totalLength = bodyStart + contentLength;

  if (buffer.length < totalLength) return; // Wait for full message.

  const body = buffer.subarray(bodyStart, totalLength).toString();
  const remainder = buffer.subarray(totalLength);
  intercepted = true;

  let msg;
  try {
    msg = JSON.parse(body);
  } catch {
    // Parse failed — forward as-is.
    child.stdin.write(buffer);
    buffer = Buffer.alloc(0);
    return;
  }

  if (msg.method === "initialize") {
    const tsdk = resolveTsdk(msg.params);
    if (tsdk) {
      msg.params ??= {};
      msg.params.initializationOptions ??= {};
      msg.params.initializationOptions.typescript ??= {};
      msg.params.initializationOptions.typescript.tsdk = tsdk;
      process.stderr.write(`[astro-lsp] Resolved tsdk: ${tsdk}\n`);
    } else {
      process.stderr.write(`[astro-lsp] Warning: Could not resolve typescript. Astro LS may fail.\n`);
    }
  }

  const patched = JSON.stringify(msg);
  const out = `Content-Length: ${Buffer.byteLength(patched)}\r\n\r\n${patched}`;
  child.stdin.write(out);

  if (remainder.length > 0) {
    child.stdin.write(remainder);
  }
  buffer = Buffer.alloc(0);
});

process.stdin.on("end", () => child.stdin.end());

/**
 * Resolve the path to typescript/lib from the project root.
 * Tries (in order):
 * 1. Project node_modules/typescript/lib (npm/yarn)
 * 2. Project node_modules/.pnpm/typescript@*/node_modules/typescript/lib (pnpm)
 * 3. require.resolve from the project root
 * 4. Global typescript
 */
function resolveTsdk(params) {
  const rootUri = params?.rootUri || params?.rootPath;
  const projectRoot = rootUri?.startsWith("file://")
    ? fileURLToPath(rootUri)
    : rootUri;

  const candidates = [];

  if (projectRoot) {
    // Standard node_modules (npm/yarn)
    candidates.push(join(projectRoot, "node_modules", "typescript", "lib"));

    // pnpm: search the .pnpm directory for typescript
    const pnpmDir = join(projectRoot, "node_modules", ".pnpm");
    if (existsSync(pnpmDir)) {
      try {
        const entries = readdirSync(pnpmDir);
        const tsEntry = entries.find((e) => e.startsWith("typescript@"));
        if (tsEntry) {
          candidates.push(
            join(pnpmDir, tsEntry, "node_modules", "typescript", "lib")
          );
        }
      } catch {
        // Ignore — will try other candidates.
      }
    }
  }

  // Global: try common locations
  const globalPaths = [
    // pnpm global
    join(
      process.env.HOME || "",
      ".config/pnpm-global/5/node_modules/typescript/lib"
    ),
    // Homebrew node
    "/opt/homebrew/lib/node_modules/typescript/lib",
    "/usr/local/lib/node_modules/typescript/lib",
    // npm global (Linux)
    "/usr/lib/node_modules/typescript/lib",
  ];
  candidates.push(...globalPaths);

  for (const candidate of candidates) {
    if (
      existsSync(join(candidate, "tsserverlibrary.js")) ||
      existsSync(join(candidate, "typescript.js"))
    ) {
      return candidate;
    }
  }

  return null;
}

