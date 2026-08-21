# Changelog

Changes to the repository itself — licensing, tooling, workflow and
repository-wide sweeps. Changes to a published package are recorded in that
package's own changelog:
[`@theokit/di`](packages/di/CHANGELOG.md),
[`@theokit/di-agent`](packages/di-agent/CHANGELOG.md),
[`@theokit/orm`](packages/orm/CHANGELOG.md).

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Three documentation gates, run together with `pnpm quality:docs`.
  `check-doc-coverage.mjs` asks the TypeScript compiler how much of the PUBLISHED surface
  carries documentation an editor can show, reading the emitted declarations rather than the
  source — a docblock is not documentation until it survives the build. `check-doc-api-drift.mjs`
  compiles every `import { … }` in the tracked Markdown and asks the compiler whether those names
  exist. `check-orphan-docblocks.mjs` finds docblocks stranded above another docblock, which
  attach to nothing and ship invisible.
  The entry list comes from each package's `exports` map, never from a walk of `dist/`: a first
  measurement that read the disk reported 46.0% while never having seen
  `@theokit/orm/schema-export`, a declared subpath sitting at 0%. Both module formats are
  measured, and the gate fails when the ESM and CJS surfaces classify any symbol differently —
  comparing the files byte-for-byte would go red on a per-format banner and earn the exception
  that silences a gate.
  The coverage floor is a ratchet at 100%, which is what was measured here after the pass below. (#24)
- A CI workflow. Until now nothing ran `check`, `typecheck`, `build`, `test` or the documentation
  gates on a pull request — the only workflow that ran at all was the secret scan, which says
  nothing about whether the code compiles. It runs on both promotion legs, and builds before it
  typechecks, because the packages resolve each other through their `exports` map into `dist/`.
  (#20)

- Secret scanning, in two layers: a `pre-commit` hook that scans the staged content
  with TruffleHog and refuses the commit, and a workflow that re-scans the pushed
  range in CI. The hook is what keeps a credential out of the history at all; the
  workflow is what `git commit --no-verify` cannot skip. Confirmed fixtures are
  silenced one line at a time with a `trufflehog:ignore` comment, never by excluding
  a path — an excluded path would also hide a real secret added to that fixture later.
- `LICENSE` at the repository root, Apache-2.0, the same text the three packages
  ship. Without it, default copyright applied to everything outside `packages/`.
- `SECURITY.md` — how to report a vulnerability privately, what is in scope, and
  what to expect back.
- `CONTRIBUTING.md` — the `workspace → develop → main` promotion flow, the four
  commands that gate a change, and the test-first requirement.
- npm provenance on all three packages, so a published tarball can be traced back
  to the commit and workflow that produced it. This needs a public source
  repository, which is why it is on now and was not before.

### Changed

- `CONTRIBUTING.md` lists the gating commands in an order that works. It named four — check,
  typecheck, build, test — which reads as a sequence and is not one: the packages resolve each
  other through their `exports` map into `dist/`, with no `paths` mapping and no `src` fallback,
  so on a fresh clone `typecheck` before `build` fails. A stale `dist/` on a developer machine
  hid it. The documentation gates are listed too, for the same reason. (#24)
- The four actions in the release workflow are pinned by commit SHA instead of by tag.
  `changesets/action@v1` was the sharpest edge: `v1` is not a tag in that repository, it is a
  **branch**, so any push to it changed the code running with `NPM_TOKEN` and `id-token: write` —
  enough to publish signed packages as this organization, with no release and no version bump to
  notice. Each pin carries the version it resolved to, verified against the action's own tags.
  (#20)
- **The repository moved to the official `usetheokit` organization.** Existing clones keep
  working: GitHub redirects the old `usetheodev/theokit-di` remote permanently. The
  `repository`, `bugs` and `homepage` fields of all three packages, plus the links in
  `SECURITY.md`, now point at `usetheokit`. (usetheokit/theokit#316)

- **The Apache-2.0 license text was replaced with the official one.** The text shipped
  until now had paragraph 4(d) truncated, dropping "reasonable and customary use" from
  the NOTICE clause. A modified body under the `Apache-2.0` SPDX identifier is
  effectively a custom license. The root LICENSE and the three package LICENSEs are now
  byte-identical to the canonical text. (usetheokit/theokit#316)
