import { parse } from 'flatted';

/** Functions for working with Web Storage (localStorage or sessionStorage)
 * Used try...catch statements if storage is disable or all available storage space was used up
 */

export const getWebStorageItem = <R = any>(
    key: string,
    shouldParse: boolean = false,
    storage?: Storage,
): R | undefined => {
    try {
        const webStorage = storage || localStorage;
        let output = webStorage.getItem(key) || undefined;

        if (output && shouldParse) {
            output = JSON.parse(output);
        }

        return output as R;
    } catch (e) {
        return undefined;
    }
};

export const setWebStorageItem = (key: string, value: any, storage?: Storage): void => {
    try {
        const webStorage = storage || localStorage;

        if (typeof value !== 'string') {
            value = JSON.stringify(value);
        }

        webStorage.setItem(key, value as string);
    } catch (e) {}
};

export const removeWebStorageItem = (key: string, storage?: Storage): void => {
    try {
        const webStorage = storage || localStorage;
        webStorage.removeItem(key);
    } catch (e) {}
};

export const updateWebStorageItem = (key: string, value: Record<string, unknown>, storage?: Storage): void => {
    const storedData = getWebStorageItem(key, true, storage) || {};

    setWebStorageItem(
        key,
        {
            ...storedData,
            ...value,
        },
        storage,
    );
};

/** Library which help to save object with circular structure work only with array in argument
 ** before using this library we have simple js Object in LS
 ** this check can prevent conflict
 */
export const parseValueFromLocalStorage = (localStorageValue: string): any =>
    Array.isArray(JSON.parse(localStorageValue)) ? parse(localStorageValue) : JSON.parse(localStorageValue);
