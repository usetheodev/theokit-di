import "reflect-metadata";
import { METADATA_KEYS } from "@theokit/di";

import type { DecoratedClass } from "./decorated-class.js";

export interface EvalOptions {
  name?: string;
  scorers?: unknown[];
  dataset?: unknown;
}

export function EvalDecorator(options: EvalOptions = {}): ClassDecorator {
  return (target) => {
    Reflect.defineMetadata(METADATA_KEYS.EVAL, options, target);
  };
}

export function readEvalDecoratorMetadata(target: DecoratedClass): EvalOptions | undefined {
  return Reflect.getMetadata(METADATA_KEYS.EVAL, target) as EvalOptions | undefined;
}
