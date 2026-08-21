import "reflect-metadata";
import { METADATA_KEYS } from "@theokit/di";

/** What {@link Reranker} declares: which provider and model score the candidates, and how many
 *  survive (`topN`). */
export interface RerankerOptions {
  provider?: string;
  model?: string;
  topN?: number;
}

/**
 * Declare a property as the reranking step that reorders what a retriever returned.
 *
 * Records metadata only. Nothing in this package acts on it — the runtime that does lives in
 * `@theokit/sdk`, which is what lets the declaration and the execution version independently.
 */
export function Reranker(options: RerankerOptions): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    const existing: Map<string | symbol, RerankerOptions> =
      Reflect.getMetadata(METADATA_KEYS.RERANKER, target.constructor) ?? new Map();
    existing.set(propertyKey, options);
    Reflect.defineMetadata(METADATA_KEYS.RERANKER, existing, target.constructor);
  };
}

/** Every `@Reranker` on a class, keyed by the property it was applied to. */
export function readRerankerMetadata(
  target: abstract new (...args: never) => unknown,
): ReadonlyMap<string | symbol, RerankerOptions> {
  return Reflect.getMetadata(METADATA_KEYS.RERANKER, target) ?? new Map();
}
