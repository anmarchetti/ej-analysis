const BASE_36_RADIX = 36;
const UNIQUE_ID_LENGTH = 6;

export const generateUniqueId = (): string =>
    Math.random()
        .toString(BASE_36_RADIX)
        .substring(2, 2 + UNIQUE_ID_LENGTH);
