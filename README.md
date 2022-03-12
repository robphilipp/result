# Result

## what?

A `Result` wraps the outcome of an operation that can either succeed or fail. This package also provides convenient
methods and functions for chaining, mapping, flat-mapping, reducing, converting `Results`. Please, read on, it's really
cool.

## why?

When you write a function returns the result of an operation that can either succeed or fail, you must decide how to
deal with the error condition. You have several options.

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

[//]: # (Recall, that when functions a `Result` they are forcing the caller to deal with the fact that the function may fail. Of course, the calling function could call one of the unwrapping functions, such as `getOrDefault&#40;&#41;`, `getOrThrow&#40;&#41;`, or `getOrUndefined&#40;&#41;`, but that defeats the whole point of using `Result`. )

[//]: # ()

[//]: # (Therefore, when all functions that can result in an error return a `Result`, you will have consistent pattern by which to deal with possible errors.)

[//]: # ()

[//]: # (Rather, the user   Wrap calls that throw errors with a `Result`.)


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