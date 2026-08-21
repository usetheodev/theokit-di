import "reflect-metadata";
import { METADATA_KEYS } from "@theokit/di";

import type { DecoratedClass } from "./decorated-class.js";

/** What {@link EvalDecorator} declares: the evaluation's `name`, the `scorers` that judge a run,
 *  and the `dataset` it runs against. */
export interface EvalOptions {
  name?: string;
  scorers?: unknown[];
  dataset?: unknown;
}

/**
 * Declare an agent class as the subject of an evaluation.
 *
 * Named `EvalDecorator` rather than `Eval` because `eval` is a reserved word in strict mode, and
 * an export nobody can import under its own name is worse than a longer one.
 *
 * Records metadata only. Nothing in this package acts on it — the runtime that does lives in
 * `@theokit/sdk`, which is what lets the declaration and the execution version independently.
 */
export function EvalDecorator(options: EvalOptions = {}): ClassDecorator {
  return (target) => {
    Reflect.defineMetadata(METADATA_KEYS.EVAL, options, target);
  };
}

/** The `@EvalDecorator` of a class, or `undefined` when it has none.
 *
 *  Class decorators are singular by nature, so this returns one object or `undefined` — unlike the
 *  property and method decorators, which accumulate into a map. */
export function readEvalDecoratorMetadata(target: DecoratedClass): EvalOptions | undefined {
  return Reflect.getMetadata(METADATA_KEYS.EVAL, target) as EvalOptions | undefined;
}
