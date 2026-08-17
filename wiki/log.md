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
  manifests and READMEs here. The ADR documents referenced throughout the source
  (D2, D4, D5, D7, D11, D422, D431, arch-review ADR 0001) are not present in this
  repository and were not consulted — they are named as the source names them.
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
* **Boundary**: The ADR citations this bundle attributes to the source (D2, D4, D5,
  D422 and arch-review ADR 0001 in `packages/di/src`) were removed from the source in
  the same pass, because the documents they pointed at exist in no reachable
  repository. The mentions here remain a faithful record of what the source said at
  commit `30d39c8`, the commit this bundle was derived from. D11, D431 and D8 are
  still named by changelogs, READMEs and one test.
