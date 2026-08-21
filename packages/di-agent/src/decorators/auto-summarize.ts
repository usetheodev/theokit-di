import "reflect-metadata";

import { METADATA_KEYS } from "@theokit/di";

import type { DecoratedClass } from "./decorated-class.js";

/** What {@link AutoSummarize} declares: the `triggerFraction` of the context window that starts a
 *  summarisation, how many recent turns to `keepNewest` verbatim, and optionally which `model`
 *  writes the summary. */
export interface AutoSummarizeOptions {
  triggerFraction?: number;
  keepNewest?: number;
  model?: string;
}

const DEFAULTS: Required<Omit<AutoSummarizeOptions, "model">> = {
  triggerFraction: 0.85,
  keepNewest: 4,
};

/**
 * Declare that a conversation is summarised automatically as it approaches the context limit, so
 * it can continue past the point where it would otherwise be truncated.
 *
 * Defaults are resolved at decoration time, so a reader of the metadata sees real values rather
 * than having to know them.
 *
 * Records metadata only. Nothing in this package acts on it — the runtime that does lives in
 * `@theokit/sdk`, which is what lets the declaration and the execution version independently.
 */
export function AutoSummarize(options: AutoSummarizeOptions = {}): ClassDecorator {
  return (target) => {
    const resolved = { ...DEFAULTS, ...options };
    Reflect.defineMetadata(METADATA_KEYS.AUTO_SUMMARIZE, resolved, target);
  };
}

/** The `@AutoSummarize` of a class with its defaults resolved, or `undefined` when it has none.
 *
 *  Class decorators are singular by nature, so this returns one object or `undefined` — unlike the
 *  property and method decorators, which accumulate into a map. */
export function readAutoSummarizeMetadata(
  target: DecoratedClass,
): (Required<Omit<AutoSummarizeOptions, "model">> & { model?: string }) | undefined {
  return Reflect.getMetadata(METADATA_KEYS.AUTO_SUMMARIZE, target) as
    | (Required<Omit<AutoSummarizeOptions, "model">> & { model?: string })
    | undefined;
}
