import { TAmendTaxesAndFees } from 'models/data/IAmendTaxAndFeeItem';

import { buildAmountToken, buildRateToken } from './TouristTaxSummary.utils';

const LOCALE = 'en-GB';

const makeTax = (overrides: Partial<TAmendTaxesAndFees[number]> = {}): TAmendTaxesAndFees[number] => ({
    code: 'TAX',
    exchangeRate: 1,
    paylocalAmount: 10,
    paylocalAmountConverted: 8.4,
    paylocalAmountConvertedCurrency: 'GBP',
    paylocalAmountCurrency: 'EUR',
    ...overrides,
});

describe('buildAmountToken', () => {
    it('should return a single currency amount string', () => {
        const taxesAndFees: TAmendTaxesAndFees = [makeTax({ paylocalAmount: 10, paylocalAmountCurrency: 'EUR' })];

        expect(buildAmountToken(taxesAndFees, LOCALE)).toBe('EUR 10.00');
    });

    it('should sum amounts for the same currency', () => {
        const taxesAndFees: TAmendTaxesAndFees = [
            makeTax({ paylocalAmount: 10, paylocalAmountCurrency: 'EUR' }),
            makeTax({ paylocalAmount: 5, paylocalAmountCurrency: 'EUR' }),
        ];

        expect(buildAmountToken(taxesAndFees, LOCALE)).toBe('EUR 15.00');
    });

    it('should join multiple currencies with " + "', () => {
        const taxesAndFees: TAmendTaxesAndFees = [
            makeTax({ paylocalAmount: 10, paylocalAmountCurrency: 'EUR' }),
            makeTax({ paylocalAmount: 49.68, paylocalAmountCurrency: 'CHF' }),
        ];

        expect(buildAmountToken(taxesAndFees, LOCALE)).toBe('EUR 10.00 + CHF 49.68');
    });

    it('should use locale decimal separator', () => {
        const taxesAndFees: TAmendTaxesAndFees = [makeTax({ paylocalAmount: 10.5, paylocalAmountCurrency: 'EUR' })];

        expect(buildAmountToken(taxesAndFees, 'de-DE')).toBe('EUR 10,50');
    });

    it('should return empty string for empty array', () => {
        expect(buildAmountToken([], LOCALE)).toBe('');
    });
});

describe('buildRateToken', () => {
    it('should return a single exchange rate string', () => {
        const taxesAndFees: TAmendTaxesAndFees = [
            makeTax({
                paylocalAmount: 10,
                paylocalAmountConverted: 8.4,
                paylocalAmountCurrency: 'EUR',
                paylocalAmountConvertedCurrency: 'GBP',
            }),
        ];

        expect(buildRateToken(taxesAndFees, LOCALE)).toBe('EUR 1 = GBP 0.84');
    });

    it('should return rate "0.00" when totalLocal is 0', () => {
        const taxesAndFees: TAmendTaxesAndFees = [
            makeTax({
                paylocalAmount: 0,
                paylocalAmountConverted: 0,
                paylocalAmountCurrency: 'EUR',
                paylocalAmountConvertedCurrency: 'GBP',
            }),
        ];

        expect(buildRateToken(taxesAndFees, LOCALE)).toBe('EUR 1 = GBP 0.00');
    });

    it('should sum amounts before computing rate for the same currency', () => {
        const taxesAndFees: TAmendTaxesAndFees = [
            makeTax({
                paylocalAmount: 10,
                paylocalAmountConverted: 8,
                paylocalAmountCurrency: 'EUR',
                paylocalAmountConvertedCurrency: 'GBP',
            }),
            makeTax({
                paylocalAmount: 10,
                paylocalAmountConverted: 9,
                paylocalAmountCurrency: 'EUR',
                paylocalAmountConvertedCurrency: 'GBP',
            }),
        ];

        expect(buildRateToken(taxesAndFees, LOCALE)).toBe('EUR 1 = GBP 0.85');
    });

    it('should join multiple currencies with ", "', () => {
        const taxesAndFees: TAmendTaxesAndFees = [
            makeTax({
                paylocalAmount: 10,
                paylocalAmountConverted: 8.4,
                paylocalAmountCurrency: 'EUR',
                paylocalAmountConvertedCurrency: 'GBP',
            }),
            makeTax({
                paylocalAmount: 49.68,
                paylocalAmountConverted: 55,
                paylocalAmountCurrency: 'CHF',
                paylocalAmountConvertedCurrency: 'GBP',
            }),
        ];

        expect(buildRateToken(taxesAndFees, LOCALE)).toBe('EUR 1 = GBP 0.84, CHF 1 = GBP 1.11');
    });

    it('should use locale decimal separator', () => {
        const taxesAndFees: TAmendTaxesAndFees = [
            makeTax({
                paylocalAmount: 10,
                paylocalAmountConverted: 8.4,
                paylocalAmountCurrency: 'EUR',
                paylocalAmountConvertedCurrency: 'GBP',
            }),
        ];

        expect(buildRateToken(taxesAndFees, 'de-DE')).toBe('EUR 1 = GBP 0,84');
    });

    it('should return empty string for empty array', () => {
        expect(buildRateToken([], LOCALE)).toBe('');
    });
});
