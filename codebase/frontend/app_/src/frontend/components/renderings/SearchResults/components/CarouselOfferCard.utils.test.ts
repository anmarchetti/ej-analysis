import { CurrencyCode } from 'code/currency';
import * as discountUtils from 'frontend/utils/discount.utils';
import * as tokenizerUtils from 'frontend/utils/tokenizer';

import { getCardDescription } from './CarouselOfferCard.utils';

const mockGetDiscount = jest.spyOn(discountUtils, 'getDiscount');
const mockGetDiscountPerPerson = jest.spyOn(discountUtils, 'getDiscountPerPerson');
const mockReplaceToken = jest.spyOn(tokenizerUtils.Tokenizer, 'replaceToken');

describe('CarouselOfferCard.utils', () => {
    describe('getCardDescription', () => {
        let mockFormatMoney: jest.Mock;

        beforeEach(() => {
            mockFormatMoney = jest.fn();
            mockGetDiscount.mockClear();
            mockGetDiscountPerPerson.mockClear();
            mockReplaceToken.mockClear();
        });

        it('should return undefined when promotion has no cardDescription', () => {
            const result = getCardDescription({
                promotion: undefined,
                currency: CurrencyCode.GBP,
                formatMoney: mockFormatMoney,
                labelBeforePrice: '',
                labelAfterPrice: '',
            });

            expect(result).toBeUndefined();
        });

        it('should return undefined when cardDescription is not provided', () => {
            const promotion = {
                cardDescription: '',
                discountAmountPerBooking: 100,
            };

            const result = getCardDescription({
                promotion,
                currency: CurrencyCode.GBP,
                formatMoney: mockFormatMoney,
                labelBeforePrice: '',
                labelAfterPrice: '',
            });

            expect(result).toBe('');
        });

        it('should tokenize cardDescription with discount when discountAmountPerBooking exists', () => {
            mockGetDiscount.mockReturnValue('£100');
            mockReplaceToken.mockReturnValue('Save £100 on your booking');

            const promotion = {
                cardDescription: 'Save {discount} on your booking',
                discountAmountPerBooking: 100,
            };

            const result = getCardDescription({
                promotion,
                currency: CurrencyCode.GBP,
                formatMoney: mockFormatMoney,
                labelBeforePrice: '',
                labelAfterPrice: '',
            });

            expect(mockGetDiscount).toHaveBeenCalledWith(promotion, CurrencyCode.GBP, mockFormatMoney);
            expect(mockReplaceToken).toHaveBeenCalledWith('Save {discount} on your booking', '{discount}', '£100');
            expect(result).toBe('Save £100 on your booking');
        });

        it('should tokenize cardDescription with discount when percentageDiscountPerBooking exists', () => {
            mockGetDiscount.mockReturnValue('10%');
            mockReplaceToken.mockReturnValue('Save 10% on your booking');

            const promotion = {
                cardDescription: 'Save {discount} on your booking',
                percentageDiscountPerBooking: 0.1,
            };

            const result = getCardDescription({
                promotion,
                currency: CurrencyCode.GBP,
                formatMoney: mockFormatMoney,
                labelBeforePrice: '',
                labelAfterPrice: '',
            });

            expect(mockGetDiscount).toHaveBeenCalledWith(promotion, CurrencyCode.GBP, mockFormatMoney);
            expect(mockReplaceToken).toHaveBeenCalledWith('Save {discount} on your booking', '{discount}', '10%');
            expect(result).toBe('Save 10% on your booking');
        });

        it('should tokenize cardDescription with discountPerPerson when discountAmountPerPerson exists', () => {
            mockGetDiscountPerPerson.mockReturnValue('£25');
            mockReplaceToken.mockReturnValue('Save £25 per person on your booking');

            const promotion = {
                cardDescription: 'Save {discountPerPerson} per person on your booking',
                discountAmountPerPerson: 25,
            };

            const result = getCardDescription({
                promotion,
                currency: CurrencyCode.GBP,
                formatMoney: mockFormatMoney,
                labelBeforePrice: '',
                labelAfterPrice: '',
            });

            expect(mockGetDiscountPerPerson).toHaveBeenCalledWith(promotion, CurrencyCode.GBP, mockFormatMoney, '', '');
            expect(mockReplaceToken).toHaveBeenCalledWith(
                'Save {discountPerPerson} per person on your booking',
                '{discountPerPerson}',
                '£25',
            );
            expect(result).toBe('Save £25 per person on your booking');
        });

        it('should tokenize cardDescription with discountPerPerson when discountPercentagePerPerson exists', () => {
            mockGetDiscountPerPerson.mockReturnValue('15%');
            mockReplaceToken.mockReturnValue('Save 15% per person on your booking');

            const promotion = {
                cardDescription: 'Save {discountPerPerson} per person on your booking',
                discountPercentagePerPerson: 0.15,
            };

            const result = getCardDescription({
                promotion,
                currency: CurrencyCode.GBP,
                formatMoney: mockFormatMoney,
                labelBeforePrice: '',
                labelAfterPrice: '',
            });

            expect(mockGetDiscountPerPerson).toHaveBeenCalledWith(promotion, CurrencyCode.GBP, mockFormatMoney, '', '');
            expect(mockReplaceToken).toHaveBeenCalledWith(
                'Save {discountPerPerson} per person on your booking',
                '{discountPerPerson}',
                '15%',
            );
            expect(result).toBe('Save 15% per person on your booking');
        });

        it('should NOT tokenize cardDescription when no discount exists', () => {
            const promotion = {
                cardDescription: 'Original text without discount',
            };

            const result = getCardDescription({
                promotion,
                currency: CurrencyCode.GBP,
                formatMoney: mockFormatMoney,
                labelBeforePrice: '',
                labelAfterPrice: '',
            });

            expect(mockGetDiscount).not.toHaveBeenCalled();
            expect(mockGetDiscountPerPerson).not.toHaveBeenCalled();
            expect(mockReplaceToken).not.toHaveBeenCalled();
            expect(result).toBe('Original text without discount');
        });

        it('should handle both discount and discountPerPerson tokens', () => {
            mockGetDiscount.mockReturnValue('£100');
            mockGetDiscountPerPerson.mockReturnValue('£25');
            mockReplaceToken
                .mockReturnValueOnce('Save £100 and {discountPerPerson} per person on your booking')
                .mockReturnValueOnce('Save £100 and £25 per person on your booking');

            const promotion = {
                cardDescription: 'Save {discount} and {discountPerPerson} per person on your booking',
                discountAmountPerBooking: 100,
                discountAmountPerPerson: 25,
            };

            const result = getCardDescription({
                promotion,
                currency: CurrencyCode.GBP,
                formatMoney: mockFormatMoney,
                labelBeforePrice: '',
                labelAfterPrice: '',
            });

            expect(mockGetDiscount).toHaveBeenCalledWith(promotion, CurrencyCode.GBP, mockFormatMoney);
            expect(mockGetDiscountPerPerson).toHaveBeenCalledWith(promotion, CurrencyCode.GBP, mockFormatMoney, '', '');
            expect(mockReplaceToken).toHaveBeenCalledTimes(2);
            expect(result).toBe('Save £100 and £25 per person on your booking');
        });
    });
});
