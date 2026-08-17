---
type: API Surface
title: Agent decorators
description: The sixteen declarative agent-capability decorators of @theokit/di-agent, their options and their metadata keys.
resource: packages/di-agent/src/decorators
tags: [di-agent, decorators, api, metadata]
generated: { by: claude-code/claude-opus-5, at: 2026-08-06T15:00:00Z }
sources:
  - id: decorators
    resource: packages/di-agent/src/decorators
    title: "@theokit/di-agent decorator modules"
  - id: barrel
    resource: packages/di-agent/src/index.ts
    title: Public barrel of @theokit/di-agent
  - id: changelog
    resource: packages/di-agent/CHANGELOG.md
    title: "@theokit/di-agent changelog"
---

[@theokit/di-agent](/packages/theokit-di-agent.md) ships sixteen decorators that
describe agent capabilities declaratively. Each writes a
[metadata key](/api/metadata-keys.md) and exports a paired reader.

Read [metadata-only agent decorators](/caveats/metadata-only-agent-decorators.md)
first. Within this repository only `@Step` and `@Workflow` have a consumer
([`buildWorkflow`](/api/workflow-builder.md)); the other fourteen record metadata that
nothing here acts on.

# Uniform shape

Every module follows the same three-line pattern, which is why the catalogue below can
be a table rather than sixteen sections.

```typescript
export function Tool(options: ToolOptions): PropertyDecorator {
  return (target, propertyKey) => {
    const existing = Reflect.getMetadata(METADATA_KEYS.TOOL, target.constructor) ?? new Map();
    existing.set(propertyKey, options);
    Reflect.defineMetadata(METADATA_KEYS.TOOL, existing, target.constructor);
  };
}
```

Property and method decorators accumulate into a `Map` keyed by property name, so one
class can declare many tools or many steps. Class decorators store a single object and
a second application overwrites the first.[^decorators]

All of them store metadata on the **constructor**, never the prototype, so readers take
the class rather than an instance.

# Class decorators

One per class; the metadata is a single object.

| Decorator | Options | Reader |
|---|---|---|
| `@Auth` | `providers?`, `sessionConfig?` | `readAuthMetadata` |
| `@AutoSummarize` | `triggerFraction?`, `keepNewest?`, `model?` | `readAutoSummarizeMetadata` |
| `@EvalDecorator` | `name?`, `scorers?`, `dataset?` | `readEvalDecoratorMetadata` |
| `@Workflow` | `name?`, `retryPolicy?`, `inputSchema?`, `outputSchema?` | `readWorkflowMetadata` |

`@AutoSummarize` is the only decorator that applies defaults at decoration time rather
than storing what was passed: `triggerFraction: 0.85` and `keepNewest: 4` are merged in
before the metadata is written, so a reader always sees resolved values.[^decorators]

The export name `EvalDecorator` is deliberate — `Eval` would shadow the global.

# Property decorators

Many per class; the metadata is a `Map` keyed by property name.

| Decorator | Options | Reader |
|---|---|---|
| `@Tool` | `name`, `description`, `inputSchema?` | `readToolMetadata` |
| `@SubAgent` | `name`, `description`, `instructions`, `model?`, `maxDelegationDepth?` | `readSubAgentMetadata` |
| `@Squad` | `agents`, `process?`, `name?` | `readSquadMetadata` |
| `@UseSandbox` | `backend?`, `workDir?`, `timeoutMs?` | `readSandboxMetadata` |
| `@Retriever` | `topK?`, `threshold?` | `readRetrieverMetadata` |
| `@Reranker` | `provider?`, `model?`, `topN?` | `readRerankerMetadata` |
| `@TextSplitter` | `strategy?`, `chunkSize?`, `overlap?` | `readTextSplitterMetadata` |
| `@MemoryScopeDecorator` | `path` | `readMemoryScopeMetadata` |
| `@Subscription` | `name`, `transport?` | `readSubscriptionMetadata` |

`@Squad` declares a sequential agent team by naming the agent properties that compose
it. `process` accepts `"sequential"` or `"hierarchical"`, defaulting to sequential when
omitted; it mirrors the SDK's `createSquad` factory.[^decorators]

# Method decorators

| Decorator | Options | Reader | Shape |
|---|---|---|---|
| `@Step` | `after?`, `name?` | `readStepMetadata` | `Map` per class |
| `@Hitl` | `tools`, `timeoutMs?` | `readHitlMetadata` | `Map` per class |
| `@Cron` | `schedule`, `timezone?` | `readCronMetadata` | `Map` per class |

All three accumulate per method, keyed by the method name, and each folds that name into
the metadata as `methodKey` as well. A class may therefore declare as many scheduled
routines or approval handlers as it has methods.[^decorators]

That was not always true. `@Hitl` and `@Cron` used to keep a single object per class, so
decorating a second method silently discarded the first — the defect recorded in
[metadata-only agent decorators](/caveats/metadata-only-agent-decorators.md) and fixed in
[usetheodev/theokit-di#6](https://github.com/usetheodev/theokit-di/issues/6).

`@Step` is the one method decorator with a working consumer here —
[`buildWorkflow`](/api/workflow-builder.md) compiles its map into an SDK Workflow.

# Reader defaults

Map-shaped readers return an empty `Map` when the decorator was never applied; object-
shaped readers return `undefined`.[^decorators] So a consumer iterating tools can do so
unconditionally, while a consumer checking for `@Auth` must test for `undefined`.

[^decorators]: `@theokit/di-agent` decorator modules
[^barrel]: Public barrel of `@theokit/di-agent`
[^changelog]: `@theokit/di-agent` changelog
