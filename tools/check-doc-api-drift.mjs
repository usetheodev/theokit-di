#!/usr/bin/env node
// Documentation-vs-API drift gate.
//
// Every README in this repository opens by telling a consumer to write an import. Nothing checked
// that the names in those imports exist. A published example that does not compile is a first
// impression, and it is the cheapest way there is to lose a reader who was about to try the thing.
//
// THE ORACLE IS THE COMPILER, NOT A REGEX OVER `.d.ts` TEXT. Matching names is exactly what fails
// here: an export can be written in a form a hand-rolled parser does not read, and the parser then
// reports a real export as missing. Each `import { ... } from "..."` found in a tracked markdown
// file becomes a generated probe; `tsc --noEmit` says which names do not resolve, and each
// diagnostic is mapped back to the artifact and line that claimed it.
//
// WORKSPACE SPECIFIERS ARE RESOLVED BY AN EXPLICIT `paths` MAP, NOT BY WHERE THE PROBE STANDS. No
// package here self-links — `@theokit/di` does not depend on itself, and `@theokit/orm` links
// `@theokit/di` but not the reverse — so standing the probe in the document's own package would
// leave a package's own README unable to resolve the package it documents. The map is built from
// each package's own `exports` field and points at the emitted declarations, which is the same file
// a consumer installs.
//
// EXTERNAL SPECIFIERS ARE CHECKED WHERE THE READER STANDS. `@theokit/sdk`, `drizzle-orm` and
// `better-sqlite3` are versioned dependencies of ONE package each — the SDK of `@theokit/di-agent`,
// the other two of `@theokit/orm` — so a probe is compiled from inside the package that owns the
// document, falling back to the repository root. An external the workspace does not install at all
// is out of scope and counted, not failed: this repository does not choose what a reader installs.
//
// "COULD NOT CHECK" IS NOT "IS WRONG". A module that fails to RESOLVE (TS2307) says the probe stood
// in the wrong place; a name missing from a module that did resolve (TS2305/TS2724) says the
// documentation is wrong. They are reported apart, and an unresolvable WORKSPACE module fails the
// run as a broken gate (exit 2) rather than as a documentation defect.
//
// WHAT A DOCUMENT INSTRUCTS vs WHAT IT RECORDS. A `CHANGELOG.md` entry that says a symbol was
// removed names that symbol on purpose, and so does the `-` side of a ```diff migration block: both
// describe a past state a reader is being moved AWAY from. Checking them would report the record as
// a defect and pressure someone into rewriting history to make a gate green — and this repository's
// own lint gate already holds released changelog entries immutable for the same reason. Only the
// instruction half is checked, which is where a reader can still be sent somewhere that does not
// exist.
//
// A DEFERRED FINDING IS STILL PRINTED. `doc-api-drift-allowlist.txt` lets a name that cannot be
// fixed in this pass carry a mandatory sunset instead of holding the run red forever. That is not
// the same as hiding it: every deferred name is listed with its date on every run, an entry whose
// date has passed re-fires at full severity, and a malformed entry aborts the run. The reason the
// mechanism exists at all is that a gate which is red BY DESIGN stops being read, and then misses
// the next real drift — the whole reason it was built.
//
// This reads the PUBLISHED declarations, so `pnpm build` must have run first.

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { publishedPackages, publishedSpecifiers, ROOT } from "./lib/published-entries.mjs";

const ALLOWLIST = join(ROOT, "tools", "doc-api-drift-allowlist.txt");

const LABEL = "doc-api-drift";
const PROBE_DIRNAME = ".doc-probes";
const TODAY = new Date().toISOString().slice(0, 10);

/**
 * @returns {{active: Map<string, {sunset: string, rationale: string}>, expired: Array}} deferrals
 * keyed `specifier\u0000name`. A malformed line throws: an exemption nobody can parse must not read
 * as an exemption nobody needed.
 */
function deferrals() {
  const active = new Map();
  const expired = [];
  if (!existsSync(ALLOWLIST)) return { active, expired };
  for (const [index, raw] of readFileSync(ALLOWLIST, "utf8").split("\n").entries()) {
    const entry = parseDeferral(raw, index + 1);
    if (entry === undefined) continue;
    if (entry.sunset < TODAY) expired.push(entry);
    else active.set(`${entry.specifier}\u0000${entry.name}`, entry);
  }
  return { active, expired };
}

/** One allowlist line, or `undefined` when it is blank or a comment. Exits 2 when it is malformed. */
function parseDeferral(raw, lineNumber) {
  const line = raw.trim();
  if (line.length === 0 || line.startsWith("#")) return undefined;
  const parts = line.split("|").map((part) => part.trim());
  if (parts.length < 4 || !/^\d{4}-\d{2}-\d{2}$/.test(parts[2])) {
    console.error(`[${LABEL}] x malformed allowlist entry at line ${lineNumber}: ${line}`);
    console.error("  Expected: SPECIFIER | NAME | SUNSET (YYYY-MM-DD) | RATIONALE");
    process.exit(2);
  }
  const [specifier, name, sunset, ...rest] = parts;
  return { specifier, name, sunset, rationale: rest.join(" | ") };
}

/** `import { A, type B } from "pkg"` — the shape every README example uses. */
const IMPORT = /import\s+(?:type\s+)?\{([^}]+)\}\s+from\s+["']([^"'\n]+)["']/g;

/** Tracked markdown that INSTRUCTS a reader. Changesets and changelogs record releases instead. */
function documentationFiles() {
  return execFileSync("git", ["ls-files", "*.md"], { cwd: ROOT, encoding: "utf8" })
    .split("\n")
    .filter(
      (path) =>
        path.length > 0 && !path.startsWith(".changeset/") && !path.endsWith("CHANGELOG.md"),
    );
}

/** Blank the removed side of every ```diff block: it names the API the reader is moving away from. */
function withoutRemovedLines(text) {
  return text.replace(/```diff\r?\n[\s\S]*?```/g, (block) =>
    block
      .split("\n")
      .map((line) => (/^-(?!--)/.test(line) ? "" : line))
      .join("\n"),
  );
}

/** Every documented import of a package, with the artifact and line that claims it. */
function documentedImports() {
  const claims = [];
  for (const file of documentationFiles()) {
    const text = withoutRemovedLines(readFileSync(join(ROOT, file), "utf8"));
    for (const match of text.matchAll(IMPORT)) {
      const claim = claimOf(file, text, match);
      if (claim !== undefined) claims.push(claim);
    }
  }
  return claims;
}

/** One documented import, or `undefined` when there is no published API behind it to drift. */
function claimOf(file, text, match) {
  const specifier = match[2];
  // Relative paths belong to the reader's own tree; `node:` builtins belong to the runtime.
  // Neither is a published API this repository or its dependencies can drift against.
  if (specifier.startsWith(".") || specifier.startsWith("/") || specifier.startsWith("node:")) {
    return undefined;
  }
  const names = match[1]
    .split(",")
    .map((name) => name.trim().replace(/^type\s+/, ""))
    .filter((name) => /^[A-Za-z_$][\w$]*$/.test(name));
  if (names.length === 0) return undefined;
  return { file, line: text.slice(0, match.index).split("\n").length, specifier, names };
}

/** Where a reader of `file` stands: its own package first, then the member that has the most links. */
function resolutionRoot(file) {
  const owner = /^(packages\/[^/]+)\//.exec(file);
  if (owner !== null && existsSync(join(ROOT, owner[1], "node_modules"))) {
    return join(ROOT, owner[1]);
  }
  // No integration workspace here, so the fallback is the repository root, whose `node_modules`
  // holds whatever the workspace hoisted. It is a weaker answer than the owning package and is
  // deliberately only the fallback: an external is checked where the reader of that document
  // actually stands whenever the document belongs to a package.
  return ROOT;
}

/** Whether an external specifier is installed at `root` — walking up as node resolution would. */
function externalResolves(root, specifier) {
  const pkg = specifier.startsWith("@")
    ? specifier.split("/").slice(0, 2).join("/")
    : specifier.split("/")[0];
  for (let dir = root; dir.startsWith(ROOT); dir = join(dir, "..")) {
    if (existsSync(join(dir, "node_modules", pkg, "package.json"))) return true;
    if (dir === ROOT) break;
  }
  return false;
}

const unbuilt = publishedPackages().filter((pkg) => !pkg.built);
if (unbuilt.length > 0) {
  console.error(
    `[${LABEL}] x ${unbuilt.map((pkg) => pkg.name).join(", ")} have no dist/ — run pnpm build`,
  );
  console.error(
    "  Refusing to report: the names would resolve against declarations that do not exist.",
  );
  process.exit(2);
}

const workspace = publishedSpecifiers();
const claims = documentedImports();
if (claims.length === 0) {
  // Not a pass. Every README here opens with an import example; finding none means the extraction
  // broke, and reporting green on that is how a gate starts checking nothing while looking healthy.
  console.error(
    `[${LABEL}] x no documented imports found — the extraction is broken, not the docs`,
  );
  process.exit(2);
}

// `paths` needs entries relative to the probe's tsconfig, which sits at the repository root.
const paths = Object.fromEntries(
  [...workspace].map(([specifier, decl]) => [specifier, [`./${relative(ROOT, decl)}`]]),
);

const outOfScope = [];
const byRoot = new Map();
for (const claim of claims) {
  const isWorkspace = workspace.has(claim.specifier);
  const root = resolutionRoot(claim.file);
  if (!isWorkspace && !externalResolves(root, claim.specifier)) {
    outOfScope.push(claim);
    continue;
  }
  if (!byRoot.has(root)) byRoot.set(root, []);
  byRoot.get(root).push({ ...claim, isWorkspace });
}

const drifted = [];
const notChecked = [];

for (const [root, rootClaims] of byRoot) {
  const probeDir = join(root, PROBE_DIRNAME);
  rmSync(probeDir, { recursive: true, force: true });
  mkdirSync(probeDir, { recursive: true });

  // One probe per claim, so a diagnostic's file name identifies the artifact that made the claim.
  const probes = rootClaims.map((claim, index) => {
    const probe = join(probeDir, `probe-${index}.ts`);
    writeFileSync(
      probe,
      `import type { ${claim.names.join(", ")} } from ${JSON.stringify(claim.specifier)};\n`,
    );
    return { probe, claim };
  });

  writeFileSync(
    join(probeDir, "tsconfig.json"),
    `${JSON.stringify(
      {
        compilerOptions: {
          noEmit: true,
          strict: true,
          skipLibCheck: true,
          target: "es2022",
          module: "esnext",
          moduleResolution: "bundler",
          baseUrl: ROOT,
          paths,
        },
        files: probes.map((entry) => relative(probeDir, entry.probe)),
      },
      null,
      2,
    )}\n`,
  );

  let output = "";
  try {
    execFileSync("npx", ["tsc", "-p", probeDir], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (error) {
    // A failed invocation is not a clean compile.
    if (typeof error.status !== "number") {
      console.error(`[${LABEL}] x tsc could not be run: ${error.message}`);
      console.error(
        "  Refusing to report: a gate that cannot invoke its tool has checked nothing.",
      );
      rmSync(probeDir, { recursive: true, force: true });
      process.exit(2);
    }
    output = `${error.stdout ?? ""}${error.stderr ?? ""}`;
  }

  for (const raw of output.split("\n")) {
    const match = /probe-(\d+)\.ts\(\d+,\d+\): error (TS\d+): (.+)$/.exec(raw.trim());
    if (match === null) continue;
    const entry = probes[Number(match[1])];
    if (entry === undefined) continue;
    if (match[2] === "TS2307") {
      notChecked.push(entry.claim); // the module did not resolve — the probe stood wrong, not the doc
      continue;
    }
    const name = /has no exported member(?: named)? '([^']+)'/.exec(match[3])?.[1];
    drifted.push({ ...entry.claim, name: name ?? entry.claim.names.join(", ") });
  }

  rmSync(probeDir, { recursive: true, force: true });
}

const checked = claims.filter(
  (claim) => !outOfScope.includes(claim) && !notChecked.includes(claim),
);
const checkedNames = checked.reduce((total, claim) => total + claim.names.length, 0);

if (outOfScope.length > 0) {
  // Named per FILE, not per specifier. Whether a package resolves depends on where the reader of
  // that document stands: `drizzle-orm` is linked in `@theokit/orm` and absent from `@theokit/di`,
  // so a report keyed by specifier alone would say "not installed" about something that is, and
  // give nobody a place to go and look.
  console.log(
    `[${LABEL}] i ${outOfScope.length} import(s) not checked — that package is not installed where the document's reader stands:`,
  );
  for (const claim of outOfScope) {
    console.log(`      ${claim.file}:${claim.line} — ${claim.specifier}`);
  }
}

if (notChecked.length > 0) {
  const workspaceGaps = notChecked.filter((claim) => workspace.has(claim.specifier));
  console.error(
    `\n[${LABEL}] x ${notChecked.length} import(s) could not be checked — module unresolvable:`,
  );
  for (const claim of notChecked) {
    console.error(`      ${claim.file}:${claim.line} — ${claim.specifier} did not resolve`);
  }
  console.error(
    "  This is a gap in the gate, not a defect in the documentation. Link the package or teach",
  );
  console.error("  the gate where a reader of that document stands.");
  if (workspaceGaps.length === 0) {
    console.error(
      "  None of these is a workspace package; the published surface was still checked.",
    );
  }
}

const { active: deferred, expired } = deferrals();
const stillOpen = drifted.filter((item) => !deferred.has(`${item.specifier}\u0000${item.name}`));
const carried = drifted.filter((item) => deferred.has(`${item.specifier}\u0000${item.name}`));

if (expired.length > 0) {
  console.error(`\n[${LABEL}] x ${expired.length} allowlist entr(ies) expired — re-firing:`);
  for (const entry of expired) {
    console.error(`      ${entry.specifier} '${entry.name}' — sunset ${entry.sunset} has passed`);
  }
}

if (carried.length > 0) {
  const seen = new Map();
  for (const item of carried) {
    const key = `${item.specifier}\u0000${item.name}`;
    if (!seen.has(key)) seen.set(key, { ...item, count: 0 });
    seen.get(key).count += 1;
  }
  console.log(`\n[${LABEL}] i ${seen.size} documented name(s) deferred with a sunset:`);
  for (const item of seen.values()) {
    const sunset = deferred.get(`${item.specifier}\u0000${item.name}`).sunset;
    console.log(
      `      ${item.specifier} has no '${item.name}' — ${item.count} occurrence(s), sunset ${sunset}`,
    );
  }
  console.log(
    "  Deferred is not fixed. See tools/doc-api-drift-allowlist.txt for why and by when.",
  );
}

const drifted_ = stillOpen;
if (drifted_.length > 0) {
  console.error(`\n[${LABEL}] FAIL — ${drifted_.length} documented name(s) do not exist:`);
  for (const item of drifted_) {
    console.error(`      ${item.file}:${item.line} — ${item.specifier} has no '${item.name}'`);
  }
  console.error("\n  A reader who copies one of these gets code that does not compile.");
}

if (drifted_.length > 0 || expired.length > 0) process.exit(1);
if (notChecked.length > 0) process.exit(2);

const resolved = checkedNames - carried.length;
console.log(
  `[${LABEL}] PASS — ${resolved} of ${checkedNames} documented name(s) across ${
    checked.length
  } import(s) in ${new Set(checked.map((claim) => claim.file)).size} file(s) resolve${
    carried.length > 0 ? `; the other ${carried.length} are deferred above, not resolved.` : "."
  }`,
);
