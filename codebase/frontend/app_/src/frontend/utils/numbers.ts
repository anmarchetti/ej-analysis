const EVEN_DIVISOR = 2;

export const incrementByCondition = (num: number, condition: boolean): number => (condition ? num + 1 : num);

export const limitNumberRange = (num: number, min: number, max: number): number => Math.max(min, Math.min(num, max));

export const getFirstNumbersFromString = (str: string): number | undefined => {
    const regex = /\d+/;
    const match = regex.exec(str);

    return match ? Number(match[0]) : undefined;
};

export const toRealNumber = (value: number | string): number | null => {
    if (Number.isFinite(value)) return value as number;

    if (typeof value === 'string' && value.trim() !== '') {
        const num = +value;

        if (Number.isFinite(num)) {
            return num;
        }
    }

    return null;
};

export const isEven = (value: number): boolean => value % EVEN_DIVISOR === 0;
