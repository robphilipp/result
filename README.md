# Result

## what?

A `Result` wraps the outcome of an operation that can either succeed or fail. This package also provides convenient methods and functions for chaining, mapping, flat-mapping, reducing, converting `Results`. Please, read on, it's really cool. 

## why?

When you write a function returns the result of an operation that can either succeed or fail, you must decide how to deal with the error condition. You have several options.

1. The function can throw an [Error](https://developer.mozilla.org/en-US/docs/web/javascript/reference/global_objects/error).
2. The function can return a [null](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/null) or an `undefined`.
3. The function could return an invalid value. For example, if the function is to return a number, then it could return a [NaN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NaN).
4. The function could return a tuple `[success, failure]`. When the operation succeeds, the success is defined and the failure is undefined. When the operation fails, the success is undefined and the failure is defined.

These options have drawbacks. The major drawback is that there is no way to tell the caller of the function that it must deal with the possibility that the function could result in an error. And except for the first option, none of these options provide the caller of the function with a reason why the operation failed.

Let's start with the first option, throwing an `Error`. When throwing an `Error`, the code calling the function needs to know that it must catch the `Error` in case it wants to handle error conditions. This is standard, but care must be taken that errors are caught at some point and handled gracefully. Suppose that you create and awesome library which calls a function, from another library, that throws an error. And suppose, your library decides to pass that error on instead of dealing with it. Then, unless you clearly document that you are allowing the error to bubble up, the caller of your library has no way of know that there may be an error condition.

The second option is to return a `null` or an `undefined`. And this is fraught with problems. If the return type is of some object, then you can get errors when attempting to access properties the (undefined) object. Now the caller of your function has to be extremely careful to check whether the return object or value is null or undefined. Even if you define your function as `function hmmm(yo: string): string | null | undefined` so that the caller is aware that the function could return a `null` or `undefined`, this doesn't explicitly tell the called that those are only returned on an error.

The third option provides a nice way to represent a failure. But, this only works when there is a clearly invalid value. Numbers can be represented as invalid with `NaN`. What about a `string` or a `boolean`? Of course there are clearly cases where the result can clearly have invalid values. But these are context dependent.

The fourth options solves many of the issues mentioned above. A success is represented as `["yay", undefined]` and a failure is represented as `[undefined, 'boo hoo']`. Then, for each call to the function, the caller must check `result[0] === undefined` for success, or `result[1] === undefined` for failure. And now we have a bunch of if-statements in our code, one to check the result of each call.

The `Result` provides a clean way of telegraphing that a function may fail, reporting why it failed. `Result` also allows these results to be chained without the need for if-statements or try-catch blocks. Let's look at an example.

```ts
import {failureResult, successResult} from "./Result";

/**
 * Attempts to divide the dividend by the divisor
 * @param dividend The number on top
 * @param divisor The number on the bottom
 * @return The result of the division which wraps the value or a failure
 */
function divide(dividend: number, divisor: number): Result<number, string> {
    if (divisor === 0) {
        return failureResult("Can't divide by zero!")
    }
    return successResult(dividend / divisor)
}

// divide 100 by 10, then divide the result of that by 5, and then multiply 
// that result by 5
const result1 = divide(100, 10)
    .andThen(quotient => divide(quotient / 5))
    .map(quotient => Math.PI * quotient)

// prints 2π = 6.283185307179586 (definitely better than one π)
result1
    .onSuccess(value => console.log(`2π = ${value}`))
    .onFailure(reason => console.log(reason))

// now let's attempt to divide by 0
const result2 =  divide(100, 0)
    .andThen(quotient => divide(quotient, 5))
    .map(quotient => Math.PI * quotient)

// prints "Can't divide by zero!"
result2
    .onSuccess(value => console.log(`2π = ${value}`))
    .onFailure(reason => console.log(reason))
```

Right off the bat, the function signature tells the caller that it must handle the fact that the result could be a success or a failure. Also, the success value will be of type `number`, and the failure will be a `string`. The function body does the usual. It performs a check to ensure that the arguments are valid, and if they aren't, it returns a failure result using the `failureResult(...)` convenience function. If the arguments are valid, then returns a successful result that holds the value of the division operation.

Next we attempt to divide 100 by 10, which result in 10, and then divide that by 5, which results in 2, and multiply that by π. Notice that there are no if-statements to check whether the result succeeded. Rather, we chain the results. The first call `divide(100, 10)` returns a success `Result` that wraps the value 10. Calling `.andThen(callback)` on the result causes the specified callback function to be called if, and only if, the `Result` on which we are calling `.andThen(callback)` is a success. In other words, the first division succeeded, so the callback, `divide(quotient, 5)` will be called. The `.andThen(...)` function is a flat-map. And we use in it this case because the `divide(...)` function returns a `Result`. In our example, the second division succeeds and so the callback handed to the `.map(callback)` function is called, which multiplies the resultant value by π. We use a map because the callback does not return a `Result`. And then `result1` is a successful `Result` that has a value equal to 2π, which we can see from the console log.

What happens when the divisor is 0? In that case, the second and third callbacks are skipped and `result2` is a failure `Result` holding the reason for the failure. This can be seen from the console log for result2.

Let's rewrite the example with the `Result` object.

```ts
/**
 * Attempts to divide the dividend by the divisor
 * @param dividend The number on top
 * @param divisor The number on the bottom
 * @return The result of the division which wraps the value or a failure
 */
function divide(dividend: number, divisor: number): number {
    if (divisor === 0) {
        return NaN
    }
    return dividend / divisor
}

const div1 = divide(100, 10)
if (isNaN(div1)) {
    throw new Error("Got a NaN")
}
const div2 = divide(div1, 5)
if (isNaN(div2)) {
    throw new Error("Got a NaN")
}
const result1 = div2 * Math.PI
console.log(`2π = ${result1}`)

const div1b = divide(100, 0)
if (isNaN(div1b)) {
    throw new Error("Got a NaN")
}

// never gets here
const div2b = divide(div1b, 5)
if (isNaN(div2)) {
    throw new Error("Got a NaN")
}
const result2 = div2b * Math.PI
console.log(`2π = ${result2}`)

```

Yeah! A bunch of if-statements. The code is much less concise and harder to understand.

## what else?


## usage patterns

[//]: # (A basic result for use when an operation that returns a result can either succeed or fail.)

[//]: # (Instead of throwing an exception or returning `undefined` when the operation fails, the {@link Result})

[//]: # (can be marked as a failure, and an error object can be returned describing the reason for the failure. When)

[//]: # (the operation succeeds, the {@link Result} can be marked as a success, and it then holds the)

[//]: # (result of the operation.)

[//]: # ()
[//]: # (Additionally, it provides the chaining of results through {@link Result.map} and {@link Result.andThen}.)

[//]: # (The {@link reduceToResult} is a reducing function that combine a set of {@link Result}-producing)

[//]: # (operations into one {@link Result} that is a success iff all the operations are a success. And the)

[//]: # ({@link forEachResult} accepts a set of {@link Result}s and combines them into one result that is a)

[//]: # (success iff all the {@link Result}s are a success.)

[//]: # ()
[//]: # (When writing functions that return a {@link Result}, use the {@link successResult} function to create)

[//]: # (a success {@link Result}. And use the {@link failureResult} function to create a, you guessed it, ad)

[//]: # (failure {@link Result}.)

[//]: # ()
[//]: # (The {@link Result.succeeded} and {@link Result.failed} properties of a result report whether the)

[//]: # (is a success or failure.)

[//]: # ()
[//]: # (The {@link Result.getOrUndefined} method returns a value on a success, or `undefined` on a failure.)

[//]: # (The {@link Result.getOrDefault} method returns the value on a success, or the specified value when)

[//]: # (the {@link Result} is a failure. And the {@link Result.getOrThrow} returns the value on a success, and)

[//]: # (throws an error, with the error value, on a failure. Although the {@link Result.value} is available,)

[//]: # (I encourage you not to use it directly, but rather use the above-mentioned accessor methods.)