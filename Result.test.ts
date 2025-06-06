import {
    failureResult,
    forEachElement, forEachPromise,
    forEachResult,
    reduceToResult,
    Result,
    resultFromAll, resultFromAny,
    successResult, ToString
} from './Result'

describe('when creating a Result', () => {
    it('should be able to create a success', () => {
        const result = successResult([1, 2, 3, 4])
        expect(result.succeeded).toBeTruthy()
        expect(result.failed).toBeFalsy()
        expect(result.getOrUndefined()).toBeDefined()
        expect(result.getOrUndefined()).toEqual([1, 2, 3, 4])
        expect(result.getOrThrow()).toEqual([1, 2, 3, 4])
        expect(result.getOrDefault([])).toEqual([1, 2, 3, 4])
        expect(result.getOr(() => [2, 3, 4, 5])).toEqual([1, 2, 3, 4])
    })

    it('should be able to create a failure', () => {
        const result = failureResult("failed to work")
        expect(result.failed).toBeTruthy()
        expect(result.succeeded).toBeFalsy()
        expect(result.getOrUndefined()).toBeUndefined()
        expect(() => result.getOrThrow()).toThrowError("failed to work")
        expect(result.getOrDefault([2, 4, 6])).toEqual([2, 4, 6])
        expect(result.getOr(() => [2, 4, 6])).toEqual([2, 4, 6])
    })

    describe('when doing a map', () => {
        it('should remain a failure when mapping result of failure', () => {
            const result = failureResult("failed to work").map(() => [6, 7, 8, 9, 10])
            expect(result.failed).toBeTruthy()
            expect(result.succeeded).toBeFalsy()
            expect(result.getOrUndefined()).toBeUndefined()
            expect(() => result.getOrThrow()).toThrowError("failed to work")
            expect(result.getOrDefault([2, 4, 6])).toEqual([2, 4, 6])
        })

        it('should be able to map a failure when mapping result of failure', () => {
            const result = failureResult<unknown, string>("failed to work").mapFailure(() => "failed to work, but didn't")
            expect(result.failed).toBeTruthy()
            expect(result.succeeded).toBeFalsy()
            expect(result.getOrUndefined()).toBeUndefined()
            expect(result.error).toBe("failed to work, but didn't")
            expect(() => result.getOrThrow()).toThrowError("failed to work, but didn't")
        })
    })

    describe('when doing a filter', () => {
        it('should be able to filter success result with met predicate', () => {
            const result = successResult(5).filter(value => value === 5)
            expect(result.succeeded).toBeTruthy()
            expect(result.getOrThrow()).toBe(5)
        })

        it('should be able to filter success with unmet predicate', () => {
            const result = successResult<number, string>(5)
                .filter(value => value % 2 === 0, () => 'must be odd')
            expect(result.failed).toBeTruthy()
            expect(result.error).toBe('must be odd')
            // expect(result.error?.toString()).toBe('Predicate not satisfied')
        })

    })

    describe('when doing a flat map', () => {
        it('should be able to flat-map values for successful result', () => {
            const result = successResult([1, 2, 3, 4])
                .flatMap(() => successResult([6, 7, 8, 9, 10]))
            expect(result.succeeded).toBeTruthy()
            expect(result.failed).toBeFalsy()
            expect(result.getOrUndefined()).toBeDefined()
            expect(result.getOrUndefined()).toEqual([6, 7, 8, 9, 10])
            expect(result.getOrDefault([])).toEqual([6, 7, 8, 9, 10])
            expect(result.getOrThrow()).toEqual([6, 7, 8, 9, 10])
        })

        it('should remain a failure when flat-mapping result of failure', () => {
            const result = failureResult("failed to work")
                .flatMap(() => successResult([6, 7, 8, 9, 10]))
            expect(result.failed).toBeTruthy()
            expect(result.succeeded).toBeFalsy()
            expect(result.getOrUndefined()).toBeUndefined()
            expect(() => result.getOrThrow()).toThrowError("failed to work")
            expect(result.getOrDefault([2, 4, 6])).toEqual([2, 4, 6])
        })
    })

    describe('when applying conditionalMap', () => {
        it('should be able to do a conditional map on a success', () => {
            const result = successResult(5)
                .conditionalMap(
                    value => value % 2 === 1,
                    value => value * 10
                )
            expect(result.succeeded).toBeTruthy()
            expect(result.failed).toBeFalsy()
            expect(result.getOrThrow()).toBe(50)
        })

        it('should pass through the value as a success when condition is not met', () => {
            const result = successResult(5)
                .conditionalMap(
                    value => value % 2 === 0,
                    value => value * 10
                )
            expect(result.succeeded).toBeTruthy()
            expect(result.failed).toBeFalsy()
            expect(result.getOrThrow()).toBe(5)
        })

        it('should be able to do a conditional map on a failure', () => {
            const result = failureResult<number, string>("oops")
                .conditionalMap(
                    value => value % 2 === 0,
                    value => value * 10
                )
            expect(result.succeeded).toBeFalsy()
            expect(result.failed).toBeTruthy()
            expect(result.getOrUndefined()).toBeUndefined()
        })
    })

    describe('when applying conditionalFlatMap', () => {
        it('should be able to do a conditional flatmap on a success', () => {
            const result = successResult<number, string>(5)
                .conditionalFlatMap(
                    value => value % 2 === 1,
                    value => successResult(value * 10)
                )
            expect(result.succeeded).toBeTruthy()
            expect(result.failed).toBeFalsy()
            expect(result.getOrThrow()).toBe(50)
        })

        it('should pass through the value as a success when condition is not met', () => {
            const result = successResult<number, string>(5)
                .conditionalFlatMap(
                    value => value % 2 === 0,
                    value => successResult(value * 10)
                )
            expect(result.succeeded).toBeTruthy()
            expect(result.failed).toBeFalsy()
            expect(result.getOrThrow()).toBe(5)
        })

        it('should be able to do a conditional map on a failure', () => {
            const result = failureResult<number, string>("oops")
                .conditionalFlatMap(
                    value => value % 2 === 0,
                    value => successResult(value * 10)
                )
            expect(result.succeeded).toBeFalsy()
            expect(result.failed).toBeTruthy()
            expect(result.getOrUndefined()).toBeUndefined()
        })
    })

    describe('when flattening nested results', () => {
        it('should be able to apply a mapping to an array of results and combine it into one result', () => {
            const results: Array<Result<string, string>> = [
                successResult("an apple"),
                successResult("busy bumble bees"),
                successResult("changing clothing causes constipation"),
                successResult("doorknobs doorbells dinner ding dong")
            ]
            const combined = forEachResult<string, string, number, string>(
                results,
                result => result.map(value => value.split(" ").length)
            )
            expect(combined.succeeded).toBeTruthy()
            expect(combined.failed).toBeFalsy()
            expect(combined.getOrUndefined()).toBeDefined()
            expect(combined.getOrUndefined()).toEqual([2, 3, 4, 5])
            expect(combined.getOrDefault([]).length).toBe(4)
        })


        it('should not be able to apply a mapping to an array of results and combine it into one result when it contains failures', () => {
            const results: Array<Result<string, string>> = [
                successResult("an apple"),
                successResult("busy bumble bees"),
                successResult("changing clothing causes constipation"),
                failureResult("doorknobs doorbells dinner ding dong"),
                failureResult("oops only one operation ordinarily opens")
            ]
            const combined = forEachResult<string, string, number, string>(
                results,
                result => result.map(value => value.split(" ").length)
            )
            expect(combined.failed).toBeTruthy()
            expect(combined.succeeded).toBeFalsy()
            expect(combined.getOrUndefined()).toBeUndefined()
            expect(combined.error).toEqual([
                "doorknobs doorbells dinner ding dong",
                "oops only one operation ordinarily opens"
            ])
        })

        it('should be able to reduce an array of results into one result', () => {
            const inputValues = [
                "an apple",
                "busy bumble bees",
                "changing clothing causes constipation",
                "doorknobs doorbells dinner ding dong"
            ]
            const reduced = reduceToResult<string, number[], string>(
                inputValues,
                (values, inputValue) => {
                    values.push(inputValue.split(" ").length)
                    return successResult(values)
                },
                []
            )
            expect(reduced.succeeded).toBeTruthy()
            expect(reduced.failed).toBeFalsy()
            expect(reduced.getOrUndefined()).toBeDefined()
            expect(reduced.getOrUndefined()).toEqual([2, 3, 4, 5])
            expect(reduced.getOrDefault([]).length).toBe(4)
        })

        it('should not be able to reduce an array of results into one result when it contains failures', () => {
            const inputValues = [
                "an apple",
                "busy bumble bees",
                "changing clothing causes constipation",
                "doorknobs doorbells dinner ding dong"
            ]
            const reduced = reduceToResult<string, number[], string>(
                inputValues,
                (values, inputValue) => {
                    if (inputValue.startsWith('d')) return failureResult("oops only one operation ordinarily opens")
                    values.push(inputValue.split(" ").length)
                    return successResult(values)
                },
                []
            )
            expect(reduced.failed).toBeTruthy()
            expect(reduced.succeeded).toBeFalsy()
            expect(reduced.getOrUndefined()).toBeUndefined()
            expect(reduced.error).toEqual(["oops only one operation ordinarily opens"])
        })

    })

    it('should skip onFailure when result is a success', () => {
        let message = ""
        const result = successResult("success!")
            .onFailure(() => message = "failed")
            .onSuccess(() => message = "succeeded")
            .onFailure(() => message = "failed again")
        expect(message).toEqual("succeeded")
        expect(result.getOrUndefined()).toEqual("success!")
    })

    it('should skip onSuccess when result is a failure', () => {
        let message = ""
        const result = failureResult("failed!")
            .onSuccess(() => message = "success")
            .onFailure(() => message = "failed")
            .onSuccess(() => message = "success again")
        expect(message).toEqual("failed")
        expect(result.error).toEqual("failed!")
    })
})

describe('when comparing results', () => {
    it('should treat successes and failures as unequal', () => {
        expect(successResult<string, string>("yay!").equals(failureResult("damn!"))).toBeFalsy()
        expect(failureResult<string, string>("damn!").equals(successResult("yay!"))).toBeFalsy()
    })

    it('should treat success as equal iff their values are equal', () => {
        expect(successResult<string, string>("yay!").equals(successResult("yay!"))).toBeTruthy()
        expect(successResult<string, string>("yay!").equals(successResult("yippy!"))).toBeFalsy()
    })

    it('should tread failures as equal iff their errors are equal', () => {
        expect(failureResult<string, string>("damn!").equals(failureResult("damn!"))).toBeTruthy()
        expect(failureResult<string, string>("damn!").equals(failureResult("shit!"))).toBeFalsy()

    })
})

describe('when combining a list of results into a single result', () => {
    it('should be able to return the successes', () => {
        const result = forEachElement(
            [1, 2, 3, 4, 5],
            elem => successResult(2 * elem)
        )
        expect(result.succeeded).toBeTruthy()
        expect(result.getOrDefault([]).length).toBe(5)
        expect(result.getOrDefault([])).toEqual([2, 4, 6, 8, 10])
    })

    it('should fail if any one fails', () => {
        const result = forEachElement(
            [1, 2, 3, 4, 5],
            elem => elem === 3 ?
                failureResult<number, string>("three sucks") :
                successResult<number, string>(2 * elem)
        )
        expect(result.failed).toBeTruthy()
        expect(result.error).toEqual(["three sucks"])
    })

    it('should combine all successful results into a new result', () => {
        const result = [1, 2, 3, 4, 5].map(successResult)
        expect(resultFromAll(result).getOrThrow()).toEqual(successResult([1, 2, 3, 4, 5]).getOrThrow())
    })
    it('should not combine all results into a result when one or more results are failures', () => {
        const result: Array<Result<number, string>> = [...[1, 2, 3, 4, 5].map(x => successResult<number, string>(x)), failureResult('hmm')]
        expect(resultFromAll(result).failed).toBeTruthy()
    })
    it('should combine all results into a result discarding failures failures', () => {
        const result: Array<Result<number, string>> = [...[1, 2, 3, 4, 5].map(x => successResult<number, string>(x)), failureResult('hmm')]
        expect(resultFromAny(result).succeeded).toBeTruthy()
        expect(resultFromAny(result).getOrThrow()).toEqual(successResult([1, 2, 3, 4, 5]).getOrThrow())
    })
})

describe('when using promises', () => {
    it('should convert a result wrapping a promise to promise wrapping a result', async () => {
        const result = successResult<Promise<Result<string, string>>, string>(new Promise((resolve,) => {
            setTimeout(() => {
                resolve(successResult('yep'))
            }, 300)
        }))
        const promised = await result.liftPromise<string>()
        expect(promised.getOrThrow()).toEqual('yep')
        expect(promised.getOrThrow()).not.toEqual('yeps')
    })

    it('should be able to convert an array of elements when all promises succeed', async () => {
        const results = await forEachPromise([1, 2, 3, 4, 5], elem => new Promise<Result<number, string>>((resolve,) => {
            setTimeout(() => {
                resolve(successResult(elem * 2))
            }, 300)
        }))

        expect(results.getOrThrow()).toEqual([2, 4, 6, 8, 10])
    })

    it('should not be able to convert an array of elements when all promises do not succeed', async () => {
        const results = await forEachPromise([1, 2, 3, 4, 5], elem => new Promise<Result<number, string>>((resolve, reject) => {
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
    })
})