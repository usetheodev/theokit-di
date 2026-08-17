/**
 * The class a class decorator was applied to, as seen by the reader helpers.
 *
 * Spelled as a constructor signature rather than `Function`. `Function` is the widest callable
 * type there is — it accepts any argument list and returns `any` — so it documents nothing and
 * silently admits things that are not classes at all. The constructor form says what the readers
 * actually receive: something you could have written `new` in front of.
 *
 * `abstract` so an abstract base class is accepted, and `...args: never` because the readers only
 * ever pass the value to `Reflect.getMetadata` and never construct it, so the parameter list is
 * deliberately unusable rather than merely unconstrained.
 */
export type DecoratedClass = abstract new (...args: never) => unknown;
