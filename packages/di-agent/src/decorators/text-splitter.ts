import "reflect-metadata";
import { METADATA_KEYS } from "@theokit/di";

/** What {@link TextSplitter} declares: the splitting `strategy`, the target `chunkSize`, and how
 *  much `overlap` consecutive chunks share so a passage split mid-sentence is still retrievable
 *  from either side. */
export interface TextSplitterOptions {
  strategy?: string;
  chunkSize?: number;
  overlap?: number;
}

/**
 * Declare a property as the step that breaks documents into indexable chunks.
 *
 * Records metadata only. Nothing in this package acts on it — the runtime that does lives in
 * `@theokit/sdk`, which is what lets the declaration and the execution version independently.
 */
export function TextSplitter(options: TextSplitterOptions): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    const existing: Map<string | symbol, TextSplitterOptions> =
      Reflect.getMetadata(METADATA_KEYS.TEXT_SPLITTER, target.constructor) ?? new Map();
    existing.set(propertyKey, options);
    Reflect.defineMetadata(METADATA_KEYS.TEXT_SPLITTER, existing, target.constructor);
  };
}

/** Every `@TextSplitter` on a class, keyed by the property it was applied to. */
export function readTextSplitterMetadata(
  target: abstract new (...args: never) => unknown,
): ReadonlyMap<string | symbol, TextSplitterOptions> {
  return Reflect.getMetadata(METADATA_KEYS.TEXT_SPLITTER, target) ?? new Map();
}
