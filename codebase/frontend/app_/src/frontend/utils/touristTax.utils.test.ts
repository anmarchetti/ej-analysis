import { mockedOffer } from 'frontend/__mocks__/offer';
import { IOffer } from 'models/data/IOffer';

import {
    formatMoneyWithTouristTax,
    getIsTouristTaxDisplayed,
    getPriceWithTouristTax,
    getTouristTaxFieldsFromOffer,
    getTouristTaxPrice,
} from './touristTax.utils';

describe('touristTax.utils', () => {
    describe('getPriceWithTouristTax', () => {
        it('should return priceExcludingTouristTax when isTaxEnabled is false', () => {
            const result = getPriceWithTouristTax(100, 80, false);

            expect(result).toBe(80);
        });

        it('should return price (already includes tax) when isTaxEnabled is true', () => {
            const result = getPriceWithTouristTax(100, 80, true);

            expect(result).toBe(100);
        });
    });

    describe('formatMoneyWithTouristTax', () => {
        it('should format priceExcludingTouristTax when isTaxEnabled is false', () => {
            const mockFormatMoney = jest.fn((amount: number) => `£${amount}`);
            const result = formatMoneyWithTouristTax(100, 80, false, mockFormatMoney);

            expect(result).toBe('£80');
            expect(mockFormatMoney).toHaveBeenCalledWith(80, undefined);
        });

        it('should format price with tax when isTaxEnabled is true', () => {
            const mockFormatMoney = jest.fn((amount: number) => `£${amount}`);
            const result = formatMoneyWithTouristTax(100, 80, true, mockFormatMoney);

            expect(result).toBe('£100');
            expect(mockFormatMoney).toHaveBeenCalledWith(100, undefined);
        });
    });

    describe('getTouristTaxPrice', () => {
        it('should return the ceiling value of a positive number', () => {
            expect(getTouristTaxPrice(10.2)).toBe(11);
        });

        it('should return 0 when the input is 0', () => {
            expect(getTouristTaxPrice(0)).toBe(0);
        });

        it('should return 0 when the input is a negative number', () => {
            expect(getTouristTaxPrice(-5.7)).toBe(0);
        });

        it('should return 0 when the input is NaN', () => {
            expect(getTouristTaxPrice(NaN)).toBe(0);
        });
    });

    describe('getTouristTaxFieldsFromOffer', () => {
        it('should return appropriate values when offer is defined', () => {
            expect(getTouristTaxFieldsFromOffer(mockedOffer)).toEqual({
                touristTax: mockedOffer.touristTax,
                touristTaxPP: mockedOffer.touristTaxPP,
                taxesAndFees: mockedOffer.taxesAndFees,
            });
        });

        it('should return default values when offer is not defined', () => {
            expect(getTouristTaxFieldsFromOffer(null)).toEqual({
                touristTax: -1,
                touristTaxPP: -1,
                taxesAndFees: undefined,
            });
        });

        it('should return default values when tourist tax fields are not defined', () => {
            expect(
                getTouristTaxFieldsFromOffer({
                    ...mockedOffer,
                    touristTax: undefined,
                    touristTaxPP: undefined,
                    taxesAndFees: undefined,
                } as unknown as IOffer),
            ).toEqual({
                touristTax: -1,
                touristTaxPP: -1,
                taxesAndFees: undefined,
            });
        });
    });

    describe('getIsTouristTaxDisplayed', () => {
        it('should return true when tourist tax is enabled and value is not -1', () => {
            const result = getIsTouristTaxDisplayed({ isTouristTaxEnabled: true, touristTax: 10 });

            expect(result).toBe(true);
        });

        it('should return false when tourist tax is disabled regardless of value', () => {
            const result = getIsTouristTaxDisplayed({ isTouristTaxEnabled: false, touristTax: 10 });

            expect(result).toBe(false);
        });

        it('should return false when tourist tax value is -1 regardless of enabled status', () => {
            const result = getIsTouristTaxDisplayed({ isTouristTaxEnabled: true, touristTax: -1 });

            expect(result).toBe(false);
        });

        it('should return false when tourist tax is disabled and value is -1', () => {
            const result = getIsTouristTaxDisplayed({ isTouristTaxEnabled: false, touristTax: -1 });

            expect(result).toBe(false);
        });
    });
});
