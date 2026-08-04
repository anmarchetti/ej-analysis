import { CurrencyCode } from 'code/currency';
import { Tokens } from 'code/tokens';
import { TTaxesAndFees } from 'models/data/ITouristTax';

export type TTaxEntry = NonNullable<TTaxesAndFees[CurrencyCode]>;

export const getMultiCurrencyTokens = (
    touristTax: number,
    taxesAndFees: TTaxesAndFees,
    conjunctionWord: string,
): { [key: string]: string } => {
    const taxEntries = Object.values(taxesAndFees);

    return {
        [Tokens.TouristTax]: touristTax.toString(),
        [Tokens.TouristTaxLocalAmounts]: taxEntries.map(tax => `${tax.currency} ${tax.totalLocalPrice}`).join(' + '),
        [Tokens.ExchangeRateValues]: taxEntries.map(tax => tax.exchRt).join(` ${conjunctionWord} `),
    };
};

export const getSingleCurrencyTokens = (touristTax: number, taxEntry: TTaxEntry): { [key: string]: string } => ({
    [Tokens.TouristTax]: touristTax.toString(),
    [Tokens.CurrencyCode]: taxEntry.currency,
    [Tokens.ExchangeRate]: taxEntry.exchRt.toString(),
    [Tokens.TouristTaxLocal]: taxEntry.totalLocalPrice.toString(),
});
