---
"@theokit/orm": minor
---

**Breaking: `@Transactional({ isolationLevel })` is no longer accepted and ignored.**
The options parameter was never read, so code that passed a level and appeared to work
was never getting one. The level now reaches the driver, and is rejected with an
`OrmConfigurationError` on `sqlite`, which has no per-transaction isolation level to
set.

**`@Transactional` is usable from the published package.** `bindDataSourceToInstance`
is what its error message tells you to call, and it was not exported — following the
instruction did not compile. It and `TransactionalOptions` are now reachable from the
package entry point, and the docs show the container recipe: inject
`ORM_DATA_SOURCE_TOKEN` and bind in a `@PostConstruct` hook.

`exportSchema` marks a column `required` only when it is `NOT NULL` **and** has no
default. That is what it always did, but no fixture proved it — every one paired
`notNull` with no default, or a default with a nullable column, so dropping half the
rule left the suite green.

Every published export carries documentation an editor can show — the package went
from 3/20 to 20/20, and `@theokit/orm/schema-export`, the polyglot surface a Python or
Go consumer reaches first, from 0/4 to 4/4.

Peer range widened to accept `@theokit/di@^0.2.0`.
