import { METADATA_KEYS } from "../internal/metadata.js";

/**
 * `@Qualifier(name)` — names which implementation a constructor parameter wants.
 *
 * **This container does not read it.** The decorator records the name under
 * `METADATA_KEYS.QUALIFIER_NAMES`, keyed by parameter index, and resolution
 * ignores it: `Container` holds one registration per token, so there is nothing
 * for a qualifier to choose between.
 *
 * It stays because the metadata key is exported and the annotation is a real
 * declaration of intent that surrounding tooling can act on. What it is not is a
 * resolution rule enforced here.
 *
 * To actually select an implementation today, give each one its own token and
 * inject that token — which is the same decision, made somewhere a reader can
 * see it:
 *
 * @example
 * ```ts
 * const STRIPE = "payments.stripe";
 *
 * @Injectable()
 * class OrderService {
 *   constructor(@Inject(STRIPE) private payments: PaymentGateway) {}
 * }
 * ```
 *
 * @see {@link Primary} — the same limitation, from the provider's side.
 */
export function Qualifier(name: string): ParameterDecorator {
  return (target: object, _propertyKey: string | symbol | undefined, parameterIndex: number) => {
    const existing: Map<number, string> =
      Reflect.getMetadata(METADATA_KEYS.QUALIFIER_NAMES, target) ?? new Map();
    existing.set(parameterIndex, name);
    Reflect.defineMetadata(METADATA_KEYS.QUALIFIER_NAMES, existing, target);
  };
}
