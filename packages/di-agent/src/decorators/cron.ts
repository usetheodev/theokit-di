import "reflect-metadata";
import { METADATA_KEYS } from "@theokit/di";

export interface CronOptions {
  schedule: string;
  timezone?: string;
}

export interface CronMetadata extends CronOptions {
  methodKey: string | symbol;
}

/**
 * `@Cron(options)` — declare a scheduled routine on a method.
 *
 * Accumulates per method, keyed by the method name, so a class may schedule as many
 * routines as it has methods. It used to keep a single object per class, which meant a
 * second `@Cron` on the same class silently discarded the first (#6).
 */
export function Cron(options: CronOptions): MethodDecorator {
  return (target: object, propertyKey: string | symbol, _descriptor: PropertyDescriptor) => {
    const existing: Map<string | symbol, CronMetadata> =
      Reflect.getMetadata(METADATA_KEYS.CRON, target.constructor) ?? new Map();
    existing.set(propertyKey, { ...options, methodKey: propertyKey });
    Reflect.defineMetadata(METADATA_KEYS.CRON, existing, target.constructor);
  };
}

/** Read `@Cron()` metadata off a class constructor, keyed by method (insertion-ordered). */
export function readCronMetadata(
  target: abstract new (...args: never) => unknown,
): ReadonlyMap<string | symbol, CronMetadata> {
  return Reflect.getMetadata(METADATA_KEYS.CRON, target) ?? new Map();
}
