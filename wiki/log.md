## 2026-08-06

* **Creation**: Bundle authored from the `theokit-di` source tree at commit `3861d5c`.
  Covered all three packages (`@theokit/di`, `@theokit/di-agent`, `@theokit/orm`):
  every module under `packages/*/src`, all three `package.json` manifests, all four
  changelogs, the three package READMEs, the monorepo README, and the
  `examples/di-agent-express` dogfood.
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
