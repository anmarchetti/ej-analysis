import {
    areArraysEqual,
    arrayHalfLength,
    concatUniqueArrayValues,
    deepClone,
    getSecondLatestOrFirst,
    getUniqArray,
    haveSameElements,
    isEmpty,
    joinUniqueNonEmptyArrayValues,
    leftColumn,
    moveToFrontOfArray,
    onlyUnique,
    removeNullOrUndefined,
    removePrefixes,
    rightColumn,
} from './array.utils';

describe('array.utils', () => {
    describe('moveToFrontOfArray', () => {
        const array = [1, 2, 3, 4];

        it(`should return array with new first item and don't change initial array`, () => {
            const newArray = moveToFrontOfArray(array, x => x % 3 === 0);
            expect(newArray).toEqual([3, 1, 2, 4]);
            expect(array).toEqual(array);
        });

        it(`should return inital array if any element doesn't match the predicate`, () => {
            const newArray = moveToFrontOfArray(array, x => x % 5 === 0);
            expect(newArray).toEqual(array);
        });

        it(`should move only one element to the front if several elements match the predicate`, () => {
            const newArray = moveToFrontOfArray(array, x => x % 2 === 0);
            expect(newArray).toEqual([2, 1, 3, 4]);
        });
    });

    describe('Check if array is empty', () => {
        it(`should return true if array is empty`, () => {
            const array = [];
            expect(isEmpty(array)).toBeTruthy();
        });

        it(`should return true if array is undefined`, () => {
            const array = undefined;
            expect(isEmpty(array)).toBeTruthy();
        });

        it(`should return false if array is not empty`, () => {
            const array = [1, 2, 3, 4];
            expect(isEmpty(array)).toBeFalsy();
        });
    });

    describe('getUniqArray', () => {
        it(`should return a new unique array from one array`, () => {
            expect(getUniqArray([1, 2, 3])).toEqual([1, 2, 3]);
        });

        it(`should return a new unique array without empty stings from two arrays`, () => {
            expect(getUniqArray(['test1', 'test2', ''], ['', ''])).toEqual(['test1', 'test2']);
        });

        it(`should return a new unique array from two arrays with no duplicate elements`, () => {
            expect(getUniqArray([1, 2, 3], [3, '3', 5])).toEqual([1, 2, 3, '3', 5]);
        });

        it(`should return a new unique array from three arrays with no duplicate elements`, () => {
            expect(getUniqArray([1, 2, 3], [3, 3, 5], [5, 5, 6])).toEqual([1, 2, 3, 5, 6]);
        });
    });

    describe('onlyUnique', () => {
        it('should filter duplicates', () => {
            expect([null, '1', '2', '1'].filter(onlyUnique)).toEqual([null, '1', '2']);
        });

        it('should filter uduplicates multiple times', () => {
            expect(['1', '2', '1', '1'].filter(onlyUnique)).toEqual(['1', '2']);
        });

        it('should not filter duplicates of another type', () => {
            expect(['1', '2', 1].filter(onlyUnique)).toEqual(['1', '2', 1]);
        });
    });

    describe('deepClone', () => {
        it('Should return the same new obj', () => {
            const obj = { field1: { nestedField: 'Arno Gorn' } };

            const newObj = deepClone(obj);

            expect(obj).toStrictEqual(newObj);
            expect(obj === newObj).toBe(false);
        });
    });

    describe('removeNullOrUndefined', () => {
        it('Should remove null and undefined from array', () => {
            const array = ['', 'string', null, undefined, 123, 0];

            const newArr = removeNullOrUndefined(array);

            expect(newArr).toStrictEqual(['', 'string', 123, 0]);
        });
    });

    describe.each([
        [
            ['A', 'B', 'C'],
            ['D', 'E', 'F'],
            ['A', 'B', 'C', 'D', 'E', 'F'],
        ],
        [
            ['A', 'B', 'C'],
            ['B', 'C', 'D'],
            ['A', 'B', 'C', 'D'],
        ],
    ])('concatUniqueArrayValues', (arr1, arr2, expected) => {
        it(`should return ${expected}`, () => {
            expect(concatUniqueArrayValues(arr1, arr2)).toStrictEqual(expected);
        });
    });

    describe('removePrefixes', () => {
        it('should return array without prefix duplication', () => {
            const array = ['A', 'ABC', 'AB', 'B', 'C', 'D', 'DE', 'DEF', 'BC', ''];

            const newArr = removePrefixes(array);

            expect(newArr).toStrictEqual(['ABC', 'C', 'DEF', 'BC']);
        });
    });

    describe('haveSameElements', () => {
        it('should return true if arrays are equal', () => {
            const arr1 = [1, 2, 3];
            const arr2 = [3, 2, 1];

            expect(haveSameElements(arr1, arr2)).toBe(true);
            expect(arr1).toStrictEqual([1, 2, 3]);
            expect(arr2).toStrictEqual([1, 2, 3]);
        });

        it('should return false if arrays are not equal', () => {
            const arr1 = [1, 2, 3];
            const arr2 = [3, 2, 1, 4];

            expect(haveSameElements(arr1, arr2)).toBe(false);
            expect(arr1).toStrictEqual([1, 2, 3]);
            expect(arr2).toStrictEqual([1, 2, 3, 4]);
        });
    });

    describe('areArraysEqual', () => {
        it('should return true if arrays are equal', () => {
            const arr1 = [1, 2, 3];
            const arr2 = [1, 2, 3];

            expect(areArraysEqual(arr1, arr2)).toBe(true);
            expect(arr1).toStrictEqual([1, 2, 3]);
            expect(arr2).toStrictEqual([1, 2, 3]);
        });

        it('should return false if arrays are equal but in different order', () => {
            const arr1 = [1, 2, 3];
            const arr2 = [3, 2, 1];

            expect(areArraysEqual(arr1, arr2)).toBe(false);
            expect(arr1).toStrictEqual([1, 2, 3]);
            expect(arr2).toStrictEqual([3, 2, 1]);
        });

        it('should return false if arrays are not equal', () => {
            const arr1 = [1, 2, 3];
            const arr2 = [3, 2, 1, 4];

            expect(areArraysEqual(arr1, arr2)).toBe(false);
            expect(arr1).toStrictEqual([1, 2, 3]);
            expect(arr2).toStrictEqual([3, 2, 1, 4]);
        });
    });

    describe('getSecondLatestOrFirst', () => {
        it('should returns undefined for empty array', () => {
            expect(getSecondLatestOrFirst([])).toBeUndefined();
        });

        it('should returns the only element for array with one element', () => {
            expect(getSecondLatestOrFirst(['a'])).toBe('a');
        });

        it('should returns the first element for array with two elements', () => {
            expect(getSecondLatestOrFirst(['a', 'b'])).toBe('a');
        });

        it('should returns the second latest element for array with more than two elements', () => {
            expect(getSecondLatestOrFirst(['a', 'b', 'c', 'd', 'e'])).toBe('d');
        });
    });

    describe('arrayHalfLength', () => {
        const evenArray = [1, 2, 3, 4, 5, 6];
        const oddArray = [1, 2, 3, 4, 5, 6, 7];

        it('should return number of half of the elements', () => {
            const halfLength = arrayHalfLength(evenArray);

            expect(halfLength).toStrictEqual(3);
        });

        it('should return number of half of the elements rounded down when odd length of array is provided', () => {
            const halfLength = arrayHalfLength(oddArray);

            expect(halfLength).toStrictEqual(3);
        });
    });

    describe('leftColumn', () => {
        const arr = [1, 2, 3, 4, 5, 6];

        it('should return left half of array', () => {
            const leftPart = leftColumn(arr);

            expect(leftPart).toStrictEqual([1, 2, 3]);
        });
    });

    describe('rightColumn', () => {
        const arr = [1, 2, 3, 4, 5, 6];

        it('should return left half of array', () => {
            const rightPart = rightColumn(arr);

            expect(rightPart).toStrictEqual([4, 5, 6]);
        });
    });

    describe('joinUniqueNonEmptyArrayValues', () => {
        it('should join unique, non-empty values from both arrays with default comma separator', () => {
            const arr1 = ['A', '', 'B', 'C'];
            const arr2 = ['B', 'D', '', 'E'];
            expect(joinUniqueNonEmptyArrayValues(arr1, arr2)).toBe('A,B,C,D,E');
        });

        it('should join unique, non-empty values from both arrays with custom separator', () => {
            const arr1 = ['A', '', 'B'];
            const arr2 = ['B', 'C', ''];
            expect(joinUniqueNonEmptyArrayValues(arr1, arr2, '|')).toBe('A|B|C');
        });

        it('should return empty string if all values are empty', () => {
            expect(joinUniqueNonEmptyArrayValues(['', ''], ['', ''])).toBe('');
        });

        it('should handle first empty array', () => {
            expect(joinUniqueNonEmptyArrayValues([], ['C', 'D'])).toBe('C,D');
        });

        it('should handle second empty array', () => {
            expect(joinUniqueNonEmptyArrayValues(['A', 'B'], [])).toBe('A,B');
        });
    });
});
