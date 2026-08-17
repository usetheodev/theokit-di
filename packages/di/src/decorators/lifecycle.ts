import { METADATA_KEYS } from "../internal/metadata.js";

/**
 * `@PostConstruct` — method the container calls once the instance is built and every
 * constructor dependency is injected.
 *
 * Runs once per instance, so a SINGLETON initialises once no matter how often it is
 * resolved. If the method returns a Promise, `container.resolveAsync()` awaits it before
 * handing the instance back; `container.resolve()` cannot await, so it throws
 * `AsyncPostConstructInSyncResolveError` rather than return a half-initialised object.
 * A hook that throws propagates, for the same reason.
 *
 * @example
 * ```ts
 * @Injectable()
 * class CacheService {
 *   private cache!: Map<string, unknown>
 *
 *   @PostConstruct
 *   async init() {
 *     this.cache = await loadCacheFromRedis()
 *   }
 * }
 * ```
 */
export function PostConstruct(target: object, propertyKey: string | symbol): void {
  Reflect.defineMetadata(METADATA_KEYS.POST_CONSTRUCT, propertyKey, target.constructor);
}

/**
 * `@PreDestroy` — method the container calls when the instance is torn down:
 * `container.dispose()` for SINGLETON, the end of `runInRequest()` for REQUEST.
 *
 * Runs BEFORE `dispose()` when the class has both, and is awaited if it returns a
 * Promise. A class needs no `dispose()` to be torn down — declaring this hook is enough
 * for the container to track it. A hook that throws does not stop the remaining
 * instances; the failures surface together as an `AggregateError`.
 *
 * @example
 * ```ts
 * @Injectable()
 * class DbConnection {
 *   @PreDestroy
 *   async close() {
 *     await this.pool.end()
 *   }
 * }
 * ```
 */
export function PreDestroy(target: object, propertyKey: string | symbol): void {
  Reflect.defineMetadata(METADATA_KEYS.PRE_DESTROY, propertyKey, target.constructor);
}
