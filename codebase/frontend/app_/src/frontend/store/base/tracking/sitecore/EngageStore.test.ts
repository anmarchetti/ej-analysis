import { Engage, ICdpResponse, init } from '@sitecore/engage';
import { waitFor } from '@testing-library/dom';

import { CurrencyCode } from 'code/currency';
import { DATE_FORMATS } from 'code/dates';
import {
    baseHolidayMock,
    contentOrder,
    createMockStores,
    destinationMock,
    eventData,
    logData,
    loggerStrings,
    orderCheckoutEventDataMock,
    orderData,
} from 'frontend/__mocks__';
import { mockAirportParking } from 'frontend/__mocks__/airportParking';
import { getBaseExperimentMock, getExperimentMock } from 'frontend/__mocks__/experiments';
import { originsWithNames } from 'frontend/__mocks__/originsWithNames';
import { mockedBooking, mockedLateRoomCheckout } from 'frontend/__mocks__/tracking';
import { logger } from 'frontend/services/logging';
import sitecoreService from 'frontend/services/sitecore.service';
import { LayoutStore } from 'frontend/store/holidays';
import { getCookie } from 'frontend/utils/cookies.utils';
import { formatDateL10n } from 'frontend/utils/date.utils';
import isBackend from 'frontend/utils/isBackend';
import { callOperationWithTimeout } from 'frontend/utils/timeoutController.utils';
import * as trackingUtils from 'frontend/utils/tracking/tracking.utils';
import { NO_FLEXIBILITY } from 'frontend/utils/tracking/tracking.utils';
import * as webStorageUtils from 'frontend/utils/webStorage.utils';
import { CardType } from 'models/enum/CardType';
import { DataStatus } from 'models/enum/DataStatus';
import { SeatType } from 'models/enum/SeatType';
import SiteSettings from 'models/enum/SiteSettings';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { ProductCategories, ProductIds, ProductNames } from 'models/enum/tracking/ProductCategories';
import { WebStorageKeys } from 'models/enum/WebStorageKeys';
import { ISitecorePersonalizeExperiment } from 'models/sitecore/ISitecorePersonalizeExperiment';

import { CANCELLED_STATUS, IdentityRules, OrderCheckoutPayment, PURCHASED_STATUS, SitecoreChannel } from './constants';
import { EngageStore, IContentOrder } from './EngageStore';

jest.useFakeTimers().setSystemTime(new Date('2020-01-01'));
const mockTriggerExperiences = jest.fn();

const mockDefaultData = {
    channel: SitecoreChannel.Desktop,
    currency: CurrencyCode.GBP,
    language: 'EN',
    page: 'Test Title',
};

const standardPageProfile = {
    hotelTheme: {
        beach: 10,
        lakes: 0,
        city: 0,
    },
};

const mockResponse: ICdpResponse = {
    status: 'success',
    ref: '',
    version: '',
    client_key: '',
};

const createMockPaymentInfo = (overrides = {}) => ({
    agentComission: 0,
    allowPayBalanceDueDate: '2025-01-01',
    allowPayOutstandingBalanceDays: 30,
    balanceDueAmount: 0,
    balanceDueDate: '2025-01-01',
    commissionIncludingVat: 0,
    currency: CurrencyCode.GBP,
    depositDueDate: '2025-01-01',
    depositPrice: 0,
    paymentHistory: [],
    pricePP: 0,
    totalPrice: 150.5,
    ...overrides,
});

const mockPageViewEvent = (isMobile = false) => ({
    ...mockDefaultData,
    channel: isMobile ? SitecoreChannel.Mobile : SitecoreChannel.Desktop,
    pageProfile: standardPageProfile,
});

const createRootStore = () =>
    createMockStores({
        trackingStore: {
            pageLang: mockDefaultData.language,
            getPageTitle: jest.fn(() => mockDefaultData.page),
            buildBaseHolidayProduct: jest.fn(),
            buildAllSeatsProducts: jest.fn().mockReturnValue([]),
        },
        appStore: { isScreenExtraSmall: false, deviceType: SitecoreChannel.Desktop },
        marketStore: { currency: mockDefaultData.currency },
        layoutStore: {
            isSearchResultsPage: false,
            pageProfile: standardPageProfile,
            isTradePortal: false,
            getSettingAsBoolean: jest.fn(() => true),
            context: { trackingId: 'trackingId' },
            pageName: 'confirmation page',
            isExtrasPage: true,
            getSettingAsNumber: jest.fn().mockReturnValue(9),
        },
        hotelsStore: { status: DataStatus.Loaded },
        searchStore: {
            searchFrom: {
                origins: ['LGW', 'LTN', 'SEN', 'STN'],
            },
            searchTo: {
                isLoadingDestinations: false,
                selectedDestinations: [destinationMock],
            },
            searchWhen: {
                flexDays: 0,
                isFlexible: false,
                to: new Date(2020, 9, 7),
                from: new Date(2020, 8, 30),
                selectedNumberOfNights: 7,
            },
            searchWho: {
                adultsQuantity: 2,
                childrenQuantity: 0,
                infantsQuantity: 0,
                childrenAges: [2, 3],
            },
            originsWithNames,
        },
        userStore: { checkIfUserLoggedIn: jest.fn(() => true), userData: { email: 'email@test.com' } },
        payStore: { paymentInfo: { creditAmount: 0 }, currency: CurrencyCode.GBP },
        queryParamsStore: { query: '' },
        bookingStore: {
            bookingInfoPayload: {
                bookingReference: 'test-reference',
                paymentType: OrderCheckoutPayment.Card,
                cardType: CardType.Mastercard,
                paymentInfo: {
                    totalPrice: 100,
                    currency: CurrencyCode.GBP,
                },
                date: '2025-08-07',
            },
            isLoadingBookingConfirmationInfo: false,
            extraLuggage: {
                getExtraLuggageProductsForTracking: jest.fn().mockReturnValue([]),
                getLargeCabinBagsPriceByRoute: jest.fn().mockReturnValue(16),
            },
        },
        flightsPassengersStore: { LCBCount: 0 },
    });
let mockRootStore = createRootStore();
const mockEvent = jest.fn();
const mockIdentity = jest.fn();
const mockGetBrowserId = jest.fn().mockReturnValue('4563d0b3-44fc-4dc7-b022-8615700c2b69');
const mockGetWebStorageItem = jest.spyOn(webStorageUtils, 'getWebStorageItem');
const mockSetWebStorageItem = jest.spyOn(webStorageUtils, 'setWebStorageItem');
const mockRemoveWebStorageItem = jest.spyOn(webStorageUtils, 'removeWebStorageItem');
const mockUpdateWebStorageItem = jest.spyOn(webStorageUtils, 'updateWebStorageItem');
const mockCallOperationWithTimeout = callOperationWithTimeout as jest.MockedFunction<typeof callOperationWithTimeout>;

jest.mock('frontend/utils/isBackend', () => jest.fn().mockReturnValue(false));
jest.mock('frontend/utils/cookies.utils', () => ({
    __esModule: true,
    getCookie: jest.fn().mockReturnValue('1'),
}));
jest.mock('frontend/utils/generateUniqueId.utils', () => ({
    __esModule: true,
    generateUniqueId: jest.fn(() => 'uniqueId'),
}));
jest.mock('frontend/utils/timeoutController.utils', () => ({
    __esModule: true,
    callOperationWithTimeout: jest.fn(),
}));
jest.mock('@sitecore/engage', () => ({
    __esModule: true,
    init: jest
        .fn()
        .mockImplementation(() => ({ event: mockEvent, getBrowserId: mockGetBrowserId, identity: mockIdentity })),
}));

const mockedInit = init as jest.MockedFn<typeof init>;
const mockedIsBackend = isBackend as jest.MockedFn<typeof isBackend>;
const mockedCookie = getCookie as jest.MockedFn<typeof getCookie>;
const experiments: ISitecorePersonalizeExperiment[] = [
    getExperimentMock('60b60241-3c24-46dd-988a-5f742593ca59', 'friendlyId', 'test'),
];

describe('EngageStore', () => {
    let store: EngageStore;

    beforeEach(() => {
        mockRootStore = createRootStore();
        mockedIsBackend.mockReturnValue(false);
        mockedCookie.mockReturnValue('1');
        mockCallOperationWithTimeout.mockReturnValue(Promise.resolve(mockResponse));
    });

    describe('initializeEngage', () => {
        it('should initialize', () => {
            new EngageStore(mockRootStore);

            expect(mockedInit).toHaveBeenCalledWith({
                clientKey: 'test-key',
                cookieDomain: '.test-cookie.com',
                cookieExpiryDays: 365,
                includeUTMParameters: 'true',
                pointOfSale: 'default',
                targetURL: 'https://test-target.com',
                webPersonalization: true,
            });
        });

        it('should initialize with false on SearchResultsPage', () => {
            mockRootStore.layoutStore.isSearchResultsPage = true;

            new EngageStore(mockRootStore);

            expect(mockedInit).toHaveBeenCalledWith({
                clientKey: 'test-key',
                cookieDomain: '.test-cookie.com',
                cookieExpiryDays: 365,
                includeUTMParameters: 'true',
                pointOfSale: 'default',
                targetURL: 'https://test-target.com',
                webPersonalization: false,
            });
        });

        it('should NOT initialize on backend', () => {
            mockedIsBackend.mockReturnValueOnce(true);

            new EngageStore(mockRootStore);

            expect(mockedInit).not.toHaveBeenCalled();
        });

        it('should NOT initialize when cookies are NOT enabled', () => {
            mockedCookie.mockReturnValueOnce('');

            new EngageStore(mockRootStore);

            expect(mockedInit).not.toHaveBeenCalled();
        });

        it('should NOT initialize on experience editor', () => {
            mockRootStore.layoutStore.isExperienceEditor = true;

            new EngageStore(mockRootStore);

            expect(mockedInit).not.toHaveBeenCalled();
        });

        it('should NOT initialize on payment page on holidays', () => {
            mockRootStore.layoutStore.isTradePortal = false;
            mockRootStore.layoutStore.isCommitBookingPage = true;

            new EngageStore(mockRootStore);

            expect(mockedInit).not.toHaveBeenCalled();
        });

        it('should initialize on confirm page on trade', () => {
            mockRootStore.layoutStore.isCommitBookingPage = true;
            mockRootStore.layoutStore.isTradePortal = true;

            new EngageStore(mockRootStore);

            expect(mockedInit).toHaveBeenCalledWith({
                clientKey: 'test-key',
                cookieDomain: '.test-cookie.com',
                cookieExpiryDays: 365,
                includeUTMParameters: 'true',
                pointOfSale: 'default',
                targetURL: 'https://test-target.com',
                webPersonalization: true,
            });

            expect(window).toHaveProperty('engage');
        });
    });

    describe('setEngageParams', () => {
        beforeEach(() => {
            store = new EngageStore(mockRootStore);
        });

        it('should set sortParams with provided params', () => {
            const params = { EnableOrdering: '1', FriendlyId: 'uk__extras_promocode_ordering' };

            store.setEngageParams(params);

            expect(store.sortParams).toEqual(params);
        });

        it('should overwrite existing sortParams', () => {
            const initialParams = { EnableOrdering: '1', FriendlyId: 'uk__extras_promocode_ordering' };

            const newParams = {
                EnableOrdering: 'true',
                FriendlyId: 'new-friendly-id',
                AdditionalParam: 'new-value',
            };

            store.setEngageParams(initialParams);
            expect(store.sortParams).toEqual(initialParams);

            store.setEngageParams(newParams);
            expect(store.sortParams).toEqual(newParams);
        });

        it('should set empty object when no params provided', () => {
            store.setEngageParams({});

            expect(store.sortParams).toEqual({});
        });
    });

    describe('getLogData', () => {
        beforeEach(() => {
            mockRootStore.layoutStore.getSetting = jest.fn().mockReturnValue(true);
            store = new EngageStore(mockRootStore);
        });

        it('should NOT log anything when EnablePersonalizeOrderLogging is off', () => {
            mockRootStore.layoutStore.getSetting = jest.fn().mockReturnValue(false);

            expect(
                store.getLogData({
                    response: { status: 'success' } as ICdpResponse,
                    item: { selectionAttr: 'test-attr' } as ISitecorePersonalizeExperiment,
                }),
            ).toBe(null);
        });

        it('should return a correctly formatted log data object', () => {
            expect(
                store.getLogData({
                    response: { status: 'success' } as ICdpResponse,
                    item: { selectionAttr: 'test-attr' } as ISitecorePersonalizeExperiment,
                }),
            ).toEqual({
                ...store['orderCheckoutEventData'],
                order: logData.order,
                response: { status: 'success' },
                eventType: EventTypes.CustomEventPrefix.toUpperCase(),
                bookingReference: 'test-reference',
                selectionAttr: 'test-attr',
            });
        });

        it('should exclude cardType and paymentType from the order object', () => {
            const resultOrder = store.getLogData({
                response: { status: 'error' } as ICdpResponse,
                item: { selectionAttr: 'another-attr' } as ISitecorePersonalizeExperiment,
            })?.order;

            expect(resultOrder).not.toHaveProperty('cardType');
            expect(resultOrder).not.toHaveProperty('paymentType');
        });
    });

    describe('sendEvent', () => {
        beforeEach(() => {
            store = new EngageStore(mockRootStore);
        });

        it('should return undefined when engage is undefined', async () => {
            jest.spyOn(store, 'engage', 'get').mockReturnValue(undefined);

            const result = await store.sendEvent(EventTypes.View, mockDefaultData);

            expect(result).toBeUndefined();
            expect(mockCallOperationWithTimeout).not.toHaveBeenCalled();
        });

        it('should call callOperationWithTimeout with correct parameters', async () => {
            mockCallOperationWithTimeout.mockResolvedValue(mockResponse);

            const extensionData = { extension: 'value' };
            const result = await store.sendEvent(EventTypes.View, mockDefaultData, extensionData);

            expect(mockCallOperationWithTimeout).toHaveBeenCalledWith(
                expect.any(Function),
                9,
                EventTypes.View,
                '4563d0b3-44fc-4dc7-b022-8615700c2b69',
            );
            expect(result).toEqual(mockResponse);
        });

        it('should work with different event types', async () => {
            mockEvent.mockResolvedValue(mockResponse);

            const eventTypes = [
                EventTypes.View,
                EventTypes.SearchCriteria,
                EventTypes.OrderCheckout,
                EventTypes.OrderCancel,
            ];

            for (const eventType of eventTypes) {
                await store.sendEvent(eventType, mockDefaultData);

                expect(mockCallOperationWithTimeout).toHaveBeenCalledWith(
                    expect.any(Function),
                    9,
                    eventType,
                    '4563d0b3-44fc-4dc7-b022-8615700c2b69',
                );
            }

            expect(mockCallOperationWithTimeout).toHaveBeenCalledTimes(4);
        });

        it('should pass correct operation function to callOperationWithTimeout', async () => {
            mockCallOperationWithTimeout.mockImplementation(async operation => {
                operation();

                return mockResponse;
            });

            await store.sendEvent(EventTypes.View, mockDefaultData, { extension: 'value' });

            expect(mockEvent).toHaveBeenCalledWith(EventTypes.View, mockDefaultData, { extension: 'value' });
        });
    });

    describe('sendPageViewEvent', () => {
        it('should send page view event', async () => {
            store = new EngageStore(mockRootStore);
            store.sendEvent = jest.fn();
            mockRootStore.trackingStore.pageLoadObject = {
                pageReferral: 'https://www.easyjet.com/holidays/search?utm_source=test&foo=bar',
                dimension11: 'search',
            };

            await store.sendPageViewEvent();

            expect(store.sendEvent).toHaveBeenCalledWith(EventTypes.View.toUpperCase(), {
                ...mockPageViewEvent(),
                pageReferral: 'https://www.easyjet.com/holidays/search',
                pageReferralCategory: 'search',
            });
        });

        it('should send page view event without query when page referral has no params', async () => {
            store = new EngageStore(mockRootStore);
            store.sendEvent = jest.fn();
            mockRootStore.trackingStore.pageLoadObject = {
                pageReferral: 'https://www.easyjet.com/holidays/search',
                dimension11: 'search',
            };

            await store.sendPageViewEvent();

            expect(store.sendEvent).toHaveBeenCalledWith(EventTypes.View.toUpperCase(), {
                ...mockPageViewEvent(),
                pageReferral: 'https://www.easyjet.com/holidays/search',
                pageReferralCategory: 'search',
            });
        });
    });

    describe('sendSearchEvent', () => {
        beforeEach(() => {
            store = new EngageStore(mockRootStore);
            store.sendEvent = jest.fn();
        });

        it('should send search event', async () => {
            await store.sendSearchEvent();

            expect(store.sendEvent).toHaveBeenCalledWith('SEARCH_CRITERIA', {
                ...mockDefaultData,
                departureDate: formatDateL10n(mockRootStore.searchStore.searchWhen.from, DATE_FORMATS.query),
                destinations: [{ code: 'destination_code', name: 'destination_name' }],
                flexibility: NO_FLEXIBILITY,
                fromAirports: [
                    { code: 'LGW', name: 'London Gatwick' },
                    { code: 'LTN', name: 'London Luton' },
                    { code: 'SEN', name: 'London Southend' },
                    { code: 'STN', name: 'London Stansted' },
                ],
                numberOfNights: 7,
                pax: { adults: 2, children: 0, infants: 0, childrenAges: [2, 3] },
                returnDate: formatDateL10n(mockRootStore.searchStore.searchWhen.to, DATE_FORMATS.query),
            });
        });

        it('should call getDepartureAirportsCodes with empty array when origins are undefined', async () => {
            const mockGetDepartureAirportsCode = jest.spyOn(trackingUtils, 'getDepartureAirportsCodes');
            store.rootStore.searchStore.searchFrom.origins = undefined;

            await store.sendSearchEvent();

            expect(mockGetDepartureAirportsCode).toHaveBeenCalledWith([], store.rootStore.searchStore.originsWithNames);
        });
    });

    describe('callEngage', () => {
        beforeEach(() => {
            store = new EngageStore(mockRootStore);
            store.sendPageViewEvent = jest.fn();
            store.sendSearchEvent = jest.fn();
        });

        it('should call sendPageViewEvent and NOT call sendSearchEvent', async () => {
            await store.callEngage();

            expect(store.sendPageViewEvent).toHaveBeenCalled();
            expect(globalThis.Engage?.triggerExperiences).toBe(undefined);
        });

        it('should call globalThis.Engage.triggerExperiences when it is NOT undefined', async () => {
            Object.defineProperty(globalThis, 'Engage', {
                value: { triggerExperiences: mockTriggerExperiences },
            });

            await store.callEngage();

            expect(mockTriggerExperiences).toHaveBeenCalled();
        });

        it('should call sendPageViewEvent and sendSearchEvent on search results page', async () => {
            mockRootStore.layoutStore.isSearchResultsPage = true;

            await store.callEngage();

            expect(store.sendPageViewEvent).toHaveBeenCalled();
            expect(store.sendSearchEvent).toHaveBeenCalled();
            expect(mockedInit).toHaveBeenCalledWith({
                clientKey: 'test-key',
                cookieDomain: '.test-cookie.com',
                cookieExpiryDays: 365,
                includeUTMParameters: 'true',
                pointOfSale: 'default',
                targetURL: 'https://test-target.com',
                webPersonalization: true,
            });
        });
    });

    describe('clearContentOrder', () => {
        it('should clear contentOrder', () => {
            store.contentOrder = {} as IContentOrder;

            store.clearContentOrder();

            expect(store.contentOrder).toEqual(null);
        });
    });

    describe('getOrderingFromPromoCode', () => {
        beforeEach(() => {
            store = new EngageStore({
                ...mockRootStore,
                layoutStore: {
                    isExtrasPage: true,
                    getSettingAsBoolean: jest.fn().mockReturnValue(false),
                    getSettingAsNumber: jest.fn().mockReturnValue(350),
                },
                bookingStore: { adultsQuantity: 2, childrenQuantity: 0, infantsQuantity: 0 },
            });
            store.contentOrder = contentOrder;
            store.sortParams = { EnableOrdering: '1', FriendlyId: 'uk__extras_promocode_ordering' };
        });

        it('should clear contentOrder when engage is undefined', async () => {
            jest.spyOn(store, 'engage', 'get').mockReturnValue(undefined);

            await store.getOrderingFromPromoCode('TEST123');

            expect(store.contentOrder).toBeNull();
        });

        it('should clear contentOrder when NOT on extras page', async () => {
            store.rootStore.layoutStore = {
                isExtrasPage: false,
                getSettingAsBoolean: jest.fn().mockReturnValue(false),
            } as unknown as LayoutStore;

            await store.getOrderingFromPromoCode('TEST123');

            expect(store.contentOrder).toBeNull();
        });

        it('should clear contentOrder when EnableOrdering field is missing', async () => {
            store.sortParams = { FriendlyId: 'uk__extras_promocode_ordering' };

            await store.getOrderingFromPromoCode('TEST123');

            expect(store.contentOrder).toBeNull();
        });

        it('should clear contentOrder when OrderingFriendlyID is missing', async () => {
            store.sortParams = { EnableOrdering: '0' };

            await store.getOrderingFromPromoCode('TEST123');

            expect(store.contentOrder).toBeNull();
        });

        it('should clear contentOrder when DisableReordering setting is enabled', async () => {
            store.rootStore.layoutStore = {
                isExtrasPage: true,
                getSettingAsBoolean: jest.fn().mockReturnValue(true),
            } as unknown as LayoutStore;

            await store.getOrderingFromPromoCode('TEST123');

            expect(store.contentOrder).toBeNull();
            expect(store.rootStore.layoutStore.getSettingAsBoolean).toHaveBeenCalledWith(
                SiteSettings.DisableReordering,
            );
        });

        it('should call callOperationWithTimeout with proper params for hotel details page', async () => {
            const mockPersonalize = jest.fn().mockResolvedValue(contentOrder);
            jest.spyOn(store, 'engage', 'get').mockReturnValue({
                personalize: mockPersonalize,
                getBrowserId: mockGetBrowserId,
            } as unknown as Engage);
            mockCallOperationWithTimeout.mockImplementation(async operation => {
                operation();

                return contentOrder;
            });
            store.rootStore.layoutStore = {
                isHotelDetailsBookPage: true,
                getSettingAsBoolean: jest.fn().mockReturnValue(false),
                getSettingAsNumber: jest.fn().mockReturnValue(350),
            } as unknown as LayoutStore;

            await store.getOrderingFromPromoCode('PROMO');

            expect(store.contentOrder).toEqual(contentOrder);
            expect(store.rootStore.layoutStore.getSettingAsBoolean).toHaveBeenCalledWith(
                SiteSettings.DisableReordering,
            );
            expect(mockCallOperationWithTimeout).toHaveBeenCalledWith(
                expect.any(Function),
                350,
                EventTypes.OrderPersonalize,
                '4563d0b3-44fc-4dc7-b022-8615700c2b69',
                'uk__extras_promocode_ordering',
            );
            expect(mockPersonalize).toHaveBeenCalledWith({
                ...mockDefaultData,
                friendlyId: 'uk__extras_promocode_ordering',
                params: {
                    promoCode: 'PROMO',
                    deviceType: SitecoreChannel.Desktop,
                },
            });
        });

        it('should set contentOrder even when result is empty object', async () => {
            mockCallOperationWithTimeout.mockResolvedValue({});

            await store.getOrderingFromPromoCode('PROMO');

            expect(store.contentOrder).toEqual({});
        });

        it('should pass correct paxMix with different passenger quantities', async () => {
            store.rootStore.bookingStore = {
                ...store.rootStore.bookingStore,
                adultsQuantity: 3,
                childrenQuantity: 2,
                infantsQuantity: 1,
            } as any;

            const mockPersonalize = jest.fn().mockResolvedValue(contentOrder);
            jest.spyOn(store, 'engage', 'get').mockReturnValue({
                personalize: mockPersonalize,
                getBrowserId: mockGetBrowserId,
            } as unknown as Engage);
            mockCallOperationWithTimeout.mockImplementation(async operation => {
                operation();

                return contentOrder;
            });
            jest.spyOn(store, 'engage', 'get').mockReturnValue({
                personalize: mockPersonalize,
                getBrowserId: mockGetBrowserId,
            } as unknown as Engage);

            await store.getOrderingFromPromoCode('PROMO');

            expect(mockPersonalize).toHaveBeenCalledWith(
                expect.objectContaining({
                    friendlyId: expect.any(String),
                    params: {
                        promoCode: 'PROMO',
                        paxMix: {
                            adults: 3,
                            children: 2,
                            infants: 1,
                        },
                    },
                }),
            );
        });

        it('should pass correct paxMix with zero passengers', async () => {
            store.rootStore.bookingStore = {
                ...store.rootStore.bookingStore,
                adultsQuantity: 0,
                childrenQuantity: 0,
                infantsQuantity: 0,
            } as any;

            const mockPersonalize = jest.fn().mockResolvedValue(contentOrder);
            jest.spyOn(store, 'engage', 'get').mockReturnValue({
                personalize: mockPersonalize,
                getBrowserId: mockGetBrowserId,
            } as unknown as Engage);
            mockCallOperationWithTimeout.mockImplementation(async operation => {
                operation();

                return contentOrder;
            });

            jest.spyOn(store, 'engage', 'get').mockReturnValue({
                personalize: mockPersonalize,
                getBrowserId: mockGetBrowserId,
            } as unknown as Engage);

            await store.getOrderingFromPromoCode('PROMO');

            expect(mockPersonalize).toHaveBeenCalledWith(
                expect.objectContaining({
                    friendlyId: expect.any(String),
                    params: {
                        promoCode: 'PROMO',
                        paxMix: {
                            adults: 0,
                            children: 0,
                            infants: 0,
                        },
                    },
                }),
            );
        });
    });

    it('should set experiments on setExperiments call', () => {
        const engageStore = new EngageStore(mockRootStore);

        engageStore.setExperiments(experiments);

        expect(engageStore.experiments).toEqual(experiments);
    });

    it('should get experiments by unique Id on experimentsByUniqueId call', () => {
        const engageStore = new EngageStore(mockRootStore);

        engageStore.experiments = experiments;

        expect(engageStore.experimentsByUniqueId).toEqual({
            '60b60241-3c24-46dd-988a-5f742593ca59': getBaseExperimentMock('friendlyId', 'test'),
        });
    });

    describe('serialize', () => {
        it('should return experiments', () => {
            store = new EngageStore(mockRootStore);
            store.experiments = experiments;

            expect(store.serialize()).toEqual({
                experiments,
            });
        });
    });

    describe('deserialize', () => {
        beforeEach(() => {
            store = new EngageStore(mockRootStore);
        });

        it('should return experiments', () => {
            store.experiments = experiments;
            store.deserialize({ experiments });

            expect(store.experiments).toEqual(experiments);
        });

        it('should return empty array when initialState is undefined', () => {
            store.experiments = experiments;
            store.deserialize();

            expect(store.experiments).toEqual([]);
        });
    });

    describe('sendOrderCheckoutEvent', () => {
        beforeEach(() => {
            store = new EngageStore(mockRootStore);
            store.sendEvent = jest.fn();
        });

        it('should NOT call event when engage is undefined', async () => {
            jest.spyOn(store, 'engage', 'get').mockReturnValue(undefined);

            await store.sendOrderCheckoutEvent();

            expect(store.sendEvent).not.toHaveBeenCalled();
        });

        it('should NOT call event when isLoadingBookingConfirmationInfo is true', () => {
            mockRootStore.bookingStore.isLoadingBookingConfirmationInfo = true;

            store.sendOrderCheckoutEvent();

            expect(store.sendEvent).not.toHaveBeenCalled();
        });

        it('should call event, setWebStorageItem and setExperimentsIntoStorage', async () => {
            store.setExperimentsIntoStorage = jest.fn();

            await store.sendOrderCheckoutEvent();

            expect(store.sendEvent).toHaveBeenCalledWith(
                EventTypes.OrderCheckout.toUpperCase(),
                store['orderCheckoutEventData'],
            );
        });

        it('should call sendCustomEvent for each EngageCustomEvents key and remove storage item', async () => {
            store.setExperimentsIntoStorage = jest.fn();
            store.sendCustomEvent = jest.fn();
            mockGetWebStorageItem.mockReturnValueOnce({
                CUSTOM_EVENT_heroBannerClick: true,
                CUSTOM_EVENT_promoClick: true,
            });

            await store.sendOrderCheckoutEvent();

            expect(store.sendCustomEvent).toHaveBeenCalledTimes(2);
            expect(store.sendCustomEvent).toHaveBeenCalledWith('SUCCESSFUL_CONVERSATION', {
                source: 'CUSTOM_EVENT_heroBannerClick',
            });
            expect(store.sendCustomEvent).toHaveBeenCalledWith('SUCCESSFUL_CONVERSATION', {
                source: 'CUSTOM_EVENT_promoClick',
            });
            expect(mockRemoveWebStorageItem).toHaveBeenCalledWith(WebStorageKeys.EngageCustomEvents, sessionStorage);
        });

        it('should NOT call sendCustomEvent when EngageCustomEvents is empty', async () => {
            store.setExperimentsIntoStorage = jest.fn();
            store.sendCustomEvent = jest.fn();
            mockGetWebStorageItem.mockReturnValueOnce({});

            await store.sendOrderCheckoutEvent();

            expect(store.sendCustomEvent).not.toHaveBeenCalled();
            expect(mockRemoveWebStorageItem).not.toHaveBeenCalledWith(
                WebStorageKeys.EngageCustomEvents,
                sessionStorage,
            );
        });

        it('should NOT call sendCustomEvent when EngageCustomEvents is null', async () => {
            store.setExperimentsIntoStorage = jest.fn();
            store.sendCustomEvent = jest.fn();
            mockGetWebStorageItem.mockReturnValueOnce(null);

            await store.sendOrderCheckoutEvent();

            expect(store.sendCustomEvent).not.toHaveBeenCalled();
        });
    });

    describe('sendPromoCodeEvent', () => {
        beforeEach(() => {
            store = new EngageStore(mockRootStore);
            store.sendEvent = jest.fn();
        });

        it('should NOT call event when promocode is undefined', async () => {
            await store.sendPromoCodeEvent();

            expect(store.sendEvent).not.toHaveBeenCalled();
        });

        it('should call event', async () => {
            await store.sendPromoCodeEvent('EUBO');

            expect(store.sendEvent).toHaveBeenCalledWith('ATCOM_PROMO_CODE', {
                channel: mockDefaultData.channel,
                currency: CurrencyCode.GBP,
                language: mockDefaultData.language,
                page: 'Test Title',
                promoCode: 'EUBO',
            });
        });
    });

    describe('sendCustomEvent', () => {
        it('should call event with browser ID', async () => {
            store = new EngageStore(mockRootStore);
            store.sendEvent = jest.fn();

            await store.sendCustomEvent(EventTypes.LogIn, { buttonLabel: 'label', buttonLocation: ' location' });

            expect(store.sendEvent).toHaveBeenCalledWith('CUSTOM_EVENT_LOGIN', {
                channel: mockDefaultData.channel,
                currency: CurrencyCode.GBP,
                language: mockDefaultData.language,
                page: 'Test Title',
                buttonLabel: 'label',
                buttonLocation: ' location',
            });
        });
    });

    describe('saveHeroBannerClickEvent', () => {
        beforeEach(() => {
            store = new EngageStore(mockRootStore);
            store.sendCustomEvent = jest.fn();
            mockUpdateWebStorageItem.mockClear();
            mockRootStore.engageStore = {
                experimentsByUniqueId: {
                    uid123: {
                        friendlyId: 'friendly-id',
                        selectionAttr: 'selection-attr',
                    },
                },
            } as any;
        });

        it('should call sendCustomEvent with derived eventType and selectionAttr', async () => {
            await store.saveHeroBannerClickEvent('uid123', EventTypes.HeroBannerClick);

            expect(store.sendCustomEvent).toHaveBeenCalledWith('HERO_BANNER_CLICK_FRIENDLY-ID', {
                selectionAttr: 'selection-attr',
            });
        });

        it('should use Default values when experiment is not found by uniqueId', async () => {
            await store.saveHeroBannerClickEvent('missing-id', EventTypes.HeroBannerClick);

            expect(store.sendCustomEvent).toHaveBeenCalledWith('HERO_BANNER_CLICK_DEFAULT', {
                selectionAttr: 'Default',
            });
        });

        it('should call updateWebStorageItem with eventType key set to true', async () => {
            await store.saveHeroBannerClickEvent('uid123', EventTypes.HeroBannerClick);

            expect(mockUpdateWebStorageItem).toHaveBeenLastCalledWith(
                WebStorageKeys.EngageCustomEvents,
                { 'CUSTOM_EVENT_HERO_BANNER_CLICK_FRIENDLY-ID': true },
                sessionStorage,
            );
        });
    });

    describe('sendMarketingEvent', () => {
        it('should call event with marketing channel data', async () => {
            mockRootStore.queryParamsStore.query = { utm_medium: 'email', utm_campaign: 'CampaignName' };
            store = new EngageStore(mockRootStore);
            store.sendEvent = jest.fn();

            await store.sendMarketingEvent();

            expect(store.sendEvent).toHaveBeenCalledWith('MARKETING_CHANNEL', {
                ...store['engageEventData'],
                marketingChannel: 'email',
                campaignName: 'CampaignName',
            });
        });
    });

    describe('Experiment events', () => {
        beforeEach(() => {
            store = new EngageStore(mockRootStore);

            jest.useFakeTimers().setSystemTime(new Date('2020-01-01'));
        });

        describe('getExperimentsFromStorage', () => {
            it('should get data from session-storage', () => {
                store.rootStore.layoutStore.lang = 'ch-de';

                store.getExperimentsFromStorage();

                expect(mockGetWebStorageItem).toHaveBeenCalledWith('experiments_ch-de', true, sessionStorage);
            });
        });

        describe('setExperimentsIntoStorage', () => {
            it('should set data into session-storage', () => {
                store.rootStore.layoutStore.lang = 'ch-de';

                store.setExperimentsIntoStorage([]);

                expect(mockSetWebStorageItem).toHaveBeenCalledWith('experiments_ch-de', [], sessionStorage);
            });
        });

        describe('syncExperiments', () => {
            it('should merge experiments from both session-storage and store and set data into session-storage', () => {
                store.getExperimentsFromStorage = jest.fn(() => [
                    getExperimentMock('60b60241-3c24-46dd-988a-5f742593ca59', 'experiment-1', 'value-1-default'),
                    getExperimentMock('60b60241-3c24-46dd-988a-5f742593ca59', 'experiment-3', 'value-3'),
                ]);
                store.experiments = [
                    getExperimentMock('60b60241-3c24-46dd-988a-5f742593ca59', 'experiment-1', 'value-1'),
                    getExperimentMock('60b60241-3c24-46dd-988a-5f742593ca59', 'experiment-2', 'value-2'),
                ];
                store.setExperimentsIntoStorage = jest.fn();
                store.syncExperiments();

                expect(store.setExperimentsIntoStorage).toHaveBeenCalledWith([
                    getExperimentMock('60b60241-3c24-46dd-988a-5f742593ca59', 'experiment-1', 'value-1'),
                    getExperimentMock('60b60241-3c24-46dd-988a-5f742593ca59', 'experiment-3', 'value-3'),
                    getExperimentMock('60b60241-3c24-46dd-988a-5f742593ca59', 'experiment-2', 'value-2'),
                ]);
            });
        });
    });

    describe('orderCheckoutEventData', () => {
        it('should return data with cardType from bookingInfoPayload when paymentType is NOT credit', () => {
            expect(store['orderCheckoutEventData']).toStrictEqual(orderCheckoutEventDataMock());
        });

        it('should return data without cardType when paymentType is credit', () => {
            mockRootStore.bookingStore.bookingInfoPayload.paymentType = OrderCheckoutPayment.Credit;

            store = new EngageStore(mockRootStore);

            const result = orderCheckoutEventDataMock();
            result.order.cardType = '';
            result.order.paymentType = OrderCheckoutPayment.Credit;

            expect(store['orderCheckoutEventData']).toStrictEqual(result);
        });
    });

    describe('addOrderItems', () => {
        it('should return initial event data when NO booking', () => {
            const event = orderCheckoutEventDataMock();

            expect(store['addOrderItems'](EventTypes.OrderCheckout, event)).toStrictEqual(event);
        });

        it('should return initial event data when NO baseHoliday', () => {
            store.rootStore.bookingStore.booking = mockedBooking;

            const event = orderCheckoutEventDataMock();

            expect(store['addOrderItems'](EventTypes.OrderCheckout, event)).toStrictEqual(event);
        });

        it('should return base items', () => {
            store.rootStore.bookingStore.booking = mockedBooking;
            store.rootStore.trackingStore.buildBaseHolidayProduct = jest.fn().mockReturnValue(baseHolidayMock);

            const event = orderCheckoutEventDataMock();

            const items = store['addOrderItems'](EventTypes.OrderCheckout, event).order.orderItems;
            expect(items?.length).toBe(3);
            expect(items).toStrictEqual([
                {
                    currencyCode: CurrencyCode.GBP,
                    name: baseHolidayMock.name,
                    orderedAt: event.order.orderedAt,
                    price: baseHolidayMock.price,
                    productId: baseHolidayMock.id,
                    quantity: baseHolidayMock.quantity,
                    referenceId: 'test-reference-uniqueId',
                    status: PURCHASED_STATUS,
                    type: ProductCategories.BaseHoliday,
                },
                {
                    currencyCode: CurrencyCode.GBP,
                    name: 'LGW-TFS',
                    orderedAt: event.order.orderedAt,
                    price: 0,
                    productId: 'flight-1',
                    quantity: baseHolidayMock.quantity,
                    referenceId: 'test-reference-uniqueId',
                    status: PURCHASED_STATUS,
                    type: ProductCategories.FlightDeparture,
                },
                {
                    currencyCode: CurrencyCode.GBP,
                    name: 'TFS-LGW',
                    orderedAt: event.order.orderedAt,
                    price: 0,
                    productId: 'flight-2',
                    quantity: baseHolidayMock.quantity,
                    referenceId: 'test-reference-uniqueId',
                    status: PURCHASED_STATUS,
                    type: ProductCategories.FlightReturn,
                },
            ]);
        });

        it('should return extra items', () => {
            Object.defineProperty(store.rootStore.flightsPassengersStore, 'LCBCount', { get: () => 2 });
            store.rootStore.bookingStore.booking = {
                ...mockedBooking,
                lateRoomCheckout: mockedLateRoomCheckout,
                airportParking: mockAirportParking,
            };
            store.rootStore.trackingStore.buildBaseHolidayProduct = jest.fn().mockReturnValue(baseHolidayMock);
            store.rootStore.trackingStore.buildAllSeatsProducts = jest.fn().mockReturnValue([
                { category: 'Seats: Outbound', price: 23.99, name: SeatType.UpFront, id: '3E', quantity: 1 },
                { category: 'Seats: Return', price: 12.49, name: SeatType.Standard, id: '9E', quantity: 1 },
            ]);
            store.rootStore.bookingStore.extraLuggage.getExtraLuggageProductsForTracking = jest.fn().mockReturnValue([
                { price: 40, quantity: 1, routeId: '1', title: '23kg Extra Hold Bag' },
                { price: 90, quantity: 1, routeId: '1', title: 'Bike' },
                { price: 40, quantity: 1, routeId: '2', title: '23kg Extra Hold Bag' },
                { price: 90, quantity: 1, routeId: '2', title: 'Bike' },
            ]);

            const event = orderCheckoutEventDataMock();
            const items = store['addOrderItems'](EventTypes.OrderCheckout, event).order.orderItems;
            expect(items?.length).toBe(13);
            expect(items?.[3]).toEqual({
                referenceId: 'test-reference-uniqueId',
                orderedAt: event.order.orderedAt,
                status: PURCHASED_STATUS,
                currencyCode: CurrencyCode.GBP,
                type: 'Seats: Outbound',
                price: 23.99,
                name: SeatType.UpFront,
                productId: '3E',
                quantity: 1,
            });
            expect(items?.[4]).toEqual({
                referenceId: 'test-reference-uniqueId',
                orderedAt: event.order.orderedAt,
                status: PURCHASED_STATUS,
                currencyCode: CurrencyCode.GBP,
                type: 'Seats: Return',
                price: 12.49,
                name: SeatType.Standard,
                productId: '9E',
                quantity: 1,
            });
            expect(items?.[5]).toEqual({
                referenceId: 'test-reference-uniqueId',
                orderedAt: event.order.orderedAt,
                status: PURCHASED_STATUS,
                currencyCode: CurrencyCode.GBP,
                type: 'Bags: Outbound',
                price: 40,
                name: '23kg Extra Hold Bag',
                productId: '23kg Extra Hold Bag_hotel id',
                quantity: 1,
            });
            expect(items?.[6]).toEqual({
                referenceId: 'test-reference-uniqueId',
                orderedAt: event.order.orderedAt,
                status: PURCHASED_STATUS,
                currencyCode: CurrencyCode.GBP,
                type: 'Bags: Outbound',
                price: 90,
                name: 'Bike',
                productId: 'Bike_hotel id',
                quantity: 1,
            });
            expect(items?.[7].type).toBe('Bags: Inbound');
            expect(items?.[8].type).toBe('Bags: Inbound');
            expect(items?.[9]).toEqual({
                referenceId: 'test-reference-uniqueId',
                orderedAt: event.order.orderedAt,
                status: PURCHASED_STATUS,
                currencyCode: CurrencyCode.GBP,
                type: ProductCategories.HotelExtras,
                price: mockedLateRoomCheckout.price,
                name: mockedLateRoomCheckout.name,
                productId: ProductIds.LateCheckout,
                quantity: 1,
            });
            expect(items?.[10]).toEqual({
                referenceId: 'test-reference-uniqueId',
                orderedAt: event.order.orderedAt,
                status: PURCHASED_STATUS,
                currencyCode: CurrencyCode.GBP,
                type: ProductCategories.LCBOutbound,
                price: 16,
                name: ProductNames.LargeCabinBags,
                productId: ProductIds.LargeCabinBagsSingle,
                quantity: 2,
            });
            expect(items?.[11].type).toBe(ProductCategories.LCBInbound);
            expect(items?.[12]).toEqual({
                referenceId: 'test-reference-uniqueId',
                orderedAt: event.order.orderedAt,
                status: PURCHASED_STATUS,
                currencyCode: CurrencyCode.GBP,
                type: ProductCategories.ExternalExtras,
                price: mockAirportParking.bookingDetails.totalPrice,
                name: ProductNames.AirportParking,
                productId: ProductCategories.ExternalExtras,
                quantity: 1,
            });
        });

        it('should render cabin bags items with 0 price when it is undefined', () => {
            Object.defineProperty(store.rootStore.flightsPassengersStore, 'LCBCount', { get: () => 2 });
            store.rootStore.bookingStore.extraLuggage.getLargeCabinBagsPriceByRoute = jest
                .fn()
                .mockReturnValueOnce(undefined);
            store.rootStore.bookingStore.booking = {
                ...mockedBooking,
                seatSelection: undefined,
            };
            store.rootStore.trackingStore.buildBaseHolidayProduct = jest.fn().mockReturnValue(baseHolidayMock);

            const event = orderCheckoutEventDataMock();

            const items = store['addOrderItems'](EventTypes.OrderCheckout, event).order.orderItems;
            expect(items?.length).toBe(9);
            expect(items?.[7]).toEqual({
                referenceId: 'test-reference-uniqueId',
                orderedAt: event.order.orderedAt,
                status: PURCHASED_STATUS,
                currencyCode: CurrencyCode.GBP,
                type: ProductCategories.LCBOutbound,
                price: 0,
                name: ProductNames.LargeCabinBags,
                productId: ProductIds.LargeCabinBagsSingle,
                quantity: 2,
            });
            expect(items?.[8]).toEqual({
                referenceId: 'test-reference-uniqueId',
                orderedAt: event.order.orderedAt,
                status: PURCHASED_STATUS,
                currencyCode: CurrencyCode.GBP,
                type: ProductCategories.LCBInbound,
                price: 0,
                name: ProductNames.LargeCabinBags,
                productId: ProductIds.LargeCabinBagsSingle,
                quantity: 2,
            });
        });
    });

    describe('isOrderCheckoutSent', () => {
        it('should call getWebStorageItem with correct data', () => {
            mockGetWebStorageItem.mockReturnValue(true);

            expect(store.isOrderCheckoutSent).toBe(true);
            expect(mockGetWebStorageItem).toHaveBeenCalledWith(
                WebStorageKeys.IsOrderCheckoutSent,
                true,
                sessionStorage,
            );
        });

        it('should return false when getWebStorageItem returns false', () => {
            mockGetWebStorageItem.mockReturnValue(false);

            expect(store.isOrderCheckoutSent).toBe(false);
        });
    });

    describe('sendPersonalizeOrderData', () => {
        const sendPersonalizeOrderData = jest
            .spyOn(sitecoreService, 'sendPersonalizeOrderData')
            .mockImplementation(jest.fn());
        let loggerInfoMock: jest.SpyInstance;

        beforeEach(() => {
            store = new EngageStore(mockRootStore);
            loggerInfoMock = jest.spyOn(logger, 'info').mockResolvedValue(undefined);
        });

        it('should NOT call sitecoreService.sendPersonalizeOrderData when engage is undefined', async () => {
            const engageStore = new EngageStore(mockRootStore);

            jest.spyOn(engageStore, 'engage', 'get').mockReturnValue(undefined);

            await engageStore.sendPersonalizeOrderData();

            expect(sendPersonalizeOrderData).not.toHaveBeenCalled();
        });

        it('should NOT call sitecoreService.sendPersonalizeOrderData when getSettingAsBoolean returns false', async () => {
            store.rootStore.layoutStore.getSettingAsBoolean = jest.fn(() => false);

            await store.sendPersonalizeOrderData();

            expect(sendPersonalizeOrderData).not.toHaveBeenCalled();
        });

        it('should send singular event', () => {
            store.getExperimentsFromStorage = jest.fn(() => [
                getExperimentMock('60b60241-3c24-46dd-988a-5f742593ca59', 'experience-1', 'value-1'),
                getExperimentMock('60b60241-3c24-46dd-988a-5f742593ca59', 'experience-2', 'value-2'),
                getExperimentMock('60b60241-3c24-46dd-988a-5f742593ca59', '', 'value-2'),
                getExperimentMock('60b60241-3c24-46dd-988a-5f742593ca59', 'experience-3', ''),
            ]);

            store.sendPersonalizeOrderData();

            expect(sendPersonalizeOrderData).toHaveBeenCalledWith({
                cardType: 'Mastercard',
                currencyCode: CurrencyCode.GBP,
                orderedAt: '2020-01-01T00:00:00.000Z',
                paymentType: OrderCheckoutPayment.Card,
                price: 100,
                referenceId: 'test-reference',
                status: PURCHASED_STATUS,
                date: '2025-08-07',
                experiences: {
                    'experience-1': 'value-1',
                    'experience-2': 'value-2',
                },
            });

            expect(loggerInfoMock).toHaveBeenNthCalledWith(1, loggerStrings[2]);
            expect(loggerInfoMock).toHaveBeenNthCalledWith(2, loggerStrings[3]);
        });

        it('should send event with empty object when experiments are [', () => {
            store.getExperimentsFromStorage = jest.fn(() => []);

            store.sendPersonalizeOrderData();

            expect(sendPersonalizeOrderData).toHaveBeenCalledWith({
                cardType: 'Mastercard',
                currencyCode: CurrencyCode.GBP,
                orderedAt: '2020-01-01T00:00:00.000Z',
                paymentType: OrderCheckoutPayment.Card,
                price: 100,
                referenceId: 'test-reference',
                status: PURCHASED_STATUS,
                date: '2025-08-07',
                experiences: {},
            });

            expect(loggerInfoMock).toHaveBeenCalledWith('EngageStore sendPersonalizeOrderData experiences: []');
        });
    });

    describe('sendExperimentEvents', () => {
        let loggerInfoMock: jest.SpyInstance;

        beforeEach(() => {
            store = new EngageStore(mockRootStore);
            store.sendEvent = jest.fn();
            loggerInfoMock = jest.spyOn(logger, 'info').mockResolvedValue(undefined);
        });

        it('should NOT call event when engage is undefined', async () => {
            jest.spyOn(store, 'engage', 'get').mockReturnValue(undefined);

            await store.sendExperimentEvents();

            expect(store.sendEvent).not.toHaveBeenCalled();
        });

        it('should NOT call sitecoreService.sendPersonalizeOrderData when getExperimentsFromStorage returns empty array', async () => {
            store.getExperimentsFromStorage = jest.fn(() => []);

            await store.sendExperimentEvents();

            expect(store.sendEvent).not.toHaveBeenCalled();
        });

        it('should send multiple events', async () => {
            store.getExperimentsFromStorage = jest.fn(() => [
                getExperimentMock('60b60241-3c24-46dd-988a-5f742593ca59', 'experiment-1', 'value-1'),
                getExperimentMock('60b60241-3c24-46dd-988a-5f742593ca59', 'experiment-2', 'value-2'),
            ]);

            const { price, ...mockOrderData } = orderData;

            await store.sendExperimentEvents();

            waitFor(() => {
                expect(store.sendEvent).toHaveBeenNthCalledWith(
                    1,
                    'CUSTOM_EVENT_experiment-1',
                    {
                        ...eventData,
                        attributeId: 'value-1',
                    },
                    mockOrderData,
                );

                expect(store.sendEvent).toHaveBeenNthCalledWith(
                    2,
                    'CUSTOM_EVENT_experiment-2',
                    {
                        ...eventData,
                        attributeId: 'value-2',
                    },
                    mockOrderData,
                );
            });

            expect(loggerInfoMock).toHaveBeenNthCalledWith(1, loggerStrings[0]);
            expect(loggerInfoMock).toHaveBeenNthCalledWith(2, loggerStrings[1]);
        });

        it('should NOT log event when logData is null', async () => {
            store['getLogData'] = jest.fn(() => null);

            await store.sendExperimentEvents();

            expect(loggerInfoMock).not.toHaveBeenCalled();
        });
    });

    describe('sendOrderCancelEvent', () => {
        it('should call event with correct data when engage is available', async () => {
            store = new EngageStore(mockRootStore);
            store.sendEvent = jest.fn();
            await store.sendOrderCancelEvent({
                bookingReference: 'TEST123',
                date: '2025-01-15',
                lastName: 'Test',
                package: {} as any,
                paymentInfo: createMockPaymentInfo({
                    currency: CurrencyCode.EUR,
                    totalPrice: 250.75,
                }),
            });

            expect(store.sendEvent).toHaveBeenCalledWith(EventTypes.OrderCancel.toUpperCase(), {
                ...store['engageEventData'],
                pointOfSale: 'default',
                order: {
                    orderedAt: '2025-01-15',
                    referenceId: 'TEST123',
                    status: CANCELLED_STATUS,
                    currencyCode: CurrencyCode.EUR,
                    price: 250.75,
                },
            });
        });
    });

    describe('sendIdentityEvent', () => {
        beforeEach(() => {
            store = new EngageStore(mockRootStore);
            jest.spyOn(store, 'engage', 'get').mockReturnValue({
                event: mockEvent,
                getBrowserId: mockGetBrowserId,
                identity: mockIdentity,
            } as unknown as Engage);
        });

        it('should NOT call getWebStorageItem when engage is undefined', async () => {
            jest.spyOn(store, 'engage', 'get').mockReturnValue(undefined);

            await store.sendIdentityEvent();

            expect(mockGetWebStorageItem).not.toHaveBeenCalled();
        });

        it('should NOT call getWebStorageItem when is trade portal', async () => {
            mockRootStore.layoutStore.isTradePortal = true;

            await store.sendIdentityEvent();

            expect(mockGetWebStorageItem).not.toHaveBeenCalled();
        });

        it('should NOT call identity event when user logged out and identity is saved', async () => {
            mockRootStore.layoutStore.isTradePortal = false;
            mockGetWebStorageItem.mockReturnValueOnce(IdentityRules.BrowserId);

            await store.sendIdentityEvent();

            expect(mockGetWebStorageItem).toHaveBeenCalled();
            expect(mockIdentity).not.toHaveBeenCalled();
        });

        it('should NOT call identity event when NO browser id is present', async () => {
            mockRootStore.layoutStore.isTradePortal = false;
            mockGetBrowserId.mockReturnValueOnce('');
            mockedCookie.mockReturnValueOnce('');
            mockGetWebStorageItem.mockReturnValueOnce(IdentityRules.BrowserId);

            await store.sendIdentityEvent();

            expect(mockGetWebStorageItem).toHaveBeenCalled();
            expect(mockIdentity).not.toHaveBeenCalled();
        });

        it('should call identity event with browser id from engage', async () => {
            mockRootStore.layoutStore.isTradePortal = false;
            mockGetWebStorageItem.mockReturnValueOnce('');

            await store.sendIdentityEvent();

            expect(mockGetWebStorageItem).toHaveBeenCalled();
            expect(mockSetWebStorageItem).toHaveBeenCalledWith(
                WebStorageKeys.UserIdentificationStatus,
                IdentityRules.BrowserId,
            );
            expect(mockIdentity).toHaveBeenCalledWith({
                channel: SitecoreChannel.Desktop,
                currency: CurrencyCode.GBP,
                identifiers: [{ id: '1', provider: IdentityRules.BrowserId }],
                language: 'EN',
                page: 'Test Title',
                pointOfSale: 'default',
            });
        });
    });

    describe('sendPersonalizeEventsAfterSuccessfulPayment', () => {
        beforeEach(() => {
            store = new EngageStore(mockRootStore);
            store.initializeEngage = jest.fn();
            store.ensureIdentified = jest.fn();
            store.sendExperimentEvents = jest.fn();
            store.sendPersonalizeOrderData = jest.fn();
            store.sendOrderCheckoutEvent = jest.fn();
        });

        it('should call initializeEngage when engage is undefined', async () => {
            jest.spyOn(store, 'engage', 'get').mockReturnValue(undefined);

            await store.sendPersonalizeEventsAfterSuccessfulPayment();

            expect(store.initializeEngage).toHaveBeenCalled();
        });

        it('should NOT call initializeEngage when engage is defined', async () => {
            jest.spyOn(store, 'engage', 'get').mockReturnValue({
                event: mockEvent,
                getBrowserId: mockGetBrowserId,
                identity: mockIdentity,
            } as unknown as Engage);

            await store.sendPersonalizeEventsAfterSuccessfulPayment();

            expect(store.initializeEngage).not.toHaveBeenCalled();
        });

        it('should call ensureIdentified, sendExperimentEvents, sendPersonalizeOrderData and sendOrderCheckoutEvent', async () => {
            jest.spyOn(store, 'engage', 'get').mockReturnValue({
                event: mockEvent,
                getBrowserId: mockGetBrowserId,
                identity: mockIdentity,
            } as unknown as Engage);

            await store.sendPersonalizeEventsAfterSuccessfulPayment();

            expect(store.ensureIdentified).toHaveBeenCalled();
            expect(store.sendExperimentEvents).toHaveBeenCalled();
            expect(store.sendPersonalizeOrderData).toHaveBeenCalled();
            expect(store.sendOrderCheckoutEvent).toHaveBeenCalled();
        });
    });

    describe('ensureIdentified', () => {
        beforeEach(() => {
            store = new EngageStore(mockRootStore);
            jest.spyOn(store, 'engage', 'get').mockReturnValue({
                event: mockEvent,
                getBrowserId: mockGetBrowserId,
                identity: mockIdentity,
            } as unknown as Engage);
        });

        it('should return false when engage is undefined', async () => {
            jest.spyOn(store, 'engage', 'get').mockReturnValue(undefined);

            const result = await store.ensureIdentified();

            expect(result).toBe(false);
            expect(mockCallOperationWithTimeout).not.toHaveBeenCalled();
        });

        it('should return false when is trade portal', async () => {
            mockRootStore.layoutStore.isTradePortal = true;

            const result = await store.ensureIdentified();

            expect(result).toBe(false);
            expect(mockCallOperationWithTimeout).not.toHaveBeenCalled();
        });

        it('should return false when no browserId is available', async () => {
            mockRootStore.layoutStore.isTradePortal = false;
            mockGetBrowserId.mockReturnValueOnce('');
            mockedCookie.mockReturnValueOnce('');

            const result = await store.ensureIdentified();

            expect(result).toBe(false);
            expect(mockCallOperationWithTimeout).not.toHaveBeenCalled();
        });

        it('should return true when identity event returns OK status', async () => {
            mockRootStore.layoutStore.isTradePortal = false;
            mockCallOperationWithTimeout.mockResolvedValueOnce({
                ref: 'abc',
                status: 'OK',
                version: '1',
                client_key: 'key',
            });

            const result = await store.ensureIdentified();

            expect(result).toBe(true);
            expect(mockCallOperationWithTimeout).toHaveBeenCalled();
            expect(mockSetWebStorageItem).toHaveBeenCalledWith(
                WebStorageKeys.UserIdentificationStatus,
                IdentityRules.BrowserId,
            );
        });

        it('should return false when identity event returns null (timeout)', async () => {
            mockRootStore.layoutStore.isTradePortal = false;
            mockCallOperationWithTimeout.mockResolvedValueOnce(null);

            const result = await store.ensureIdentified();

            expect(result).toBe(false);
        });

        it('should return false when identity event returns non-OK status', async () => {
            mockRootStore.layoutStore.isTradePortal = false;
            mockCallOperationWithTimeout.mockResolvedValueOnce({
                ref: 'abc',
                status: 'ERROR',
                version: '1',
                client_key: 'key',
            });

            const result = await store.ensureIdentified();

            expect(result).toBe(false);
            expect(mockSetWebStorageItem).not.toHaveBeenCalledWith(
                WebStorageKeys.UserIdentificationStatus,
                IdentityRules.BrowserId,
            );
        });

        it('should send identity event regardless of existing WebStorage flag', async () => {
            mockRootStore.layoutStore.isTradePortal = false;
            mockGetWebStorageItem.mockReturnValue(IdentityRules.BrowserId);
            mockCallOperationWithTimeout.mockResolvedValueOnce({
                ref: 'abc',
                status: 'OK',
                version: '1',
                client_key: 'key',
            });

            const result = await store.ensureIdentified();

            expect(result).toBe(true);
            expect(mockCallOperationWithTimeout).toHaveBeenCalled();
        });

        it('should return false when callOperationWithTimeout throws', async () => {
            mockRootStore.layoutStore.isTradePortal = false;
            mockCallOperationWithTimeout.mockRejectedValueOnce(new Error('Network error'));

            const result = await store.ensureIdentified();

            expect(result).toBe(false);
        });
    });

    describe('browserId', () => {
        beforeEach(() => {
            store = new EngageStore(mockRootStore);
        });

        it('should return browser ID from engage when available', () => {
            mockedCookie.mockReturnValue('cookie-browser-id-456');
            mockGetBrowserId.mockReturnValueOnce('engage-browser-id-123');

            const result = store['browserId'];

            expect(result).toBe('engage-browser-id-123');
            expect(mockGetBrowserId).toHaveBeenCalled();
        });

        it('should return browser ID from cookie when engage is undefined', () => {
            jest.spyOn(store, 'engage', 'get').mockReturnValue(undefined);
            mockedCookie.mockReturnValue('cookie-browser-id-789');

            const result = store['browserId'];

            expect(result).toBe('cookie-browser-id-789');
            expect(mockedCookie).toHaveBeenCalledWith('EASYJET_ENSIGHTEN_PRIVACY_Performance_and_Personalisation');
        });

        it('should return browser ID from cookie when engage.getBrowserId returns null', () => {
            mockGetBrowserId.mockReturnValueOnce(null);
            mockedCookie.mockReturnValue('cookie-fallback-id');

            const result = store['browserId'];

            expect(result).toBe('cookie-fallback-id');
            expect(mockGetBrowserId).toHaveBeenCalled();
            expect(mockedCookie).toHaveBeenCalledWith('EASYJET_ENSIGHTEN_PRIVACY_Performance_and_Personalisation');
        });

        it('should return browser ID from cookie when engage.getBrowserId returns empty string', () => {
            mockGetBrowserId.mockReturnValueOnce('');
            mockedCookie.mockReturnValue('cookie-empty-string-fallback');

            const result = store['browserId'];

            expect(result).toBe('cookie-empty-string-fallback');
            expect(mockGetBrowserId).toHaveBeenCalled();
            expect(mockedCookie).toHaveBeenCalledWith('EASYJET_ENSIGHTEN_PRIVACY_Performance_and_Personalisation');
        });

        it('should handle when both engage and cookie return falsy values', () => {
            mockGetBrowserId.mockReturnValueOnce(null);
            mockedCookie.mockReturnValue('');

            const result = store['browserId'];

            expect(result).toBe('');
            expect(mockGetBrowserId).toHaveBeenCalled();
            expect(mockedCookie).toHaveBeenCalledWith('EASYJET_ENSIGHTEN_PRIVACY_Performance_and_Personalisation');
        });
    });

    describe('sendImpressionEvent', () => {
        beforeEach(() => {
            store = new EngageStore(mockRootStore);
            store.sendCustomEvent = jest.fn();
            mockRootStore.engageStore = {
                experimentsByUniqueId: {
                    'uid-123': {
                        friendlyId: 'test-friendly-id',
                        selectionAttr: 'test-selection-attr',
                    },
                },
            } as any;
        });

        it('should call sendCustomEvent with derived eventType and campaign data when experiment is found', async () => {
            await store.sendImpressionEvent('campaign-id', 'uid-123', EventTypes.SingleUsePromoCodePopup);

            expect(store.sendCustomEvent).toHaveBeenCalledWith('SINGLE_USE_PROMO_CODE_POPUP_VIEW_TEST-FRIENDLY-ID', {
                campaignId: 'campaign-id',
                selectionAttr: 'test-selection-attr',
            });
        });

        it('should use Default values when experiment is not found by uniqueId', async () => {
            await store.sendImpressionEvent('campaign-id', 'missing-uid', EventTypes.SingleUsePromoCodePopup);

            expect(store.sendCustomEvent).toHaveBeenCalledWith('SINGLE_USE_PROMO_CODE_POPUP_VIEW_DEFAULT', {
                campaignId: 'campaign-id',
                selectionAttr: 'Default',
            });
        });

        it('should construct correct eventType from source and EventTypes.View', async () => {
            mockRootStore.engageStore = {
                experimentsByUniqueId: {
                    'uid-456': {
                        friendlyId: 'hero-banner',
                        selectionAttr: 'attr-value',
                    },
                },
            } as any;

            await store.sendImpressionEvent('camp-id-2', 'uid-456', EventTypes.HeroBannerClick);

            expect(store.sendCustomEvent).toHaveBeenCalledWith('HERO_BANNER_CLICK_VIEW_HERO-BANNER', {
                campaignId: 'camp-id-2',
                selectionAttr: 'attr-value',
            });
        });
    });

    describe('sendClickEvent', () => {
        beforeEach(() => {
            store = new EngageStore(mockRootStore);
            store.sendCustomEvent = jest.fn();
            mockRootStore.engageStore = {
                experimentsByUniqueId: {
                    'uid-789': {
                        friendlyId: 'promo-friendly',
                        selectionAttr: 'promo-selection',
                    },
                },
            } as any;
        });

        it('should call sendCustomEvent with derived eventType and campaign data when experiment is found', async () => {
            mockUpdateWebStorageItem.mockClear();

            await store.sendClickEvent('campaign-id', 'uid-789', EventTypes.ModuleClick, 'promo-friendly');

            expect(store.sendCustomEvent).toHaveBeenCalledWith('MODULE_CLICK_CLICK_PROMO-FRIENDLY', {
                campaignId: 'campaign-id',
                selectionAttr: 'promo-selection',
            });
        });

        it('should use Default values when experiment is not found by uniqueId', async () => {
            mockUpdateWebStorageItem.mockClear();

            await store.sendClickEvent('campaign-id', 'missing-uid', EventTypes.ModuleClick, 'default-friendly');

            expect(store.sendCustomEvent).toHaveBeenCalledWith('MODULE_CLICK_CLICK_DEFAULT', {
                campaignId: 'campaign-id',
                selectionAttr: 'Default',
            });
        });

        it('should update web storage with custom event tracking', async () => {
            mockUpdateWebStorageItem.mockClear();

            await store.sendClickEvent('campaign-id', 'uid-789', EventTypes.ModuleClick, 'promo-friendly');

            expect(mockUpdateWebStorageItem).toHaveBeenLastCalledWith(
                WebStorageKeys.EngagePromocodeEvents,
                { 'CUSTOM_EVENT_MODULE_CLICK_CLICK_PROMO-FRIENDLY': 'promo-friendly' },
                sessionStorage,
            );
        });

        it('should construct correct eventType with EventTypes.Click', async () => {
            mockRootStore.engageStore = {
                experimentsByUniqueId: {
                    'uid-999': {
                        friendlyId: 'variant-a',
                        selectionAttr: 'selection-a',
                    },
                },
            } as any;
            mockUpdateWebStorageItem.mockClear();

            await store.sendClickEvent('camp-id-3', 'uid-999', EventTypes.CTAClick, 'variant-a');

            expect(store.sendCustomEvent).toHaveBeenCalledWith('CTA_CLICK_TYPE_PAGE_CLICK_VARIANT-A', {
                campaignId: 'camp-id-3',
                selectionAttr: 'selection-a',
            });
        });
    });
});
