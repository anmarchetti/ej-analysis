import { CurrencyCode } from 'code/currency';
import { Tokens } from 'code/tokens';
import { mockMultiCurrencyTouristTaxFields, mockTouristTaxFields } from 'frontend/__mocks__/touristTax';

import { getMultiCurrencyTokens, getSingleCurrencyTokens } from './TouristTaxPriceTooltip.utils';

describe('TouristTaxPriceTooltip.utils', () => {
    describe('getSingleCurrencyTokens', () => {
        const taxEntry = mockTouristTaxFields.taxesAndFees![CurrencyCode.EUR]!;

        it('should return correct token map for single currency', () => {
            const result = getSingleCurrencyTokens(mockTouristTaxFields.touristTax, taxEntry);

            expect(result).toEqual({
                [Tokens.TouristTax]: `${mockTouristTaxFields.touristTax}`,
                [Tokens.CurrencyCode]: CurrencyCode.EUR,
                [Tokens.ExchangeRate]: `${taxEntry.exchRt}`,
                [Tokens.TouristTaxLocal]: `${taxEntry.totalLocalPrice}`,
            });
        });

        it('should convert numeric values to strings', () => {
            const result = getSingleCurrencyTokens(mockTouristTaxFields.touristTax, taxEntry);

            expect(typeof result[Tokens.TouristTax]).toBe('string');
            expect(typeof result[Tokens.ExchangeRate]).toBe('string');
            expect(typeof result[Tokens.TouristTaxLocal]).toBe('string');
        });
    });

    describe('getMultiCurrencyTokens', () => {
        const { touristTax, taxesAndFees } = mockMultiCurrencyTouristTaxFields;
        const multiTaxesAndFees = taxesAndFees!;

        it('should return correct token map for multi-currency', () => {
            const result = getMultiCurrencyTokens(touristTax, multiTaxesAndFees, 'and');

            expect(result).toEqual({
                [Tokens.TouristTax]: '64.01',
                [Tokens.TouristTaxLocalAmounts]: `${CurrencyCode.EUR} 12 + ${CurrencyCode.CHF} 49.68`,
                [Tokens.ExchangeRateValues]: `${multiTaxesAndFees[CurrencyCode.EUR]!.exchRt} and ${
                    multiTaxesAndFees[CurrencyCode.CHF]!.exchRt
                }`,
            });
        });

        it('should join exchange rates with the provided conjunction word', () => {
            const result = getMultiCurrencyTokens(touristTax, multiTaxesAndFees, 'und');

            expect(result[Tokens.ExchangeRateValues]).toBe(
                `${multiTaxesAndFees[CurrencyCode.EUR]!.exchRt} und ${multiTaxesAndFees[CurrencyCode.CHF]!.exchRt}`,
            );
        });
    });
});
