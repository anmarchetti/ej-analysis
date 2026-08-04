import { CurrencyCode, TrailingZeroDisplay } from 'code/currency';

import { getDiscount, getDiscountPerPerson } from './discount.utils';

describe('discount.utils', () => {
    describe('getDiscount', () => {
        describe('discountAmountPerBooking', () => {
            test('should return formatted money amount when discountAmountPerBooking is provided', () => {
                const promotion = {
                    discountAmountPerBooking: 100,
                };
                const mockFormatMoneyWithOptions = jest.fn().mockReturnValue('£100');

                expect(getDiscount(promotion, CurrencyCode.GBP, mockFormatMoneyWithOptions)).toBe('£100');

                expect(mockFormatMoneyWithOptions).toHaveBeenCalledWith(100, {
                    currency: CurrencyCode.GBP,
                    trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
                });
            });

            test('should return empty string when discountAmountPerBooking is zero', () => {
                const promotion = {
                    discountAmountPerBooking: 0,
                };
                const mockFormatMoneyWithOptions = jest.fn();

                expect(getDiscount(promotion, CurrencyCode.GBP, mockFormatMoneyWithOptions)).toBe('');

                expect(mockFormatMoneyWithOptions).not.toHaveBeenCalled();
            });
        });

        describe('percentageDiscountPerBooking', () => {
            test('should return percentage discount when percentageDiscountPerBooking is provided', () => {
                const promotion = {
                    percentageDiscountPerBooking: 0.15,
                };
                const mockFormatMoneyWithOptions = jest.fn();

                expect(getDiscount(promotion, CurrencyCode.GBP, mockFormatMoneyWithOptions)).toBe('15%');

                expect(mockFormatMoneyWithOptions).not.toHaveBeenCalled();
            });

            test('should return percentage discount when percentageDiscountPerBooking is 100%', () => {
                const promotion = {
                    percentageDiscountPerBooking: 1,
                };
                const mockFormatMoneyWithOptions = jest.fn();

                expect(getDiscount(promotion, CurrencyCode.GBP, mockFormatMoneyWithOptions)).toBe('100%');
            });

            test('should return percentage discount when percentageDiscountPerBooking is decimal', () => {
                const promotion = {
                    percentageDiscountPerBooking: 0.025,
                };
                const mockFormatMoneyWithOptions = jest.fn();

                expect(getDiscount(promotion, CurrencyCode.GBP, mockFormatMoneyWithOptions)).toBe('2.5%');
            });
        });

        test('should prioritize discountAmountPerBooking when both discountAmountPerBooking and percentageDiscountPerBooking are provided', () => {
            const promotion = {
                discountAmountPerBooking: 50,
                percentageDiscountPerBooking: 0.2,
            };
            const mockFormatMoneyWithOptions = jest.fn().mockReturnValue('£50');

            expect(getDiscount(promotion, CurrencyCode.GBP, mockFormatMoneyWithOptions)).toBe('£50');

            expect(mockFormatMoneyWithOptions).toHaveBeenCalledWith(50, {
                currency: CurrencyCode.GBP,
                trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
            });
        });

        test('should return empty string when no discount information is provided', () => {
            const promotion = {};
            const mockFormatMoneyWithOptions = jest.fn();

            expect(getDiscount(promotion, CurrencyCode.GBP, mockFormatMoneyWithOptions)).toBe('');

            expect(mockFormatMoneyWithOptions).not.toHaveBeenCalled();
        });

        test('should return empty string when both discount fields are undefined', () => {
            const promotion = {
                discountAmountPerBooking: undefined,
                percentageDiscountPerBooking: undefined,
            };
            const mockFormatMoneyWithOptions = jest.fn();

            expect(getDiscount(promotion, CurrencyCode.GBP, mockFormatMoneyWithOptions)).toBe('');

            expect(mockFormatMoneyWithOptions).not.toHaveBeenCalled();
        });

        describe('different currencies', () => {
            test('should work when currency is GBP', () => {
                const promotion = {
                    discountAmountPerBooking: 25,
                };
                const mockFormatMoneyWithOptions = jest.fn().mockReturnValue('£25');

                expect(getDiscount(promotion, CurrencyCode.GBP, mockFormatMoneyWithOptions)).toBe('£25');

                expect(mockFormatMoneyWithOptions).toHaveBeenCalledWith(25, {
                    currency: CurrencyCode.GBP,
                    trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
                });
            });

            test('should work when currency is EUR', () => {
                const promotion = {
                    discountAmountPerBooking: 75,
                };
                const mockFormatMoneyWithOptions = jest.fn().mockReturnValue('€75');

                expect(getDiscount(promotion, CurrencyCode.EUR, mockFormatMoneyWithOptions)).toBe('€75');

                expect(mockFormatMoneyWithOptions).toHaveBeenCalledWith(75, {
                    currency: CurrencyCode.EUR,
                    trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
                });
            });
        });
    });

    describe('getDiscountPerPerson', () => {
        const labelBeforePrice = '';
        const labelAfterPrice = ' pp';

        describe('discountAmountPerPerson', () => {
            test('should return formatted money amount when discountAmountPerPerson is provided', () => {
                const promotion = {
                    discountAmountPerPerson: 125,
                };
                const mockFormatMoneyWithOptions = jest.fn().mockReturnValue('£125');

                expect(
                    getDiscountPerPerson(
                        promotion,
                        CurrencyCode.GBP,
                        mockFormatMoneyWithOptions,
                        labelBeforePrice,
                        labelAfterPrice,
                    ),
                ).toBe('£125 pp');
            });

            test('should return empty string when discountAmountPerPerson is zero', () => {
                const promotion = {
                    discountAmountPerPerson: 0,
                };
                const mockFormatMoneyWithOptions = jest.fn();

                expect(
                    getDiscountPerPerson(
                        promotion,
                        CurrencyCode.GBP,
                        mockFormatMoneyWithOptions,
                        labelBeforePrice,
                        labelAfterPrice,
                    ),
                ).toBe('');
            });
        });

        describe('discountPercentagePerPerson', () => {
            test('should return percentage discount when discountPercentagePerPerson is provided', () => {
                const promotion = {
                    discountPercentagePerPerson: 0.15,
                };
                const mockFormatMoneyWithOptions = jest.fn();

                expect(
                    getDiscountPerPerson(
                        promotion,
                        CurrencyCode.GBP,
                        mockFormatMoneyWithOptions,
                        labelBeforePrice,
                        labelAfterPrice,
                    ),
                ).toBe('15% pp');
            });

            test('should return percentage discount when discountPercentagePerPerson is 100%', () => {
                const promotion = {
                    discountPercentagePerPerson: 1,
                };
                const mockFormatMoneyWithOptions = jest.fn();

                expect(
                    getDiscountPerPerson(
                        promotion,
                        CurrencyCode.GBP,
                        mockFormatMoneyWithOptions,
                        labelBeforePrice,
                        labelAfterPrice,
                    ),
                ).toBe('100% pp');
            });

            test('should return percentage discount when discountPercentagePerPerson is decimal', () => {
                const promotion = {
                    discountPercentagePerPerson: 0.075,
                };
                const mockFormatMoneyWithOptions = jest.fn();

                expect(
                    getDiscountPerPerson(
                        promotion,
                        CurrencyCode.GBP,
                        mockFormatMoneyWithOptions,
                        labelBeforePrice,
                        labelAfterPrice,
                    ),
                ).toBe('7.5% pp');
            });
        });

        test('should prioritize discountAmountPerPerson when both discountAmountPerPerson and discountPercentagePerPerson are provided', () => {
            const promotion = {
                discountAmountPerPerson: 50,
                discountPercentagePerPerson: 0.2,
            };
            const mockFormatMoneyWithOptions = jest.fn().mockReturnValue('£50');

            expect(
                getDiscountPerPerson(
                    promotion,
                    CurrencyCode.GBP,
                    mockFormatMoneyWithOptions,
                    labelBeforePrice,
                    labelAfterPrice,
                ),
            ).toBe('£50 pp');

            expect(mockFormatMoneyWithOptions).toHaveBeenCalledWith(50, {
                currency: CurrencyCode.GBP,
                trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
            });
        });

        test('should return empty string when no discount information is provided', () => {
            const promotion = {};
            const mockFormatMoneyWithOptions = jest.fn();

            expect(
                getDiscountPerPerson(
                    promotion,
                    CurrencyCode.GBP,
                    mockFormatMoneyWithOptions,
                    labelBeforePrice,
                    labelAfterPrice,
                ),
            ).toBe('');

            expect(mockFormatMoneyWithOptions).not.toHaveBeenCalled();
        });

        test('should return empty string when both discount fields are undefined', () => {
            const promotion = {
                discountAmountPerPerson: undefined,
                discountPercentagePerPerson: undefined,
            };
            const mockFormatMoneyWithOptions = jest.fn();

            expect(
                getDiscountPerPerson(
                    promotion,
                    CurrencyCode.GBP,
                    mockFormatMoneyWithOptions,
                    labelBeforePrice,
                    labelAfterPrice,
                ),
            ).toBe('');

            expect(mockFormatMoneyWithOptions).not.toHaveBeenCalled();
        });

        describe('different currencies', () => {
            test('should work when currency is GBP', () => {
                const promotion = {
                    discountAmountPerPerson: 50,
                };
                const mockFormatMoneyWithOptions = jest.fn().mockReturnValue('£50');

                expect(
                    getDiscountPerPerson(
                        promotion,
                        CurrencyCode.GBP,
                        mockFormatMoneyWithOptions,
                        labelBeforePrice,
                        labelAfterPrice,
                    ),
                ).toBe('£50 pp');

                expect(mockFormatMoneyWithOptions).toHaveBeenCalledWith(50, {
                    currency: CurrencyCode.GBP,
                    trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
                });
            });

            test('should work when currency is EUR', () => {
                const promotion = {
                    discountAmountPerPerson: 75,
                };
                const mockFormatMoneyWithOptions = jest.fn().mockReturnValue('€75');

                expect(
                    getDiscountPerPerson(
                        promotion,
                        CurrencyCode.EUR,
                        mockFormatMoneyWithOptions,
                        labelBeforePrice,
                        labelAfterPrice,
                    ),
                ).toBe('€75 pp');

                expect(mockFormatMoneyWithOptions).toHaveBeenCalledWith(75, {
                    currency: CurrencyCode.EUR,
                    trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
                });
            });
        });

        test('should handle decimal discountAmountPerPerson values', () => {
            const promotion = {
                discountAmountPerPerson: 49.99,
            };
            const mockFormatMoneyWithOptions = jest.fn().mockReturnValue('£49.99');

            expect(
                getDiscountPerPerson(
                    promotion,
                    CurrencyCode.GBP,
                    mockFormatMoneyWithOptions,
                    labelBeforePrice,
                    labelAfterPrice,
                ),
            ).toBe('£49.99 pp');

            expect(mockFormatMoneyWithOptions).toHaveBeenCalledWith(49.99, {
                currency: CurrencyCode.GBP,
                trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
            });
        });

        test('should include labelBeforePrice when provided', () => {
            expect(
                getDiscountPerPerson(
                    { discountAmountPerPerson: 100 },
                    CurrencyCode.GBP,
                    jest.fn().mockReturnValue('£100'),
                    'from ',
                    ' pp',
                ),
            ).toBe('from £100 pp');
        });
    });
});
