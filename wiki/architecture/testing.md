---
type: Architecture
title: Test inventory
description: What the 252 tests cover, how they are split, and which behaviours are asserted only at the metadata level.
resource: packages
tags: [architecture, testing, coverage]
generated: { by: claude-code/claude-opus-5, at: 2026-08-06T15:00:00Z }
sources:
  - id: run
    resource: "pnpm test at commit 30d39c8, 2026-08-06"
    title: Observed test run
  - id: ditests
    resource: packages/di/tests
    title: "@theokit/di test suite"
  - id: agenttests
    resource: packages/di-agent/tests
    title: "@theokit/di-agent test suite"
  - id: ormtests
    resource: packages/orm/tests
    title: "@theokit/orm test suite"
---

Observed on 2026-08-06 at commit `30d39c8`, running `pnpm test` across the
workspace.[^run]

| Package | Files | Passed | Skipped |
|---|---|---|---|
| `@theokit/di` | 7 | 69 | 0 |
| `@theokit/di-agent` | 18 (+1 skipped) | 112 | 2 |
| `@theokit/orm` | 10 | 71 | 0 |
| **Total** | **35** | **252** | **2** |

Everything runs on Vitest 4 with SWC transforms. The two skips are the env-gated
real-LLM integration tests, which announce themselves rather than passing silently:
`Skipping — OPENROUTER_API_KEY not set.`[^run]

# @theokit/di

Seven files, each holding one dimension of container behaviour:[^ditests]

`container-core`
: registration, the four provider shapes, resolution, the freeze rule.

`async-resolution`
: `resolveAsync`, the sync-to-async fallback, the single-flight Promise cache.

`lifecycle` and `disposal`
: `@PostConstruct` / `@PreDestroy` metadata, and the reverse-order dispose chain.

`modules`
: `@Module` loading, import cycles, export validation.

`qualifier-primary`
: `@Qualifier` and `@Primary` metadata.

`analyze-graph`
: `analyze()` nodes, edges and cycle detection.

## Two suites assert metadata, not behaviour

`lifecycle.test.ts` and `qualifier-primary.test.ts` assert only that the decorators
write the expected `Reflect` metadata. Every case reads the key back directly:[^ditests]

```typescript
const method = Reflect.getMetadata(METADATA_KEYS.POST_CONSTRUCT, Service);
expect(method).toBe("init");
```

No test resolves a decorated class through the container and observes an effect,
because there is no effect to observe — see
[inert container decorators](/caveats/inert-di-decorators.md). The suites are green and
they are honest about what they check; the gap is in the runtime, not the tests.

# @theokit/di-agent

Eighteen files, essentially one per decorator, plus `inject-agent`, `workflow-builder`
and the env-gated `integration/real-agent`.[^agenttests]

The same pattern holds and for the same reason: the decorator suites verify the
metadata contract, which is the whole contract those decorators have. Two files test
real behaviour — `workflow-builder`, which compiles and runs a step chain, and
`inject-agent`, which resolves through a container with a mock Agent.

`integration/real-agent` is the dogfood gate. When `OPENROUTER_API_KEY` is set it runs
two live calls against OpenRouter and asserts per-request Agent isolation end to end.

# @theokit/orm

Split into `unit` and `integration`:[^ormtests]

| File | Covers |
|---|---|
| `unit/repository-crud` | the six CRUD methods, PK detection, id validation |
| `unit/schema-export` | the twelve column mappings and the unknown-type throw |
| `unit/tokens` | `getRepositoryToken` naming and failure modes |
| `unit/als-context` | `withAgentContext` propagation |
| `unit/create-repository` | the non-DI factory |
| `unit/create-repository-barrel` | that the factory is reachable from the public barrel |
| `integration/module-end-to-end` | `forRoot` + `forFeature` + `@InjectRepository` against real SQLite |
| `integration/agent-aware-columns` | auto-fill against real SQLite |
| `integration/transactional` | commit, rollback, tx propagation |
| `integration/python-sqlalchemy-smoke` | JSON Schema loaded into SQLAlchemy |

The integration tests use `better-sqlite3` in memory, so they exercise a real driver
and real SQL rather than a mock query builder.

`create-repository-barrel` is worth noting as a pattern: a test whose only job is to
guard reachability from the published entry point. A symbol can work perfectly and
still be unusable if the barrel does not export it.

# The gap that test names off

Every `@Transactional` test binds its data source by calling
`bindDataSourceToInstance` directly. None resolves the decorated class through a
container, and `module-end-to-end` never mentions `@Transactional`.[^ormtests] The
documented DI path is therefore not covered — because, as
[@Transactional has no DI binding path](/caveats/transactional-di-binding.md) sets out,
it does not exist.

This is the clearest illustration of why a green suite is not the same as a covered
contract: the tests assert what the code does, and the documentation claims something
more.

# Running them

```bash
pnpm test                        # whole workspace
pnpm --filter @theokit/orm test  # one package
pnpm test:coverage               # with V8 coverage
```

`@theokit/orm` also carries a Stryker mutation-testing setup as a dev
dependency.[^ormtests]

[^run]: Observed test run
[^ditests]: `@theokit/di` test suite
[^agenttests]: `@theokit/di-agent` test suite
[^ormtests]: `@theokit/orm` test suite
