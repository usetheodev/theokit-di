---
type: API Surface
title: Agent context columns
description: withAgentContext and the auto-filling of agentId, runId and conversationId on insert and update.
resource: packages/orm/src/als-context.ts
tags: [orm, agent, provenance, asynclocalstorage]
generated: { by: claude-code/claude-opus-5, at: 2026-08-06T15:00:00Z }
sources:
  - id: als
    resource: packages/orm/src/als-context.ts
    title: Agent AsyncLocalStorage context
  - id: filler
    resource: packages/orm/src/internal/agent-column-filler.ts
    title: Agent column filler
  - id: tests
    resource: packages/orm/tests/integration/agent-aware-columns.test.ts
    title: Agent-aware columns test suite
---

This is what makes [@theokit/orm](/packages/theokit-orm.md) *agent-aware* rather than
just another repository layer: rows written inside an agent run carry that run's
provenance without any call site mentioning it.

```typescript
await withAgentContext({ agentId: "agent-123", runId: "run-456" }, async () => {
  await repo.insert({ id: "u1", name: "Ada" });
  // stored row also has agent_id = "agent-123", run_id = "run-456"
});
```

# The API

```typescript
function withAgentContext<R>(ctx: AgentContext, fn: () => R | Promise<R>): Promise<R>;
function getAgentContext(): AgentContext | undefined;

interface AgentContext {
  agentId?: string;
  runId?: string;
  conversationId?: string;
}
```

All three fields are optional, so a caller may set only what it knows.[^als]

`withAgentContext` always returns a Promise, even wrapping a synchronous function —
`Promise.resolve(als.run(...))`. Convenient for uniformity, but it means a synchronous
callback still requires an `await` at the call site.

# The fill rule

`fillAgentColumns` runs inside [`Repository`](/api/repository.md)'s `insert` and
`update`, before the payload reaches Drizzle. A column is filled only when all three
conditions hold:[^filler]

1. The column exists on the table — read from Drizzle's real column list, not guessed.
2. The payload's value for it is `undefined`.
3. The context supplies a value for it.

Condition 2 is the one to internalise: an explicit value always wins. Passing
`agentId: "override"` inside a context keeps `"override"`. The context fills gaps, it
never overwrites intent.

The tracked names are exactly `agentId`, `runId` and `conversationId`, matched against
the Drizzle property names, so a column declared as
`agentId: text("agent_id")` matches on `agentId`.

# The development-mode warning

A table that has one of these columns but is written with no context active logs a
warning — once per table, in non-production only:[^filler]

```
[@theokit/orm] Table has agentId/runId/conversationId column(s) but no AgentContext
set. Wrap calls with withAgentContext({...}, () => ...) to auto-fill.
```

De-duplication uses a `WeakSet` keyed on the table object, so a hot insert loop warns
once rather than once per row and the table can still be garbage-collected. It is
suppressed when `NODE_ENV === "production"`, on the reasoning that a warning nobody
reads on every request is worse than no warning.

Deliberately, this is a warning and not an error. A table may legitimately carry an
`agentId` that is filled by non-agent code paths, so refusing the write would be wrong.

# It is orthogonal to the container

`withAgentContext` is a free function over its own `AsyncLocalStorage`. It does not
touch [`Container`](/api/container.md), does not require
[REQUEST scope](/api/scopes.md), and works with a repository built by
`createRepository`. An HTTP service will usually open both boundaries at the same
point — see [one agent per HTTP request](/guides/request-scope-http.md) — but neither
depends on the other.

Its cousin is the transaction context in [@Transactional](/api/transactional.md): the
same `AsyncLocalStorage` technique, a separate store, and the same propagation caveat
about callbacks that escape the Promise chain.

[^als]: Agent `AsyncLocalStorage` context
[^filler]: Agent column filler
[^tests]: Agent-aware columns test suite
