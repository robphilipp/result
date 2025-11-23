/**
 * A small utility representing an optional value that may be present or absent.
 *
 * It is similar in spirit to Java's `Optional`. Use `Optional.of` when you know the
 * value is present, and `Optional.ofNullable` when the value may be `null` or `undefined`.
 *
 * Examples
 * ```ts
 * // Creating non-empty and empty optionals
 * const a = Optional.of(42);
 * a.isNotEmpty(); // true
 * a.isEmpty(); // false
 *
 * const b = Optional.ofNullable(undefined);
 * b.isEmpty(); // true
 *
 * // Supplying defaults
 * Optional.empty<number>().getOrElse(20); // 20
 *
 * // Throwing when absent
 * Optional.empty<string>().getOrThrow(() => new Error('Value is missing')); // throws
 *
 * // Mapping and filtering
 * Optional.of(5).map(v => v * 2).getOrElse(0); // 10
 * Optional.of(10).filter(v => v > 5).getOrElse(0); // 10
 * Optional.of(3).filter(v => v > 5).isEmpty(); // true
 * ```
 */
export class Optional<T> {
    private constructor(private readonly value: T | null | undefined) {}

    /**
     * Create a non-empty `Optional` from a non-null / non-undefined value.
     *
     * Example
     * ```ts
     * const optional = Optional.of(42);
     * optional.isNotEmpty(); // true
     * optional.isEmpty(); // false
     * ```
     */
    static of<T>(value: NonNullable<T>): Optional<T> {
        return new Optional(value)
    }

    /**
     * Create an `Optional` that may be empty if the provided value is `null` or `undefined`.
     *
     * Examples
     * ```ts
     * Optional.ofNullable('hello').isNotEmpty(); // true
     * Optional.ofNullable(null).isEmpty();       // true
     * Optional.ofNullable(undefined).isEmpty();  // true
     * ```
     */
    static ofNullable<T>(value?: T | null): Optional<T> {
        return new Optional(value)
    }

    /**
     * Create an empty `Optional`.
     *
     * Example
     * ```ts
     * const optional = Optional.empty();
     * optional.isEmpty(); // true
     * ```
     */
    static empty<T>(): Optional<T> {
        return Optional.ofNullable()
    }

    /**
     * Check whether the optional is empty (its value is `null` or `undefined`).
     *
     * Examples
     * ```ts
     * Optional.empty().isEmpty(); // true
     * Optional.of('value').isEmpty(); // false
     * ```
     */
    isEmpty(): boolean {
        return this.value === null || this.value === undefined
    }

    /**
     * Check whether the optional contains a value (not `null`/`undefined`).
     *
     * Examples
     * ```ts
     * Optional.of(123).isNotEmpty(); // true
     * Optional.empty().isNotEmpty(); // false
     * ```
     */
    isNotEmpty(): this is Optional<NonNullable<T>> {
        return this.value !== null && this.value !== undefined
    }

    /**
     * Return the contained value if present, otherwise return the provided default.
     *
     * Examples
     * ```ts
     * Optional.of(10).getOrElse(20); // 10
     * Optional.empty<number>().getOrElse(20); // 20
     * ```
     */
    getOrElse(defaultValue: T): T {
        if (this.isNotEmpty()) {
            return this.value as T
        }
        return defaultValue
    }

    /**
     * Return the contained value if present, otherwise throw the error produced by `supplier`.
     *
     * Examples
     * ```ts
     * Optional.of('test').getOrThrow(() => new Error('Value is missing')); // 'test'
     *
     * // Throws
     * Optional.empty<string>().getOrThrow(() => new Error('Value is missing'));
     * ```
     */
    getOrThrow<E extends Error>(supplier: () => E): T {
        if (this.isNotEmpty()) {
            return this.value as T
        }
        throw supplier()
    }

    /**
     * Transform the contained value with `mapper` if present, otherwise return an empty `Optional`.
     *
     * Examples
     * ```ts
     * Optional.of(5).map(v => v * 2).getOrElse(0);          // 10
     * Optional.empty<number>().map(v => v * 2).isEmpty();    // true
     * ```
     */
    map<U>(mapper: (value: T) => U): Optional<U> {
        if (this.isNotEmpty()) {
            return Optional.ofNullable<U>(mapper(this.value as T))
        }
        return Optional.empty<U>()
    }

    /**
     * Keep the value only if it matches the `predicate`; otherwise return an empty `Optional`.
     *
     * Examples
     * ```ts
     * Optional.of(10).filter(v => v > 5).getOrElse(0); // 10
     * Optional.of(3).filter(v => v > 5).isEmpty();     // true
     * Optional.empty<number>().filter(v => v > 5).isEmpty(); // true
     * ```
     */
    filter(predicate: (value: T) => boolean): Optional<T> {
        if (this.isNotEmpty() && predicate(this.value as T)) {
            return Optional.ofNullable<T>(this.value as T)
        }
        return Optional.empty<T>()
    }
}