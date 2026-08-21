# Changelog

All notable changes to `@theokit/di-agent` are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Every published export now carries documentation an editor can show. Measured on the emitted
  declarations, 16/56 to 56/56. Each decorator now states the thing a reader cannot infer from its
  signature: this package records metadata and nothing here acts on it — the runtime that
  does lives in `@theokit/sdk`. (#24)

- npm provenance is enabled again. It was switched off because npm refuses attestation for packages built from a private source repository; this one is public now, so published tarballs carry a sigstore attestation linking them to the commit and workflow that produced them.
- `DecoratedClass` — the constructor type the decorator reader helpers accept, exported so consumers can name it.

### Changed

- `repository`, `homepage` and `bugs` now point at `usetheokit/theokit-di`. They pointed at `usetheo/theokit-sdk`, so every "Repository" and "Report issues" link on npm led to a project that does not host this package.
- `readAuthMetadata`, `readEvalDecoratorMetadata` and `readWorkflowMetadata` now declare their parameter as `DecoratedClass` rather than `Function`. `Function` is the widest callable type there is, so it documented nothing and admitted values that are not classes. Any class you already passed still type-checks.
- JSDoc and comments no longer cite plan tasks or edge-case identifiers that exist in no repository a reader can reach.
- **Breaking:** `readCronMetadata` and `readHitlMetadata` return a `ReadonlyMap` keyed by method name instead of a single object or `undefined`. `@Cron` and `@Hitl` kept one object per class, so decorating a second method silently discarded the first — a class with two scheduled routines quietly lost one. Both now accumulate per method, like the other fourteen decorators. Migration: `readCronMetadata(C)?.schedule` becomes `readCronMetadata(C).get("methodName")?.schedule`, and an undecorated class yields an empty map rather than `undefined` (#6).

## 0.2.0

### Minor Changes

- Decorator-driven agent-team + workflow authoring (own identity — composition over a new engine).

  - **`@Squad(metadata)`** property decorator + `readSquadMetadata` — declarative sequential agent team backed by `@theokit/di` `METADATA_KEYS.SQUAD`.
  - **`@Step(metadata?)`** method decorator + `readStepMetadata` (`{ after?, name? }`) backed by `METADATA_KEYS.STEP`.
  - **`buildWorkflow(instance)`** — compiles a class decorated with `@Step` into a `@theokit/sdk` `Workflow` (topological order by `after`; validates no-steps / unknown-after / cycle). No new runtime engine — composes `@theokit/sdk/workflow`.

  First npm publish of these decorators (`0.1.0` on npm is the scaffold).

## [0.1.0] - 2026-05-31

> First GA release. Promotes `0.1.0-next.0` to stable. API contract preserved — no breaking changes from `0.1.0-next.0`.

### Changed

- Removed obsolete `// biome-ignore lint/correctness/noUnusedVariables` directives from `tests/{analyze-graph,async-resolution,container-core,inject-agent,integration/real-agent}.test.ts`. They were flagged as `suppressions/unused` after the workspace enabled `javascript.parser.unsafeParameterDecoratorsEnabled` in `biome.json`.
- Dropped the unused `@vitest/coverage-v8` devDependency.

## [0.1.0-next.0] - 2026-05-29

### Added

- Initial release of `@theokit/di-agent` — agent-first DI integration for `@theokit/di`.
- `@InjectAgent()` parameter decorator (sugar over `@Inject(AGENT_TOKEN)`).
- `createAgentProvider({ factory, scope? })` helper producing a `FactoryProvider` with default `Scope.REQUEST`.
- `AGENT_TOKEN` exported constant for advanced wiring (custom providers under the same token).

### Validation

- 5 unit tests with mock Agent + 2 real-LLM integration tests (env-gated by `OPENROUTER_API_KEY`). Real-LLM run validated against OpenRouter (`openai/gpt-4o-mini`) — 800ms end-to-end.

### Peer dependencies

- `@theokit/di` `workspace:^` (kept in lockstep — Changesets `linked` config).
- `@theokit/sdk` `workspace:^` (the actual Agent runtime).
- `reflect-metadata` `^0.2.0` (transitive via `@theokit/di`).
