import { METADATA_KEYS } from "../internal/metadata.js";

/**
 * `@Primary` — marks a class as the preferred implementation of a token.
 *
 * **This container does not read it.** The decorator records the mark under
 * `METADATA_KEYS.PRIMARY` and nothing else happens: `Container` keeps one
 * registration per token, so registering a second provider for the same token
 * replaces the first regardless of this mark, with a warning on stderr.
 *
 * It stays because the metadata key is exported and the annotation is a real
 * declaration of intent — code generators, module loaders and application
 * wiring can act on it. What it is not is a resolution rule enforced here.
 *
 * Selecting between competing implementations would require the container to
 * hold several registrations per token, which changes cache keys, cycle
 * detection and disposal. That is a design decision, not a missing branch, and
 * it has not been made. Until it is, pick your implementation at registration
 * time:
 *
 * @example
 * ```ts
 * // Decide in the wiring, where the choice is visible:
 * const container = new Container({
 *   providers: [{ provide: PAYMENTS, useClass: useStripe ? StripePayments : PayPalPayments }],
 * });
 *
 * // Read the mark yourself if you want to drive that choice from the class:
 * Reflect.getMetadata(METADATA_KEYS.PRIMARY, StripePayments); // true
 * ```
 */
export function Primary(target: abstract new (...args: never) => unknown): void {
  Reflect.defineMetadata(METADATA_KEYS.PRIMARY, true, target);
}
