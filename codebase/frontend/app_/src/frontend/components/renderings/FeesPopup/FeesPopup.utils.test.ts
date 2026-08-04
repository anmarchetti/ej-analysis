import { IOffer } from 'models/data/IOffer';

import { getTouristTaxInfo } from './FeesPopup.utils';

describe('FeesPopup.utils', () => {
    describe('getTouristTaxInfo', () => {
        it('should return zero tourist tax and not displayed when tourist tax is disabled', () => {
            const result = getTouristTaxInfo({
                offer: {
                    touristTax: 7.5,
                } as IOffer,
                isTouristTaxEnabled: false,
            });

            expect(result).toEqual({
                touristTax: 0,
                isTouristTaxDisplayed: false,
            });
        });

        it('should return correct tourist tax and displayed when tourist tax is enabled', () => {
            const result = getTouristTaxInfo({
                offer: {
                    touristTax: 7.5,
                } as IOffer,
                isTouristTaxEnabled: true,
            });

            expect(result).toEqual({
                touristTax: 8,
                isTouristTaxDisplayed: true,
            });
        });

        it('should return zero tourist tax and not displayed when offer has no tourist tax', () => {
            const result = getTouristTaxInfo({
                offer: {} as IOffer,
                isTouristTaxEnabled: true,
            });

            expect(result).toEqual({
                touristTax: 0,
                isTouristTaxDisplayed: false,
            });
        });

        it('should return zero tourist tax and not displayed when tourist tax fields are missing', () => {
            const result = getTouristTaxInfo({
                offer: {} as IOffer,
                isTouristTaxEnabled: true,
            });

            expect(result).toEqual({
                touristTax: 0,
                isTouristTaxDisplayed: false,
            });
        });
    });
});
