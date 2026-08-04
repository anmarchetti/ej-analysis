export const THOUSAND_DIVISOR = 1000;
export const TWO_PLACES = 2;

export function formatNumber(num: number, divider: number, places: number): number {
    return +(Math.round(+(num / divider + 'e+' + places)) + 'e-' + places);
}
