export interface ToString {
    toString: () => string
}

/**
 * A basic result for use when an operation that returns a result can either succeed or fail.
 * Instead of throwing an exception or returning `undefined` when the operation fails, the {@link Result}
 * can be marked as a failure, and an error object can be returned describing the reason for the failure. When
 * the operation succeeds, the {@link Result} can be marked as a success, and it then holds the
 * result of the operation.
 *
 * Additionally, it provides the chaining of results through {@link Result.map} and {@link Result.andThen}.
 * The {@link reduceToResult} is a reducing function that combine a set of {@link Result}-producing
 * operations into one {@link Result} that is a success iff all the operations are a success. And the
 * {@link forEachResult} accepts a set of {@link Result}s and combines them into one result that is a
 * success if, and only if, all the {@link Result}s are a success.
 *
 * When writing functions that return a {@link Result}, use the {@link successResult} function to create
 * a success {@link Result}. And use the {@link failureResult} function to create a (you guessed it)
 * failure {@link Result}.
 *
 * The {@link Result.succeeded} and {@link Result.failed} properties of a result report whether it
 * is a success or failure.
 *
 * The {@link Result.getOrUndefined} method returns a value on a success, or `undefined` on a failure.
 * The {@link Result.getOrDefault} method returns the value on a success, or the specified value when
 * the {@link Result} is a failure. And the {@link Result.getOrThrow} returns the value on a success, and
 * throws an error, with the error value, on a failure. Although the {@link Result.value} is available,
 * I encourage you not to use it directly, but rather use the above-mentioned accessor methods.
 */
export class Result<S, F extends ToString> {
    /**
     * The success value of the result. This property is meant for internal use only.
     * @see getOrUndefined
     * @see getOrDefault
     * @see getOrThrow
     */
    readonly value?: S;

    /**
     * The failure value of the result. This property is meant for internal use only.
     * @see failureOrUndefined
     */
    readonly error?: F;

    /**
     * Property that is `true` when the result is a success and `false` when the result is a failure
     * @see failed
     */
    readonly succeeded: boolean;

    /**
     * Property that is `true` when the result is a failure and `false` when the result is a success
     * @see succeeded
     */
    readonly failed: boolean;

    private constructor(result: ResultType<S, F>) {
        const { success, failure } = result;
        this.value = success;
        this.error = failure;
        this.succeeded = success !== undefined && failure === undefined;
        this.failed = failure !== undefined;
    }

    /**
     * Determines the equality of this result and the specified one. The results are considered equal if:
     * 1. They are both a success and their values are equal
     * 2. They are both a failure and their errors are equal
     * @param result The result
     * @return `true` if the results are equal; `false` otherwise
     *
     * @example
     * ```typescript
     * // both results are successes and have the same value, so they are equal
     * successResult<string, string>("yay!").equals(successResult("yay!"))
     *
     * // both results are successes but have they different values, so they are not equal
     * successResult<string, string>("yay!").equals(successResult("yippy!"))
     *
     * // a success result can never be equal to a failure result
     * successResult<string, string>("yay!").equals(failureResult("yay!"))
     * failureResult<string, string>("yay!").nonEqual(successResult("yay!"))
     * ```
     */
    equals(result: Result<S, F>): boolean {
        if (result.succeeded !== this.succeeded) {
            return false;
        }
        if (this.succeeded) {
            return result.value === this.value;
        }
        return result.error === this.error;
    }

    /**
     * Determines the equality of this result and the specified one. The results are considered equal if:
     * 1. They are both a success and their values are equal
     * 2. They are both a failure and their errors are equal
     * @param result The result
     * @return `false` if the results are equal; `true` otherwise
     */
    nonEqual(result: Result<S, F>): boolean {
        return !this.equals(result);
    }

    /**
     * Applies the specified `mapper` function to the success value of this result, and returns a new
     * {@link Result} that wraps the result of the `mapper`. When this result is a failure,
     * then it does **not** apply the `mapper`, but rather merely returns this result.
     * @param mapper The mapper function that accepts the success value and returns a new value.
     * @return When this result is a success, then returns a {@link Result} that wraps the result
     * of the `mapper` function. When this result is a failure, then returns this result.
     * @see flatMap
     *
     * @example
     * ```typescript
     * // messageLength is 15
     * const messageLength = successResult("original result").map(value => value.length).getOrDefault(0)
     * ```
     */
    map<SP>(mapper: (value: S) => SP): Result<SP, F> {
        if (this.succeeded && this.value !== undefined) {
            return new Result<SP, F>({ success: mapper(this.value) });
        }
        return new Result<SP, F>({ failure: this.error });
    }

    /**
     * Applies the specified `next` function to the success value of this {@link Result}, and returns the
     * result of the `next` function. When this result is a failure, then it does **not** apply the
     * `next` function, but rather merely returns the failure result.
     * @param next The function to apply to this result's success value
     * @return When this result is a success, then returns the result of the `next` function. When
     * this result is a failure, then returns this result.
     * @see andThen
     * @see conditionalFlatMap
     *
     * @example
     * ```typescript
     * // result is [6, 7, 8, 9, 10]
     * const result = successResult([1, 2, 3, 4])
     *      .flatMap(() => successResult([6, 7, 8, 9, 10]))
     *      .getOrDefault([])
     *
     * // result is [] because the first result is a failure
     * const result = failureResult("failed to work")
     *      .flatMap(() => successResult([6, 7, 8, 9, 10]))
     *      .getOrDefault([])
     *
     * // ...and likewise, the result is [] because the first result is a failure
     * const result = successResult([6, 7, 8, 9, 10])
     *      .flatMap(() => failureResult("failed to work"))
     *      .getOrDefault([])
     *
     * ```
     */
    flatMap<SP>(next: (value: S) => Result<SP, F>): Result<SP, F> {
        if (this.succeeded && this.value !== undefined) {
            return next(this.value);
        }
        return new Result<SP, F>({ failure: this.error });
    }

    /**
     @deprecated Use {@link flatMap} instead.
      * Applies the specified `next` function to the success value of this {@link Result}, and returns the
      * result of the `next` function. When this result is a failure, then it does **not** apply the
      * `next` function, but rather merely returns the failure result.
     * @param next The function to apply to this result's success value
     * @return When this result is a success, then returns the result of the `next` function. When
     * this result is a failure, then returns this result.
     * @see flatMap
     */
    andThen<SP>(next: (value: S) => Result<SP, F>): Result<SP, F> {
        return this.flatMap(next);
    }

    /**
     * *NOTE* that unlike the {@link map} and {@link flatMap} functions, this conditional mapping
     * requires that the Result's value type is the same as the input value type.
     *
     * Applies a mapping function to a value based on a predicate and returns a result. When the predicate
     * is met, then applies the mapping. When the predicate is not met, then returns the original value.
     *
     * @param predicate A function that determines whether the provided value satisfies a condition.
     * @param mapper A function that transforms the value if the predicate is true.
     * @return A `Result` object containing either the transformed success value or the failure value.
     *
     * @example
     * ```typescript
     * // result is 50 (= 5 * 10)
     * const result = successResult(5)
     *      .conditionalMap(
     *          // when the value is odd...
     *          value => value % 2 === 1,
     *          // ...then multiply it by 10
     *          value => value * 10
     *      ).getOrDefault(0)
     * ```
     */
    conditionalMap(predicate: (value: S) => boolean, mapper: (value: S) => S): Result<S, F> {
        if (this.succeeded && this.value !== undefined) {
            return predicate(this.value) ? 
                new Result<S, F>({ success: mapper(this.value) }) : 
                new Result<S, F>({ success: this.value });
        }
        return new Result<S, F>({ failure: this.error });
    }

    /**
     * *NOTE* that unlike the {@link map} and {@link flatMap} functions, this conditional mapping
     * requires that the Result's value type is the same as the input value type.
     *
     * Applies a mapping function to a value based on a predicate and returns a result. When the predicate
     * is met, then applies the mapping. When the predicate is not met, then returns the original value.
     *
     * @param predicate A function that determines whether the provided value satisfies a condition.
     * @param next A function that transforms the value if the predicate is true.
     * @return When this result is a success, then returns the result of the `next` function. When
     * this result is a failure, then returns this result.
     */
    conditionalFlatMap(predicate: (value: S) => boolean, next: (value: S) => Result<S, F>): Result<S, F> {
        if (this.succeeded && this.value !== undefined) {
            return predicate(this.value) ? next(this.value) : new Result<S, F>({ success: this.value });
        }
        return new Result<S, F>({ failure: this.error });
    }

    /**
     * Applies the filter to the success value of this result and returns the result if it matches
     * the filter predicate, or a failure if it doesn't match the predicate. When this result is a
     * failure, then returns that failure.
     * @param filter The filter predicate
     * @param [failureProvider] Optional function that provides the failure when the success result
     * does not match the predicate
     * @return When this result is a success, then returns the success if it matches the predicate or
     * a failure if it does not. When this result is a failure, then returns the failure.
     */
    filter(filter: (value: S) => boolean, failureProvider?: () => F): Result<S, F> {
        if (this.succeeded && this.value !== undefined) {
            return filter(this.value) ?
                new Result<S, F>({ success: this.value }) :
                new Result<S, F>({ failure: failureProvider ? failureProvider() : { toString: () => "Predicate not satisfied" } as F });
        }
        return new Result<S, F>({ failure: this.error });
    }

    /**
     * When this result is a failure, then applies the specified `mapper` function to the failure.
     * When the result is a success, then simply returns a copy of this result. This function is
     * useful when you want to update the failure information at the end of a result chain.
     * @param mapper A mapper that accepts the failure and returns a new failure
     * @return When the result is a failure, maps the failure to a new failure and returns it
     */
    mapFailure<FP>(mapper: (failure: F) => FP): Result<S, FP> {
        if (this.failed && this.error !== undefined) {
            return new Result<S, FP>({ failure: mapper(this.error) });
        }
        return new Result<S, FP>({ success: this.value });
    }

    /**
     * Changes the type of the result when the result is a failure. This is helpful when checking a
     * result for failure and then needing to return a result whose success type is different.
     * @param fallback A fallback failure in case the failure in the result is undefined
     * @return A new failure result with the new success type
     */
    asFailureOf<SP>(fallback: F): Result<SP, F> {
        return new Result<SP, F>({ failure: this.error || fallback });
    }

    /**
     * Convenience method to make it a bit easier to work with chained promises and results.
     *
     *
     * Attempts to lift the Promise out of the result and re-wrap the result as a promise. In other words,
     * attempts to convert a `Result<Promise<S>, F>` into a `Promise<Result<SP>, F` where the type `SP`
     * equals to the type `S` of the resolved promise.
     *
     *
     * Additionally, when lifting a {@link Promise} for a {@link Result} out of a {@link Result}, this function
     * we also flatten the resulting {@link Result} of a {@link Result}. In other words, it will convert
     * `Result<Promise<Result<S, F>, F>` into a `Promise<Result<SP, F>>`.
     *
     * @return a promise to a result whose success type is that same as the type of the promise's resolved value
     */
    async liftPromise<SP>(): Promise<Result<SP, F>> {
        // create a guard to test if the promised value is a result. specifically, the guard ensures that
        // the promised value has a flatMap function. this is a type-predicate signature that returns true
        // when the value has a `flatMap` function, and once asserted, then the value takes on that type.
        const hasAndThen =
            <S, F extends ToString>(value: any): value is Result<S, F> => 'flatMap' in value;

        if (this.succeeded && this.value !== undefined) {
            if (this.value instanceof Promise) {
                try {
                    const promisedValue = await (this.value as Promise<SP>);
                    // when the promised value is already a result, then just return it
                    if (hasAndThen<SP, F>(promisedValue)) {
                        return promisedValue;
                    }
                    // otherwise, wrap it in a result
                    return new Result<SP, F>({ success: promisedValue });
                } catch (error) {
                    return new Result<SP, F>({ failure: error as F });
                }
            }
            return new Result<SP, F>({ success: this.value as unknown as SP });
        }
        return new Result<SP, F>({ failure: this.error });
    }

    /**
     * When this result is a success, calls the `handler` function on this result's value and
     * returns this result. When this result is a failure, then does **not** call the `handler`, but
     * rather just returns this result. Note that this method does not modify this result.
     * @param handler The callback that accepts the success value, but doesn't return anything.
     * @return This result.
     * @see onFailure
     * @see always
     */
    onSuccess(handler: (value: S) => void): Result<S, F> {
        if (this.succeeded && this.value !== undefined) {
            try {
                handler(this.value);
            } catch (error) {
                return Result.errorMessageResult('Result.onSuccess handler threw an error', error as Error);
            }
        }
        return this;
    }

    /**
     * When this result is a failure, calls the `handler` function on this result's error and
     * returns this result. When this result is a success, then does **not** call the `handler`, but
     * rather just returns this result. Note that this method does not modify this result.
     * @param handler The callback that accepts the error, but doesn't return anything.
     * @return This result.
     * @see onSuccess
     * @see always
     */
    onFailure(handler: (error: F) => void): Result<S, F> {
        if (this.failed && this.error !== undefined) {
            try {
                handler(this.error);
            } catch (error) {
                return Result.errorMessageResult('Result.onFailure handler threw an error', error as Error);
            }
        }
        return this;
    }

    /**
     * Calls the handler regardless whether the result is a success or failure
     * @param handler The callback to perform
     * @return This result
     * @see onSuccess
     * @see onFailure
     */
    always(handler: () => void): Result<S, F> {
        try {
            handler();
        } catch (error) {
            return Result.errorMessageResult('Result.onAlways handler threw an error', error as Error);
        }
        return this;
    }

    /**
     * @return When this result is a success, then returns the value. Otherwise, returns `undefined`.
     * @see getOrDefault
     * @see getOrThrow
     * @see failureOrUndefined
     */
    getOrUndefined(): S | undefined {
        return this.value;
    }

    /**
     * @return When this result is a success, then returns the value. Otherwise, returns the specified
     * default value.
     * @see getOrUndefined
     * @see getOrThrow
     * @see failureOrUndefined
     */
    getOrDefault(value: S): S {
        return (this.succeeded && this.value !== undefined) ? this.value : value;
    }

    /**
     * Provides a value by invoking a supplier function if the current context
     * or associated value does not already exist or is undefined.
     * @param supplier - A function that supplies a value to return.
     * @returns The value either provided by the supplier function or already
     * existing in the associated context.
     */
    getOr(supplier: () => S): S {
        return (this.succeeded && this.value !== undefined) ? this.value : supplier();
    }

    /**
     * @return When this result is a success, then returns the value. Otherwise, throws an error that
     * contains the error in this result.
     * @see getOrUndefined
     * @see getOrDefault
     * @see failureOrUndefined
     */
    getOrThrow(): S {
        if (this.succeeded && this.value !== undefined) {
            return this.value;
        }
        throw Error(this.error?.toString());
    }

    /**
     * @return When this result is a failure, then returns the error. Otherwise, returns `undefined`.
     * @see getOrUndefined
     * @see getOrDefault
     * @see getOrThrow
     */
    failureOrUndefined(): F | undefined {
        return this.error;
    }

    /**
     * Creates an error message result used when a function's handler throws an exception when
     * called.
     * @param message The error message
     * @param error The error thrown by the handler
     * @return A failure result with the error message describing why the handler failed
     */
    private static errorMessageResult<S, F extends ToString>(message: string, error: Error): Result<S, F> {
        return new Result<S, F>({
            failure: {
                toString: () => `${message}; error: ${error.message}`
            } as F
        });
    }

    /**
     * Factory method for creating a successful {@link Result}.
     * @param success The value of the successful operation.
     * @return A {@link Result} that holds the value of the successful operation and an undefined error.
     */
    static success<S, F extends ToString>(success: S): Result<S, F> {
        return new Result<S, F>({ success });
    }

    /**
     * Factory method for creating a failure {@link Result}.
     * @param failure The error reported from the operation.
     * @return A {@link Result} that holds the failure and an undefined success
     */
    static failure<S, F extends ToString>(failure: F): Result<S, F> {
        return new Result<S, F>({ failure });
    }

    /**
     * Convenience method for collapsing (flatMap) an array of {@link Result}s into a single {@link Result}
     * that holds an array of values. All results in the specified array of results must be successful in order
     * for the returned result to be a success.
     * @param results An array of results
     * @return A {@link Result} holding an array of successful values, or a failure if any of the results in
     * the array are failures.
     */
    static fromAll<T, F extends ToString>(results: Array<Result<T, F>>): Result<Array<T>, string> {
        const successes = results.filter(result => result.succeeded).map(result => result.getOrThrow());
        if (successes.length !== results.length) {
            return Result.failure<Array<T>, string>(`All results were not successful; number_failed: ${results.length - successes.length}`);
        }
        return Result.success<Array<T>, string>(successes);
    }

    /**
     * Convenience method for collapsing (flatMap) an array of {@link Result}s into a single {@link Result}
     * that holds an array of successful values. Any failure results will be discarded. If all the results
     * are failures, then returns a successful result holding an empty array.
     * @param results An array of results
     * @return A {@link Result} holding an array of successful values. Any failures will be discarded.
     */
    static fromAny<T, F extends ToString>(results: Array<Result<T, F>>): Result<Array<T>, string> {
        return Result.success<Array<T>, string>(results.filter(result => result.succeeded).map(result => result.getOrThrow()));
    }
}

/**
 * Type definition for the optional success and failure
 */
type ResultType<S, F extends ToString> = { success?: S, failure?: F }

/**
 * Factory function for a successful {@link Result}.
 * @param success The value of the successful operation.
 * @return A {@link Result} that holds the value of the successful operation and an undefined error.
 */
export const successResult = <S, F extends ToString>(success: S): Result<S, F> => Result.success(success);

/**
 * Factory function for a failure {@link Result}.
 * @param failure The error reported from the operation.
 * @return A {@link Result} that holds the failure and an undefined success
 */
export const failureResult = <S, F extends ToString>(failure: F): Result<S, F> => Result.failure(failure);

/**
 * Convenience function for collapsing (flatMap) an array of {@link Result}s into a single {@link Result}
 * that holds an array of values. All results in the specified array of results must be successful in order
 * for the returned result to be a success.
 * @param results An array of results
 * @return A {@link Result} holding an array of successful values, or a failure if any of the results in
 * the array are failures.
 */
export function resultFromAll<T, F extends ToString>(results: Array<Result<T, F>>): Result<Array<T>, string> {
    return Result.fromAll(results);
}

/**
 * Convenience function for collapsing (flatMap) an array of {@link Result}s into a single {@link Result}
 * that holds an array of successful values. Any failure results will be discarded. If all the results
 * are failures, then returns a successful result holding an empty array.
 * @param results An array of results
 * @return A {@link Result} holding an array of successful values. Any failures will be discarded.
 */
export function resultFromAny<T, F extends ToString>(results: Array<Result<T, F>>): Result<Array<T>, string> {
    return Result.fromAny(results);
}

/**
 * For each result in the `resultList` applies the `handler` function and then reduces each of those
 * results into a single result. The single result is a "success" iff all the results spewed from the
 * `handler` are a "success". Conversely, if any of those results are a "failure", the single result is
 * also a failure.
 *
 * The single result holds an array of all the success values when it is a success. When it is a failure,
 * then holds a list of all the failures.
 *
 * @template SI The type of the success elements in the input array
 * @template FI The type of the failure elements in the input array
 * @template SO The success type for the operation in the handler that leads to a successful result
 * @template FO The failure type for the operation in the handler that leads to a failed result
 * @param resultList The list of the {@link Result}s
 * @param handler The handler that accepts a {@link Result} and returns a new {@link Result}
 * @return A single {@link Result} which is either a success or failure. When the result is a success,
 * then the {@link Result} holds an array of success values. When the result is a failure, then the
 * {@link Result} holds an array of the failures.
 */
export function forEachResult<SI, FI extends ToString, SO, FO extends ToString>(
    resultList: Array<Result<SI, FI>>,
    handler: (result: Result<SI, FI>) => Result<SO, FO>
): Result<Array<SO>, Array<FO>> {
    const results = resultList.map(value => handler(value));
    const successes = results.filter(result => result.succeeded).length;
    if (successes !== results.length) {
        const failed: Array<FO> = []
        for (let i = 0; i < results.length; ++i) {
            const result = results[i]
            if (result.failed && result.error !== undefined) {
                failed.push(result.error)
            }
        }
        return Result.failure<Array<SO>, Array<FO>>(failed)
    }
    const succeeded: Array<SO> = []
    for (let i = 0; i < results.length; ++i) {
        const result = results[i]
        if (result.succeeded && result.value !== undefined) {
            succeeded.push(result.value)
        }
    }
    return Result.success<Array<SO>, Array<FO>>(succeeded)
}

/**
 * Applies the handler to the specified set of elements, lifting the result outside the array.
 * Given an array of numbers to which we apply a {@link Result} returning operation, the overall result is a
 * success of all the operations are successes. When any of the operations returns a failure, then
 * the failures are collected, and the overall result is a failure.
 *
 * @example
 * const result = forEachElement(
 *      [1, 2, 3, 4, 5],
 *      elem => successResult(2 * elem)
 *  )
 *  expect(result.succeeded).toBeTruthy()
 *  expect(result.getOrDefault([]).length).toBe(5)
 *  expect(result.getOrDefault([])).toEqual([2, 4, 6, 8, 10])
 *         
 * @example
 * const result = forEachElement(
 *      [1, 2, 3, 4, 5],
 *      elem => elem === 3 ?
 *          failureResult<number, string>("three sucks") :
 *          successResult<number, string>(2 * elem)
 *  )
 *  expect(result.failed).toBeTruthy()
 *  expect(result.error).toEqual(["three sucks"])
 *         
 * @param elems The elements on which to perform a {@link Result} returning operation
 * @param handler The operation that accepts an element and returns a {@link Result}
 * @return A {@link Result} wrapping the array of success values, or failure values.
 */
export function forEachElement<V, S, F extends ToString>(
    elems: Array<V>,
    handler: (elem: V) => Result<S, F>
): Result<Array<S>, Array<F>> {
    const results = elems.map(elem => handler(elem))
    const successes = results.filter(result => result.succeeded).length
    if (successes !== results.length) {
        const failed: Array<F> = []
        for (let i = 0; i < results.length; ++i) {
            const result = results[i]
            if (result.failed && result.error !== undefined) {
                failed.push(result.error)
            }
        }
        return Result.failure<Array<S>, Array<F>>(failed)
    }
    const succeeded: Array<S> = []
    for (let i = 0; i < results.length; ++i) {
        const result = results[i]
        if (result.succeeded && result.value !== undefined) {
            succeeded.push(result.value)
        }
    }
    return Result.success(succeeded)
}

/**
 * Accepts an array of values, and for each value calls a handler function that returns a {@link Promise} to
 * a {@link Result} from operating on that value. Then returns a {@link Promise} to a {@link Result} holding
 * an array of successes, or an array of failures.
 *
 * @example
 * const results = await forEachPromise([1,2,3,4,5], elem => new Promise<Result<number, string>>((resolve, reject) => {
 *     setTimeout(() => {
 *         resolve(successResult(elem * 2))
 *     }, 300)
 * }))
 *
 * expect(results.getOrThrow()).toEqual([2,4,6,8,10])
 *
 * @example
 * const results = await forEachPromise([1,2,3,4,5], elem => new Promise<Result<number, string>>((resolve, reject) => {
 *     setTimeout(() => {
 *         if (elem % 2 === 0) {
 *             resolve(successResult(elem / 2))
 *         } else {
 *             reject("number must be even")
 *         }
 *     }, 300)
 * }))
 *
 * expect(results.failed).toBeTruthy()
 * expect(results.error).toEqual(["number must be even", "number must be even", "number must be even"])
 *
 * @param elems The elements to which to apply the specified handler function
 * @param handler The function that returns a {@link Result} for a specified value
 * @return a {@link Promise} to a {@link Result} holding an array of successes, or an array of failures.
 */
export async function forEachPromise<V, S, F>(
    elems: Array<V>,
    handler: (elem: V) => Promise<Result<S, F>>
): Promise<Result<Array<S>, Array<F>>> {
    const results = elems.map(elem => handler(elem))
    try {
        // wait until all the promises have settled as resolved or rejected
        const promisedResults = await Promise.allSettled(results)
        // when there are failures, then the overall result is a failure, and report it
        const rejected = promisedResults
            .filter(settled => settled.status === 'rejected')
            // @ts-ignore
            .map(settled => settled.reason)
        if (rejected.length > 0) {
            return Result.failure(rejected.map(reject => reject))
        }

        // no failures so report the success results
        const succeeded: Array<Result<S, F>> = promisedResults
            .filter(settled => settled.status === 'fulfilled')
            // @ts-ignore
            .map(settled => settled.value)
        return forEachResult(succeeded, result => result)
    } catch (reason) {
        // something went terribly wrong
        console.error("Result::forEachPromise failed to settle all results", reason)
        return Result.failure<S[], F[]>([reason as F])
    }
}

/**
 * Accepts an array of values of type `V` and applies the specified `reducer` function to each
 * value. The `reducer` function accepts a value and a reduced-value and returns a {@link Result}.
 * When all the {@link Result}s are `success`, returns the reduced-value wrapped in a new {@link Result}.
 * When any of the {@link Result} are a failure, returns a failure that is an array of all the
 * failures.
 * @template V The type of the elements in the input array
 * @template S The success type for the operation in the handler that leads to a successful result
 * @template F The failure type for the operation in the handler that leads to a failed result
 * @param values The values to reduce
 * @param reducer The reducer function
 * @param initialValue The initial value of the reduced value
 * @return A {@link Result} that holds the reduced value. Or in the event of one or more failures,
 * returns a {@link Result} that holds a list of failures.
 */
export function reduceToResult<V, S, F extends ToString>(
    values: Array<V>,
    reducer: (reducedValue: S, value: V) => Result<S, F>,
    initialValue: S
): Result<S, Array<F>> {
    const failures: Array<F> = [];
    const reduced: S | undefined = values.reduce(
        (reducedValue: S, value: V) => {
            const result = reducer(reducedValue, value);
            if (result.error !== undefined) {
                failures.push(result.error);
                return reducedValue;
            }
            return result.value || reducedValue;
        },
        initialValue
    );

    if (reduced === undefined || failures.length > 0) {
        return Result.failure<S, Array<F>>(failures)
    }
    return Result.success(reduced);
}
