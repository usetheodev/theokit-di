# Changelog

Workspace-level changes for the `theokit-di` monorepo. Per-package changes live in each package's `CHANGELOG.md`.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- Wiki de conhecimento em `wiki/` — bundle Open Knowledge Format v0.2 com 27 conceitos
  derivados do código-fonte dos três pacotes: pacotes, superfície de API, arquitetura,
  guias, glossário e três *caveats* de divergência entre código e documentação.
  Validado com `okf-validate --strict` (0 erros, 0 warnings, 0 links quebrados,
  0 órfãos). (#4, #5, #6)
- TypeDoc `docs:json` tooling per package (`@theokit/di`, `@theokit/di-agent`, `@theokit/orm`): each package now has a `typedoc.json` (single `src/index.ts` entrypoint, `docs-json/api.json` output) and a `docs:json` script, plus `typedoc` as a devDependency. Emits the TypeDoc JSON consumed by the `theo-opendocs` `generate:di-reference` script to build the per-symbol API reference. `docs-json/` is gitignored (generated artifact).

### Changed

- O README do `@theokit/di` corrige a referência ao pacote de decorators HTTP: o nome atual é `@theokit/http` e ele vive no repo irmão `theokit` (`packages/http`), não em `../http-decorators`. (docs-reorg-2026-08)
- Extracted `@theokit/di`, `@theokit/di-agent`, `@theokit/orm` out of the `theokit-sdk` monorepo into this standalone repository (plan `monorepo-cohesion-split`, 2026-06-18), preserving full git history via `git filter-repo`. `@theokit/di-agent` now consumes `@theokit/sdk` as a published npm dependency (`^1.9.0`) instead of a workspace link. npm package names and versions are unchanged (`@theokit/di@0.1.1`, `@theokit/di-agent@0.2.0`, `@theokit/orm@0.1.0-next.1`).
