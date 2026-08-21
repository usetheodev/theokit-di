#!/usr/bin/env node
// Public-API documentation coverage, asked of the TypeScript compiler over the PUBLISHED
// declarations — the same question a consumer's editor asks when it renders a tooltip, and the
// same question an agent asks when it has only the package to work from.
//
// WHY THE COMPILER AND NOT A REGEX. `getExportsOfModule` gives the real export list, with aliases
// followed to the declaration they point at, and `getDocumentationComment` says which of them a
// reader actually gets text for. Counting `/**` occurrences answers a different question and
// disagrees with this one by tens of points.
//
// WHY THE EMIT AND NOT THE SOURCE. A docblock in the source is not documentation until it survives
// the build. `stripInternal` removes a declaration outright when the literal `@internal` appears in
// any leading comment range, and the declaration rollup drops or relocates comments on its own. The
// file a consumer installs is the only one whose documentation is real.
//
// EVERY PUBLISHED ENTRY, FROM THE MANIFEST. The entry list comes from `exports`, never from a walk
// of `dist/` — see the header of lib/published-entries.mjs for the two times reading the disk lost
// an entry here. One of this repository's four published entries is a subpath,
// `@theokit/orm/schema-export`, and it is the polyglot surface: a Python or Go consumer generating
// models from the emitted JSON Schema reaches it before anything else.
//
// BOTH MODULE FORMATS. These packages publish dual ESM + CJS, so a consumer on `require` reads a
// `.d.cts` this gate would otherwise never open. Rather than assume the two agree, `sameSurface`
// classifies both and fails naming any symbol that differs. It compares the CLASSIFICATION, not the
// bytes: identical files are a stronger claim than the premise needs, and a gate that goes red on a
// per-format banner or a reordered declaration is a gate someone silences with an exception.
//
// A DOCBLOCK WHOSE FIRST LINE BEGINS WITH `@` IS PARSED AS A TAG, and the whole block becomes that
// tag's value: `/** @theokit/orm — ... */` yields no documentation at all and invents a tag named
// `theokit`. The comment is plainly visible in the `.d.ts` and reaches no reader. That shape is
// reported separately, because "you wrote documentation and got none" needs a different sentence
// than "you wrote none".
//
// A SYMBOL THIS REPOSITORY ONLY FORWARDS IS NOT THIS REPOSITORY'S TO DOCUMENT. The compiler follows
// an alias and reads the documentation of the DECLARATION, so a docblock written on a re-export
// line reaches nobody. Those are counted separately and listed on every run.
//
// THE FLOOR IS A RATCHET, NOT A TARGET. Raise it when the number rises; never lower it to make a
// run pass. A symbol that cannot be documented is a symbol that should not be exported.
//
// Usage: node tools/check-doc-coverage.mjs [--list <package-or-specifier>]

import { createRequire } from "node:module";
import { join } from "node:path";
import { publishedPackages, ROOT } from "./lib/published-entries.mjs";

const LABEL = "doc-coverage";
const ts = createRequire(import.meta.url)(join(ROOT, "node_modules/typescript"));

/**
 * Minimum share of published exports carrying documentation, per entry.
 *
 * 100 because that is what was measured here after documenting the 65 exports this gate first
 * surfaced (117/117, up from 52/117 = 44.4%). The number came from the measurement, not from a
 * target chosen in advance.
 *
 * It is a ratchet: raise it when the number rises, never lower it to make a run pass. A symbol that
 * cannot be documented is a symbol that should not be exported — with the one exception this gate
 * counts separately, a symbol whose declaration lives in a dependency.
 */
const FLOOR_PERCENT = 100;

const listIndex = process.argv.indexOf("--list");
const LIST = listIndex === -1 ? undefined : process.argv[listIndex + 1];

/** JSDoc tags TypeScript legitimately recognises. A first-line tag outside this set is prose the
 *  author did not mean as a tag — most often a package specifier. */
const KNOWN_TAGS = new Set([
  "param",
  "returns",
  "return",
  "throws",
  "example",
  "see",
  "deprecated",
  "internal",
  "public",
  "remarks",
  "defaultValue",
  "typeParam",
  "template",
  "since",
  "beta",
  "alpha",
  "experimental",
  "override",
  "readonly",
  "packageDocumentation",
  "module",
]);

/** Where one exported symbol lands: documented, undocumented, documented-and-swallowed, forwarded. */
function classify(symbol, checker) {
  const target = symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
  const declaredIn = target.getDeclarations()?.[0]?.getSourceFile().fileName;
  if (declaredIn?.includes("/node_modules/")) {
    // pnpm stores every package under `.pnpm/<pkg>@<hash>/node_modules/<pkg>`, so the FIRST
    // `node_modules/` segment names the store, not the package. Take the last one.
    const segments = declaredIn.split("/node_modules/");
    const from = /^((?:@[^/]+\/)?[^/]+)/.exec(segments[segments.length - 1])?.[1] ?? "a dependency";
    return { kind: "forwarded", from };
  }
  const text = target
    .getDocumentationComment(checker)
    .map((part) => part.text)
    .join("")
    .trim();
  if (text.length > 0) return { kind: "documented" };
  // No documentation reached the reader. Distinguish "none written" from "written and swallowed":
  // a block whose first tag is not one TypeScript knows was prose the author expected to be read.
  const invented = (target.getJsDocTags(checker) ?? []).find((tag) => !KNOWN_TAGS.has(tag.name));
  return invented === undefined
    ? { kind: "undocumented" }
    : { kind: "swallowed", tag: invented.name };
}

/** Documentation status of every export of one declaration file. */
function inspect(declPath) {
  const program = ts.createProgram([declPath], {
    noEmit: true,
    skipLibCheck: true,
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
  });
  const source = program.getSourceFile(declPath);
  if (source === undefined) return undefined;
  const checker = program.getTypeChecker();
  const moduleSymbol = checker.getSymbolAtLocation(source);
  if (moduleSymbol === undefined) return undefined;

  const out = { documented: [], undocumented: [], swallowed: [], forwarded: [] };
  for (const symbol of checker.getExportsOfModule(moduleSymbol)) {
    const name = symbol.getName();
    const verdict = classify(symbol, checker);
    if (verdict.kind === "documented") out.documented.push(name);
    else if (verdict.kind === "forwarded") out.forwarded.push({ name, from: verdict.from });
    else if (verdict.kind === "undocumented") out.undocumented.push(name);
    else out.swallowed.push({ name, tag: verdict.tag });
  }
  return out;
}

/** One symbol-to-verdict map, so the two module formats can be compared symbol by symbol. */
function verdictMap(result) {
  const map = new Map();
  for (const name of result.documented) map.set(name, "documented");
  for (const name of result.undocumented) map.set(name, "undocumented");
  for (const item of result.swallowed) map.set(item.name, "swallowed");
  for (const item of result.forwarded) map.set(item.name, "forwarded");
  return map;
}

/**
 * Differences between the ESM and CJS surfaces of one entry, as sentences.
 *
 * Reporting one surface is only honest while the other says the same thing. This compares what the
 * gate actually claims — the classification per symbol — so a cosmetic difference in the emit stays
 * green and a symbol documented in one format but not the other goes red by name.
 */
function surfaceDifferences(esm, cjs) {
  const a = verdictMap(esm);
  const b = verdictMap(cjs);
  const problems = [];
  for (const [name, verdict] of a) {
    if (!b.has(name)) problems.push(`${name}: exported from ESM only`);
    else if (b.get(name) !== verdict)
      problems.push(`${name}: ${verdict} in ESM, ${b.get(name)} in CJS`);
  }
  for (const name of b.keys()) if (!a.has(name)) problems.push(`${name}: exported from CJS only`);
  return problems;
}

const rows = [];
const mismatched = [];
let failedToRead = 0;

for (const pkg of publishedPackages()) {
  if (!pkg.built) {
    console.error(`[${LABEL}] x ${pkg.name}: declared entries missing from dist/ — run pnpm build`);
    failedToRead += 1;
    continue;
  }
  for (const entry of pkg.entries) {
    const result = inspect(entry.decl);
    if (result === undefined) {
      console.error(
        `[${LABEL}] x ${entry.specifier}: the compiler could not read the published entry`,
      );
      failedToRead += 1;
      continue;
    }
    if (entry.declCjs !== undefined) {
      const cjs = inspect(entry.declCjs);
      if (cjs === undefined) {
        console.error(`[${LABEL}] x ${entry.specifier}: the compiler could not read the CJS entry`);
        failedToRead += 1;
        continue;
      }
      const problems = surfaceDifferences(result, cjs);
      if (problems.length > 0) mismatched.push({ specifier: entry.specifier, problems });
    }
    const total = result.documented.length + result.undocumented.length + result.swallowed.length;
    rows.push({ name: entry.specifier, total, ...result });
  }
}

if (failedToRead > 0) {
  console.error(
    `[${LABEL}] FAIL — ${failedToRead} entr(ies) could not be read; nothing was measured for them.`,
  );
  process.exit(2);
}

if (LIST !== undefined) {
  const matches = rows.filter(
    (e) => e.name === LIST || e.name.startsWith(`${LIST}/`) || e.name.endsWith(`/${LIST}`),
  );
  if (matches.length === 0) {
    console.error(`[${LABEL}] x no published entry matching ${LIST}`);
    process.exit(2);
  }
  for (const row of matches) {
    console.log(`${row.name} — ${row.documented.length}/${row.total} documented`);
    for (const name of row.undocumented.sort()) console.log(`  undocumented  ${name}`);
    for (const item of row.swallowed)
      console.log(`  swallowed     ${item.name} (parsed as @${item.tag})`);
    for (const item of row.forwarded)
      console.log(`  forwarded     ${item.name} (declared in ${item.from})`);
  }
  process.exit(0);
}

const totalExports = rows.reduce((sum, row) => sum + row.total, 0);
const totalDocumented = rows.reduce((sum, row) => sum + row.documented.length, 0);
const overall = totalExports === 0 ? 0 : (totalDocumented / totalExports) * 100;

for (const row of rows.sort((a, b) => a.name.localeCompare(b.name))) {
  const percent = row.total === 0 ? 100 : (row.documented.length / row.total) * 100;
  const mark = percent >= FLOOR_PERCENT ? "ok" : "x ";
  console.log(
    `[${LABEL}] ${mark} ${row.name.padEnd(30)} ${row.documented.length.toString().padStart(3)}/${row.total.toString().padEnd(3)} ${percent.toFixed(1).padStart(5)}%`,
  );
}

const below = rows.filter(
  (row) => row.total > 0 && (row.documented.length / row.total) * 100 < FLOOR_PERCENT,
);
const swallowedRows = rows.filter((row) => row.swallowed.length > 0);

console.log(
  `\n[${LABEL}] overall ${totalDocumented}/${totalExports} = ${overall.toFixed(1)}% (floor ${FLOOR_PERCENT}%)`,
);

const forwardedRows = rows.filter((row) => row.forwarded.length > 0);
if (forwardedRows.length > 0) {
  const count = forwardedRows.reduce((sum, row) => sum + row.forwarded.length, 0);
  console.log(
    `\n[${LABEL}] i ${count} export(s) forwarded from a dependency — outside the denominator:`,
  );
  for (const row of forwardedRows) {
    for (const item of row.forwarded)
      console.log(`      ${row.name}: ${item.name} (declared in ${item.from})`);
  }
  console.log("  Not a pass and not a failure: the declaration is not in this repository, so no");
  console.log("  docblock written here would reach a reader.");
}

if (mismatched.length > 0) {
  console.error(`\n[${LABEL}] x the two module formats do not describe the same surface:`);
  for (const entry of mismatched) {
    for (const problem of entry.problems) console.error(`      ${entry.specifier}: ${problem}`);
  }
  console.error("  One surface is reported on the premise that the other says the same thing.");
}

if (swallowedRows.length > 0) {
  console.error(
    `\n[${LABEL}] x documentation written and swallowed — a first-line @tag ate the block:`,
  );
  for (const row of swallowedRows) {
    for (const item of row.swallowed)
      console.error(`      ${row.name}: ${item.name} (parsed as @${item.tag})`);
  }
  console.error(
    "  Start the block with prose; a specifier like `@theokit/orm` on the first line is",
  );
  console.error("  read as a tag name and the text reaches no reader.");
}

if (below.length > 0) {
  console.error(`\n[${LABEL}] FAIL — ${below.length} entr(ies) below the ${FLOOR_PERCENT}% floor:`);
  for (const row of below) {
    console.error(`      ${row.name} — run: node tools/check-doc-coverage.mjs --list ${row.name}`);
  }
}

if (below.length > 0 || swallowedRows.length > 0 || mismatched.length > 0) process.exit(1);
console.log(`[${LABEL}] PASS — every published entry is at or above the ${FLOOR_PERCENT}% floor.`);
