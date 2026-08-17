---
type: Package
title: "@theokit/di-agent"
description: Agent-first DI integration — a REQUEST-scoped Agent provider plus sixteen declarative agent-capability decorators.
resource: https://www.npmjs.com/package/@theokit/di-agent
tags: [package, di, agent, decorators]
generated: { by: claude-code/claude-opus-5, at: 2026-08-06T15:00:00Z }
sources:
  - id: pkg
    resource: packages/di-agent/package.json
    title: "@theokit/di-agent package manifest"
  - id: readme
    resource: packages/di-agent/README.md
    title: "@theokit/di-agent README"
  - id: barrel
    resource: packages/di-agent/src/index.ts
    title: Public barrel of @theokit/di-agent
  - id: changelog
    resource: packages/di-agent/CHANGELOG.md
    title: "@theokit/di-agent changelog"
  - id: rootreadme
    resource: README.md
    title: theokit-di monorepo README
---

`@theokit/di-agent` bridges [@theokit/di](/packages/theokit-di.md) and the
`@theokit/sdk` Agent runtime. Its stated wedge is a single guarantee: every HTTP
request gets its own isolated Agent, without the application wiring one by
hand.[^readme]

Beyond that wedge it also carries a large decorator surface — sixteen decorators
that describe agentic capabilities declaratively. Read
[metadata-only agent decorators](/caveats/metadata-only-agent-decorators.md) before
relying on them: in this repository they record metadata and nothing consumes it.

# Identity

Name
: `@theokit/di-agent`

Version
: `0.2.0`[^pkg]

License
: Apache-2.0

Peer dependencies
: `@theokit/di@^0.1.0-next.0`, `@theokit/sdk@^1.3.0`, `reflect-metadata@^0.2.0`[^pkg]

The SDK is consumed as a published npm dependency, not a workspace link, so the SDK
and the DI ecosystem can move on separate cadences. Decorators are an optional DX
layer — the earlier rule that made them mandatory was revoked.[^rootreadme]

# The three load-bearing exports

| Export | What it does |
|---|---|
| `AGENT_TOKEN` | The string token `"@theokit/di-agent:Agent"` every piece agrees on. |
| `createAgentProvider({ factory, scope? })` | Builds a `FactoryProvider` for that token, REQUEST-scoped by default. |
| `InjectAgent()` | Parameter decorator; exactly `Inject(AGENT_TOKEN)`, but it states intent. |

These are covered in [agent provider](/api/agent-provider.md), and the end-to-end
HTTP pattern is in [one agent per HTTP request](/guides/request-scope-http.md).

# The decorator surface

Sixteen decorators cover tools, sub-agents, squads, workflow steps, retrieval,
reranking, text splitting, memory scoping, sandboxing, human-in-the-loop, cron,
subscriptions, auth, evaluation and auto-summarization. Each writes a
[metadata key](/api/metadata-keys.md) and ships a paired reader function. They are
catalogued in [agent decorators](/api/agent-decorators.md).

One of them has a real consumer inside this package:
[`buildWorkflow`](/api/workflow-builder.md) compiles a `@Step`-decorated class into a
`@theokit/sdk` Workflow. That module is the package's only bridge that actually
imports the SDK at runtime; every other decorator module is metadata-only.[^barrel]

# Version history in brief

`0.1.0` shipped the wedge — `@InjectAgent`, `createAgentProvider`, `AGENT_TOKEN` —
validated against OpenRouter (`openai/gpt-4o-mini`) in an env-gated integration
test. `0.2.0` added the declarative team and workflow authoring surface: `@Squad`,
`@Step` and `buildWorkflow`, deliberately composing the existing SDK Workflow engine
rather than introducing a second one.[^changelog]

[^pkg]: `@theokit/di-agent` package manifest
[^readme]: `@theokit/di-agent` README
[^barrel]: Public barrel of `@theokit/di-agent`
[^changelog]: `@theokit/di-agent` changelog
[^rootreadme]: theokit-di monorepo README
