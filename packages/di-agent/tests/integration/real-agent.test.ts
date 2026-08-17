/**
 * Real-LLM integration test. Calls the actual `@theokit/sdk` `Agent.create()`
 * and `Agent.send()` against a real provider, injected via REQUEST scope.
 *
 * Env-gated: skips if `OPENROUTER_API_KEY` is missing. CI without the key
 * shows an honest skip with reason.
 *
 * Reuses the retry-on-empty pattern so cold-warmup empty content doesn't flake
 * the suite (model-side issue, NOT SDK bug).
 */

import { Container, Injectable, Module } from "@theokit/di";
import { Agent, type SDKAgent } from "@theokit/sdk";
import { describe, expect, it } from "vitest";

import { createAgentProvider, InjectAgent } from "../../src/index.js";

const KEY = process.env.OPENROUTER_API_KEY;
const MODEL = process.env.DI_AGENT_TEST_MODEL ?? "openai/gpt-4o-mini";

if (KEY === undefined || KEY.length === 0) {
  process.stderr.write(
    "[di-agent/integration/real-agent] Skipping — OPENROUTER_API_KEY not set. Set it in .env to run this dogfood gate.\n",
  );
}

async function drainAgentText(agent: SDKAgent, prompt: string): Promise<string> {
  const run = await agent.send(prompt);
  let text = "";
  for await (const event of run.stream()) {
    if (event.type === "assistant") {
      for (const part of event.message.content) {
        if (part.type === "text") text += part.text;
      }
    }
  }
  await run.wait();
  return text;
}

describe.skipIf(KEY === undefined || KEY.length === 0)(
  "@InjectAgent — real LLM integration",
  () => {
    it("resolves a REQUEST-scoped Agent and sends to a real LLM", async () => {
      @Injectable()
      class Echo {
        constructor(@InjectAgent() readonly agent: SDKAgent) {}
      }

      @Module({
        providers: [
          createAgentProvider({
            factory: () =>
              Agent.create({
                apiKey: KEY!,
                model: { id: MODEL },
                providers: { routes: [{ capability: "chat", provider: "openrouter" }] },
              }),
          }),
          Echo,
        ],
      })
      class AppModule {}

      const container = new Container();
      container.registerModule(AppModule);

      const text = await container.runInRequest(async () => {
        const echo = await container.resolveAsync(Echo);
        // Retry-on-empty: a cold warmup may return empty
        // content; retry once with a simpler prompt before failing.
        let reply = await drainAgentText(echo.agent, "Reply with exactly the word PONG.");
        if (reply.length === 0) {
          process.stderr.write(
            "[di-agent/integration/real-agent] Empty content on first send (cold-warmup flake). Retrying once with simpler prompt.\n",
          );
          reply = await drainAgentText(echo.agent, "Say hi.");
        }
        return reply;
      });

      expect(text.length).toBeGreaterThan(0);
    });

    it("each runInRequest gets an isolated Agent (no cross-request leakage)", async () => {
      @Module({
        providers: [
          createAgentProvider({
            factory: () =>
              Agent.create({
                apiKey: KEY!,
                model: { id: MODEL },
                providers: { routes: [{ capability: "chat", provider: "openrouter" }] },
              }),
          }),
        ],
      })
      class AppModule {}

      const container = new Container();
      container.registerModule(AppModule);

      // Two separate runInRequest calls — should produce two distinct
      // Agent instances (asserted via referential inequality).
      const [a, b] = await Promise.all([
        container.runInRequest(async () =>
          container.resolveAsync<SDKAgent>("@theokit/di-agent:Agent"),
        ),
        container.runInRequest(async () =>
          container.resolveAsync<SDKAgent>("@theokit/di-agent:Agent"),
        ),
      ]);

      expect(a).not.toBe(b);
    });
  },
);
