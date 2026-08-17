# Changelog

All notable changes to `@theokit/orm` are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- npm provenance is enabled again. It was switched off because npm refuses attestation for packages built from a private source repository; this one is public now, so published tarballs carry a sigstore attestation linking them to the commit and workflow that produced them.
- `bindDataSourceToInstance` and `TransactionalOptions` are exported from the package entry point. `bindDataSourceToInstance` is what the `@Transactional` error message tells you to call, and it was not reachable from the published package, so following that instruction did not compile (#4).

### Changed

- `repository`, `homepage` and `bugs` now point at `usetheodev/theokit-di`. They pointed at `usetheo/theokit-sdk`, so every "Repository" and "Report issues" link on npm led to a project that does not host this package.
- `@Transactional` no longer claims the container binds its DataSource automatically. Nothing ever did. The error message now names `bindDataSourceToInstance`, the one call that fixes it, and the docs show the container recipe: inject `ORM_DATA_SOURCE_TOKEN` and bind in a `@PostConstruct` hook (#4).
- **Breaking:** `@Transactional({ isolationLevel })` was accepted and silently ignored — the options parameter was never read. The level is now passed to the driver, and rejected with an `OrmConfigurationError` on `sqlite`, which has no per-transaction isolation level to set. Code that passed a level on sqlite and appeared to work was never getting one; it now fails instead of pretending (#4).

## [0.1.0] - 2026-06-22

### Added

- **`createRepository(db, table)` non-DI factory.** Plain CRUD needs no `@theokit/di`, decorators, or `reflect-metadata` (only `@Transactional` requires a bound DataSource). Works with any drizzle `db`, including better-sqlite3 (awaitable builders). First stable release (drops the `-next` prerelease tag).

## [0.1.0-next.1] - 2026-06-01

### Added

- Python SQLAlchemy polyglot smoke test — exported JSON Schema 7 loads into SQLAlchemy `MetaData` + `create_all` succeeds against in-memory SQLite. Proves the polyglot story works end-to-end across language boundaries. The smoke test gracefully skips when Python 3.10+ or `sqlalchemy` is unavailable.
- `tests/integration/scripts/load_schema.py` — reference Python harness for consumers that want to load orm-emitted schemas into their own SQLAlchemy models.
- Package scaffold for `@theokit/orm`: tsup build, vitest setup, tsconfig with `experimentalDecorators` + `emitDecoratorMetadata`.
- `Repository<T>` class with 6 minimum methods (`findById`, `findMany`, `insert`, `update`, `delete`, `query`) over `drizzle-orm`. Throws `OrmConfigurationError` at construction when the entity has no primary key, and `findById`/`update`/`delete` validate `id` is non-null, non-empty, string-or-number to prevent data-loss from `DELETE WHERE id IS NULL`.
- `getRepositoryToken(entity, dataSourceName?)` token generator. Mirrors NestJS TypeORM convention (`REPO:${entityName}` / `REPO:${dataSourceName}:${entityName}`).
- `@InjectRepository(entity, dataSourceName?)` parameter decorator wrapping `@Inject` from `@theokit/di`.
- `OrmModule.forRoot(opts)` / `OrmModule.forFeature(entities, dataSourceName?)` provider builders. `forFeature` throws `OrmConfigurationError` with actionable message if `forRoot` was not called for the dataSource first.
- `withAgentContext({ agentId, runId, conversationId }, fn)` AsyncLocalStorage helper. Repository `insert`/`update` auto-fill matching columns when context is present and column exists on the table.
- `@Transactional()` method decorator wraps `db.transaction(...)` with rollback-on-throw. Tx propagated via `withTxContext` AsyncLocalStorage so injected Repositories transparently use the tx scope. Throws `OrmConfigurationError` with actionable message when the host class is not DI-managed (no DataSource bound).
- `exportSchemas(schema)` / `exportSchema(table)` (from `@theokit/orm/schema-export`): emit JSON Schema 7 from Drizzle tables. 12 column types mapped (text, varchar, integer, bigint, real, numeric, boolean, json, uuid, blob, timestamp, enum). Unknown column types throw `OrmSchemaExportError` with actionable message — no silent fallback.
- `OrmError`, `OrmConfigurationError`, `OrmValidationError`, `OrmSchemaExportError` typed error hierarchy.
