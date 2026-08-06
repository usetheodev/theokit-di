---
type: API Class
title: Repository
description: CRUD over one Drizzle table — transaction-aware, agent-column-aware, with a query escape hatch.
resource: packages/orm/src/repository.ts
tags: [orm, repository, crud, drizzle]
generated: { by: claude-code/claude-opus-5, at: 2026-08-06T15:00:00Z }
sources:
  - id: repo
    resource: packages/orm/src/repository.ts
    title: Repository implementation
  - id: tests
    resource: packages/orm/tests/unit/repository-crud.test.ts
    title: Repository CRUD test suite
  - id: changelog
    resource: packages/orm/CHANGELOG.md
    title: "@theokit/orm changelog"
---

`Repository<T>` wraps a single Drizzle table with six methods. It is the working
surface of [@theokit/orm](/packages/theokit-orm.md).[^repo]

```typescript
class Repository<T extends Table> {
  constructor(defaultDb: unknown, table: T);
}

function createRepository<T extends Table>(db: unknown, table: T): Repository<T>;
```

The constructor takes no container and no decorators. `createRepository` exists to
make that non-DI path explicit and discoverable, so plain CRUD needs neither
`@theokit/di` nor `reflect-metadata` — added in `0.1.0` as M7-7.[^changelog]

# Methods

| Method | Signature | Returns |
|---|---|---|
| `findById` | `(id: string \| number)` | the row, or `null` |
| `findMany` | `(where?: SQL)` | array of rows |
| `insert` | `(values: InferInsertModel<T>)` | the inserted row |
| `update` | `(id, patch: Partial<InferInsertModel<T>>)` | the updated row |
| `delete` | `(id: string \| number)` | `void` |
| `query` | `()` | the raw Drizzle select builder |

Return types flow from Drizzle's `InferSelectModel<T>` and `InferInsertModel<T>`, so a
repository over a typed table is typed end to end without generics at the call site.

# Primary key detection happens at construction

The constructor resolves the table's primary key immediately, and throws
[`OrmConfigurationError`](/api/orm-errors.md) if it cannot. It checks three Drizzle
metadata spellings (`primary`, `isPrimaryKey`, `primaryKey`), then falls back to a
column literally named `id`.[^repo]

Failing here rather than at first query is the point: a misconfigured table surfaces at
wiring time, not in production on the first `findById`. Composite and custom keys are
out of scope for `0.1.0` — the error message routes you to `query()`.

# Id validation guards against data loss

`findById`, `update` and `delete` all run `assertValidId`, which rejects `null`,
`undefined`, the empty string, and any non-string non-number.[^repo]

This is not defensive noise. `delete(undefined)` without the guard becomes
`DELETE WHERE id IS NULL`, which in SQL matches nothing — or, with a nullable column and
the wrong driver semantics, matches something. Refusing the input is the only safe
answer, and it throws [`OrmValidationError`](/api/orm-errors.md).

# insert and update require .returning()

Both methods check for `.returning()` on the query builder and throw when it is
absent.[^repo]

| Situation | Outcome |
|---|---|
| Driver exposes `.returning()`, row comes back | the row is returned |
| Driver exposes `.returning()`, zero rows | `OrmValidationError` |
| Driver has no `.returning()` | `OrmConfigurationError` naming MySQL |

`update` distinguishes the two failure kinds usefully: zero returned rows means no row
matched that id, and the message includes the id. This is what makes an update of a
non-existent row an error rather than a silent no-op.

The practical consequence is that the supported write path in `0.1.0` is SQLite and
Postgres. MySQL is a valid `Dialect` at configuration time but fails on the first
write, with `query()` as the documented fallback.

# Transaction awareness is implicit

The `db` used by every method is a getter, not a stored field:

```typescript
private get db(): DialectAwareDb {
  const tx = getTxContext();
  return (tx ?? this.defaultDb) as DialectAwareDb;
}
```

If an `AsyncLocalStorage` transaction context is active, the repository uses the
transaction handle; otherwise it uses the data source's db.[^repo] So a repository
injected once transparently joins whatever transaction its caller opened, with no
transaction-aware API and no parameter threading. That mechanism is described in
[@Transactional](/api/transactional.md).

# Agent columns

`insert` and `update` pass their payload through `fillAgentColumns` before it reaches
Drizzle, which populates `agentId`, `runId` and `conversationId` when the table has
them and an agent context is active. See
[agent context columns](/api/agent-context.md).

# query()

`query()` returns the raw Drizzle select builder for the table — joins, aggregates,
composite keys, dialect-specific features, anything the six methods do not cover.
It is the deliberate escape hatch rather than an oversight, and it is what the error
messages point at when they hit a limit.

Note that it bypasses nothing else: because it uses the same `db` getter, a `query()`
inside a transaction still runs inside that transaction.

[^repo]: Repository implementation
[^tests]: Repository CRUD test suite
[^changelog]: `@theokit/orm` changelog
