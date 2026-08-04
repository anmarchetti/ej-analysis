/**
 * Get price prostfix if price != 0
 * @param phrase
 * @param price
 * @returns phrase with prepending space or empty string
 */
export const getPricePostfix = (phrase: string, price = 0): string => (price ? ' ' + phrase : '');

export const getAmendmentRoundedPrice = (price: number, toFloor?: boolean): number =>
    toFloor ? Math.floor(price) : Math.ceil(price);
