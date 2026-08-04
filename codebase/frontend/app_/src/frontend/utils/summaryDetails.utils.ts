import { CurrencyCode, ICurrencyFormatOptions } from 'code/currency';

export const getCurrencyFormatOptions = (currency: CurrencyCode | undefined): ICurrencyFormatOptions => ({
    currency: currency,
    maximumFractionDigits: 0,
    roundUp: true,
});
