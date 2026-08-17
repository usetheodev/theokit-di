# Contributing

Thanks for looking. This repository holds three packages — `@theokit/di`,
`@theokit/di-agent` and `@theokit/orm` — in one pnpm workspace.

## Getting set up

```bash
nvm use                                              # Node 22.12+
corepack enable && corepack prepare pnpm@9.15.0 --activate
pnpm install
pnpm build
pnpm test
```

`pnpm validate` is not a script here; the four commands that gate a change are
`pnpm check`, `pnpm typecheck`, `pnpm build` and `pnpm test`. All four must pass.

## Branches

Work starts on `workspace` and is promoted by pull request:

```
workspace ──PR──> develop ──PR──> main
 (work)         (integration)    (release)
```

`workspace` is a single permanent branch — there are no feature branches. Never
commit directly to `develop` or `main`; both advance only through the promotion
PRs above.

## What a change needs

**A test, written first.** Every bug fix starts with a test that reproduces it
and fails. Every behaviour change comes with a test that would catch its
regression. This matters more here than the phrasing suggests: three defects in
this repository survived a green suite because the tests asserted that a
decorator *wrote metadata*, not that anything *read it*. Assert the behaviour a
consumer depends on.

**A changelog entry**, in the affected package's `CHANGELOG.md` under
`[Unreleased]`, plus this repository's root `CHANGELOG.md` when the change is
visible outside a single package. Write it for the person consuming the package,
not for the person who wrote the diff. Reference the issue or PR number.

Entries under a released version heading are immutable. If one is wrong, add a
new entry that corrects it.

**English.** The whole repository is English-only, and a test enforces it —
`packages/di/tests/lint/no-ptbr.test.ts` sweeps every `.ts` and `.md` file for
Portuguese and fails the suite on a hit. Changelogs are exempt, because
translating a released entry would rewrite the record of what shipped.

**A commit message that describes its own commit.** Say what the change does and
why. Do not reference plans, tickets, ADRs or audit findings that live outside
this repository — a reader who cannot open the thing you cited is worse off than
one you simply explained it to.

## Style

Biome handles formatting and linting; `pnpm check` runs it and `pnpm check:fix`
applies what it can. Cognitive complexity is capped at 10 per function — if you
trip it, extract a method rather than adding a suppression. A `biome-ignore` is
acceptable when the rule is genuinely wrong for the case, and it must carry a
comment saying why on the same line.

## Releasing

Releases go through [changesets](https://github.com/changesets/changesets). Add
one with `pnpm changeset` when your change should ship. The release workflow runs
on a push to `main` and publishes with npm provenance.

## Reporting a bug

Open an issue with the version you tested, what you expected, what happened, and
the smallest reproduction you can manage. If it is a security problem, follow
[SECURITY.md](SECURITY.md) instead and do not open a public issue.
