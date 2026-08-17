import "reflect-metadata";

import { METADATA_KEYS } from "@theokit/di";

export interface HitlOptions {
  tools: string[];
  timeoutMs?: number;
}

export interface HitlMetadata extends HitlOptions {
  methodKey: string | symbol;
}

/**
 * `@Hitl(options)` — declare a human-in-the-loop approval handler on a method.
 *
 * Accumulates per method, keyed by the method name, so a class may declare as many
 * handlers as it has methods. It used to keep a single object per class, which meant a
 * second `@Hitl` on the same class silently discarded the first (#6).
 */
export function Hitl(options: HitlOptions): MethodDecorator {
  return (target: object, propertyKey: string | symbol, _descriptor: PropertyDescriptor) => {
    const existing: Map<string | symbol, HitlMetadata> =
      Reflect.getMetadata(METADATA_KEYS.HITL, target.constructor) ?? new Map();
    existing.set(propertyKey, { ...options, methodKey: propertyKey });
    Reflect.defineMetadata(METADATA_KEYS.HITL, existing, target.constructor);
  };
}

/** Read `@Hitl()` metadata off a class constructor, keyed by method (insertion-ordered). */
export function readHitlMetadata(
  target: abstract new (...args: never) => unknown,
): ReadonlyMap<string | symbol, HitlMetadata> {
  return Reflect.getMetadata(METADATA_KEYS.HITL, target) ?? new Map();
}
