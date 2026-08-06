---
type: Caveat
title: Metadata-only agent decorators
description: Fourteen of the sixteen @theokit/di-agent decorators record metadata that nothing in this repository consumes.
resource: packages/di-agent/src/decorators
tags: [caveat, di-agent, decorators, expectations]
generated: { by: claude-code/claude-opus-5, at: 2026-08-06T15:00:00Z }
sources:
  - id: decorators
    resource: packages/di-agent/src/decorators
    title: "@theokit/di-agent decorator modules"
  - id: barrel
    resource: packages/di-agent/src/index.ts
    title: Public barrel of @theokit/di-agent
  - id: builder
    resource: packages/di-agent/src/workflow-builder.ts
    title: buildWorkflow implementation
  - id: rootreadme
    resource: README.md
    title: theokit-di monorepo README
---

[@theokit/di-agent](/packages/theokit-di-agent.md) exports sixteen
[agent decorators](/api/agent-decorators.md). Two of them have a consumer in this
repository. The other fourteen write metadata and stop there.

This is not a defect — it is what the package is. But `@Tool`, `@Cron` and `@Auth` read
like they *do* something, so it is worth being precise about where the behaviour lives.

# The split

Consumed here
: `@Step` and `@Workflow`, both read by
  [`buildWorkflow`](/api/workflow-builder.md), which compiles them into a real
  `@theokit/sdk` Workflow.[^builder]

Metadata only
: `@Tool`, `@SubAgent`, `@Squad`, `@UseSandbox`, `@Hitl`, `@AutoSummarize`, `@Cron`,
  `@Subscription`, `@Auth`, `@EvalDecorator`, `@Retriever`, `@Reranker`,
  `@TextSplitter` and `@MemoryScopeDecorator`.

Each of the fourteen is complete on its own terms: a decorator that writes a
[metadata key](/api/metadata-keys.md), and a reader that gets it back.[^decorators] The
package ships both halves and no third piece.

# What this means concretely

Decorating a method with `@Cron({ schedule: "0 * * * *" })` does not schedule anything.
No timer is created, no scheduler is registered, and the method will not be called. The
schedule string is stored on the class constructor where a scheduler could find
it.[^decorators]

Same for the rest. `@Tool` does not register a tool with an Agent, `@Auth` does not
guard anything, `@UseSandbox` does not create a sandbox.

# Why the design is deliberate

The intended consumer is the `@theokit/sdk` runtime, which is a separate npm package on
its own release cadence — see [package topology](/architecture/package-topology.md).
Putting the *declaration* vocabulary here and the *execution* there is what lets the
two version independently.

The key table living in [@theokit/di](/packages/theokit-di.md) rather than in this
package is the same idea taken one step further: a runtime can read `@Tool` metadata
while depending only on the DI package.

Two facts make the direction explicit. The monorepo README states decorators are an
**optional** DX layer and that ADR D431 revoked the rule making them
mandatory.[^rootreadme] And `buildWorkflow` is described in its own header as the
bridge layer — the one module that, unlike the metadata-only decorators, imports the
SDK peer dependency.[^builder]

# Before you rely on one

- Check whether your `@theokit/sdk` version reads that key. This repository cannot tell
  you; the decorators here are write-only.
- Expect no validation. `@Cron({ schedule: "not a cron string" })` stores the string
  as-is — nothing parses it, so a malformed value surfaces wherever it is eventually
  consumed, not at decoration.
- Watch the single-object decorators. `@Hitl` and `@Cron` store one object per class,
  so a second decorated method silently overwrites the first, as
  [agent decorators](/api/agent-decorators.md) records.

# Tracked as

The design itself is intentional and is not filed. One objective defect inside it is:
the `@Hitl` / `@Cron` silent-overwrite, filed as
[usetheodev/theokit-di#6](https://github.com/usetheodev/theokit-di/issues/6).

# Reading the metadata yourself

Every reader is exported, so building your own consumer is a supported path:

```typescript
import { readToolMetadata, readCronMetadata } from "@theokit/di-agent";

const tools = readToolMetadata(MyAgentClass);   // Map<string|symbol, ToolOptions>
const cron = readCronMetadata(MyAgentClass);    // CronMetadata | undefined
```

Map-shaped readers return an empty `Map` when the decorator was never applied;
object-shaped readers return `undefined`.[^decorators]

[^decorators]: `@theokit/di-agent` decorator modules
[^barrel]: Public barrel of `@theokit/di-agent`
[^builder]: `buildWorkflow` implementation
[^rootreadme]: theokit-di monorepo README
