import "reflect-metadata";
import { METADATA_KEYS } from "@theokit/di";

import type { DecoratedClass } from "./decorated-class.js";

export interface AuthOptions {
  providers?: string[];
  sessionConfig?: unknown;
}

export function Auth(options: AuthOptions = {}): ClassDecorator {
  return (target) => {
    Reflect.defineMetadata(METADATA_KEYS.AUTH, options, target);
  };
}

export function readAuthMetadata(target: DecoratedClass): AuthOptions | undefined {
  return Reflect.getMetadata(METADATA_KEYS.AUTH, target) as AuthOptions | undefined;
}
