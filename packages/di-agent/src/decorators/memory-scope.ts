import "reflect-metadata";

import { METADATA_KEYS } from "@theokit/di";

/** What {@link MemoryScopeDecorator} declares: the `path` naming this scope's place in the
 *  memory hierarchy. */
export interface MemoryScopeOptions {
  path: string;
}

/**
 * Declare the memory scope a property reads and writes, so sibling scopes stay isolated from
 * each other while a child can still see its parent.
 *
 * Records metadata only. Nothing in this package acts on it — the runtime that does lives in
 * `@theokit/sdk`, which is what lets the declaration and the execution version independently.
 */
export function MemoryScopeDecorator(options: MemoryScopeOptions): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    const existing: Map<string | symbol, MemoryScopeOptions> =
      Reflect.getMetadata(METADATA_KEYS.MEMORY_SCOPE, target.constructor) ?? new Map();
    existing.set(propertyKey, options);
    Reflect.defineMetadata(METADATA_KEYS.MEMORY_SCOPE, existing, target.constructor);
  };
}

/** Every `@MemoryScopeDecorator` on a class, keyed by the property it was applied to. */
export function readMemoryScopeMetadata(
  target: abstract new (...args: never) => unknown,
): ReadonlyMap<string | symbol, MemoryScopeOptions> {
  return Reflect.getMetadata(METADATA_KEYS.MEMORY_SCOPE, target) ?? new Map();
}
