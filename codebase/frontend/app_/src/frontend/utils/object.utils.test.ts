import { areObjectsEqual, isDefined, isEmptyObject, pick, reverseNumberValue } from './object.utils';

describe('object.utils', () => {
    describe('reverseNumberValue', () => {
        it('should reverse value', () => {
            const val = reverseNumberValue(12, true);
            expect(val).toBe(-12);
        });

        it('should not  reverse value', () => {
            const val = reverseNumberValue(12, false);
            expect(val).toBe(12);
        });

        it('should value if not an number', () => {
            const val = reverseNumberValue('test' as any, false);
            expect(val).toBe('test');
        });
    });

    describe('isEmptyObject', () => {
        it('should return true if object is empty', () => {
            expect(isEmptyObject({})).toBeTruthy();
        });

        it('should return false if object is not empty', () => {
            expect(isEmptyObject({ key: 'value' })).toBeFalsy();
        });
    });

    describe('areObjectsEqual', () => {
        it('return false when objects has different number of keys', () => {
            const a = { a: 1 };
            const b = { a: 1, b: 2 };

            expect(areObjectsEqual(a, b)).toBe(false);
        });

        it('return false when objects has different values', () => {
            const a = { a: 1 };
            const b = { b: 2 };

            expect(areObjectsEqual(a, b)).toBe(false);
        });

        it('return false when objects has different keys', () => {
            const a = { a: 1 };
            const b = { b: 1 };

            expect(areObjectsEqual(a, b)).toBe(false);
        });

        it('return true when objects has same keys and values', () => {
            const a = { a: 1 };
            const b = { b: 1 };

            expect(areObjectsEqual(a, b)).toBe(false);
        });
    });

    describe('pick', () => {
        it('should pick necessary props', () => {
            expect(pick({ a: 'a', b: 'b' }, ['a'])).toEqual({ a: 'a' });
        });
    });

    describe('isDefined', () => {
        it('should return true for numbers', () => {
            expect(isDefined(0)).toBe(true);
            expect(isDefined(42)).toBe(true);
            expect(isDefined(-100)).toBe(true);
        });

        it('should return true for strings', () => {
            expect(isDefined('')).toBe(true);
            expect(isDefined('hello')).toBe(true);
        });

        it('should return true for objects and arrays', () => {
            expect(isDefined({})).toBe(true);
            expect(isDefined([])).toBe(true);
            expect(isDefined({ key: 'value' })).toBe(true);
        });

        it('should return true for boolean values', () => {
            expect(isDefined(true)).toBe(true);
            expect(isDefined(false)).toBe(true);
        });

        it('should return false for null and undefined', () => {
            expect(isDefined(null)).toBe(false);
            expect(isDefined(undefined)).toBe(false);
        });
    });
});
