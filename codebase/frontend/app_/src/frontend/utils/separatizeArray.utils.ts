/**
 * Inserts element between every item in array
 *
 * @param arr Original array
 * @param separator Desired separator
 */
export function separatizeArray(arr: any[], separator: any) {
    return arr.reduce((r: any, a: any, i) => (arr[i + 1] ? r.concat(a, separator) : r.concat(a)), []);
}
