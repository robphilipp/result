/**
 * A small utility representing an optional value that may be present or absent.
 *
 * It is similar in spirit to Java's `Optional`. Use `Optional.of` when you know the
 * value is present, and `Optional.ofNullable` when the value may be `null` or `undefined`.
 *
 * @example
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
     * @param value The value to wrap in an `Optional`
     * @return An `Optional` containing the provided value.
     * @example
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
     * @param value The value to wrap in an `Optional`
     * @return An `Optional` containing the provided value if it is not `null` or `undefined`,
     * otherwise an empty `Optional`.
     * @example
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
     * @return An empty `Optional`.
     * @example
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
     * @return `true` if the optional is empty, `false` otherwise.
     * @example
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
     * @return `true` if the optional contains a value, `false` otherwise.
     * @example
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
     * @param defaultValue The default value to return if the optional is empty.
     * @return The contained value if present, otherwise the provided default.
     * @example
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
     * @param supplier A function that produces an error to throw if the optional is empty.
     * @return The contained value if present, otherwise throws the error produced by `supplier`.
     * @throws The error produced by `supplier` if the optional is empty.
     * @example
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
     * @param mapper A function that transforms the contained value.
     * @return An `Optional` containing the result of the transformation if the optional is not empty,
     * otherwise an empty `Optional`.
     * @template U The type of the result of the transformation.
     * @example
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
     * @param predicate The predicate that determines whether the value should be kept or discarded
     * @return An `Optional` containing the value if it matches the predicate, or an empty `Optional` otherwise.
     * @example
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

    /**
     * Applies the specified function to the value in the optional has a value
     * @param fn Function that is applied to the value
     * @return The original optional
     * @example
     * ```ts
     * Optional.of(10).ifPresent(v => console.log(v)); // prints 10
     * Optional.empty<number>().ifPresent(v => console.log(v)); // does not print anything
     * ```
     */
    ifPresent(fn: (value: T) => void): Optional<T> {
        if (this.isNotEmpty()) {
            fn(this.value as T)
        }
        return this
    }
}