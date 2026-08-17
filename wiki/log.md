## 2026-08-06

* **Creation**: Bundle authored from the `theokit-di` source tree at commit `30d39c8`.
  Covered all three packages (`@theokit/di`, `@theokit/di-agent`, `@theokit/orm`):
  every module under `packages/*/src`, all three `package.json` manifests, all four
  changelogs, the three package READMEs, the monorepo README, and the
  `examples/di-agent-express` dogfood, which was still in the tree at that point
  and has since been removed.
* **Creation**: Test facts taken from an observed `pnpm test` run on 2026-08-06 —
  252 passing, 2 skipped (env-gated real-LLM tests). No coverage figure is claimed,
  because none was measured.
* **Creation**: Three caveat concepts record divergences between shipped behaviour and
  the source's own documentation, each with a reproducible sweep as evidence —
  inert container decorators, metadata-only agent decorators, and the missing
  `@Transactional` DI binding path.
* **Update**: Each caveat now names the issue tracking it — #4 (`@Transactional`
  binding, with the ignored `isolationLevel` as a sub-bug), #5 (inert container
  decorators), #6 (`@Cron` / `@Hitl` silent overwrite). The metadata-only agent
  decorator design itself is intentional and was not filed.
* **Boundary**: Scope is this repository only. `@theokit/sdk` and `@theokit/http` live
  in sibling repositories and were not read; claims about them are attributed to the
  manifests and READMEs here.
* **Boundary**: No concept carries a `verified` entry. Every fact was read from the
  source, but no human has reviewed this bundle.

## 2026-08-17

* **Update**: The repository history was rewritten so that every commit message
  describes only what its own commit contains. Commit identifiers cited in this
  bundle were re-pointed to their rewritten equivalents; the trees they name are
  byte-for-byte the same, so no derived fact changed.
* **Update**: `examples/di-agent-express` was removed from the tree. The guide that
  cites it now anchors its provenance to commit `c1781ee`, the last commit in which
  the directory existed.
* **Update**: The source used to cite decisions, audit findings, plan tasks and edge
  cases by bare identifier — `ADR D2`, `PV#10`, `EC-R2-1`, `M7-7`, `T4.2` and their
  kind — in comments, JSDoc, test names and README prose. None of the documents behind
  those identifiers exist in any repository a reader can reach, and the JSDoc ones
  shipped to consumers through the published type declarations. They were all removed,
  with the reasoning each stood for written out where it applies. This bundle no longer
  cites them either. Some survive in released changelog entries, which are immutable.
* **Update**: The three caveats were re-derived after the defects they recorded were
  fixed. `@PostConstruct` and `@PreDestroy` are implemented, so the inert-decorator
  caveat now covers only `@Primary` and `@Qualifier`, whose docstrings were rewritten to
  state the limitation instead of promising a resolution rule. `bindDataSourceToInstance`
  is exported and `@Transactional` has a working container recipe, so that caveat is now
  about explicit binding rather than a missing path. `@Cron` and `@Hitl` accumulate per
  method, which changes their reader shape from a single object to a `ReadonlyMap`.
  Issues #4, #5 and #6 closed.
