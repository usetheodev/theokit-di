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
