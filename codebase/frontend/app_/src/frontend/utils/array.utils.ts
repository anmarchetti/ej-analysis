const HALF_ARRAY_DIVIDER = 2;

/**
 * Move item, that satisfies the condition, to the front of the array
 * @param array
 * @param predicate - function
 * @return new modified array
 */

import { nonEmptyString } from './string.utils';

export function moveToFrontOfArray<T>(array: T[], predicate: (v: T) => boolean): T[] {
    const i = array.findIndex(x => predicate(x));

    if (i === -1) return array;

    return [array[i], ...array.slice(0, i), ...array.slice(i + 1)];
}

/**
 * Creates an array of elements split into two groups, the first of which contains
 * elements predicate returns truthy for, second - falsy
 * @param array
 * @param isValid - function
 * @return new 2 arrays
 */
export function partition<T>(array: T[], isValid: (item: T, index: number) => boolean): T[][] {
    return array.reduce(
        ([pass, fail], elem, index) => (isValid(elem, index) ? [[...pass, elem], fail] : [pass, [...fail, elem]]),
        [[], []],
    );
}

/**
 * Split array into parts with provided length, i.e `splitArray([1, 2, 3, 4], 2)` will return `[[1, 2], [3, 4]]`
 */
export function splitArray<T>(input: T[], spacing: number): T[][] {
    const output: T[][] = [];

    for (let i = 0; i < input.length; i += spacing) {
        output[output.length] = input.slice(i, i + spacing);
    }

    return output;
}

/**
 * String array check intersection with another array elements
 * @param arr1
 * @param arr2
 * @return new array with elements from both arrays
 */

export const intersection = (arr1: Array<string> | undefined = [], arr2: Array<string> | undefined = []): string[] =>
    arr1.filter(value => arr2.includes(value));

/**
 * Check is there an intersection between two string arrays
 * @param arr1
 * @param arr2
 * @return is there an intersection
 */

export const hasIntersection = (arr1: Array<string> | undefined = [], arr2: Array<string> | undefined = []): boolean =>
    arr1.some(value => arr2.includes(value));

/** Group an array of objects by a key */
export const groupArrayByKey = <T extends Record<string, any>, K extends keyof T>(
    arr: T[],
    key: K,
): Record<string, T[]> =>
    arr.reduce((acc, item) => ((acc[item[key]] = [...(acc[item[key]] || []), item]), acc), {} as Record<string, T[]>);

export const isEmpty = <T>(array: T[] | undefined): boolean => !Array.isArray(array) || !array.length;

/** Check if 2 arrays are equal regardless of order, AND SORT THEM !!!
 * @param arr1
 * @param arr2
 * @return are arrays equal
 */
export const haveSameElements = <T>(arr1: T[], arr2: T[]): boolean =>
    JSON.stringify(arr1.sort()) === JSON.stringify(arr2.sort());

/** Check if 2 arrays are equal
 * @param arr1
 * @param arr2
 * @return are arrays equal
 */
export const areArraysEqual = <T>(arr1: T[], arr2: T[]): boolean => JSON.stringify(arr1) === JSON.stringify(arr2);

/** Clone value with deep objects
 * @param value
 * @return a deep clone of value
 */
export const deepClone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

/** Combine multiply arrays without duplicates and exclude empty strings from result
 * @param arrays
 * @return new unique array with elements from both arrays without duplicates and empty strings
 */
export const getUniqArray = (...arrays: (string | number)[][]): (string | number)[] => [
    ...new Set(arrays.reduce((acc, arr) => acc.concat(arr.filter(el => el !== '')), [])),
];

/**
 * function to filter duplicates from array
 * @param item
 * @param pos
 * @param arr
 * @returns
 */
export const onlyUnique = <T>(item: T, pos: number, arr: T[]): boolean => arr.indexOf(item) == pos;

/** Remove null and undefined from array
 * @param array
 * @return array without null and undefined
 */
export const removeNullOrUndefined = <TValue>(array: TValue[]): Exclude<TValue, undefined | null>[] =>
    array.filter((e): e is Exclude<typeof e, undefined | null> => e !== undefined && e !== null);

export const concatUniqueArrayValues = (arr1: string[], arr2: string[]): string[] =>
    [...arr1, ...arr2].filter(onlyUnique);

export const removePrefixes = (arr: string[]): string[] =>
    arr.filter((str, i, strings) => !strings.some(el => el !== str && el.startsWith(str)));

/**
 * Returns the second latest element of the array if it has two or more elements.
 * If the array has only one element, returns that element.
 * If the array is empty or undefined, returns undefined.
 *
 * @param arr - The array to retrieve the element from
 * @returns The second latest element, the only element, or undefined
 */
export const getSecondLatestOrFirst = <T>(arr: T[]): T | undefined => {
    if (!arr || arr.length === 0) {
        return undefined;
    }

    if (arr.length === 1) {
        return arr[0];
    }

    const secondLatest = 2;

    return arr[arr.length - secondLatest];
};

/**
 * Calculates the half-length of the given array, rounded down.
 * If the array is empty, returns 0.
 * Rounding down is intentional: in usage contexts
 * (e.g. airport lists, destination lists) the first column already has
 * an extra item like AnywhereInput or GeoInput.
 *
 * @param array - The array to measure
 * @returns The integer value representing half of the array's length
 */
export const arrayHalfLength = (array: any[]): number => Math.floor(array.length / HALF_ARRAY_DIVIDER);

/**
 * Returns the first half of the array.
 * If the array is empty, returns an empty array.
 *
 * @param array - The array to slice
 * @returns A new array containing elements from the start up to the half-length
 */
export const leftColumn = <T>(array: T[]): T[] => array.slice(0, arrayHalfLength(array));

/**
 * Returns the second half of the array.
 * If the array is empty, returns an empty array.
 *
 * @param array - The array to slice
 * @returns A new array containing elements from the half-length to the end
 */
export const rightColumn = <T>(array: T[]): T[] => array.slice(arrayHalfLength(array));

/**
 * function to join arrays of string unique values with separator
 * @param arr1 first array
 * @param arr2 second array
 * @param separator separator to join values, default is ','
 * @returns joined string of unique non empty values from both arrays
 */
export const joinUniqueNonEmptyArrayValues = (arr1: string[], arr2: string[], separator: string = ','): string =>
    concatUniqueArrayValues(arr1, arr2).filter(nonEmptyString).join(separator);
