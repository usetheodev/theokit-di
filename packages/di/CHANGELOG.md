# Changelog

All notable changes to `@theokit/di` are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `@PostConstruct` is now called. The container invokes the marked method once the instance is built and every constructor dependency is injected — once per instance, so a SINGLETON initialises once however often it is resolved. An async hook is awaited by `resolveAsync`; `resolve()` cannot await one and throws `AsyncPostConstructInSyncResolveError` rather than return an object whose initialiser is still running (#5).
- `@PreDestroy` is now called, before `dispose()` when a class has both, and awaited if it returns a Promise. A class no longer needs a `dispose()` method to be torn down — declaring the hook is enough for the container to track it. A failing hook no longer stops the others; the failures arrive together as an `AggregateError` (#5).
- `AsyncPostConstructInSyncResolveError`, exported so consumers can catch it by type.

### Changed

- `repository`, `homepage` and `bugs` now point at `usetheodev/theokit-di`. They pointed at `usetheo/theokit-sdk`, so every "Repository" and "Report issues" link on npm led to a project that does not host this package.
- The package description no longer names `@theokit/http-decorators`, which does not exist. The package is `@theokit/http`.
- The README no longer carries a Portuguese clause, and says plainly where `@theokit/http` ships from.
- JSDoc on the public surface no longer cites ADRs, audit findings, plan tasks or edge-case identifiers that exist in no repository a reader can reach. The rationale each citation stood for is now written inline, so it survives into the published type declarations.
- `Primary` now declares its parameter as a constructor type rather than `Function`. `Function` is the widest callable type there is, so it documented nothing and admitted values that are not classes. Any class you could already decorate still type-checks.

### Fixed

- `@Primary` and `@Qualifier` documented a resolution priority the container has never had. They record metadata and nothing else, and their JSDoc now says exactly that, with the working alternative alongside. Implementing them means holding several registrations per token — which is the cache key, the cycle-detection node identity and the disposal order — so it is a design decision rather than a missing branch, and it has not been made (#5).
- The English-only lint gate could not fail on an accented word. It split identifiers with an ASCII-only pattern before testing them for diacritics, so `não` became `n` and `o` and the diacritic tier was unreachable. Both tiers now work, verified by planting an accented identifier and watching the sweep turn red (#7).

## 0.1.1

### Patch Changes

- Add `METADATA_KEYS.SQUAD` (`"usetheo:di:squad"`) and `METADATA_KEYS.STEP` (`"usetheo:di:step"`) — new metadata keys backing the `@Squad()` and `@Step()` decorators in `@theokit/di-agent`. Shipped as a patch (additive values on the existing exported `METADATA_KEYS`) to keep `@theokit/di-agent` and the in-progress `@theokit/orm` (prerelease `0.1.0-next.1`) inside their `^0.1.0` peer range — a `minor` (`0.2.0`) would fall outside `^0.1.x` and force both dependents to `1.0.0`.

  Also: broke the `container.ts ↔ internal/module-loader.ts` type-only cycle (arch-review ADR 0001) — `loadModule` now depends on a narrow `ModuleRegistrar` interface from the leaf `types.ts` instead of the concrete `Container`. No behavior change; `Container` satisfies it structurally.

## [0.1.0] - 2026-05-31

> First GA release. Promotes `0.1.0-next.0` to stable with the single-flight Promise cache fix (shipped in `0.1.0-next.0`) plus the biome-cleanup refactors below. API contract preserved — no breaking changes from `0.1.0-next.0`.

### Changed

- Refactored `Container.constructClassWithAsyncFallback<T>` (complexity 18 → ≤10) via Extract Method: introduced 4 private helpers (`validateMetadata`, `handlePrimitiveParam`, `tryResolveSync`, `resolveAllAsync`). Behavior preserved; reflect-metadata error ordering + async-fallback semantics unchanged. (theokit-sdk-biome-cleanup)
- Refactored `Container.fromFactoryProvider` (complexity 11 → ≤10) via Extract Method: introduced `tryResolveSyncDeps` private helper returning a discriminated union for sync/async dispatch. (theokit-sdk-biome-cleanup)
- Removed redundant `export` on `MODULE_METADATA_KEY` (internal-only — never part of public surface). (theokit-sdk-biome-cleanup)
- See ADR D422 for the consolidated rationale (parameter decorators enabled in biome + container Extract Method refactor).

## [0.1.0-next.0] - 2026-05-29

### Added

- Initial release of `@theokit/di` — lightweight TypeScript dependency injection container.
- `Container` class with `register()` / `registerModule()` / `resolve()` / `resolveAsync()` / `analyze()` / `dispose()`.
- 5 decorators: `@Injectable()`, `@Inject(token)`, `@Optional()`, `@Module({...})` — NestJS-compatible API.
- 4 provider types: `useClass`, `useFactory`, `useValue`, `useExisting`.
- 3 lifecycle scopes: `SINGLETON` (default), `TRANSIENT`, `REQUEST` (via `AsyncLocalStorage`).
- Cycle detection at resolve-time (Promise-lock cache with cycle-first ordering per v1.2 EC-R2-1 prevents async deadlocks).
- Cache cleanup on Promise rejection (v1.2 EC-R2-2) — transient factory failures do NOT poison the REQUEST cache.
- `runInRequest()` try/finally guarantees REQUEST instances are disposed even on callback throw (v1.1 EC-3).
- `validateClassProvider()` centralized validation — both declarative `providers: []` and imperative `register()` reject undecorated classes (v1.1 EC-1).
- Container freezes after first `resolve()`; `allowDynamicRegistration: true` opt-out for tests (v1.2 EC-R2-5).
- Module loading with cycle detection (DFS), export validation at register-time, BFS-style transitive provider import.
- Typed errors: `TokenNotFoundError`, `CyclicDependencyError`, `AsyncProviderInSyncResolveError`, `ScopeViolationError`, `MissingInjectableError`, `ContainerDisposedError`, `ContainerFrozenError`, `InvalidModuleError`, `InvalidExportError`, `CyclicModuleImportError`, `ReflectMetadataMissingError`.
- Disposal lifecycle: `dispose()` calls `Symbol.asyncDispose` (preferred) or `dispose()` on each instance in reverse construction order; aggregates errors via `AggregateError`.
- Foundation for `@theokit/orm` (P2) and `@theokit/http-decorators` (P3). Agent-first integration ships as separate `@theokit/di-agent` package (zero coupling per ADR D8).

### Bundle / Coverage

- Tests: 58 unit + integration tests passing. Coverage: 95.55% statements / 88.21% branches / 98.82% functions / 95.55% lines.
- Bundle: ESM 11.55 KB / CJS 11.32 KB (gzipped est.).
- Dual ESM + CJS, target Node 22.12+, dts emitted.

### Polyglot strategy (read ADR D11)

`@theokit/di` is **intentionally TS-only**. DI containers are intrinsically language-specific runtime constructs. The polyglot story for the theokit ecosystem lives in the contract layer — `@theokit/orm` (P2, schema export to JSON Schema + SQL migrations) and `@theokit/http-decorators` (P3, OpenAPI 3.x emit from `@Controller` decorators). Python/Go SDKs will be generated from those specs (Supabase/Appwrite pattern), NOT by porting the DI container.
