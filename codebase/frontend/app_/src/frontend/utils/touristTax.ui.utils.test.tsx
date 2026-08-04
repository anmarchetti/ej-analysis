import { getTouristTaxSummaryData } from './touristTax.ui.utils';

describe('touristTax.ui.utils', () => {
    describe('getTouristTaxSummaryData', () => {
        it('should return correct data when price is a positive number', () => {
            const result = getTouristTaxSummaryData({ price: 15.5 });

            expect(result.price).toBe(16);
            expect(result.trigger).toBe('£16');
            expect((result.label as React.ReactElement).props).toStrictEqual({
                dictionaryKey: 'TouristTax.Labels.LocalTaxes',
                tag: 'p',
            });
        });

        it('should return correct data when price is 0', () => {
            const result = getTouristTaxSummaryData({ price: 0 });

            expect(result.price).toBe(0);
            expect(result.trigger).toBe('£0');
            expect((result.label as React.ReactElement).props).toStrictEqual({
                dictionaryKey: 'TouristTax.Labels.TaxNotApplicable',
                tag: 'p',
            });
        });

        it('should return correct data when price is undefined', () => {
            const result = getTouristTaxSummaryData({});

            expect(result.price).toBe(0);
            expect(result.trigger).toBe('£0');
            expect((result.label as React.ReactElement).props).toStrictEqual({
                dictionaryKey: 'TouristTax.Labels.TaxNotApplicable',
                tag: 'p',
            });
        });

        it('should return correct data when price is a negative number', () => {
            const result = getTouristTaxSummaryData({ price: -10 });

            expect(result.price).toBe(0);
            expect(result.trigger).toBe('£0');
            expect((result.label as React.ReactElement).props).toStrictEqual({
                dictionaryKey: 'TouristTax.Labels.TaxNotApplicable',
                tag: 'p',
            });
        });
    });
});
