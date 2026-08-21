import { AsyncLocalStorage } from "node:async_hooks";
import type { AgentContext } from "./types.js";

const als = new AsyncLocalStorage<AgentContext>();

/**
 * Run `fn` with an agent context attached, so repositories can stamp agent-aware columns without
 * the caller threading the ids through every function in between.
 *
 * The context follows the async chain rather than the call stack, so it survives every `await`
 * inside `fn`. It does NOT survive an escape from that chain: a bare `setTimeout` or `setImmediate`
 * inside `fn` starts a new chain and sees no context. Wrap the whole unit of work, not a fragment
 * of it.
 *
 * @returns whatever `fn` returns, always as a Promise, so a synchronous and an asynchronous `fn`
 *   are called the same way.
 */
export function withAgentContext<R>(ctx: AgentContext, fn: () => R | Promise<R>): Promise<R> {
  return Promise.resolve(als.run(ctx, fn));
}

/**
 * The agent context of the current async chain, or `undefined` outside {@link withAgentContext}.
 *
 * `undefined` is a normal answer, not an error: a repository writing agent-aware columns leaves
 * them unset rather than refusing the write, because plain application code has no agent to name.
 */
export function getAgentContext(): AgentContext | undefined {
  return als.getStore();
}
