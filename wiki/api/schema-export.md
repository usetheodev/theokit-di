---
type: API Function
title: Schema export
description: Emits JSON Schema 7 from Drizzle tables so non-TypeScript consumers can share the same contract.
resource: packages/orm/src/schema-export.ts
tags: [orm, polyglot, json-schema, contract]
generated: { by: claude-code/claude-opus-5, at: 2026-08-06T15:00:00Z }
sources:
  - id: export
    resource: packages/orm/src/schema-export.ts
    title: Schema export implementation
  - id: tests
    resource: packages/orm/tests/unit/schema-export.test.ts
    title: Schema export test suite
  - id: python
    resource: packages/orm/tests/integration/python-sqlalchemy-smoke.test.ts
    title: Python SQLAlchemy polyglot smoke test
  - id: changelog
    resource: packages/orm/CHANGELOG.md
    title: "@theokit/orm changelog"
---

Schema export is how the TypeScript-only decision recorded in
[@theokit/di](/packages/theokit-di.md) stays workable across languages. The container
does not cross language boundaries; the **contract** does.

```typescript
import { exportSchemas } from "@theokit/orm/schema-export";

const schemas = exportSchemas({ users });
// schemas.users is JSON Schema 7
```

# Its own entry point

This module is published as a separate subpath, `@theokit/orm/schema-export`, with its
own `tsup` entry — it is not re-exported from the main barrel.[^export] So a consumer
generating schemas at build time does not pull the repository, the decorators or
`drizzle-orm`'s runtime surface into that script.

# API

```typescript
function exportSchema(table: Table): JsonSchema7;
function exportSchemas(schema: Record<string, Table>): Record<string, JsonSchema7>;
```

`exportSchemas` keys its output by the **SQL table name**, not by the key you passed
in. Passing `{ userTable: users }` where the table is declared as
`sqliteTable("users", ...)` yields `{ users: ... }`.[^export]

# The emitted shape

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "users",
  "type": "object",
  "properties": { "...": {} },
  "required": ["..."],
  "additionalProperties": false
}
```

A column is `required` when it is `notNull` **and** has no default — the correct rule
for an insert contract, since a defaulted column need not be supplied.[^export]
`additionalProperties: false` is always emitted, so the schema rejects unknown fields
rather than tolerating them.

# Column mapping

Twelve column families are recognised, tried in order by an ordered matcher list. Order
matters: `enum` is checked before everything, and `uuid` before the generic string
rules, so the more specific mapping always wins.[^export]

| Drizzle column | JSON Schema |
|---|---|
| enum | `string` + `enum` |
| uuid | `string`, `format: uuid` |
| numeric / decimal | `string`, `format: decimal`, `multipleOf` from `scale` |
| bigint | `string`, `format: int64` |
| timestamp / date | `string`, `format: date-time` |
| blob / bytea / binary | `string`, `contentEncoding: base64` |
| boolean | `boolean` |
| json | `object` |
| integer | `integer` |
| real / double / float | `number` |
| text / varchar / char | `string`, `maxLength` from `length` |

Three of these are deliberately not the obvious mapping. `bigint` and `numeric` become
strings because JSON numbers are IEEE 754 doubles and would silently lose precision on
a 64-bit id or a money amount. `multipleOf: 10 ** -scale` on a decimal encodes the
declared scale as a validation rule, so `numeric(10, 2)` yields `multipleOf: 0.01`.

# Unknown columns fail loudly

A column matching none of the twelve throws
[`OrmSchemaExportError`](/api/orm-errors.md) naming the column, the table and both the
`dataType` and `columnType` it saw.[^export]

There is no silent fallback to `string`, and that is the correct trade. A guessed type
propagates into every downstream consumer's model and surfaces as a data bug in another
language, far from here.

# Proven across a language boundary

The polyglot claim is exercised, not asserted: an integration test exports a schema,
loads it into a Python SQLAlchemy `MetaData`, and runs `create_all` against in-memory
SQLite.[^python] It skips when Python 3.10+ or `sqlalchemy` is unavailable, which is
why the suite stays green on machines without them — a skip recorded in
[test inventory](/architecture/testing.md).

The harness at `tests/integration/scripts/load_schema.py` is kept as a reference for
consumers wanting to load orm-emitted schemas into their own models.[^changelog]

[^export]: Schema export implementation
[^tests]: Schema export test suite
[^python]: Python SQLAlchemy polyglot smoke test
[^changelog]: `@theokit/orm` changelog
