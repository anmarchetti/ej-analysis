import { CurrencyCode } from 'code/currency';
import { mockBooking } from 'frontend/__mocks__';
import { IBookingInfo } from 'models/data/IBookingInfo';
import { IDestination } from 'models/data/IDestination';

import { getMockedExcursions, getMockedExcursionsResponse } from './__mocks__/excursion';
import {
    DESKTOP_ITEMS_AMOUNT,
    getExcursionLinkAndExcursionsWithUtmTagging,
    getShowDots,
    getViewBookingStatusPageData,
    hideArrows,
    HORIZONTAL_VIEW_AMOUNT,
    TABLET_ITEMS_AMOUNT,
} from './Excursions.utils';

describe('Excursions utils', () => {
    describe('getExcursionLinkAndExcursionsWithUtmTagging', () => {
        // doesn't contain url field
        const expectedExcursionResult = {
            coverImageUrl: 'test_header.jpeg',
            description: 'Test desrciption',
            freeCancellation: true,
            likelyToSellOut: false,
            retailPrice: {
                value: 66,
                currency: CurrencyCode.GBP,
            },
            reviewsAvg: 4.2,
            reviewsNumber: 14,
            title: 'Test title',
        };
        const booking = {
            hotel: {
                country: { name: 'localized hotel country', itemName: 'hotel country' },
                location: { name: 'localized hotel location', itemName: 'hotel location' },
                resort: { name: 'localized hotel resort', itemName: 'hotel resort' },
            },
        } as IBookingInfo;
        const excursionsResponse = getMockedExcursionsResponse();
        const { excursionsLink } = excursionsResponse;
        const destinationParents = [{ itemName: 'majorca' }, { itemName: 'spain' }] as IDestination[];
        const layoutName = 'caralonia-majorca';

        test('should return expected results when isDestinationPage is true', () => {
            const res = getExcursionLinkAndExcursionsWithUtmTagging(
                excursionsResponse,
                true,
                false,
                false,
                null,
                null,
                'en',
                destinationParents,
                layoutName,
            );

            expect(res).toEqual({
                excursions: [
                    {
                        ...expectedExcursionResult,
                        url: 'https://.sbox.musement.com/uk/athens/athens-tour-by-night-590/?utm_source=UK-en-GB-Destination-Guides&utm_campaign=spain-majorca-caralonia-majorca&utm_medium=web',
                    },
                ],
                excursionsLink: `${excursionsLink}?utm_source=UK-en-GB-Destination-Guides&utm_campaign=spain-majorca-caralonia-majorca&utm_medium=web`,
                utmValue: 'spain-majorca-caralonia-majorca',
            });
        });

        describe('Confirmation Page', () => {
            test('should return expected results when confirmationBooking hotel is defined', () => {
                const res = getExcursionLinkAndExcursionsWithUtmTagging(
                    excursionsResponse,
                    false,
                    true,
                    false,
                    booking,
                    null,
                    'en',
                    destinationParents,
                    layoutName,
                );

                expect(res).toEqual({
                    excursions: [
                        {
                            ...expectedExcursionResult,
                            url: 'https://.sbox.musement.com/uk/athens/athens-tour-by-night-590/?utm_source=UK-en-GB-Booking-Confirmation-Page&utm_campaign=hotel-country-hotel-location-hotel-resort&utm_medium=web',
                        },
                    ],
                    excursionsLink: `${excursionsLink}?utm_source=UK-en-GB-Booking-Confirmation-Page&utm_campaign=hotel-country-hotel-location-hotel-resort&utm_medium=web`,
                    utmValue: 'hotel-country-hotel-location-hotel-resort',
                });
            });

            test('should return expected results when confirmationBooking hotel is not defined', () => {
                const res = getExcursionLinkAndExcursionsWithUtmTagging(
                    excursionsResponse,
                    false,
                    true,
                    false,
                    null,
                    null,
                    'en',
                    destinationParents,
                    layoutName,
                );

                expect(res).toEqual({
                    excursions: [
                        {
                            ...expectedExcursionResult,
                            url: 'https://.sbox.musement.com/uk/athens/athens-tour-by-night-590/',
                        },
                    ],
                    excursionsLink: excursionsLink,
                    utmValue: '',
                });
            });
        });

        describe('ViewBooking Page', () => {
            test('should return expected results when viewBooking hotel is not defined', () => {
                const res = getExcursionLinkAndExcursionsWithUtmTagging(
                    excursionsResponse,
                    false,
                    false,
                    true,
                    null,
                    null,
                    'en',
                    destinationParents,
                    layoutName,
                );

                expect(res).toEqual({
                    excursions: [
                        {
                            ...expectedExcursionResult,
                            url: 'https://.sbox.musement.com/uk/athens/athens-tour-by-night-590/',
                        },
                    ],
                    excursionsLink,
                    utmValue: '',
                });
            });

            test('should return expected results when viewBooking is defined', () => {
                const res = getExcursionLinkAndExcursionsWithUtmTagging(
                    excursionsResponse,
                    false,
                    false,
                    true,
                    null,
                    booking,
                    'en',
                    destinationParents,
                    layoutName,
                );

                expect(res).toEqual({
                    excursions: [
                        {
                            ...expectedExcursionResult,
                            url: 'https://.sbox.musement.com/uk/athens/athens-tour-by-night-590/?utm_source=UK-en-GB-View-Booking-Page&utm_campaign=hotel-country-hotel-location-hotel-resort&utm_medium=web',
                        },
                    ],
                    excursionsLink: `${excursionsLink}?utm_source=UK-en-GB-View-Booking-Page&utm_campaign=hotel-country-hotel-location-hotel-resort&utm_medium=web`,
                    utmValue: 'hotel-country-hotel-location-hotel-resort',
                });
            });
        });

        test('should return an empty array in excursions props when first argument excursions prop is an empty array', () => {
            excursionsResponse.excursions = [];
            const res = getExcursionLinkAndExcursionsWithUtmTagging(
                excursionsResponse,
                false,
                false,
                true,
                null,
                null,
                'en',
                destinationParents,
                layoutName,
            );

            expect(res).toEqual(expect.objectContaining({ excursions: [] }));
        });

        test('should return expected results when viewBooking is defined', () => {
            const excursionsLinkWithQuestionSymbol = excursionsLink + '?';
            const res = getExcursionLinkAndExcursionsWithUtmTagging(
                { ...excursionsResponse, excursionsLink: excursionsLinkWithQuestionSymbol },
                false,
                false,
                true,
                null,
                booking,
                'en',
                destinationParents,
                layoutName,
            );

            expect(res).toEqual(
                expect.objectContaining({
                    excursionsLink: `${excursionsLinkWithQuestionSymbol}&utm_source=UK-en-GB-View-Booking-Page&utm_campaign=hotel-country-hotel-location-hotel-resort&utm_medium=web`,
                }),
            );
        });
    });

    describe('hideArrows', () => {
        let excursions;

        beforeEach(() => {
            excursions = getMockedExcursions();
        });

        test('should return true when excursions is an empty array', () => {
            const res = hideArrows([], true, false);

            expect(res).toBe(true);
        });

        test('should return true when excursions length is less than TABLET_ITEMS_AMOUNT, isScreenLarge is false and isScreenMedium is true', () => {
            const res = hideArrows(excursions, true, false);

            expect(res).toBe(true);
        });

        test('should return false when excursions length is greater than TABLET_ITEMS_AMOUNT, isScreenLarge is false and isScreenMedium is true', () => {
            excursions = getMockedExcursions(TABLET_ITEMS_AMOUNT + 1);
            const res = hideArrows(excursions, true, false);

            expect(res).toBe(false);
        });

        test('should return true when excursions length is less than DESKTOP_ITEMS_AMOUNT and isScreenLarge is true', () => {
            const res = hideArrows(excursions, true, true);

            expect(res).toBe(true);
        });

        test('should return false when excursions length is greater than DESKTOP_ITEMS_AMOUNT and isScreenLarge is true', () => {
            excursions = getMockedExcursions(DESKTOP_ITEMS_AMOUNT + 1);
            const res = hideArrows(excursions, true, true);

            expect(res).toBe(false);
        });

        test('should return true when isScreenMedium is false', () => {
            const res = hideArrows(excursions, false, true);

            expect(res).toBe(true);
        });

        test('should return true when isScreenMedium is false', () => {
            const res = hideArrows(excursions, false, false);

            expect(res).toBe(true);
        });
    });

    describe('getViewBookingStatusPageData', () => {
        it('should return true isViewBookingStatusPage when destination page is false, confirmation page is false and no location', () => {
            const { isViewBookingStatusPage } = getViewBookingStatusPageData(mockBooking, false, false, false);
            expect(isViewBookingStatusPage).toBe(true);
        });

        it('should return false isViewBookingStatusPage when destination page is true, confirmation page is false and no location', () => {
            const { isViewBookingStatusPage } = getViewBookingStatusPageData(mockBooking, true, false, false);
            expect(isViewBookingStatusPage).toBe(false);
        });

        it('should return false isViewBookingStatusPage when destination page is false, confirmation page is false and has location', () => {
            const { isViewBookingStatusPage } = getViewBookingStatusPageData(mockBooking, false, false, true);
            expect(isViewBookingStatusPage).toBe(false);
        });

        it('should return false isViewBookingStatusPage when destination page is false, confirmation page is true and no location', () => {
            const { isViewBookingStatusPage } = getViewBookingStatusPageData(mockBooking, false, true, false);
            expect(isViewBookingStatusPage).toBe(false);
        });

        it('should return correct viewBookingStatusPage location, start and end date', () => {
            const {
                viewBookingStatusPageLocation,
                viewBookingStatusPageBookingStartDate,
                viewBookingStatusPageBookingEndDate,
            } = getViewBookingStatusPageData(mockBooking, false, false, false);

            expect(viewBookingStatusPageBookingStartDate).toBe(mockBooking.package?.accom?.startDate);
            expect(viewBookingStatusPageBookingEndDate).toBe(mockBooking.package?.accom?.endDate);
            expect(viewBookingStatusPageLocation).toBe(mockBooking.hotel?.location?.code);
        });
    });

    describe('getShowDots', () => {
        test('should return false when excursions count equals HORIZONTAL_VIEW_AMOUNT', () => {
            const res = getShowDots(HORIZONTAL_VIEW_AMOUNT, true, false);

            expect(res).toBe(false);
        });

        test('should return true when excursions count is more than HORIZONTAL_VIEW_AMOUNT and isMobile', () => {
            const res = getShowDots(HORIZONTAL_VIEW_AMOUNT + 1, true, false);

            expect(res).toBe(true);
        });

        test('should return false when excursions count is more than HORIZONTAL_VIEW_AMOUNT and isMobile is false, isScreenLarge is false', () => {
            const res = getShowDots(HORIZONTAL_VIEW_AMOUNT + 1, false, false);

            expect(res).toBe(false);
        });

        test('should return false when excursions count is more than HORIZONTAL_VIEW_AMOUNT and isMobile is false, isScreenLarge is true', () => {
            const res = getShowDots(HORIZONTAL_VIEW_AMOUNT + 1, false, true);

            expect(res).toBe(false);
        });

        test('should return false when excursions count equals TABLET_ITEMS_AMOUNT and isMobile is false, isScreenLarge is false', () => {
            const res = getShowDots(TABLET_ITEMS_AMOUNT, false, false);

            expect(res).toBe(false);
        });

        test('should return true when excursions count is more than TABLET_ITEMS_AMOUNT and isMobile is false, isScreenLarge is false', () => {
            const res = getShowDots(TABLET_ITEMS_AMOUNT + 1, false, false);

            expect(res).toBe(true);
        });

        test('should return true when excursions count is more than DESKTOP_ITEMS_AMOUNT and isMobile is false, isScreenLarge is true', () => {
            const res = getShowDots(DESKTOP_ITEMS_AMOUNT + 1, false, true);

            expect(res).toBe(true);
        });

        test('should return false when excursions count equals DESKTOP_ITEMS_AMOUNT and isMobile is false, isScreenLarge is true', () => {
            const res = getShowDots(DESKTOP_ITEMS_AMOUNT, false, true);

            expect(res).toBe(false);
        });
    });
});
