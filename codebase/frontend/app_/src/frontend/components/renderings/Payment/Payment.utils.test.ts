import { CurrencyCode } from 'code/currency';
import { mockGlobalFetch } from 'frontend/__mocks__/fetch';
import { IPaymentFailureItem } from 'frontend/store/holidays/payment/payment-failures.config';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { IBookingInfo } from 'models/data/IBookingInfo';
import { IOfferWithoutAltBoards } from 'models/data/IOffer';
import { IPaymentTrackingEvent } from 'models/data/IPaymentInfo';
import { IBillingInfo } from 'models/data/payment/BillingInfo';
import { CardType } from 'models/enum/CardType';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { IPaymentPageFields } from './interfaces';
import {
    createFphData,
    getDepositDescriptionField,
    getExtrasFromPriceBreakdown,
    getFullPriceDescriptionField,
    getPaymentErrorMessage,
    getPaymentHistory,
    getPaymentLabelForBalancePaymentSuccess,
    getPaymentLabelForSuccess,
    getPriceBreakdown,
    getTouristTaxBannerProps,
    sendTrackingEvent,
} from './Payment.utils';

jest.mock('code/env', () => ({
    envAll: {
        GA_MEASUREMENT_ID: 'testMeasurementId',
        GA_TRACKING_API_SECRET: 'testApiSecret',
    },
}));

jest.mock('code/env', () => ({
    envAll: {
        GA_MEASUREMENT_ID: 'testMeasurementId',
        GA_TRACKING_API_SECRET: 'testApiSecret',
    },
}));

describe('sendTrackingEvent', () => {
    const mockClientId = 'testClientId';
    const mockEventList: IPaymentTrackingEvent[] = [
        {
            name: 'PageView',
            params: {
                business_channel: 'Online',
                business_type: 'Retail',
                content_group: 'Checkout',
                currency: CurrencyCode.GBP,
                environment: 'Production',
                logged_in_status: 'Yes',
                page_category: 'Payment',
                page_title: 'Payment Page',
                platform_language: 'EN',
                referral_page_category: 'Home',
                referral_page_name: 'Homepage',
                responsive_page_break_view: 'Extra large',
                screen_orientation: 'Landscape',
                site_version: 'v1.0.0',
                test_variant: 'A/B Test 1',
                consent_config: '1|1|',
                page_location: 'http://localhost/payment',
                page_referral_url: 'http://localhost/home',
                page_url: 'http://localhost/payment',
                session_id: 'abc123',
                timestamp: 1623546119292,
                user_agent: 'Mozilla/5.0',
                event_category: 'User Engagement',
                event_action: 'Page View',
                event_label: 'Payment Page',
                event_value: '1',
            },
        },
    ];

    beforeEach(() => {
        jest.resetAllMocks();
        global.fetch = jest.fn();
        global.console.error = jest.fn();
    });

    it('should call fetch with the correct URL and request body', async () => {
        jest.mocked(global.fetch).mockResolvedValue(mockGlobalFetch);

        await sendTrackingEvent(mockClientId, mockEventList);

        expect(fetch).toHaveBeenCalledWith(
            `https://www.google-analytics.com/mp/collect?measurement_id=testMeasurementId&api_secret=testApiSecret`,
            {
                method: 'POST',
                body: JSON.stringify({
                    client_id: mockClientId,
                    events: mockEventList,
                }),
            },
        );
    });

    it('should log an error if fetch fails', async () => {
        jest.mocked(global.fetch).mockRejectedValue(new Error('error'));

        await sendTrackingEvent(mockClientId, mockEventList);

        expect(console.error).toHaveBeenCalled();
    });
});

describe('getPaymentErrorMessage', () => {
    it('should return the correct error message with format key - error code', () => {
        const mockError = {
            messageKey: 'errorKey',
            details: 'errorDetails',
            descriptionKey: 'errorDescription',
            code: '1000',
        } as IPaymentFailureItem;

        expect(getPaymentErrorMessage(mockError)).toEqual('errorKey - 1000');
    });

    it('should return error message with description key if error code is not present', () => {
        const mockError = {
            messageKey: 'errorKey',
            details: 'errorDetails',
            descriptionKey: 'errorDescription',
        } as IPaymentFailureItem;

        expect(getPaymentErrorMessage(mockError)).toEqual('errorKey - errorDescription');
    });
});

describe('getPaymentLabelForSuccess', () => {
    const mockCard = {
        code: '111',
        number: '222',
    };

    it('should calculate and return correct label for given payments', () => {
        const payments = [
            { amount: 100, paymentDate: '2024-11-19T00:00:00Z', card: mockCard, isCredit: true },
            { amount: 50, paymentDate: '2024-11-18T00:00:00Z', card: mockCard, isCredit: false },
            { amount: 30, paymentDate: '2024-11-17T00:00:00Z', card: mockCard, isCredit: true },
        ];

        const result = getPaymentLabelForSuccess(payments);
        expect(result).toStrictEqual({
            cash: 50,
            credit: 130,
        });
    });

    it('should return "Cash: 0 - Credit: 0" for an empty payments array', () => {
        const payments: any[] = [];
        const result = getPaymentLabelForSuccess(payments);
        expect(result).toStrictEqual({
            cash: 0,
            credit: 0,
        });
    });

    it('should handle cases where all payments are cash', () => {
        const payments = [
            { amount: 40, paymentDate: '2024-11-19T00:00:00Z', card: mockCard, isCredit: false },
            { amount: 20, paymentDate: '2024-11-18T00:00:00Z', card: mockCard, isCredit: false },
        ];

        const result = getPaymentLabelForSuccess(payments);
        expect(result).toStrictEqual({
            cash: 60,
            credit: 0,
        });
    });

    it('should handle cases where all payments are credit', () => {
        const payments = [
            { amount: 40, paymentDate: '2024-11-19T00:00:00Z', card: mockCard, isCredit: true },
            { amount: 20, paymentDate: '2024-11-18T00:00:00Z', card: mockCard, isCredit: true },
        ];

        const result = getPaymentLabelForSuccess(payments);
        expect(result).toStrictEqual({
            cash: 0,
            credit: 60,
        });
    });
});

describe('getPaymentLabelForBalancePaymentSuccess', () => {
    it('should calculate and return correct label when both cash and credit amounts are present', () => {
        const payDetails = {
            amount: 100,
            creditAmount: 200,
        };

        const result = getPaymentLabelForBalancePaymentSuccess(payDetails);
        expect(result).toStrictEqual({
            cash: 100,
            credit: 200,
        });
    });

    it('should default cash amount to 0 if "amount" is not present', () => {
        const payDetails = {
            creditAmount: 150,
        };

        const result = getPaymentLabelForBalancePaymentSuccess(payDetails);
        expect(result).toStrictEqual({
            cash: 0,
            credit: 150,
        });
    });

    it('should default credit amount to 0 if "creditAmount" is not present', () => {
        const payDetails = {
            amount: 50,
            card: {},
            cardType: CardType.Visa,
            nameOnCard: 'name',
            cardNumber: '1111',
            expirationDate: 'date',
            cvv: '000',
            issueNumber: '000',
            onChange: jest.fn(),
            billingInfo: {} as IBillingInfo,
        };

        const result = getPaymentLabelForBalancePaymentSuccess(payDetails);
        expect(result).toStrictEqual({
            cash: 50,
            credit: 0,
        });
    });

    it('should handle cases where payDetails is undefined', () => {
        const result = getPaymentLabelForBalancePaymentSuccess(undefined);
        expect(result).toStrictEqual({
            cash: 0,
            credit: 0,
        });
    });

    it('should handle cases where payDetails has neither "amount" nor "creditAmount"', () => {
        const payDetails = {};

        const result = getPaymentLabelForBalancePaymentSuccess(payDetails as any);
        expect(result).toStrictEqual({
            cash: 0,
            credit: 0,
        });
    });
});

describe('getDepositDescriptionField', () => {
    const mockFields = {
        PayWithDepositDescriptionOnePassengerIncludingTax: { value: 'One passenger with tax' },
        PayWithDepositDescriptionIncludingTax: { value: 'Including tax' },
        PayWithDepositDescriptionOnePassenger: { value: 'One passenger' },
        PayWithDepositDescription: { value: 'Default description' },
    } as IPaymentPageFields;

    it('should return empty value when fields is undefined', () => {
        const result = getDepositDescriptionField(false, false, undefined);

        expect(result).toEqual({ value: '' });
    });

    it('should return PayWithDepositDescriptionOnePassengerIncludingTax when both isPricePPShown and isTaxIncluded are true', () => {
        const result = getDepositDescriptionField(true, true, mockFields);

        expect(result).toEqual({ value: 'Including tax' });
    });

    it('should return PayWithDepositDescriptionIncludingTax when isTaxIncluded is true and isPricePPShown is false', () => {
        const result = getDepositDescriptionField(false, true, mockFields);

        expect(result).toEqual({ value: 'One passenger with tax' });
    });

    it('should return PayWithDepositDescriptionOnePassenger when isPricePPShown is true and isTaxIncluded is false', () => {
        const result = getDepositDescriptionField(true, false, mockFields);

        expect(result).toEqual({ value: 'Default description' });
    });

    it('should return PayWithDepositDescription when both isPricePPShown and isTaxIncluded are false', () => {
        const result = getDepositDescriptionField(false, false, mockFields);

        expect(result).toEqual({ value: 'One passenger' });
    });
});

describe('getFullPriceDescriptionField', () => {
    const mockFields = {
        PayFullDescriptionIncludingTax: { value: 'With tax' },
        PayFullDescription: { value: 'Without tax' },
    } as IPaymentPageFields;

    it('should return empty value when fields is undefined', () => {
        const result = getFullPriceDescriptionField(false, undefined);

        expect(result).toEqual({ value: '' });
    });

    it('should return PayFullDescriptionIncludingTax when isTaxIncluded is true', () => {
        const result = getFullPriceDescriptionField(true, mockFields);

        expect(result).toEqual({ value: 'With tax' });
    });

    it('should return PayFullDescription when isTaxIncluded is false', () => {
        const result = getFullPriceDescriptionField(false, mockFields);

        expect(result).toEqual({ value: 'Without tax' });
    });
});

describe('createFphData', () => {
    it('should return FPH data when isFlightAndHotelPackage is true', () => {
        const result = createFphData(
            jest.fn(p => p),
            true,
            150,
        );

        expect(result).toEqual({
            isFph: true,
            discount: 150,
            text: SitecoreDictionary.FlightPlusHotelPricesFlightPlusHotel,
        });
    });

    it('should return default discount value  when discount is not provided', () => {
        const result = createFphData(
            jest.fn(p => p),
            true,
        );

        expect(result).toEqual({
            isFph: true,
            discount: 0,
            text: SitecoreDictionary.FlightPlusHotelPricesFlightPlusHotel,
        });
    });

    it('should return non-FPH data when isFlightAndHotelPackage is false', () => {
        const result = createFphData(
            jest.fn(p => p),
            false,
            150,
        );

        expect(result).toEqual({
            isFph: false,
            discount: 0,
            text: '',
        });
    });

    it('should return non-FPH data when isFlightAndHotelPackage is false, ignoring provided discount', () => {
        const result = createFphData(
            jest.fn(p => p),
            false,
            9999,
        );

        expect(result).toEqual({
            isFph: false,
            discount: 0,
            text: '',
        });
    });

    it('should handle discount value of 0', () => {
        const result = createFphData(
            jest.fn(p => p),
            true,
            0,
        );

        expect(result).toEqual({
            isFph: true,
            discount: 0,
            text: SitecoreDictionary.FlightPlusHotelPricesFlightPlusHotel,
        });
    });
});

describe('getPriceBreakdown', () => {
    const mockExtraPriceBreakdown = [{ amount: 200, code: 'extra', name: 'extra', quantity: 5 }];
    const mockPriceBreakdown = [{ amount: 300, code: 'price', name: 'price', quantity: 3 }];
    const mockBooking = { priceBreakdown: [{ amount: 100, code: 'test', name: 'test', quantity: 10 }] } as IBookingInfo;

    it('should return booking.extraPriceBreakdown when it exists', () => {
        const bookingWithExtra = {
            extraPriceBreakdown: [{ amount: 150, code: 'bookingExtra', name: 'bookingExtra', quantity: 2 }],
            priceBreakdown: [{ amount: 100, code: 'test', name: 'test', quantity: 10 }],
        } as IBookingInfo;

        const result = getPriceBreakdown(
            bookingWithExtra,
            mockExtraPriceBreakdown,
            mockPriceBreakdown,
            false,
            undefined,
        );

        expect(result).toEqual([{ amount: 150, code: 'bookingExtra', name: 'bookingExtra', quantity: 2 }]);
    });

    it('should return extraPriceBreakdown when booking.extraPriceBreakdown does not exist', () => {
        const result = getPriceBreakdown(mockBooking, mockExtraPriceBreakdown, mockPriceBreakdown, false);

        expect(result).toEqual([{ amount: 200, code: 'extra', name: 'extra', quantity: 5 }]);
    });

    it('should return booking.priceBreakdown when neither booking.extraPriceBreakdown nor extraPriceBreakdown exist', () => {
        const result = getPriceBreakdown(mockBooking, undefined, mockPriceBreakdown, false);

        expect(result).toEqual([{ amount: 100, code: 'test', name: 'test', quantity: 10 }]);
    });

    it('should return priceBreakdown when booking has no breakdowns and extraPriceBreakdown is undefined', () => {
        const emptyBooking = {} as IBookingInfo;
        const result = getPriceBreakdown(emptyBooking, undefined, mockPriceBreakdown, false);

        expect(result).toEqual([{ amount: 300, code: 'price', name: 'price', quantity: 3 }]);
    });

    it('should return undefined when breakdownValue is null', () => {
        const emptyBooking = {} as IBookingInfo;
        const result = getPriceBreakdown(emptyBooking, undefined, null, false);

        expect(result).toBeUndefined();
    });

    it('should return undefined when breakdownValue is undefined', () => {
        const emptyBooking = {} as IBookingInfo;
        const result = getPriceBreakdown(emptyBooking, undefined, undefined, false);

        expect(result).toBeUndefined();
    });

    it('should return undefined when breakdownValue has length <= 1 and isTouristTax is true', () => {
        const singleItemBreakdown = [{ amount: 50, code: 'single', name: 'single', quantity: 1 }];
        const result = getPriceBreakdown(undefined, singleItemBreakdown, null, true);

        expect(result).toBeUndefined();
    });

    it('should return undefined when breakdownValue has length 0 and isTouristTax is true', () => {
        const emptyBreakdown: any[] = [];
        const result = getPriceBreakdown(undefined, emptyBreakdown, null, true);

        expect(result).toBeUndefined();
    });

    it('should return breakdownValue when breakdownValue has length > 1 and isTouristTax is true', () => {
        const multiItemBreakdown = [
            { amount: 50, code: 'item1', name: 'item1', quantity: 1 },
            { amount: 60, code: 'item2', name: 'item2', quantity: 2 },
        ];
        const result = getPriceBreakdown(undefined, multiItemBreakdown, null, true);

        expect(result).toEqual(multiItemBreakdown);
    });

    it('should return breakdownValue when breakdownValue has length 1 and isTouristTax is false', () => {
        const singleItemBreakdown = [{ amount: 50, code: 'single', name: 'single', quantity: 1 }];
        const result = getPriceBreakdown(undefined, singleItemBreakdown, null, false);

        expect(result).toEqual(singleItemBreakdown);
    });

    describe('FPH flow', () => {
        it('should return breakdown when FPH flow with fphDiscount > 0, even if length <= 1 and isTouristTax is true', () => {
            const singleItemBreakdown = [{ amount: 50, code: 'Holiday', name: 'Holiday', quantity: 1 }];
            const bookingWithFph = { promoCollections: ['fph'], extraPriceBreakdown: singleItemBreakdown } as any;

            const result = getPriceBreakdown(bookingWithFph, undefined, null, true, {
                isFph: true,
                discount: 100,
                text: 'Flight + Hotel',
            });

            expect(result).toBeDefined();
            expect(result?.length).toBe(1);
        });

        it('should return undefined when FPH flow with fphDiscount === 0 and length <= 1 and isTouristTax is true', () => {
            const singleItemBreakdown = [{ amount: 50, code: 'Holiday', name: 'Holiday', quantity: 1 }];
            const bookingWithFph = {
                promoCollections: ['fph'],
                extraPriceBreakdown: singleItemBreakdown,
            } as IBookingInfo;

            const result = getPriceBreakdown(bookingWithFph, undefined, null, true, {
                isFph: true,
                discount: 0,
                text: 'Flight + Hotel',
            });

            expect(result).toBeUndefined();
        });

        it('should return undefined when FPH flow with fphDiscount === undefined and length <= 1 and isTouristTax is true', () => {
            const singleItemBreakdown = [{ amount: 50, code: 'Holiday', name: 'Holiday', quantity: 1 }];
            const bookingWithFph = {
                promoCollections: ['fph'],
                extraPriceBreakdown: singleItemBreakdown,
            } as IBookingInfo;

            const result = getPriceBreakdown(bookingWithFph, undefined, null, true);

            expect(result).toBeUndefined();
        });

        it('should change Holiday name to "Flight + Hotel" when FPH flow', () => {
            const breakdownWithHoliday = [
                { amount: 500, code: 'Holiday', name: 'Holiday', quantity: 1 },
                { amount: 50, code: 'Extras', name: 'Extras', quantity: 2 },
            ];
            const bookingWithFph = {
                promoCollections: ['fph'],
                extraPriceBreakdown: breakdownWithHoliday,
            } as IBookingInfo;

            const result = getPriceBreakdown(bookingWithFph, undefined, null, false, {
                isFph: true,
                discount: 100,
                text: 'Flight + Hotel',
            });

            expect(result).toBeDefined();
            expect(result?.[0].name).toBe('Flight + Hotel');
            expect(result?.[0].code).toBe('Holiday');
            expect(result?.[1].name).toBe('Extras');
        });

        it('should add fphDiscount to Holiday amount when FPH flow', () => {
            const breakdownWithHoliday = [
                { amount: 500, code: 'Holiday', name: 'Holiday', quantity: 1 },
                { amount: 50, code: 'Extras', name: 'Extras', quantity: 2 },
            ];
            const bookingWithFph = {
                promoCollections: ['fph'],
                extraPriceBreakdown: breakdownWithHoliday,
            } as IBookingInfo;

            const result = getPriceBreakdown(bookingWithFph, undefined, null, false, {
                isFph: true,
                discount: 100,
                text: 'Flight + Hotel',
            });

            expect(result).toBeDefined();
            expect(result?.[0].amount).toBe(600);
            expect(result?.[0].name).toBe('Flight + Hotel');
            expect(result?.[0].code).toBe('Holiday');
            expect(result?.[1].amount).toBe(50);
            expect(result?.[1].name).toBe('Extras');
        });

        it('should not change amount when fphDiscount is 0', () => {
            const breakdownWithHoliday = [{ amount: 500, code: 'Holiday', name: 'Holiday', quantity: 1 }];
            const bookingWithFph = {
                promoCollections: ['fph'],
                extraPriceBreakdown: breakdownWithHoliday,
            } as IBookingInfo;

            const result = getPriceBreakdown(bookingWithFph, undefined, null, false, {
                isFph: true,
                discount: 0,
                text: 'Flight + Hotel',
            });

            expect(result).toBeDefined();
            expect(result?.[0].amount).toBe(500);
            expect(result?.[0].name).toBe('Flight + Hotel');
        });

        it('should handle default fphDiscount value (0) when not provided', () => {
            const breakdownWithHoliday = [
                { amount: 500, code: 'Holiday', name: 'Holiday', quantity: 1 },
                { amount: 50, code: 'Extras', name: 'Extras', quantity: 2 },
            ];
            const bookingWithFph = {
                promoCollections: ['fph'],
                extraPriceBreakdown: breakdownWithHoliday,
            } as IBookingInfo;

            const result = getPriceBreakdown(bookingWithFph, undefined, null, false, {
                isFph: true,
                discount: 0,
                text: 'Flight + Hotel',
            });

            expect(result).toBeDefined();
            expect(result?.[0].amount).toBe(500);
            expect(result?.[0].name).toBe('Flight + Hotel');
        });

        it('should not change Holiday name when not FPH flow', () => {
            const breakdownWithHoliday = [
                { amount: 500, code: 'Holiday', name: 'Holiday', quantity: 1 },
                { amount: 50, code: 'Extras', name: 'Extras', quantity: 2 },
            ];
            const bookingWithoutFph = {
                promoCollections: [],
                extraPriceBreakdown: breakdownWithHoliday,
            } as unknown as IBookingInfo;

            const result = getPriceBreakdown(bookingWithoutFph, undefined, null, false);

            expect(result).toBeDefined();
            expect(result?.[0].name).toBe('Holiday');
            expect(result?.[0].amount).toBe(500);
        });

        it('should not mutate original breakdown when changing Holiday name and amount', () => {
            const breakdownWithHoliday = [{ amount: 500, code: 'Holiday', name: 'Holiday', quantity: 1 }];
            const bookingWithFph = {
                promoCollections: ['fph'],
                extraPriceBreakdown: breakdownWithHoliday,
            } as IBookingInfo;

            getPriceBreakdown(bookingWithFph, undefined, null, false, {
                isFph: true,
                discount: 100,
                text: 'Flight + Hotel',
            });

            expect(breakdownWithHoliday[0].name).toBe('Holiday');
            expect(breakdownWithHoliday[0].amount).toBe(500);
        });
    });
});

describe('getPaymentHistory', () => {
    const mockCard = {
        code: '111',
        number: '222',
    };

    const mockPaymentHistory = [
        { amount: 100, paymentDate: '2024-11-19T00:00:00Z', card: mockCard, isCredit: true },
        { amount: 50, paymentDate: '2024-11-18T00:00:00Z', card: mockCard, isCredit: false },
    ];

    it('should return paymentHistory when isBooking is true and isPayRemaining is true', () => {
        const result = getPaymentHistory(true, true, mockPaymentHistory);

        expect(result).toEqual(mockPaymentHistory);
    });

    it('should return undefined when isBooking is false and isPayRemaining is true', () => {
        const result = getPaymentHistory(false, true, mockPaymentHistory);

        expect(result).toBeUndefined();
    });

    it('should return undefined when isBooking is true and isPayRemaining is false', () => {
        const result = getPaymentHistory(true, false, mockPaymentHistory);

        expect(result).toBeUndefined();
    });

    it('should return undefined when isBooking is false and isPayRemaining is false', () => {
        const result = getPaymentHistory(false, false, mockPaymentHistory);

        expect(result).toBeUndefined();
    });

    it('should return undefined when isBooking is true and isPayRemaining is undefined', () => {
        const result = getPaymentHistory(true, undefined, mockPaymentHistory);

        expect(result).toBeUndefined();
    });

    it('should return undefined when isBooking is false and isPayRemaining is undefined', () => {
        const result = getPaymentHistory(false, undefined, mockPaymentHistory);

        expect(result).toBeUndefined();
    });

    it('should return undefined when paymentHistory is undefined but conditions are met', () => {
        const result = getPaymentHistory(true, true, undefined);

        expect(result).toBeUndefined();
    });

    it('should return empty array when paymentHistory is empty array and conditions are met', () => {
        const result = getPaymentHistory(true, true, []);

        expect(result).toEqual([]);
    });
});

describe('getExtrasFromPriceBreakdown', () => {
    it('should return undefined when priceBreakdown is undefined', () => {
        const result = getExtrasFromPriceBreakdown(undefined);

        expect(result).toBeUndefined();
    });

    it('should return the extras item when it exists in the price breakdown', () => {
        const priceBreakdown = [
            { amount: 200, code: 'Holiday', name: 'Holiday Package', quantity: 1 },
            { amount: 100, code: 'EXTR', name: 'Extras', quantity: 1 },
            { amount: 50, code: 'Kids', name: 'Kids Discount', quantity: 1 },
        ];

        const result = getExtrasFromPriceBreakdown(priceBreakdown);

        expect(result).toEqual({ amount: 100, code: 'EXTR', name: 'Extras', quantity: 1 });
    });
});

describe('getTouristTaxBannerProps', () => {
    const fields = {
        TouristTaxPaymentRequiredBannerTitle: mockSitecoreField('TouristTaxPaymentRequiredBannerTitle'),
        TouristTaxPaymentRequiredBannerText: mockSitecoreField(
            'TouristTaxPaymentRequiredBannerText {amount} {exchangeRate} text',
        ),
        TouristTaxNoPaymentRequiredBannerTitle: mockSitecoreField('TouristTaxNoPaymentRequiredBannerTitle'),
        TouristTaxNoPaymentRequiredBannerText: mockSitecoreField('TouristTaxNoPaymentRequiredBannerText'),
    } as IPaymentPageFields;

    it('should return null when offer is null', () => {
        const result = getTouristTaxBannerProps({
            offer: null,
            fields,
            getPhrase: jest.fn(),
            currencySymbol: '£',
        });

        expect(result).toBeNull();
    });

    it('should return null when fields are null', () => {
        const mockOffer = { touristTax: 10, taxesAndFees: {} } as unknown as IOfferWithoutAltBoards;

        const result = getTouristTaxBannerProps({
            offer: mockOffer,
            fields: null as unknown as IPaymentPageFields,
            getPhrase: jest.fn(),
            currencySymbol: '£',
        });

        expect(result).toBeNull();
    });

    it('should return correct banner props when touristTax is 0', () => {
        const mockOffer = { touristTax: 0, taxesAndFees: {} } as unknown as IOfferWithoutAltBoards;

        const result = getTouristTaxBannerProps({
            offer: mockOffer,
            fields,
            getPhrase: jest.fn(),
            currencySymbol: '£',
        });

        expect(result?.title.value).toBe('TouristTaxNoPaymentRequiredBannerTitle');
        expect(result?.text.value).toBe('TouristTaxNoPaymentRequiredBannerText');
    });

    it('should return null when taxesAndFees is empty', () => {
        const mockOffer = { touristTax: 10, taxesAndFees: {} } as unknown as IOfferWithoutAltBoards;

        const result = getTouristTaxBannerProps({
            offer: mockOffer,
            fields,
            getPhrase: jest.fn(),
            currencySymbol: '£',
        });

        expect(result).toBeNull();
    });

    it('should return correct banner props with calculated amounts and exchange rates', () => {
        const mockOffer = {
            touristTax: 10,
            taxesAndFees: {
                fee1: { currency: 'USD', totalLocalPrice: 100, exchRt: 1.2 },
                fee2: { currency: 'EUR', totalLocalPrice: 80, exchRt: 1.1 },
            },
        } as unknown as IOfferWithoutAltBoards;

        const result = getTouristTaxBannerProps({
            offer: mockOffer,
            fields,
            getPhrase: jest.fn(p => p),
            currencySymbol: 'CURRENCY_SYMBOL',
        });

        expect(result?.title.value).toBe('TouristTaxPaymentRequiredBannerTitle');
        expect(result?.text.value).toBe(
            'TouristTaxPaymentRequiredBannerText USD 100 (CURRENCY_SYMBOL84) + EUR 80 (CURRENCY_SYMBOL73) CURRENCY_SYMBOL1 = USD 1.2 Globals.Conjunctions.And CURRENCY_SYMBOL1 = EUR 1.1 text',
        );
    });
});
