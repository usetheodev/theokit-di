#!/usr/bin/env node
// Orphaned-docblock gate: a JSDoc block whose next content is ANOTHER JSDoc block.
//
// TypeScript attaches a docblock to the declaration that follows it. When a second block intervenes,
// the first attaches to nothing: the symbol it was written for ships undocumented, and the text
// itself becomes invisible — present in the source, absent from every editor tooltip and from the
// published declaration. `tsc` accepts the shape without a word, which is why it accumulates.
//
// It is an editing accident, not a style choice. Two shapes produce it: a declaration MOVES to
// another module and its docblock is left behind, or a new declaration+docblock is INSERTED between
// an existing docblock and its declaration, stranding the older text.
//
// THE PATTERN'S BODY MUST NOT CONTAIN `*/`. A non-greedy `[\s\S]*?\*\/` backtracks: when the
// lookahead fails right after the first `*/`, the engine extends the body to a LATER `*/` that
// satisfies it, so every docblock matches every later docblock across whole declarations.
//
// WHAT THIS CANNOT SEE: an orphan that exists only in the EMIT. The declaration rollup re-anchors a
// module header onto whichever export lands next, and a header whose first line begins with `@` is
// then parsed as a tag and swallowed. Nothing is wrong in the source, so nothing here can fire —
// and pointing at a line in `dist/` that nobody can edit would not help anyway.
// `check-doc-coverage.mjs` catches the consequence, because it reads the emit and reports both the
// undocumented symbol and the swallowed block.
//
// A block at file offset 0 is a module header legitimately preceding the first symbol's docblock and
// is excluded. A header that is NOT at offset 0 still reports, correctly: it is competing for
// attachment, and the fix is to write it as a non-JSDoc comment so it stops competing.

import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { ROOT } from "./lib/published-entries.mjs";

const LABEL = "doc-orphans";

/** A JSDoc block, then only whitespace, then another JSDoc block. */
const ORPHAN = /\/\*\*(?:[^*]|\*(?!\/))*\*\/[ \t]*\r?\n\s*(?=\/\*\*)/g;

/** Hand-written TypeScript under `packages/`: no build output, no generated declarations. */
function sources() {
  const packages = join(ROOT, "packages");
  const files = [];
  for (const entry of readdirSync(packages, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile()) continue;
    if (!/\.tsx?$/.test(entry.name) || entry.name.endsWith(".d.ts")) continue;
    const path = join(entry.parentPath, entry.name);
    // Any hidden segment is scratch, not source: a mutation run or a probe directory holds a full
    // copy of a package, and reporting a finding twice from a directory that will be deleted is how
    // a gate loses the reader's trust in the findings that are real. Node 22's recursive walk does
    // not skip dotted directories on its own.
    const parts = relative(packages, path).split("/");
    if (parts.some((part) => part.startsWith(".") || part === "node_modules" || part === "dist")) {
      continue;
    }
    files.push(path);
  }
  return files.sort();
}

const findings = [];
for (const file of sources()) {
  const text = readFileSync(file, "utf8");
  for (const match of text.matchAll(ORPHAN)) {
    if (match.index === 0) continue;
    const firstText =
      match[0].split("\n").find((line) => /\*\s*\S/.test(line) && !/^\s*\/\*\*/.test(line)) ?? "";
    findings.push({
      file: relative(ROOT, file),
      line: text.slice(0, match.index).split("\n").length,
      text: firstText.replace(/^\s*\*\s?/, "").slice(0, 96),
    });
  }
}

if (findings.length === 0) {
  console.log(`[${LABEL}] PASS — no docblock is stranded above another docblock.`);
  process.exit(0);
}

console.error(`[${LABEL}] x ${findings.length} orphaned docblock(s):`);
for (const finding of findings) {
  console.error(`      ${finding.file}:${finding.line}  ${finding.text}`);
}
console.error("");
console.error(`[${LABEL}] FAIL — each of these attaches to nothing, so the symbol it was written`);
console.error("  for ships undocumented and the text ships invisible.");
console.error("  Fix by intent, not mechanically: move the block onto the symbol it describes;");
console.error("  delete it when the block below is the newer, correct version; or write it as a");
console.error("  non-JSDoc comment when it is a section or module header.");
process.exit(1);
