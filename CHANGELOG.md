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

- `LICENSE` at the repository root. The three packages each carried Apache-2.0 and
  declared it, but nothing covered the repository itself, so default copyright
  applied to everything outside `packages/` — the README, the workflows and the
  tooling. The root now carries the same Apache-2.0 text the packages ship (#15).
- `SECURITY.md` — how to report a vulnerability privately, what is in scope, and
  what to expect back.
- `CONTRIBUTING.md` — the `workspace → develop → main` promotion flow, the four
  commands that gate a change, and the test-first requirement.
- npm provenance is enabled again across all three packages. It had been switched
  off because npm refuses attestation for packages built from a private source
  repository; the repository is public now, so published tarballs can be traced
  back to the commit and workflow that produced them.

### Changed

- Every commit message was rewritten so that it describes only what its own
  commit contains. The packages were extracted from `theokit-sdk` carrying their
  original messages verbatim, so eleven of them documented files that never came
  with the packages, five merge commits cited pull request numbers belonging to
  the other repository, and four subjects asserted changes their commits do not
  make — including a breaking-change marker on a commit that touches two files.
  The trees are unchanged.
- References to documents that exist in no reachable repository were removed from
  the source, the tests, the READMEs and the published type declarations: ADR
  identifiers, audit findings, plan tasks and edge-case markers. Each prefixed a
  sentence that already stated the decision, so the sentences are what remain.
  Entries under a released version heading were left alone.
- Package `repository`, `homepage` and `bugs` URLs now point at
  `usetheodev/theokit-di`. They pointed at `usetheo/theokit-sdk` — wrong
  organization and wrong repository — so every "Repository" and "Report issues"
  link on npm led somewhere that does not host these packages.

### Removed

- The `wiki/` knowledge bundle. It documented the packages accurately but was
  generated rather than reviewed, and every concept declared as much.
- The `di-agent-express` example and the `deepagents-decorators-demo` script.

### Fixed

- The English-only lint gate could not fail on an accented word. It split
  identifiers with an ASCII-only pattern before testing them for diacritics, so
  the accents were discarded before the check that looks for them ever ran. Both
  tiers work now, verified in both directions (#7).
