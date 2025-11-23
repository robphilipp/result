// Optional.test.ts
import {Optional} from './Optional';

describe('Optional', () => {
    describe('static of', () => {
        it('should create a non-empty Optional when given a non-null value', () => {
            const optional = Optional.of(42);
            expect(optional.isNotEmpty()).toBe(true);
            expect(optional.isEmpty()).toBe(false);
        });
    });

    describe('static ofNullable', () => {
        it('should create a non-empty Optional when given a non-null value', () => {
            const optional = Optional.ofNullable('hello');
            expect(optional.isNotEmpty()).toBe(true);
        });

        it('should create an empty Optional when given a null value', () => {
            const optional = Optional.ofNullable(null);
            expect(optional.isEmpty()).toBe(true);
        });

        it('should create an empty Optional when given an undefined value', () => {
            const optional = Optional.ofNullable(undefined);
            expect(optional.isEmpty()).toBe(true);
        });
    });

    describe('static empty', () => {
        it('should create an empty Optional', () => {
            const optional = Optional.empty();
            expect(optional.isEmpty()).toBe(true);
        });
    });

    describe('isEmpty', () => {
        it('should return true for an empty Optional', () => {
            const optional = Optional.empty();
            expect(optional.isEmpty()).toBe(true);
        });

        it('should return false for a non-empty Optional', () => {
            const optional = Optional.of('value');
            expect(optional.isEmpty()).toBe(false);
        });
    });

    describe('isNotEmpty', () => {
        it('should return true for a non-empty Optional', () => {
            const optional = Optional.of(123);
            expect(optional.isNotEmpty()).toBe(true);
        });

        it('should return false for an empty Optional', () => {
            const optional = Optional.empty();
            expect(optional.isNotEmpty()).toBe(false);
        });
    });

    describe('getOrElse', () => {
        it('should return the value for a non-empty Optional', () => {
            const optional = Optional.of<number>(10);
            expect(optional.getOrElse(20)).toBe(10);
        });

        it('should return the default value for an empty Optional', () => {
            const optional = Optional.empty<number>();
            expect(optional.getOrElse(20)).toBe(20);
        });
    });

    describe('getOrThrow', () => {
        it('should return the value for a non-empty Optional', () => {
            const optional = Optional.of('test');
            expect(optional.getOrThrow(() => new Error('Value is missing'))).toBe('test');
        });

        it('should throw an error for an empty Optional', () => {
            const optional = Optional.empty<string>();
            expect(() => optional.getOrThrow(() => new Error('Value is missing'))).toThrow('Value is missing');
        });
    });

    describe('map', () => {
        it('should apply the mapper function to the value in a non-empty Optional', () => {
            const optional = Optional.of(5).map(value => value * 2);
            expect(optional.isNotEmpty()).toBe(true);
            expect(optional.getOrElse(0)).toBe(10);
        });

        it('should return an empty Optional when mapping over an empty Optional', () => {
            const optional = Optional.empty<number>().map(value => value * 2);
            expect(optional.isEmpty()).toBe(true);
        });
    });

    describe('filter', () => {
        it('should return the same Optional if the predicate matches', () => {
            const optional = Optional.of<number>(10).filter(value => value > 5);
            expect(optional.isNotEmpty()).toBe(true);
            expect(optional.getOrElse(0)).toBe(10);
        });

        it('should return an empty Optional if the predicate does not match', () => {
            const optional = Optional.of(3).filter(value => value > 5);
            expect(optional.isEmpty()).toBe(true);
        });

        it('should return an empty Optional when filtering an empty Optional', () => {
            const optional = Optional.empty<number>().filter(value => value > 5);
            expect(optional.isEmpty()).toBe(true);
        });
    });
});