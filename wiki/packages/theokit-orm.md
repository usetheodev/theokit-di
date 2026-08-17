---
type: Package
title: "@theokit/orm"
description: Repository pattern, agent-aware columns, transactions and JSON Schema export over drizzle-orm, wired through @theokit/di.
resource: https://www.npmjs.com/package/@theokit/orm
tags: [package, orm, drizzle, repository]
generated: { by: claude-code/claude-opus-5, at: 2026-08-06T15:00:00Z }
sources:
  - id: pkg
    resource: packages/orm/package.json
    title: "@theokit/orm package manifest"
  - id: readme
    resource: packages/orm/README.md
    title: "@theokit/orm README"
  - id: barrel
    resource: packages/orm/src/index.ts
    title: Public barrel of @theokit/orm
  - id: changelog
    resource: packages/orm/CHANGELOG.md
    title: "@theokit/orm changelog"
---

`@theokit/orm` gives the theokit ecosystem the developer experience of NestJS +
TypeORM — inject a repository, get CRUD — but builds it on Drizzle instead:
Apache-2.0, edge-runtime ready, and no code generation step.[^readme]

It is the only package here that is genuinely optional at the DI level. Plain CRUD
works without a container at all, through
[`createRepository(db, table)`](/api/repository.md); the container buys you
constructor injection, not the query surface.[^changelog]

# Identity

Name
: `@theokit/orm`

Version
: `0.1.0` — first stable release, dropping the `-next` prerelease line[^pkg]

License
: Apache-2.0

Peer dependencies
: `@theokit/di@^0.1.0`, `drizzle-orm@>=0.36.0`, `reflect-metadata@^0.2.0`; `drizzle-kit` is optional[^pkg]

Entry points
: `.` for the main barrel and `./schema-export` for the polyglot exporter — two separate `tsup` entries[^pkg]

# The five capabilities

Repository
: `Repository<T>` wraps one Drizzle table with `findById`, `findMany`, `insert`,
  `update`, `delete` and an escape-hatch `query()`. See [Repository](/api/repository.md).

Injection
: `OrmModule.forRoot` registers the data source, `OrmModule.forFeature` registers one
  provider per table, and `@InjectRepository(table)` resolves it. See
  [OrmModule](/api/orm-module.md).

Agent-aware columns
: Any table carrying `agentId`, `runId` or `conversationId` gets those columns filled
  automatically inside `withAgentContext`. See
  [agent context columns](/api/agent-context.md).

Transactions
: `@Transactional()` wraps a method in `db.transaction` and propagates the handle so
  repositories transparently join it. See [@Transactional](/api/transactional.md) and
  the binding caveat in
  [@Transactional needs its DataSource bound explicitly](/caveats/transactional-di-binding.md).

Schema export
: `exportSchemas(schema)` emits JSON Schema 7 from Drizzle tables, so Python,
  Go or any other consumer can share the same contract. See
  [schema export](/api/schema-export.md).

# Dialect support is narrower than the type says

`Dialect` admits `"sqlite" | "pg" | "mysql"`, and `OrmModule.forRoot` validates
against exactly that set. But [`Repository.insert`](/api/repository.md) and
`Repository.update` both require the driver to expose `.returning()`, and throw
`OrmConfigurationError` naming MySQL when it does not. So MySQL passes
configuration and then fails at the first write — the supported write path in `0.1.0`
is SQLite and Postgres, with `repo.query()` as the documented MySQL fallback.[^changelog]

# Polyglot proof

The polyglot claim is not theoretical: an integration test exports JSON Schema from a
Drizzle table, loads it into a SQLAlchemy `MetaData` and runs `create_all` against
in-memory SQLite. It skips gracefully when Python 3.10+ or `sqlalchemy` is
unavailable, which is why the suite stays green on machines without them.[^changelog]
Its place in the suite is recorded in [test inventory](/architecture/testing.md).

[^pkg]: `@theokit/orm` package manifest
[^readme]: `@theokit/orm` README
[^changelog]: `@theokit/orm` changelog
