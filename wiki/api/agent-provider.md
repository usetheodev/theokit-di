---
type: API Surface
title: Agent provider
description: AGENT_TOKEN, createAgentProvider and @InjectAgent — the three pieces that give each request its own Agent.
resource: packages/di-agent/src/agent-provider.ts
tags: [di-agent, agent, request-scope, api]
generated: { by: claude-code/claude-opus-5, at: 2026-08-06T15:00:00Z }
sources:
  - id: provider
    resource: packages/di-agent/src/agent-provider.ts
    title: createAgentProvider implementation
  - id: inject
    resource: packages/di-agent/src/inject-agent.ts
    title: InjectAgent implementation
  - id: tokens
    resource: packages/di-agent/src/tokens.ts
    title: AGENT_TOKEN
  - id: readme
    resource: packages/di-agent/README.md
    title: "@theokit/di-agent README"
---

This is the wedge of [@theokit/di-agent](/packages/theokit-di-agent.md): three small
exports that together make "one isolated Agent per HTTP request" the default rather
than something each application re-implements.[^readme]

# AGENT_TOKEN

```typescript
export const AGENT_TOKEN = "@theokit/di-agent:Agent";
```

A string token, because `Agent` is a type from another package and a class token would
couple the wiring to the SDK's class identity.[^tokens] It is exported so advanced
consumers can register their own provider under the same token — a test double, a
pre-configured Agent, a per-tenant factory — and every `@InjectAgent()` site picks it
up unchanged.

# createAgentProvider(options)

```typescript
function createAgentProvider<TAgent>(
  options: CreateAgentProviderOptions<TAgent>,
): FactoryProvider<TAgent>;
```

| Option | Type | Default |
|---|---|---|
| `factory` | `() => TAgent \| Promise<TAgent>` | required |
| `scope` | `Scope` | `Scope.REQUEST` |

It returns a plain [`FactoryProvider`](/api/providers.md) bound to `AGENT_TOKEN`. That
is the whole implementation — the package supplies the token and the scope, and the
consumer supplies the factory.[^provider]

The type parameter is structural on purpose. `CreateAgentProviderOptions<TAgent>`
never names the SDK's `Agent` type, so this module has no hard import dependency on
the SDK's type tree; the concrete type flows in from the consumer's own
factory.[^provider]

```typescript
createAgentProvider({
  factory: () =>
    Agent.create({
      apiKey: process.env.OPENROUTER_API_KEY!,
      model: { id: "openai/gpt-4o-mini" },
    }),
});
```

Override `scope` to `SINGLETON` for CLI tools, cron jobs and single-tenant services,
where a shared Agent is not just acceptable but cheaper.[^provider]

# InjectAgent()

```typescript
export function InjectAgent(): ParameterDecorator {
  return Inject(AGENT_TOKEN);
}
```

Literally [`@Inject(AGENT_TOKEN)`](/api/di-decorators.md).[^inject] It exists because
`@InjectAgent()` states intent at the call site, and because it keeps the token string
out of application code — if the token ever changes, consumers do not.

```typescript
@Injectable()
class ChatService {
  constructor(@InjectAgent() private readonly agent: Agent) {}

  async chat(message: string) {
    return this.agent.send(message);
  }
}
```

# Because the factory is async, so is resolution

`Agent.create` returns a Promise, which makes the provider async, which means the
whole chain must be resolved with `resolveAsync`. Calling `resolve()` on a service
that injects an Agent throws
[`AsyncProviderInSyncResolveError`](/api/di-errors.md).

And because the default scope is REQUEST, the resolve must happen inside
[`runInRequest`](/api/container.md) or it throws `ScopeViolationError` instead. The
two constraints combine into one shape:

```typescript
await container.runInRequest(async () => {
  const chat = await container.resolveAsync(ChatService);
  return chat.chat("hello");
});
```

The full HTTP integration, including the `AsyncLocalStorage` pitfall, is in
[one agent per HTTP request](/guides/request-scope-http.md).

[^provider]: `createAgentProvider` implementation
[^inject]: `InjectAgent` implementation
[^tokens]: `AGENT_TOKEN`
[^readme]: `@theokit/di-agent` README
