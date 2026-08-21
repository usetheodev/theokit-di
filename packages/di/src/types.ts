/**
 * Public type contract for `@theokit/di`. All consumer-facing types live
 * here; internal types live in `src/internal/`.
 */

/**
 * Constructor of a class — what TypeScript emits for `class X { ... }`.
 * Used as a Class-token.
 */
// biome-ignore lint/suspicious/noExplicitAny: constructor arg types are intentionally `any[]` so any class fits
export type ClassConstructor<T = unknown> = new (...args: any[]) => T;

/**
 * Token: anything that identifies a dependency in the container.
 *
 * Class primary (auto-resolution via `reflect-metadata`),
 * String fallback (for primitives / interfaces). Symbol explicitly NOT
 * supported in v1 (deferred to v2 if real demand surfaces).
 */
export type Token<T = unknown> = ClassConstructor<T> | string;

/**
 * Lifecycle scope. The container honors three modes:
 *
 * - `SINGLETON` — single instance shared across the entire container
 * - `TRANSIENT` — fresh instance per resolve
 * - `REQUEST` — single instance per `container.runInRequest(...)` boundary
 *   (uses Node's `AsyncLocalStorage`)
 */
export const Scope = {
  SINGLETON: "singleton",
  TRANSIENT: "transient",
  REQUEST: "request",
} as const;

export type Scope = (typeof Scope)[keyof typeof Scope];

/**
 * Tells the container HOW to materialize a value for a token.
 * Exactly one of `useClass | useFactory | useValue | useExisting` MUST be set.
 */
export type Provider<T = unknown> =
  | ClassProvider<T>
  | FactoryProvider<T>
  | ValueProvider<T>
  | ExistingProvider<T>;

/**
 * Bind a token to a class the container constructs, resolving its constructor parameters.
 *
 * The common case, and the one the bare-class shorthand expands to: passing `MyService` in
 * `providers` is the same as `{ provide: MyService, useClass: MyService }`.
 *
 * The container built it, so the container tears it down: `dispose()` and `@PreDestroy` both run
 * on `container.dispose()`, in reverse construction order.
 */
export interface ClassProvider<T = unknown> {
  provide: Token<T>;
  useClass: ClassConstructor<T>;
  scope?: Scope;
}

/**
 * Bind a token to whatever a function returns, with its dependencies listed in `inject`.
 *
 * Use it when construction needs more than `new`: a value read from configuration, a handle built
 * by a library, or anything async — a factory may return a Promise, and the token then resolves
 * only through `resolveAsync`. Calling `resolve()` on such a token throws
 * `AsyncProviderInSyncResolveError` rather than handing back the Promise.
 *
 * The container ran the factory, so it tears down what came out — unlike a `useValue`, which it
 * was merely handed.
 */
export interface FactoryProvider<T = unknown> {
  provide: Token<T>;
  // biome-ignore lint/suspicious/noExplicitAny: factory deps are dynamic by definition
  useFactory: (...deps: any[]) => T | Promise<T>;
  inject?: ReadonlyArray<Token>;
  scope?: Scope;
}

/**
 * Bind a token to a value that already exists.
 *
 * The container stores it as given and constructs nothing, so it does not tear it down either:
 * `container.dispose()` leaves a `useValue` alone even when it has a `dispose()` method. You
 * built it and you still hold the reference, so closing it is yours — and a container that closed
 * it too would make an ordinary teardown a double close, which neither side can see coming.
 *
 * The rule is ownership, and it is the same one that decides the other three: the container tears
 * down what it constructed, because in that case nobody else has the reference.
 */
export interface ValueProvider<T = unknown> {
  provide: Token<T>;
  useValue: T;
}

/**
 * Bind a token as an alias for another token.
 *
 * Both names resolve to the same instance rather than to two of it, which is what makes an alias
 * different from registering the same class twice.
 *
 * Disposal follows from that: the instance is torn down once, by the registration that built it,
 * however many aliases point at it. Counting the alias separately would close one resource once
 * per name it answers to.
 */
export interface ExistingProvider<T = unknown> {
  provide: Token<T>;
  useExisting: Token<T>;
}

/**
 * Resolution context passed to factories. Mostly internal but exposed so
 * factories can `inject` siblings without hard-coding container references.
 */
export interface ResolutionContext {
  /** The current resolution path (used for cycle detection). */
  readonly path: ReadonlyArray<Token>;
  /** Synchronously resolve a token within the same context. */
  resolve<U>(token: Token<U>): U;
  /** Asynchronously resolve a token within the same context. */
  resolveAsync<U>(token: Token<U>): Promise<U>;
}

/**
 * Options passed to `new Container({...})`.
 */
export interface ContainerOptions {
  /**
   * Declarative providers seed (NestJS-style). Same effect as calling
   * `container.register(provider)` for each entry.
   */
  providers?: ReadonlyArray<Provider | ClassConstructor>;
  /**
   * When `true`, allows `register()` / `registerModule()` calls AFTER
   * the first `resolve()`. Default `false` — fail-fast on misuse.
   *
   * Containers freeze after first resolve to prevent
   * subtle bugs where a singleton is constructed with one set of
   * registrations and a different set is added later.
   */
  allowDynamicRegistration?: boolean;
}

/**
 * Anything that implements a `dispose()` method participates in lifecycle
 * cleanup when the container or REQUEST scope ends.
 */
export interface Disposable {
  dispose(): void | Promise<void>;
}

/**
 * `analyze()` debug return shape.
 */
export interface DependencyGraph {
  nodes: ReadonlyArray<{
    token: Token;
    scope: Scope;
    isAsync: boolean;
  }>;
  edges: ReadonlyArray<{
    from: Token;
    to: Token;
  }>;
  cycles: ReadonlyArray<ReadonlyArray<Token>>;
}

/**
 * Narrow capability the module-loader needs from a container: the ability to
 * register a provider. Declared here (a leaf type module) so `module-loader.ts`
 * depends on this interface instead of the concrete `Container` class — which
 * imports `loadModule` back from the loader, forming a type-only cycle
 * The concrete `Container` satisfies this structurally.
 */
export interface ModuleRegistrar {
  register<T>(providerOrClass: Provider<T> | ClassConstructor<T>): void;
}
