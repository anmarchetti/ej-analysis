/**
 * Will return negative number value if needed
 * @param value Value to reverse
 * @param reverse need reverse or not
 */
export const reverseNumberValue = (value: number, reverse: boolean): number => {
    if (typeof value == 'number') {
        return value * (reverse ? -1 : 1);
    }

    return value;
};

/** Check that value is defined, i.e. not null and not undefined */
export const isDefined = <TValue>(value: TValue | null | undefined): value is TValue =>
    value !== null && value !== undefined;

export const isEmptyObject = (obj: Record<string, any>): boolean => !obj || Object.keys(obj).length === 0;

export const pick = <T, K extends keyof T>(object: T, keys: K[]): Pick<T, K> =>
    keys.reduce((acc, key) => {
        if (object && Object.prototype.hasOwnProperty.call(object, key)) {
            acc[key] = object[key];
        }

        return acc;
    }, {} as Pick<T, K>);

/**Check if two objects are equal and have the same keys and values.
 * You can provide only plain objects, without any objects as a value
 */
export const areObjectsEqual = (a: PlainObject, b: PlainObject): boolean =>
    Object.entries(a).sort().toString() === Object.entries(b).sort().toString();
