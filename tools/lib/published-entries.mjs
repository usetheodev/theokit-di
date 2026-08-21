// The published declaration entries of every workspace package, resolved ONE way.
//
// Both documentation gates need this list and they must agree: the coverage gate measures what a
// consumer's editor can read, and the drift gate resolves the specifiers documentation tells that
// consumer to write. If the two disagreed about which files are published, a green run from either
// would mean something narrower than it claims.
//
// THE LIST COMES FROM THE MANIFEST, NEVER FROM THE DISK. That is the whole design, and it is
// written here because reading the disk instead has already cost this repository twice. A first
// measurement walked `packages/*/dist/index.d.ts` and reported 46.0% coverage — it had never seen
// `@theokit/orm/schema-export`, a declared subpath sitting at 0%. Separately, a gate ported from a
// sibling repository read `exports["."].types` and resolved nothing at all here, because these
// packages nest their conditions. A path that is published but unseen is the failure both gates
// exist to prevent, so the `exports` map — the same map a consumer's resolver reads — is the only
// input. An entry cannot be published without the gates seeing it.
//
// BOTH FORMATS. These packages publish dual ESM + CJS: every `.d.ts` has a `.d.cts` beside it, and
// a consumer on `require` reads the second one. They are emitted from the same source and are
// byte-identical today, but that is a fact to verify rather than assume — see `sameSurface` in
// check-doc-coverage.mjs, which compares the CLASSIFIED SYMBOLS of both and fails naming any that
// diverge. Comparing the files byte-for-byte would be a stronger claim than the premise needs, and
// would go red on a per-format banner or a reordered declaration, which is how a gate earns the
// exception that silences it.
//
// `./package.json` is an export subpath but not a declaration, and is dropped.

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

/** Whether a target names a declaration file of either module format. */
function isDeclaration(target) {
  return target.endsWith(".d.ts") || target.endsWith(".d.cts");
}

/**
 * Every declaration target reachable from one `exports` entry, in declaration order.
 *
 * Walks the condition object rather than reading `value.types` off the top, because these packages
 * declare their types INSIDE each condition:
 *
 *     ".": { "import": { "types": "./dist/index.d.ts",  "default": "./dist/index.js"  },
 *            "require": { "types": "./dist/index.d.cts", "default": "./dist/index.cjs" } }
 *
 * A reader that only checks the top level finds `undefined` on every entry of every package here.
 * It does not report a problem — it reports an empty list, which downstream reads as "nothing to
 * check" and passes.
 */
function declarationTargets(value) {
  if (typeof value === "string") return isDeclaration(value) ? [value] : [];
  if (value === null || typeof value !== "object") return [];
  const found = [];
  for (const [condition, nested] of Object.entries(value)) {
    if (condition === "types" && typeof nested === "string" && isDeclaration(nested)) {
      found.push(nested);
      continue;
    }
    found.push(...declarationTargets(nested));
  }
  return found;
}

/** Split the declaration targets of one subpath into the ESM surface and the CJS one. */
function splitByFormat(targets) {
  return {
    esm: targets.find((t) => t.endsWith(".d.ts")),
    cjs: targets.find((t) => t.endsWith(".d.cts")),
  };
}

/**
 * @returns {Array<{name: string, dir: string, entries: Array<{specifier: string, decl: string,
 * declCjs: string | undefined}>, built: boolean}>} one row per workspace package that has a
 * manifest, in directory order.
 *
 * `built` is false when any declared entry is missing from `dist/` — reported by the caller rather
 * than skipped, because a gate whose green can mean "there was nothing to check" is not a gate.
 */
export function publishedPackages() {
  const packagesDir = join(ROOT, "packages");
  const rows = [];
  for (const name of readdirSync(packagesDir).sort()) {
    const dir = join(packagesDir, name);
    const manifest = join(dir, "package.json");
    if (!existsSync(manifest)) continue;
    const meta = JSON.parse(readFileSync(manifest, "utf8"));
    const { entries, built } = entriesOf(meta, dir);
    rows.push({ name: meta.name, dir, entries, built });
  }
  return rows;
}

/** The published entries of one manifest, and whether every declaration they name is on disk. */
function entriesOf(meta, dir) {
  const entries = [];
  let built = true;
  for (const [subpath, value] of Object.entries(meta.exports ?? {})) {
    const entry = entryOf(meta, dir, subpath, value);
    if (entry === undefined) continue;
    if (!entry.present) built = false;
    entries.push({ specifier: entry.specifier, decl: entry.decl, declCjs: entry.declCjs });
  }
  return { entries, built: built && entries.length > 0 };
}

/** One published entry, or `undefined` when the subpath declares no ESM declaration. */
function entryOf(meta, dir, subpath, value) {
  const { esm, cjs } = splitByFormat(declarationTargets(value));
  if (esm === undefined) return undefined;
  const decl = join(dir, esm);
  const declCjs = cjs === undefined ? undefined : join(dir, cjs);
  const present = existsSync(decl) && (declCjs === undefined || existsSync(declCjs));
  const suffix = subpath.replace(/^\.\//, "");
  return {
    specifier: subpath === "." ? meta.name : `${meta.name}/${suffix}`,
    decl,
    declCjs,
    present,
  };
}

/** Every published specifier mapped to the ESM declaration file it resolves to. */
export function publishedSpecifiers() {
  const map = new Map();
  for (const pkg of publishedPackages()) {
    for (const entry of pkg.entries) map.set(entry.specifier, entry.decl);
  }
  return map;
}
