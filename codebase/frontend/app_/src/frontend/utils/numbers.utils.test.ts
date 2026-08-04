import { getFirstNumbersFromString, incrementByCondition, isEven, limitNumberRange, toRealNumber } from './numbers';

describe('numbers.utils', () => {
    describe('incrementByCondition', () => {
        it('Should return length + 1 of array', () => {
            const num = 6;

            const length = incrementByCondition(num, true);

            expect(length).toBe(7);
        });

        it('Should return length of array', () => {
            const num = 6;

            const length = incrementByCondition(num, false);

            expect(length).toBe(6);
        });
    });

    describe('limitNumberRange', () => {
        it('should return number from props when it is in range', () => {
            const result = limitNumberRange(10, 1, 30);

            expect(result).toBe(10);
        });

        it('should return min number when number from props < min number', () => {
            const result = limitNumberRange(0, 1, 30);

            expect(result).toBe(1);
        });

        it('should return max number when number from props > min number', () => {
            const result = limitNumberRange(100, 1, 30);

            expect(result).toBe(30);
        });
    });

    describe.each([
        [1, '12345', 12345],
        [2, 'abc123def', 123],
        [3, '!@#12$%3^', 12],
        [4, 'abcdef', undefined],
        [5, '', undefined],
        [6, 'abc007', 7],
    ])('getFirstNumbersFromString', (index, input, expected) => {
        it(`should return ${expected} for test No ${index}`, () => {
            expect(getFirstNumbersFromString(input)).toBe(expected);
        });
    });

    describe('toRealNumber', () => {
        it('should return the number when a valid number is provided', () => {
            expect(toRealNumber(42)).toBe(42);
            expect(toRealNumber(-25)).toBe(-25);
        });

        it('should return the number when a valid numeric string is provided', () => {
            expect(toRealNumber('11')).toBe(11);
            expect(toRealNumber('-22')).toBe(-22);
            expect(toRealNumber('  42  ')).toBe(42);
            expect(toRealNumber('  -42  ')).toBe(-42);
        });

        it('should return the number when a valid floating-point string is provided', () => {
            expect(toRealNumber('0.003431')).toBe(0.003431);
            expect(toRealNumber('-0.003431')).toBe(-0.003431);
            expect(toRealNumber('42.01')).toBe(42.01);
            expect(toRealNumber('-42.01')).toBe(-42.01);
        });

        it('should return null for a string with only a decimal point', () => {
            expect(toRealNumber('.')).toBeNull();
        });

        it('should return null for a string with a number and special characters', () => {
            expect(toRealNumber('42$')).toBeNull();
            expect(toRealNumber('abc42')).toBeNull();
            expect(toRealNumber('abc 42')).toBeNull();
            expect(toRealNumber('42.abc')).toBeNull();
            expect(toRealNumber('42. abc')).toBeNull();
            expect(toRealNumber('42,01')).toBeNull();
            expect(toRealNumber('42..01')).toBeNull();
        });

        it('should return null for a non-numeric string', () => {
            expect(toRealNumber('abc')).toBeNull();
        });

        it('should return null for an empty string', () => {
            expect(toRealNumber('')).toBeNull();
        });

        it('should return null for a string with only spaces', () => {
            expect(toRealNumber('   ')).toBeNull();
        });

        it('should return null for NaN', () => {
            expect(toRealNumber(NaN)).toBeNull();
        });

        it('should return null for Infinity', () => {
            expect(toRealNumber(Infinity)).toBeNull();
        });

        it('should return null for -Infinity', () => {
            expect(toRealNumber(-Infinity)).toBeNull();
        });

        it('should return null for null input', () => {
            expect(toRealNumber(null as unknown as string)).toBeNull();
        });

        it('should return null for undefined input', () => {
            expect(toRealNumber(undefined as unknown as number)).toBeNull();
        });
    });

    describe('isEven', () => {
        it('Should return true for 2', () => {
            const num = 2;
            expect(isEven(num)).toBe(true);
        });

        it('Should return false for 3', () => {
            const num = 3;
            expect(isEven(num)).toBe(false);
        });
    });
});
