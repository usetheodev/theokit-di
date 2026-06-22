---
"@theokit/orm": minor
---

M7-7 (Tema F) — `createRepository(db, table)`: a non-DI factory for `Repository`. The `Repository` constructor was already DI-free; this makes the non-DI path explicit and discoverable, so plain CRUD needs no `@theokit/di`, decorators, or `reflect-metadata` (only `@Transactional` requires a bound DataSource). Works with any drizzle `db`, including better-sqlite3 (awaitable query builders).
