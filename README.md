# Result

> For changes see [CHANGES.md](./CHANGES.md)

## toc

- [toc](#toc)
- [what?](#what)
- [rant](#rant)
- [why?](#why)
- [what else?](#what-else)
- [usage patterns](#usage-patterns)
   - [wrap](#wrap)
   - [unwrap](#unwrap)
   - [callback](#callback)
   - [chaining](#chaining)
   - [arrays of results](#arrays-of-results)
   - [results and promises](#results-and-promises)
- [api](#api)
   - [factory functions](#factory-functions)
      - [successResult](#successresult)
      - [failureResult](#failureresult)
      - [resultFromAll](#resultfromall)
      - [resultFromAny](#resultfromany)
      - [forEachResult](#foreachresult)
      - [forEachElement](#foreachelement)
      - [forEachPromise](#foreachpromise)
      - [reduceToResult](#reducetoresult)
   - [properties](#properties)
   - [methods](#methods)
      - [equals](#equals)
      - [nonEqual](#nonequal)
      - [map](#map)
      - [andThen @deprecated, use flatMap](#andthen)
      - [flatMap](#flatMap)
      - [conditionalMap](#conditionalMap)
      - [conditionalFlatMap](#conditionalFlatMap)
      - [filter](#filter)
      - [mapFailure](#mapfailure)
      - [asFailureOf](#asfailureof)
      - [liftPromise](#liftpromise)
      - [onSuccess](#onsuccess)
      - [onFailure](#onfailure)
      - [always](#always)
      - [getOrUndefined](#getorundefined)
      - [getOrDefault](#getordefault)
      - [getOr](#getOr)
      - [getOrThrow](#getorthrow)
      - [failureOrUndefined](#failureorundefined)

## what?

A `Result` wraps the outcome of an operation that can either succeed or fail. This package also provides convenient
methods and functions for chaining, mapping, flat-mapping, reducing, converting `Results`. Please, read on, it's really
cool.

## rant

Have you ever been ask to fix a bug or add a feature to someone else's code? And as you're testing, some exceptions is
thrown, but you don't know exactly where. So you look at the stack trace and work through the code. You add a try/catch.
Good to go. Oops, and now there is another exceptions. The point is, there could be a hundred exceptions thrown. And
just inspecting the code gives you very little insight into the list of possible exceptions. An exception could be
thrown in a dependent library. Or in some function, called by a function, called by a function, called by a function
that you call. Yeah. The code becomes hard to reason about.

Do your fellow developers (and yourself) a favor. Catch exceptions early on, and convert them to a `Result`. A `Result`
clearly states that a function may fail. Every function that can fail, whether it caught an exception and returned a
failure `Result`, or it called a function that itself returned a `Result` says "I can fail. Deal with it!". Now possible
failure points become clear. And as a great side benefit of being forced to deal with possible failures on the spot,
your code becomes safer and easier to understand! What's not to like!

## why?

When you write a function that returns the result of an operation that can either succeed or fail, you must decide how
to deal with the error condition. You have several options.

1. The function can throw
   an [Error](https://developer.mozilla.org/en-US/docs/web/javascript/reference/global_objects/error).
2. The function can return
   a [null](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/null) or an `undefined`.
3. The function could return an invalid value. For example, if the function is to return a number, then it could return
   a [NaN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NaN).
4. The function could return a tuple `[success, failure]`. When the operation succeeds, the success is defined and the
   failure is undefined. When the operation fails, the success is undefined and the failure is defined.

These options have drawbacks. The major drawback is that there is no way to tell the caller of the function that it must
deal with the possibility that the function could result in an error. And except for the first option, none of these
options provide the caller of the function with a reason why the operation failed.

Let's start with the first option, throwing an `Error`. When throwing an `Error`, the code calling the function needs to
know that it must catch the `Error` in case it wants to handle error conditions. This is standard, but care must be
taken that errors are caught at some point and handled gracefully. Suppose that you create and awesome library which
calls a function, from another library, that throws an error. And suppose, your library decides to pass that error on
instead of dealing with it. Then, unless you clearly document that you are allowing the error to bubble up, the caller
of your library has no way of know that there may be an error condition.

The second option is to return a `null` or an `undefined`. And this is fraught with problems. If the return type is of
some object, then you can get errors when attempting to access properties the (undefined) object. Now the caller of your
function has to be extremely careful to check whether the return object or value is null or undefined. Even if you
define your function as `function hmmm(yo: string): string | null | undefined` so that the caller is aware that the
function could return a `null` or `undefined`, this doesn't explicitly tell the called that those are only returned on
an error.

The third option provides a nice way to represent a failure. But, this only works when there is a clearly invalid value.
Numbers can be represented as invalid with `NaN`. What about a `string` or a `boolean`? Of course there are clearly
cases where the result can clearly have invalid values. But these are context dependent.

The fourth options solves many of the issues mentioned above. A success is represented as `["yay", undefined]` and a
failure is represented as `[undefined, 'boo hoo']`. Then, for each call to the function, the caller must
check `result[0] === undefined` for success, or `result[1] === undefined` for failure. And now we have a bunch of
if-statements in our code, one to check the result of each call.

The `Result` provides a clean way of telegraphing that a function may fail, reporting why it failed. `Result` also
allows these results to be chained without the need for if-statements or try-catch blocks. Let's look at an example.

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
divide(100, 10)
    .andThen(quotient => divide(quotient / 5))
    .map(quotient => Math.PI * quotient)
    // prints 2π = 6.283185307179586 (definitely better than one π)
    .onSuccess(value => console.log(`2π = ${value}`))
    .onFailure(reason => console.log(reason))

// now let's attempt to divide by 0
divide(100, 0)
    .andThen(quotient => divide(quotient, 5))
    .map(quotient => Math.PI * quotient)
    .onSuccess(value => console.log(`2π = ${value}`))
    // prints "Can't divide by zero!"
    .onFailure(reason => console.log(reason))
```

Right off the bat, the function signature tells the caller that it must deal with the fact that the result could be a
success or a failure. Also, the success value will be of type `number`, and the failure will be a `string`. The function
body does the usual. It performs a check to ensure that the arguments are valid, and if they aren't, it returns a
failure result using the `failureResult(...)` convenience function. If the arguments are valid, then returns a
successful result that holds the value of the division operation using the `sucessResult(...)` convenience function.

Next we attempt to divide 100 by 10, which result in 10, and then divide that by 5, which results in 2, and multiply
that by π. Notice that there are no if-statements to check whether the result succeeded. Rather, we chain the results.
The first call `divide(100, 10)` returns a success `Result` that wraps the value 10. Calling `andThen(callback)` on the
result causes the specified callback function to be called if, and only if, the `Result` on which we are
calling `andThen(callback)` is a success. In other words, the first division succeeded, so the
callback, `quotient => divide(quotient, 5)` will be called. The `andThen(...)` function is a flat-map. And we use in it
this case because the `divide(...)` function returns a `Result`. In our example, the second division succeeds and so the
callback handed to the `map(...)` function is called, which multiplies the resultant value by π. We use a `map` because
the callback does not return a `Result`. The callback handed to the `onSuccess(...)` function is called because the
result of the `map` is a success, printing "2π = 6.283185307179586" to the console. The callback in the last function in
the chain is not called because, in this case, because it would only be called if the previous result was a failure.

What happens when the divisor is 0? In that case, the second, third, and forth callbacks are skipped the callback in
the `onFailure(...)` function is called because the `divide(...)` function returns a failure result.

This code is clear and concise. Let's see what happens when rewrite the previous example without the `Result`.

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

`Result` provides a declarative way to chain together a series of operations, any of which could fail or succeed. The
series of operations are laid out clearly, without the fog of all the error handling code that would otherwise be
needed.

`Result` provides a consistent and explicit way of dealing with the fact that some operations could fail. Each function
that returns a `Result` says that its operation may fail and that the caller must deal with it (or continue to chain
results). The `Result` must be unwrapped in order to get at the underlying value or failure.

It also provides a consistent and explicit way of dealing with the fact that some operation could fail. And requires
that the result of the operation be managed at the point of the call. Each function that returns a `Result` telegraphs
that it may fail and that the caller of the function must deal with that possibility. In this way, the risk of a
surprise failure is removed, and the code becomes much easier to reason about.

When using `Result` consistently in your code, it becomes difficult **not** to deal with errors.

## usage patterns

Safety from unexpected errors a primary reason to use `Result`. `Result` provides safety by forcing the caller to deal
with the fact that the function may fail, thereby making it easier to reason about the code.

### wrap

When calling library functions that throw errors, over which you have no control, wrap that call in a `try/catch`
returning a success result when it doesn't fail, and a failure result from the `catch` when it does fail. For example,
when retrieving a set of pigs from some in-memory state, the call may result in an error (e.g. an invalid farm ID), as
shown in the following code.

```typescript
import {failureResult, successResult} from "./Result";

type Pig = {
    name: string
    weight: number
    spots: number
}

/**
 * Attempts to retrieve a farm's pigs.
 * @param farmId The farm's ID which must have the format `<region_id>:<county_id>:farm_log_number>`
 * @return a {@link Result} holding the farm's pigs, or a failure
 */
function pigsInFarm(farmId: string): Result<Array<Pig>, string> {
    try {
        // either returns the pigs for the farm, or throws an error
        const pigs = pigsFor(farmId)
        // no error thrown, so return the list of the farm's pigs wrapped in a Result
        return successResult(pigs)
    } catch (error) {
        // error was thrown, so return a failure result with the error message
        return failureResult(error.message)
    }
}
```

When library functions represent error results as `undefined` or `NaN` or `null`, then convert those to a `Result`. The
following example show how to wrap a `NaN` and can be applied to functions returning `undefined` and or `null`.

> There are legitimate reason why a `NaN` might not represent an error. And in those cases, it wouldn't make sense to convert to a Result.

```typescript
import {failureResult, successResult, Result} from "./Result";

/**
 * Calculates a complex pig-spot metric for a set of pigs.
 * @param pigs A list of {@link Pig}s
 * @return A result holding the pig-spot metric or a failure
 */
function complexSpotMetricFor(pigs: Array<Pig>): Result<number, string> {
    // attempts to calculate the pig-spot metric through some complex model. if the model
    // fails, then returns a NaN.
    const metric = complexSpotModelFor(pigs)
    if (isNaN(metric)) {
        // model failed, so return a failure explain
        return failureResult(
            `Could not calculate spot metric for pigs [${pigs.map(pig => pig.name).join("; ")}]`
        )
    }
    // success! return the very important pig-spot metric
    return successResult(metric)
}
```

### unwrap

At the end of a chain of `Result` operations you'll probably want to do something with the value. I can think of two
cases:

1. unwrap the result and use it outside a `Result`, or
2. call a function that accepts the value and ends the `Result` chain

As an example of the first case, we have the following code.

```typescript
/**
 * Determines whether the spot metric can be calculated for the pigs
 * @param pigs A list of {@link Pig}s
 */
function canCalcPositiveSpotMetricFor(pigs: Array<Pig>): boolean {
    // the function 'complexSpotMetricFor(...)' returns a result that is
    // either a success of or failure. when it returns a failure, the
    // result's 'getOrDefault(...)' returns a false. when the 
    // 'complexSpotMetricFor(...)' function returns a success value that
    // is positive, then returns true
    return complexSpotMetricFor(pigs)
        .map(metric => metric > 0)
        .getOrDefault(false)
}
```

The previous code example attempts to calculate the spot-metric for a population of pigs. When the spot-metric is
positive, then the `canCalcPositiveSpotMetricFor(...)` returns `true`. When the calculation fails, then it falls through
the `Result`'s `map(...)` and returns a `false`.

The `Result` has four unwrapping functions:

1. `getOrUndefined()` -- which returns a success value, or if the result is a failure, it returns undefined. It's there
   for completeness, but not the best approach.
2. `getOrDefault(value: S)` -- which returns the success value, or if the result is a failure, it returns the specified
   value. You've seen this one before.
3. `getOrThrow()` -- which returns the success value, or if the result is a failure, it throws an error. Again, there
   for completeness, but not the best approach.
4. `failureOfUndefined()` -- which returns the failure, of if the result is a success, then returns undefined. Yeah. Ok.

### callback

In some cases, instead of returning a value, you may want to call a function when the result is a success or failure.
For example, suppose we want to test the cognitive abilities of our pigs and record their score. Now some pigs can be
unruly and refuse to take the test, and we need to record that as well, so they can be retested at a later time.

```typescript
function pigIqTest(pigs: Array<Pig>): void {
    pigs.forEach(pig => administerIqTest(pig)
        .onSuccess(score => recordIqFor(pig, score))
        .onFailure(reason => recordUncooperativePig(pig, reason))
    )
}
```

In the above example, the callback passed to the `onSuccess(...)` function is called only when the `Result` is a
success (i.e. the pig cooperated and took the test). When the pig was uncooperative, the `Result` was a failure, and
callback passed to the `onFailure(...)` function is called, recording that the pig needed to be retested.

### chaining

One awesome feature of the `Result` is that you can chain results in a concise manner making the steps easy to
comprehend. In the previous example, we recorded the IQ for each pig that took the test, presumably to some datastore.
Suppose that this is a large operation and the `recordIqForPig(...)` function from the previous example published a
message to a queue on a highly-available message broker. Another service pulled the message from the queue, inserted the
pig's score, and issued a certificate to the pig. That code may look something like this.

```typescript
type Message = {
    deliveryTag: string
    messageBody: object
}

type PigScore = {
    // the unique name of the pig
    pig: string
    score: number
}

function handlePigScoreMessage(message: Message): void {
    convertToPigScore(message)
        // bad message, acknowledge and drop it
        .onFailure(reason => ackMessage(message.deliveryTag))
        // conversion succeeded, we have a valid message format
        .andThen(pigScore => repo.insertWithRetry(pigScore.pig, pigScore.score)
            // when written successfully, then attempt to issue the certificate
            .andThen(transaction => issueCertificate(pigScore.pig, pigScore.score)
                // commit or rollback the database transaction
                .onSuccess(() => repo.commit(transaction))
                .onFailure(() => repo.rollback(transaction))
            )
            // succeeded writing to database and issuing a certificate, 
            // acknowledge the message
            .onSuccess(() => ackMessage(message.deliveryTag))
            // failed to record score or issue certificate, reject the message
            // so that it can be handled again
            .onFailure(() => rejectMessage(message.deliveryTag))
        )
}
```

When a message is taken from the queue, the consumer calls the `handlePigScoreMessage(...)` function handing it the
message. The `handlePigScoreMessage(...)` first attempts to convert the message to a `PigScore`. The conversion can fail
if the message is invalid, and in that case, we acknowledge the message to get it off the queue and drop it. When the
conversion succeeds, then we attempt to write it to the database using a transaction that includes issuing the
certificate. The `insertWithRetry(...)` function attempts to write the pig' score. When it succeeds, the callback
function specified in the chained `andThen(...)` is called, which attempts to issue the certificate. A failure to issue
the certificate cause the database transaction to be rolled back. Successfully issuing the certificate caused the
database transaction to be committed. In the event that issuing the certificate fails, the transaction is rolled back,
and the outer `onFailure(...)` calls the function to reject the message so that it can be reprocessed. When the database
write and the certificate issuance succeed, then the outer `onSuccess(...)` calls the function to acknowledge the
message.

Clearly this was a complicated example. Yet the code is easy to understand. And importantly, it is safe.

Generally chaining and nesting provide a declarative way laying out the code's logic. Let's look chaining in more
detail.

![result-flow](./docs/result-flow-chain.png)

Recall that a result can be either a `success` or a `failure`. In the above diagram, the `result`'s
`map(callback: value => otherValue)` function will call the specified (callback) `convertValue(...)` function only when
the result is a `success`, and it will return the value returned by `convertValue(...)`. When the result is a `failure`,
then the result's `map(callback: value => otherValue)` function does **not** call `convertValue(...)`, but rather merely
returns the `failure`. Because the `map(...)` function returns the `result`, but with an updated value, if the `result`
was originally a `success`, then the `possiblyFails(...)` callback passed to the `andThen(callback: value => Result)`
function will be called. The `andThen(...)` is a flat map function. The callback to the `andThen(...)` function returns
a `Result` and this `Result` itself, so we have a `Result<Result<SP, F>>` and the `andThen(...)` flattens that to
a `Result<SP, F>`.

This idea is represented graphically in the diagram. If the result is a failure, the first `map`
passes the failure to the `andThen`, which passes the failure to the next `andThen` which passes the failure to
the `onSuccess` which passes the failure to the `onFailure` which logs the error to the console.

### arrays of results

Pigs are unruly. And we need to run each pig through an automated spot counter so that we can record the number of spots
each pig has. The automated spot counter attempts to verify the identity of the pig, based on a facial scan, then
attempts to count all the spots on the pig. After the pigs' spots are counted, we want to record the successful
spot-counts, and also the unsuccessful ones.

```typescript
import {forEachElement, resultFromAny} from "./Result";

type PigSpots = {
    pig: Pig
    spots: number
}

function verifyPig(pig: Pig): Result<Pig, string> {
    // some complex AI to determine whether the pig matches 
    // the records, if the verification fails, the returns a
    // failure result, otherwise, returns the Pig as a success
}

function countSpotsFor(pig: Pig): Result<number, string> {
    // somemore complex AI to count the spots on the pig
    // if the count fails, returns a failure result. Otherwise
    // returns the number of spots on the pig
}

/**
 * Given an array of pigs, attempts to count the spots on each verified pig
 * and returns all the spot-counts that succeeded.
 * @param pigs The pigs
 * @return An array holding the successful spot counts, or a failure if the
 * equipment failed.
 */
function countSpotsOn(pigs: Array<Pig>): Result<Array<PigSpot>, string> {
    const counts: Array<Result<PigSpot, string>> = pigs
        .map(pig => verifyPig(pig).andThen(verifiedPig => countSpotsFor(verifiedPig)))
    // flatten the Array<Result<PigSpot, string>> to an Result<Array<PigSpot>, string>, throwing
    // out any of the failures
    return resultFromAny(counts)
}

// grab all the pigs for the farm
const pigsToCount: Array<Pig> = await retrievePigsFor("0110-314-2723434223384")
// attempt to count the spots
countSpotsFor(await retrievePigsFor(farm))
    // if successful, then record the pig spots for each successful spot-count
    .onSuccess(pigSpots => pigSpots.forEach(pigSpot => persist(pigSpot)))
    // figure out which pigs could not be counted and then record the failures
    .map(pigSpots => setFrom(pigsToCount)
        .compliment(pigSpots.map(pigSpot => pigSpot.pig))
        .toArray()
    )
    .onSuccess(failedPigs => failedPigs.forEach(failure => recordFailure(failure)))
    // couldn't count pigs so report the equipment failure
    .onFailure(reason => reportEquipmentFailure(reason))
```

Aside from the `resultFromAny(...)`, there is also the `resultFromAll(...)` function that returns a success `Result`
only when all the results passed to it are themselves successes.

### results and promises

There a number of use cases where `Result` and `Promise` are used together. Consider, for example, making a REST call (
say with fetch or axios) to retrieve a user's information. The REST call returns a promise, and that promise holds the
result of the REST call once it is resolved. When the user exists, then the promise yields the account. But what if the
user doesn't exist, and the REST call results in a "not-found" status code (404). Instead of throwing an error we can
return an empty user, because a successful result means there was no error, but also no user. In case there is an error,
we can return a failure `Result` with a message describing the error.

```typescript
import {failureResult, successResult} from "./Result";

function userInfo(userId: number): Promise<Result<User, string>> {
    return axios.get('/user?id=314159')
        .then(response => {
            if (response === 200) {
                return successResult(response.data)
            }
            if (status === 404) {
                return successResutl(emptyUser())
            }
            return failureResult(`Failed to retrieve user; http_status: ${response.status}; reason: ${response.statusCode}`)
        })
        .catch(reason => failureResult(reason))
}
```

Of course, when a user with the specified ID doesn't exist, you could also return a failure. It really depends on the
context.

Suppose that after you retrieve the user information, you want to grab the account ID of the user, and then look up the
account information.

```typescript
import {successResult} from "./Result";

function accountInfoFor(userId: number): Promise<Result<Account, string>> {
    return userInfo(userId)
        .then(userResult => userResult
            .map(user => axios.get(`/account/id=${user.accountId}`)
                .then(response => {
                    if (response === 200) {
                        return successResult(response.data)
                    }
                    return failureResult(
                        `Failed to retrieve account for user; user_id: ${userId}; ` +
                        `account_id: ${user.accountId}; http_status: ${response.status}; ` +
                        `reason: ${response.statusCode}`
                    )
                })
                .catch(reason => failureResult(reason))
            )
            .liftPromise()
        )
}
```

The code above grabs the user, which returns a `Promise<Result<User, string>>`. When the promise resolves, then
the `Result` from that `Promise` is handed to the `Promise.then()` function. And if that result is a success, it will
call the callback of the `Result.map` function. That function in turn will attempt to retrieve the account information,
which results in a `Promise<Result<Account, string>>`. So what comes out of the `Result.map` is
a `Result<Promise<Result<Account, string>>>`. Eee-ch! 🥵 And now what??? Well, that's where the `Result.liftPromise`
function comes to the rescue. Calling the `liftPromise` function takes the `Result<Promise<Result<Account, string>>>`
and spits out a `Promise<Result<Account, string>>>`. Effectively lifting the `Promise` to the outermost position, and
flattening the `Results`.

> The `Result.liftPromise` function takes the `Result<Promise<Result<Account, string>>>`, lifts the `Promise` out so that it becomes `Promise<Result<Result<Account, string>, string>>` and then flattens the results to yield `Promise<Result<Account, string>>>`.

🥶 Yeah...maybe there is a better way to combine `Result` and `Promise`. Please help me figure that out!

## api

### factory functions

<hr>

#### successResult

```typescript
function successResult<S, F extends ToString>(success: S): Result<S, F> {
}
```

A factory function for a successful `Result<S, F>`. Use this function to wrap a value of type `S` in a `Result`. When
using this function, the `Result.error` will be set to `undefined.`

Arguments

- `success` The value of the successful operation.

Returns

A `Result<S, F>` that holds the value of the successful operation.


<hr>

#### failureResult

```typescript
function failureResult<S, F extends ToString>(failure: F): Result<S, F> {
}
```

A factory function for a failure `Result<S, F>`. Use this function to wrap a failure of type `F` in a `Result`. When
using this function, the `Result.success` will be set to `undefined`.

Arguments:

- `failure` The error reported from the operation.

Returns A `Result<S, F>` that holds the failure of type `F`.

<hr>

#### resultFromAll

```typescript
function resultFromAll<S, F extends ToString>(results: Array<Result<S, F>>): Result<Array<S>, string> {
}
```

A convenience function for collapsing (flatMap) an array of `Result<S, F>`s into a single `Result<Array<S>, F>`
that holds an array of values. All results in the specified array of results must be successful in order for the
returned result to be a success.

Arguments

- `results` An array of results

Returns

A `Result<Array<S>, F>` holding an array of successful values, or a failure if any of the results in the array are
failures.

<hr>

#### resultFromAny

```typescript
function resultFromAny<S, F extends ToString>(results: Array<Result<S, F>>): Result<Array<S>, string> {
}
```

A convenience function for collapsing (flatMap) an array of `Result<S, F>`s into a single `Result<Array<S>, F>`
that holds an array of successful values. Any failure results will be discarded. If all the results are failures, then
returns a successful result holding an empty array.

Arguments

- `results` An array of results

Returns

A `Result<Array<S>, F>` holding an array of successful values. Any failures will be discarded.

<hr>

#### forEachResult

```typescript
function forEachResult<SI, FI extends ToString, SO, FO extends ToString>(
    resultList: Array<Result<SI, FI>>,
    handler: (result: Result<SI, FI>) => Result<SO, FO>
): Result<Array<SO>, Array<FO>> {
}
```

For each result in the `resultList` this function applies the `handler` function, and then reduces each of those results
into a single result. The single result is a "success" if and only if all the results spewed from the
`handler` are a "success" as well. Conversely, if any of those results are a "failure", the single result is also a
failure.

The single result holds an array of all the success values when it is a success. When it is a failure, then holds a list
of all the failures.

Arguments

- `resultList` An array holding the `Result<SI, FI>` objects to flatten.
- `handler` The handler that accepts a `Result<SI, FI>` and returns a new `Result<SO, FO>`. Notice that the result's
  types may differ between the specified results and those returned by the handler.

Types

- `SI` The type of the success elements in the input array
- `FI` The type of the failure elements in the input array
- `SO` The success type for the operation in the handler that leads to a successful result
- `FO` The failure type for the operation in the handler that leads to a failed result

Returns

A single `Result<Array<SO>, Array<FO>>` which is either a success or failure. When the result is a success, then
the `Result<Array<SO>, Array<FO>>` holds an array of success values of type `SO`. When the result is a failure, then
the `Result<Array<SO>, Array<FO>>` holds an array of the failures of type `FO`.

<hr>

#### forEachElement

```typescript
function forEachElement<V, S, F extends ToString>(
    elems: Array<V>,
    handler: (elem: V) => Result<S, F>
): Result<Array<S>, Array<F>> {
}
```

This function applies the specified `handler` to the specified array of elements of type `V`. The `handler` accepts each
element and returns a `Result<S, F>`. The resulting array of `Result<S, F>` objects are flattened into a
single `Result<Array<S>, Array<F>>`.

As an example, given an array of numbers to which we apply an operation that can fail (i.e. returning a `Result<S, F>`)
We want the overall result to be a success only if all the operations are a success. And when any of the operations are
a failure, then we want the overall result is a failure.

```typescript
const result = forEachElement(
    [1, 2, 3, 4, 5],
    elem => elem === 3 ?
        failureResult<number, string>("three sucks") :
        successResult<number, string>(2 * elem)
)
expect(result.failed).toBeTruthy()
expect(result.error).toEqual(["we don't accept 3"])
```

Arguments

- `elems` The elements on which to perform an operation that can fail (i.e. one that returns a `Result<S, F>`).
- `handler` The operation that accepts an element and returns a `Result<S, F>`

Returns

A `Result<Array<S>, Array<F>>` wrapping the array of success values, or failure values.

<hr>

#### forEachPromise

```typescript
function forEachPromise<V, S, F>(
    elems: Array<V>,
    handler: (elem: V) => Promise<Result<S, F>>
): Promise<Result<Array<S>, Array<F>>> {
}
```

This function accepts an array of values of type `V`, and for each value calls a `handler` function, that returns
a `Promise<Result<S, F>>` for that value. Then flattens the array of `Promise<Result<S, F>>` into a
single `Promise<Result<Array<S>, Array<F>>>`, which it returns. All results must be a success for the promised result to
be a success. If any results are a failure, then the promised result is also a failure.

In the following example our handler function simulates a call that returns a promise to a result for each doubled,
element in the specified list.

```typescript
const results = await forEachPromise(
    [1, 2, 3, 4, 5],
    elem => new Promise<Result<number, string>>((resolve, reject) => {
        setTimeout(() => {
            resolve(successResult(elem * 2))
        }, 300)
    }))

expect(results.getOrThrow()).toEqual([2, 4, 6, 8, 10])
```

In this next example, we again simulate a call to a function that returns a promise to a result. In this case, we only
accept event numbers. Any odd numbers (not that there is anything wrong with being odd) are rejected. The overall result
is a failure, and there is a failure message for each of those failures.

```typescript
const results = await forEachPromise(
    [1, 2, 3, 4, 5],
    elem => new Promise<Result<number, string>>((resolve, reject) => {
        setTimeout(() => {
            if (elem % 2 === 0) {
                resolve(successResult(elem / 2))
            } else {
                reject("number must be even")
            }
        }, 300)
    }))

expect(results.failed).toBeTruthy()
expect(results.error).toEqual(["number must be even", "number must be even", "number must be even"])
```

Arguments

- `elems` The elements to which to apply the specified handler function
- `handler` The function that returns a `Promise<Result<S, F>>` for a specified value

Returns

A `Promise<Result<Array<S>, Array<F>>>` holding an array of successes, or an array of failures. All the results must be
a success in order for the returned result to be a success.

<hr>

#### reduceToResult

```typescript
function reduceToResult<V, S, F extends ToString>(
    values: Array<V>,
    reducer: (reducedValue: S, value: V) => Result<S, F>,
    initialValue: S
): Result<S, Array<F>> {}
```

This function accepts an array of values of type `V` and applies the specified `reducer` function to each value.
The `reducer` function accepts a value of type `V` and a reduced-value of type `S` and returns a `Result<S, F>`. When
all the `Result<S, F>` objects are a success, then returns the reduced-value wrapped in a new `Result<S, Array<F>>`.
When any of the `Result<S, F>` are a failure, returns a failure that holds an array of all the failures.

Arguments

- `values` The values to reduce
- `reducer` The reducer function @param initialValue The initial value of the reduced value


Types

- `V` The type of the elements in the input array 
- `S` The success type for the operation in the handler
that leads to a successful result 
- `F` The failure type for the operation in the handler that leads to a failed
result 

Returns

A `Result<S, Array<F>>` that holds the reduced value. Or in the event of one or more failures,
returns a `Result<S, Array<F>>` that holds a list of failures.

### properties

- **succeeded** (boolean) is `true` when the result is a success, and `false` when the result is a failure.    
- **failed** (boolean) is `true` when the result failed, and `false` when the result succeeded.


### methods

#### equals

```typescript
equals: (result: Result<S, F>) => boolean
```
Determines the equality of this result and the specified one. The results are considered equal if:
  1. They are both a success and their values are equal
  2. They are both a failure and their errors are equal

Arguments
 
- `result` The result to compare to this one

Returns

`true` if the results are equal. `false` the results are not equal

<hr>

#### nonEqual

```typescript
nonEqual: (result: Result<S, F>) => boolean
```

Determines the equality of this result and the specified one. The results are considered equal if:
  1. They are both a success and their values are equal
  2. They are both a failure and their errors are equal

Arguments

- `result` The result to compare to this one

Returns

`true` if the results are **not** equal. `false` the results are equal

<hr>

#### map

```typescript
map: <SP>(mapper: (value: S) => SP) => Result<SP, F>
```

Applies the specified `mapper` function to the success value of this result, and returns a new {@link Result} that wraps the result of the `mapper`. When this result is a failure, then it does **not** apply the `mapper`, but rather merely returns this result.

Arguments

- `mapper: (value: S) => SP` The mapper function that accepts the success value of type `S` and returns a new value of type `SP`.

Return 

When this result is a success, then returns a `Result<SP, F>` that wraps the result of the `mapper` function. When this result is a failure, the returns this result.

<hr>

#### flatMap

```typescript
flatMap: <SP>(next: (value: S) => Result<SP, F>) => Result<SP, F>
```

Applies the specified `next` function to the success value of this result, and returns the
result of the `next` function. When this result is a failure, then it does **not** apply the
`next` function, but rather merely returns the failure result.

Arguments

- `next: (value: S) => Result<SP, F>` The function to apply to this result's success value

Returns

When this result is a success, then returns the `Result<SP, F>` of the `next` function. When
this result is a failure, then returns this `Result<SP, F>` (with the undefined success result type changed to `SP`).

<hr>

#### andThen

```typescript
andThen: <SP>(next: (value: S) => Result<SP, F>) => Result<SP, F>
```

**DEPRECATED** use flatMap

Applies the specified `next` function to the success value of this result, and returns the
result of the `next` function. When this result is a failure, then it does **not** apply the
`next` function, but rather merely returns the failure result.

Arguments

- `next: (value: S) => Result<SP, F>` The function to apply to this result's success value

Returns

When this result is a success, then returns the `Result<SP, F>` of the `next` function. When
this result is a failure, then returns this `Result<SP, F>` (with the undefined success result type changed to `SP`).

<hr>

#### conditionalMap

```typescript
conditionalMap: (predicate: (value: S) => boolean, mapper: (value: S) => S) => Result<S, F>
```

*NOTE* that unlike the {@link map} and {@link flatMap} functions, this conditional mapping
requires that the Result's value type is the same as the input value type.

Applies a mapping function to a value based on a predicate and returns a result. When the predicate
is met, then applies the mapping. When the predicate is not met, then returns the original value.

Arguments

- `predicate: (value: S) => boolean` A function that determines whether the provided value satisfies a condition.
- `mapper: (value: S) => S` A function that transforms the value if the predicate is true.

Returns

A `Result<S, F>` object containing either the transformed success value or the failure value.

<hr>

#### conditionalFlatmap

```typescript
conditionalFlatMap: (predicate: (value: S) => boolean, next: (value: S) => Result<S, F>) => Result<S, F>
```

*NOTE* that unlike the {@link map} and {@link flatMap} functions, this conditional mapping
requires that the Result's value type is the same as the input value type.

Applies a mapping function to a value based on a predicate and returns a result. When the predicate
is met, then applies the mapping. When the predicate is not met, then returns the original value.

Arguments

- `predicate: (value: S) => boolean` A function that determines whether the provided value satisfies a condition.
- `next: (value: S) => Result<SP, F>` The function to apply to this result's success value

Returns

A `Result<S, F>` object containing either the transformed success value or the failure value.

<hr>

#### filter

```typescript
filter: (filter: (value: S) => boolean, failureProvider?: () => F) => Result<S, F>
```

Applies the filter to the success value of this result and returns the result if it matches
the filter predicate, or a failure if it doesn't match the predicate. When this result is a
failure, then returns that failure.

Arguments

- `filter: (value: S) => boolean` The filter predicate
- `failureProvider?: () => F` Optional function that provides the failure when the success result does not match the predicate

Returns

When this result is a success, then returns the success if and only if it matches the predicate. If it does not match the predicate, the returns a failure. When this result is a failure, then returns the failure.

<hr>

#### mapFailure

```typescript
mapFailure: <FP>(mapper: (failure: F) => FP) => Result<S, FP>
```

When this result is a failure, then applies the specified `mapper` function to the failure.
When the result is a success, then simply returns a copy of this result. This function is
useful when you want to update the failure information at the end of a result chain.

Arguments

- `mapper: (failure: F) => FP` A mapper that accepts the failure and returns a new failure

Returns

When the result is a failure, maps the failure to a new failure and returns it


<hr>

#### asFailureOf

```typescript
asFailureOf: <SP>(fallback: F) => Result<SP, F>
```

Changes the type of the result when the result is a failure. This is helpful when checking a
result for failure, and then need to return a result whose success type is different.

Arguments

- `fallback: F` A fallback failure in case the failure in the result is undefined

Returns

A new failure result with the new success type

<hr>

#### liftPromise

```typescript
liftPromise: <SP>() => Promise<Result<SP, F>>
```

Convenience method to make it a bit easier to work with chained promises and results.


Attempts to lift the Promise out of the result and re-wrap the result as a promise. In other words, attempts to convert a `Result<Promise<S>, F>` into a `Promise<Result<SP>, F` where the type `SP`equals to the type `S` of the resolved promise.

Additionally, when lifting a `Promise` for a `Result` out of a `Result`, this function we also flatten the resulting `Result` of a `Result`. In other words, it will convert
`Result<Promise<Result<S, F>, F>` into a `Promise<Result<SP, F>>`.

Returns

A promise to a result whose success type is that same as the type of the promise's resolved value

<hr>

#### onSuccess

```typescript
onSuccess: (handler: (value: S) => void) => Result<S, F>
```

When this result is a success, calls the `handler` function on this result's value, and
returns this result. When this result is a failure, then does **not** call the `handler`, but
rather just returns this result. Note that this method does not modify this result.

Arguments

- `handler: (value: S) => void` The callback that accepts the success value, but doesn't return anything.

Returns 

This result (`Result<S, F>`).

See also`onFailure`, `always`

<hr>

#### onFailure

```typescript
onFailure: (handler: (error: F) => void) => Result<S, F>
```

When this result is a failure, calls the `handler` function on this result's error, and
returns this result. When this result is a success, then does **not** call the `handler`, but
rather just returns this result. Note that this method does not modify this result.

Arguments

- `handler: (error: F) => void` The callback that accepts the error, but doesn't return anything.

Returns

This result.


See also `onSuccess`, `always`

<hr>

#### always

```typescript
always: (handler: () => void) => Result<S, F>
```

Calls the handler regardless whether the result is a success or failure.

Arguments

- `handler: () => void` The callback to perform

Returns

This result (`Result<S, F>`)

See also `onSuccess`, `onFailure`


<hr>

#### getOrUndefined

```typescript
getOrUndefined: () => S | undefined
```

Returns

When this result is a success, then returns the value. Otherwise returns `undefined`.


See also `getOrDefault`, `getOrThrow`, `failureOrUndefined`, `getOr`

<hr>

#### getOrDefault

```typescript
getOrDefault: (value: S) => S
```

Returns

When this result is a success, then returns the value. Otherwise, returns the specified
default value.

See also `getOrUndefined`, `getOrThrow`, `failureOrUndefined`, `getOr`

<hr>

#### getOr

```typescript
getOrDefault: (supplier: () => S) => S
```

Returns

When this result is a success, then returns the value. Otherwise, returns the value
returned by the specified supplier function.

See also `getOrUndefined`, `getOrThrow`, `failureOrUndefined`

<hr>

#### getOrThrow

```typescript
getOrThrow: () => S
```

Returns

When this result is a success, then returns the value. Otherwise, throws an error that
contains the error in this result.

See also `getOrUndefined`, `getOrDefault`, `failureOrUndefined`, `getOr`   

<hr>

#### failureOrUndefined

```typescript
failureOrUndefined: () => F | undefined
```

Returns

When this result is a failure, then returns the error. Otherwise, returns `undefined`.

See also `getOrUndefined`, `getOrDefault`, `getOrThrow`   
