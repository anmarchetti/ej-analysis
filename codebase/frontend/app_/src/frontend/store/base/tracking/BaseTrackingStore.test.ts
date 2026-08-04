import type { DecisionListenerPayload } from '@optimizely/optimizely-sdk';
import { waitFor } from '@testing-library/dom';
import { toJS } from 'mobx';

import { CurrencyCode } from 'code/currency';
import { mockBooking } from 'frontend/__mocks__';
import { altOffers } from 'frontend/__mocks__/altOffer';
import { luggageInfoMock } from 'frontend/__mocks__/extraLuggage';
import { availableFilters } from 'frontend/__mocks__/filters';
import { mockFlightsRoutes } from 'frontend/__mocks__/flights';
import { holidayThemeMock } from 'frontend/__mocks__/holidayTheme';
import { mockHotel } from 'frontend/__mocks__/hotel';
import { mockedOffer } from 'frontend/__mocks__/offer';
import { mockedSeatsFromWidget } from 'frontend/__mocks__/seats';
import {
    bd4SortTracking,
    featuredHotelsMock,
    mockedBooking,
    mockedLateRoomCheckout,
    mockedLuggageTrackingProductItems,
    mockedNewSeatSelection,
    mockedPaymentInfo,
    mockedPrevSeatSelection,
    mockedTimestamp,
    mockedTransfer,
} from 'frontend/__mocks__/tracking';
import { mockedTransport } from 'frontend/__mocks__/transport';
import * as carouselUtils from 'frontend/hooks/useCarouselTracking/useCarouselTracking.utils';
import { logger } from 'frontend/services/logging';
import { BaseTrackingStore } from 'frontend/store/base/tracking/BaseTrackingStore';
import * as cookiesUtils from 'frontend/utils/cookies.utils';
import { getCreditPaidAmount } from 'frontend/utils/payment.utls';
import { getSelectedSeatsFromWidgetData } from 'frontend/utils/seatMap.utils';
import { rum } from 'frontend/utils/splunk';
import { mockSitecoreField, mockSitecoreLinkField } from 'frontend/utils/tests.utils';
import { isAnalyticsDisabled } from 'frontend/utils/tracking/isAnalyticsDisabled';
import { createShortlistViewProduct } from 'frontend/utils/tracking/shortlist.utils';
import { NO_FLEXIBILITY } from 'frontend/utils/tracking/tracking.utils';
import { createProduct } from 'frontend/utils/tracking/trackOffer.utils';
import { getWebStorageItem, removeWebStorageItem, setWebStorageItem } from 'frontend/utils/webStorage.utils';
import { IAirportParking } from 'models/data/externalExtras/IAirportParking';
import { IFeePerPerson } from 'models/data/IAmendBookingFlights';
import { IBd4Tracking } from 'models/data/IBd4Tracking';
import { IDestinationCountry } from 'models/data/IDestinationCountries';
import { IOffer } from 'models/data/IOffer';
import { ISelectedSeat } from 'models/data/ISeatMapStore';
import { ICoreParams } from 'models/data/tracking/ICoreParams';
import { IEcommercePurchase, TEnhancedEcommerce } from 'models/data/tracking/IEcommerceObject';
import { ICustomParams, IEventParams } from 'models/data/tracking/IEventWithParams';
import { IPageLoadObject } from 'models/data/tracking/IPageLoadObject';
import { IBaseHolidayProduct } from 'models/data/tracking/IProduct';
import { ApiErrors } from 'models/enum/ApiErrors';
import { Bd4TravelPlacementId } from 'models/enum/Bd4TravelListId';
import { DataStatus } from 'models/enum/DataStatus';
import { FilterGroupCodes } from 'models/enum/FilterGroupCodes';
import { NavigationActionMode } from 'models/enum/NavigationActionMode';
import { OfferPromotionCodes } from 'models/enum/OfferPromotionCodes';
import { PromoBlocksThemes } from 'models/enum/PromoBlocksThemes';
import { SeatMapFlightDirection } from 'models/enum/SeatMapFlightDirection';
import { SeatType } from 'models/enum/SeatType';
import SitecoreTemplateId from 'models/enum/SitecoreTemplateId';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import {
    BrandValues,
    EventActions,
    EventCategories,
    EventLabels,
    GENERIC_CUSTOM_PARAMS_EMPTY,
    PersonalizationNames,
} from 'models/enum/tracking/GenericEventParams';
import { GenericValue } from 'models/enum/tracking/GenericValues';
import PageLoadCategory from 'models/enum/tracking/PageLoadCategory';
import { ProductCategories, ProductIds } from 'models/enum/tracking/ProductCategories';
import { RecommenderMedium } from 'models/enum/tracking/RecommenderMedium';
import { WebStorageKeys } from 'models/enum/WebStorageKeys';
import { RoomAllocation } from 'models/RoomAllocation';
import {
    validationErrorOnBlurMock,
    validationErrorOnTypeMock,
} from 'frontend/components/renderings/PromocodeInput/__mocks__/promocodeInput.mocks';

import { SitecoreChannel } from './sitecore/constants';
import { IContentOrder } from './sitecore/EngageStore';
import { BaseTrackingSearchPodStore } from './BaseTrackingStore.searchPod';

class ConcreteTrackingStore extends BaseTrackingStore {
    buildSearchDetailObject = jest.fn();
}

let mockGetPassengerConfig = 'A: 2, C: 1, I: 1';
const mockGetNumberOfRooms = 3;
jest.mock('frontend/utils/tracking/tracking.utils', () => ({
    ...jest.requireActual('frontend/utils/tracking/tracking.utils'),
    getScreenSize: jest.fn(() => 'Screen'),
    getTimestamp: jest.fn(() => mockedTimestamp),
    shouldTrackPurchase: jest.fn(() => true),
    getDepartureAirportsNames: jest.fn().mockReturnValue('DFG'),
    getOffersDestinationAirportsNames: jest.fn().mockReturnValue('Belfast City'),
    getOffersDestinationAirportsCodes: jest.fn().mockReturnValue('SRT'),
    getDestinationNames: jest.fn().mockReturnValue('Hungary'),
    getDestinationCodes: jest.fn().mockReturnValue('HRY'),
    getFirstPositionOnPage: jest.fn().mockReturnValue(6),
    getChildrenAge: jest.fn().mockReturnValue(5),
    getPassengerConfig: jest.fn(() => mockGetPassengerConfig),
    getNumberOfRooms: jest.fn(() => mockGetNumberOfRooms),
}));

const mockShortlistViewProduct = {};
const mockShortlistProduct = {};
jest.mock('frontend/utils/tracking/shortlist.utils', () => ({
    createShortlistViewProduct: jest.fn(() => mockShortlistViewProduct),
}));

jest.mock('frontend/utils/tracking/trackOffer.utils.ts', () => ({
    createProduct: jest.fn(() => mockShortlistProduct),
}));

jest.mock('frontend/services/logging', () => ({
    logger: {
        info: jest.fn(),
    },
}));

jest.mock('frontend/utils/splunk', () => ({
    rum: {
        trackPageView: jest.fn(),
    },
}));

const splunkRumEnabledState = { value: true };
jest.mock('code/env', () => {
    const actual = jest.requireActual<typeof import('code/env')>('code/env');

    return {
        ...actual,
        envPublic: Object.defineProperty({ ...actual.envPublic }, 'SPLUNK_RUM_ENABLED', {
            get: () => splunkRumEnabledState.value,
            configurable: true,
            enumerable: true,
        }),
    };
});

jest.mock('frontend/utils/tracking/isAnalyticsDisabled', () => ({
    isAnalyticsDisabled: jest.fn(() => false),
}));

jest.mock('frontend/utils/webStorage.utils', () => ({
    __esModule: true,
    setWebStorageItem: jest.fn(),
    getWebStorageItem: jest.fn(),
    removeWebStorageItem: jest.fn(),
}));

jest.mock('frontend/utils/date.utils', () => ({
    ...jest.requireActual('frontend/utils/date.utils'),
    formatDateL10n: jest.fn(date => date),
    getDaysDifference: jest.fn().mockReturnValue(4),
    getDaysDifferenceRoundedFloor: jest.fn(() => -1323),
}));

let mockSeatsUrgencyMessage: string | null;
let mockCabinBagsUrgencyMessage: string | null;
let mockRoomsUrgencyMessage: string;

jest.mock('frontend/utils/urgencyMessage.utils', () => ({
    __esModule: true,
    getCabinBagsUrgencyMessage: () => mockCabinBagsUrgencyMessage,
    getRoomsUrgencyMessage: () => mockRoomsUrgencyMessage,
    getSeatsUrgencyMessage: () => mockSeatsUrgencyMessage,
}));

jest.mock('frontend/utils/destinations.utils', () => ({
    getParentDestinationByCode: jest.fn().mockReturnValue({ code: 'IT' } as IDestinationCountry),
    getDestinationHierarchy: jest.fn().mockReturnValue({
        Country: 'Italy',
        Region: null,
        Resort: null,
    }),
}));

const mockGetFilterSelectionTrackingName = jest.fn();
jest.mock('frontend/utils/tracking/filters.utils', () => ({
    getFilterSelectionTrackingName: (...args) => mockGetFilterSelectionTrackingName(...args),
}));

const createRootStore = () => ({
    appStore: { isScreenExtraSmall: false },
    layoutStore: {
        lang: 'en',
        pageTitle: 'Book Hotel Details',
        layoutId: 'id',
        sitePath: 'https://www.easyjet.com/en/holidays',
        getPhrase: jest.fn(p => p),
        SEAccommodationNoticePeriod: 8,
        getSetting: jest.fn(() => 10),
        templateId: undefined as string | undefined,
    },
    marketStore: { currency: CurrencyCode.GBP },
    viewBookingStore: {
        isLoading: false,
        viewBookingPayload: {
            amendPaymentPayload: { selectedFlight: { promoCodeBreakDown: {} } },
        },
    },
    promoPageStore: {
        getSeasonName: jest.fn(),
    },
    bookingStore: {
        totalPrice: 1000,
        currency: 'GBP',
        isValidatingPackage: false,
        isPackageValid: true,
        fetchOffer: jest.fn(),
        extraLuggage: {
            extraLuggagePriceTotal: 0,
            getLargeCabinBagsPriceByRoute: jest.fn(() => 15),
            isLCBGreenPromoShown: false,
            isHBGreenPromoShown: false,
        },
        promoCode: { promocodeValidationErrors: [] },
        isEnoughTimeForAddSETransfer: false,
        isLoadingBookingConfirmationInfo: false,
        bookingInfoPayload: {
            paymentType: 'ApplePay',
            cardType: 'Mastercard',
        },
        outboundFlight: mockFlightsRoutes[0],
    },
    searchStore: {
        originsWithName: [],
        searchFrom: {
            origins: [],
            selectedOrigins: [],
        },
        searchTo: {
            selectedDestinations: [],
            selectedDestinationCodes: [],
            isLoadingDestinations: false,
            countriesWithRegions: [],
        },
        searchWhen: {
            flexDays: 0,
            isFlexible: false,
            hasCheapestMonthLoaded: true,
        },
        searchWho: {
            roomsAllocation: [new RoomAllocation()],
            adultsQuantity: 2,
            childrenQuantity: 1,
            infantsQuantity: 1,
        },
        take: 10,
        page: 1,
    },
    searchFiltersStore: {
        filters: availableFilters,
    },
    hotelsStore: { offers: [], minPrice: 33, maxPrice: 21 },
    seatMapStore: {
        currency: CurrencyCode.GBP,
        selectedSeatsPrice: 0,
        getFlightAircraftType: jest.fn().mockReturnValue({ name: 'plane' }),
        validatedSelectedSeats: mockedNewSeatSelection,
    },
    userStore: { isLoggedIn: false },
    metadataStore: { metaPageTitle: 'metaPageTitle' },
    amendPaymentStore: {},
    flightsPassengersStore: { LCBCount: 2 },
    engageStore: {
        experimentsByUniqueId: {
            testUniqueId: {
                friendlyId: 'friendlyId',
                selectionAttr: 'selectionAttr',
            },
        },
        sendCustomEvent: jest.fn(),
    },
    routerStore: {
        getMicroAppPage: jest.fn(),
    },
    queryParamsStore: {
        isMap: false,
    },
});

let mockRootStore: any;

Object.defineProperties(window, {
    dataLayer: { value: [], writable: true },
    location: { value: { href: 'URL', origin: 'ENV' } },
});

jest.mock('frontend/utils/seatMap.utils', () => ({
    __esModule: true,
    getSelectedSeatsFromWidgetData: jest.fn().mockReturnValue([{ test: 'processed' }]),
}));

jest.mock('frontend/utils/payment.utls', () => ({
    __esModule: true,
    getCreditPaidAmount: jest.fn().mockReturnValue(27),
    getTotalPaidAmount: jest.fn().mockReturnValue(1000),
}));

const mockGetDefaultGalleryMediaContent = jest
    .spyOn(carouselUtils, 'getDefaultGalleryMediaContent')
    .mockReturnValue('test');

const mockedBookingIdDimension = { dimension173: 'bookingID' };

describe('BaseTrackingStore', () => {
    beforeEach(() => {
        mockRootStore = createRootStore() as any;
        dataLayer = [];
        mockGetPassengerConfig = 'A: 2, C: 1, I: 1';

        mockSeatsUrgencyMessage = null;
        mockCabinBagsUrgencyMessage = null;
        mockRoomsUrgencyMessage = '';
    });

    describe('trackRumPageView', () => {
        let store: BaseTrackingStore;
        let trackPageViewMock: jest.Mock;

        beforeEach(() => {
            trackPageViewMock = jest.mocked(rum.trackPageView);
            trackPageViewMock.mockClear();
            splunkRumEnabledState.value = true;
            jest.mocked(isAnalyticsDisabled).mockReturnValue(false);
            store = new ConcreteTrackingStore(mockRootStore);
        });

        it.each<[string, string | undefined]>([
            ['HomePage', SitecoreTemplateId.HomePage],
            ['SearchResultsPage', SitecoreTemplateId.SearchResultsPage],
            ['NotFoundPage', SitecoreTemplateId.NotFoundPage],
            ['undefined', undefined],
        ])('should forward layoutStore.templateId to trackPageView (%s)', (_label, templateId) => {
            mockRootStore.layoutStore.templateId = templateId;

            store.trackRumPageView();

            expect(trackPageViewMock).toHaveBeenCalledTimes(1);
            expect(trackPageViewMock).toHaveBeenCalledWith(templateId);
        });

        it('should not call trackPageView when isAnalyticsDisabled returns true', () => {
            jest.mocked(isAnalyticsDisabled).mockReturnValue(true);
            mockRootStore.layoutStore.templateId = SitecoreTemplateId.HomePage;

            store.trackRumPageView();

            expect(trackPageViewMock).not.toHaveBeenCalled();
        });

        it('should not call trackPageView when SPLUNK_RUM_ENABLED is false', () => {
            splunkRumEnabledState.value = false;
            mockRootStore.layoutStore.templateId = SitecoreTemplateId.HomePage;

            store.trackRumPageView();

            expect(trackPageViewMock).not.toHaveBeenCalled();
        });
    });

    describe('trackManageHubClick', () => {
        let store: BaseTrackingStore;

        beforeEach(() => {
            store = new ConcreteTrackingStore(mockRootStore);
        });

        it('should intercept window.fetch', async () => {
            const mockFetch = jest.fn().mockResolvedValue({});

            Object.defineProperties(window, {
                fetch: {
                    writable: true,
                    value: mockFetch,
                },
            });

            store.trackManageHubClick();

            window.fetch('/google-analytics.com/g/collect', {
                cache: 'no-store',
                credentials: 'include',
                keepalive: true,
                method: 'POST',
                mode: 'no-cors',
                redirect: 'follow',
            });

            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledWith('/google-analytics.com/g/collect', {
                    cache: 'no-store',
                    credentials: 'include',
                    keepalive: true,
                    method: 'POST',
                    mode: 'no-cors',
                    redirect: 'follow',
                });
                expect(window.fetch).toBe(mockFetch);
            });
        });

        it('should call trackEventWithParams with params', () => {
            store.rootStore.routerStore.getMicroAppPage = jest.fn(() => 'microApp');
            store.trackEventWithParams = jest.fn();
            store.generateGenericValuesWithGuests = jest.fn(() => ({
                genericValue3: `A:1`,
                genericValue4: 'bookingId',
                genericValue1: null,
                genericValue2: null,
                destinationUrl: 'destinationUrl',
            }));

            store.trackManageHubClick();

            expect(store.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                {
                    eventCategory: EventCategories.Holidays,
                    eventType: EventTypes.Interaction,
                    eventAction: EventActions.ViewBooking,
                    eventLabel: EventLabels.ManageHoliday,
                },
                {
                    genericValue3: 'A:1',
                    genericValue4: 'bookingId',
                    genericValue1: null,
                    genericValue2: null,
                    destinationUrl: 'destinationUrl',
                },
            );
        });
    });

    it('should add BaseTrackingSearchPodStore instance to searchPod property during initialization', () => {
        const store = new ConcreteTrackingStore(mockRootStore);
        expect(store.searchPod instanceof BaseTrackingSearchPodStore).toBe(true);
    });

    describe('pageMeta', () => {
        it('should return appropriate data', () => {
            const store = new ConcreteTrackingStore(mockRootStore);
            store.pageName = 'pageName';
            store.pageTitle = 'pageTitle';

            expect(store.pageMeta).toStrictEqual({
                pageCategory: '',
                pageLoadLayoutId: '',
                pageName: 'pageName',
                pageTitle: 'pageTitle',
            });
        });
    });

    describe('bookingId', () => {
        it('Should return bookingID from viewBookingStore', () => {
            mockRootStore.viewBookingStore.booking = mockBooking;
            const store = new ConcreteTrackingStore(mockRootStore);

            expect(store.bookingId).toBe('bookingReference');
        });

        it('Should return bookingID from amendPaymentPayload', () => {
            mockRootStore.amendPaymentStore = {
                amendPaymentPayload: { bookingReference: 'bookingReferenceFromPayload' },
            };
            const store = new ConcreteTrackingStore(mockRootStore);

            expect(store.bookingId).toBe('bookingReferenceFromPayload');
        });
    });

    describe('getBookingHolidayDetails', () => {
        it('should return correct booking details object', () => {
            const booking = {
                hotel: {
                    code: 'MAAG0002',
                },
                package: {
                    transport: mockedTransport,
                    accom: {
                        isExt: false,
                        endDate: '2023-03-24',
                        startDate: '2023-03-17',
                        code: '1234',
                        hotel: mockHotel,
                        rooms: [
                            {
                                code: 'FM01',
                            },
                        ],
                    },
                },
                guests: [
                    {
                        type: 'ADULT',
                    },
                    {
                        type: 'CHILD',
                        age: 7,
                    },
                    {
                        type: 'INFANT',
                    },
                    {
                        type: 'INFANT',
                    },
                ],
                paymentInfo: {
                    totalPrice: 1000,
                },
                seatSelection: [
                    { seats: [{ price: 30 }, { price: 30 }, { price: 30 }] },
                    { seats: [{ price: 20 }, { price: 20 }, { price: 20 }] },
                ],
                extraLuggageInfo: { items: [{ price: 78 }] },
                prom: 'EUBO',
            } as any;

            const store = new ConcreteTrackingStore(mockRootStore);

            expect(store.getBookingHolidayDetails(booking)).toEqual({
                id: '1234',
                hotel: mockHotel,
                rooms: booking.package.accom.rooms,
                adults: 1,
                children: 1,
                infants: 2,
                childrenAge: '7',
                pricePP: 386,
                totalPrice: 1000,
                theme: mockHotel.theme,
                type: mockHotel.type,
                prom: booking.prom,
                outboundInfo: mockedTransport.routes[0],
                inboundInfo: mockedTransport.routes[1],
                stay: 4,
                isExt: booking.package.accom.isExt,
                hasDistressedSeats: false,
                freeNightsIncluded: 0,
                currencyCode: CurrencyCode.GBP,
            });
        });
    });

    describe('getOfferHolidayDetails', () => {
        it('should return correct holiday details object', () => {
            const store = new ConcreteTrackingStore(mockRootStore);

            expect(store.getOfferHolidayDetails(mockedOffer)).toEqual({
                id: 'X9017210',
                hotel: mockHotel,
                rooms: mockedOffer.accom.unit,
                adults: 2,
                children: 2,
                infants: 0,
                childrenAge: 5,
                pricePP: 250,
                totalPrice: 1000,
                theme: mockedOffer.accom.theme,
                prom: mockedOffer.accom.prom,
                outboundInfo: mockedTransport.routes[0],
                inboundInfo: mockedTransport.routes[1],
                stay: 7,
                isExt: mockedOffer.accom.isExt,
                hasDistressedSeats: false,
                freeNightsIncluded: 0,
                currencyCode: CurrencyCode.GBP,
                isSponsored: undefined,
                type: mockedOffer.accom.type,
            });
        });

        it('should return pricePP without bags when they selected', () => {
            mockRootStore.bookingStore.extraLuggage.extraLuggagePriceTotal = 96;

            const store = new ConcreteTrackingStore(mockRootStore);
            const details = store.getOfferHolidayDetails(mockedOffer);

            expect(details.pricePP).toEqual(226);
        });

        it('should return pricePP without airport parking when it is selected', () => {
            mockRootStore.airportParkingStore = {
                selectedAirportParking: {
                    bookingDetails: {
                        totalPrice: 100,
                    },
                },
            };

            const store = new ConcreteTrackingStore(mockRootStore);
            const details = store.getOfferHolidayDetails(mockedOffer);

            expect(details.pricePP).toEqual(225);
        });
    });

    describe('buildFeesAnalyticProduct', () => {
        const store = new ConcreteTrackingStore(mockRootStore);
        const mockFees: IFeePerPerson = {
            feesCount: 2,
            feesPerPersonAmount: 25,
        };

        it('should return fee product', () => {
            const result = store.buildFeesAnalyticProduct(mockFees);

            expect(result).toStrictEqual({
                dimension108: EventTypes.Purchase,
                category: 'Fees',
                name: 'Change Fee',
                id: 'Fees',
                price: mockFees.feesPerPersonAmount,
                quantity: mockFees.feesCount,
            });
        });
    });

    describe('buildBagsBookingFlowProducts', () => {
        const mockedBaseHoliday = { id: 'XXX234' } as any;

        it('should return empty array when no luggage passed', () => {
            const store = new ConcreteTrackingStore(mockRootStore);

            const products = store.buildBagsBookingFlowProducts(mockedTransport.routes, [], mockedBaseHoliday, false);

            expect(products).toEqual([]);
        });

        it('should return products array when luggage passed', () => {
            const store = new ConcreteTrackingStore(mockRootStore);

            const products = store.buildBagsBookingFlowProducts(
                mockedTransport.routes,
                mockedLuggageTrackingProductItems,
                mockedBaseHoliday,
                false,
            );

            expect(products).toEqual([
                expect.objectContaining({
                    category: 'Bags: Outbound',
                    id: 'Hold Baggage 15kg_XXX234',
                    name: 'Hold Baggage 15kg',
                    price: 39.99,
                    quantity: 2,
                    dimension181: 'plane',
                    dimension182: 'flight-1|flight-2',
                    dimension77: 'Direct',
                }),
                expect.objectContaining({
                    category: 'Bags: Inbound',
                    id: 'Hold Baggage 15kg_XXX234',
                    name: 'Hold Baggage 15kg',
                    price: 39.99,
                    quantity: 2,
                    dimension181: 'plane',
                    dimension182: 'flight-1|flight-2',
                    dimension77: 'Direct',
                }),
                expect.objectContaining({
                    category: 'Bags: Outbound',
                    id: 'Bicycle_XXX234',
                    name: 'Bicycle',
                    price: 45,
                    quantity: 2,
                    dimension181: 'plane',
                    dimension182: 'flight-1|flight-2',
                    dimension77: 'Direct',
                }),
                expect.objectContaining({
                    category: 'Bags: Inbound',
                    id: 'Bicycle_XXX234',
                    name: 'Bicycle',
                    price: 45,
                    quantity: 2,
                    dimension181: 'plane',
                    dimension182: 'flight-1|flight-2',
                    dimension77: 'Direct',
                }),
            ]);
        });
    });

    describe('buildLCBProduct', () => {
        const mockedBaseHoliday = {
            id: 'XXX234',
            dimension17: 'dimension17',
            dimension137: 'dimension137',
            dimension23: 'dimension23',
            dimension47: 'dimension47',
            dimension50: 'dimension50',
        } as any as IBaseHolidayProduct;

        beforeEach(() => {
            mockRootStore.bookingStore.selectedOffer = mockedOffer;
        });

        it('should return null when NO extraLuggage exists', () => {
            mockRootStore.bookingStore.extraLuggage = null;

            const store = new ConcreteTrackingStore(mockRootStore);

            expect(store.buildLCBProduct(EventTypes.AddToBasket, mockedBaseHoliday, true, 3, false)).toEqual(null);
        });

        it('should return product for outbound when isOutbound === true', () => {
            const store = new ConcreteTrackingStore(mockRootStore);

            const product = store.buildLCBProduct(EventTypes.AddToBasket, mockedBaseHoliday, true, 3, false);

            expect(mockRootStore.bookingStore.extraLuggage.getLargeCabinBagsPriceByRoute).toHaveBeenCalledWith(true);
            expect(product).toEqual({
                dimension108: EventTypes.AddToBasket,
                category: 'Large Cabin Bag: Outbound',
                id: 'LCBSingle',
                name: 'Large Cabin Bag',
                price: 15,
                quantity: 3,
                dimension17: 'dimension17',
                dimension18: 'London Gatwick',
                dimension19: 'LGW',
                dimension20: 'Tenerife Airport',
                dimension21: 'TFS',
                dimension35: '2020-09-12T07:25:00+00:00',
                dimension36: '2020-09-12T07:25:00+00:00',
                dimension37: 'S20',
                dimension38: '2020-09-12T07:25:00+00:00',
                dimension40: -1323,
                dimension83: 'flight-1',
                dimension89: 'null',
            });
        });

        it('should return product for inbound when isOutbound === false', () => {
            const store = new ConcreteTrackingStore(mockRootStore);

            const product = store.buildLCBProduct(EventTypes.AddToBasket, mockedBaseHoliday, false, 3, false);

            expect(mockRootStore.bookingStore.extraLuggage.getLargeCabinBagsPriceByRoute).toHaveBeenCalledWith(false);
            expect(product).toEqual({
                dimension108: EventTypes.AddToBasket,
                category: 'Large Cabin Bag: Inbound',
                id: 'LCBSingle',
                name: 'Large Cabin Bag',
                price: 15,
                quantity: 3,
                dimension137: 'dimension137',
                dimension18: 'Tenerife Airport',
                dimension19: 'TFS',
                dimension20: 'London Gatwick',
                dimension21: 'LGW',
                dimension35: '2020-09-19T19:10:00+00:00',
                dimension36: '2020-09-19T19:10:00+00:00',
                dimension37: 'S20',
                dimension38: '2020-09-19T19:10:00+00:00',
                dimension40: -1323,
                dimension83: 'flight-2',
                dimension89: 'null',
            });
        });

        it('should return product for remove event when eventType === RemoveFromBasket', () => {
            const store = new ConcreteTrackingStore(mockRootStore);

            const product = store.buildLCBProduct(EventTypes.RemoveFromBasket, mockedBaseHoliday, true, 3, false);

            expect(product?.dimension108).toEqual(EventTypes.RemoveFromBasket);
            expect(product?.id).toEqual(ProductIds.LargeCabinBagsSingle);
        });

        it('should return product for remove all event when eventType === RemoveFromBasket AND isRemoveAllLCB === true', () => {
            const store = new ConcreteTrackingStore(mockRootStore);

            const product = store.buildLCBProduct(EventTypes.RemoveFromBasket, mockedBaseHoliday, true, 3, true);

            expect(product?.dimension108).toEqual(EventTypes.RemoveFromBasket);
            expect(product?.id).toEqual(ProductIds.LargeCabinBagsAll);
        });

        it('should return correct product when eventType === Guest for inbound route', () => {
            mockRootStore.bookingStore.booking = mockedBooking;

            const store = new ConcreteTrackingStore(mockRootStore);

            const product = store.buildLCBProduct(
                EventTypes.Guest,
                mockedBaseHoliday,
                false,
                3,
                true,
                mockedBookingIdDimension,
            );

            expect(product).toEqual({
                dimension108: EventTypes.Guest,
                category: 'Large Cabin Bag: Inbound',
                id: 'LCBAll',
                name: 'Large Cabin Bag',
                price: 15,
                quantity: 3,
                coupon: '',
                dimension23: '',
                dimension47: 'dimension47',
                dimension50: 'dimension50',
                dimension85: 'TFS|LGW',
                dimension173: 'bookingID',
                dimension35: '2020-09-19T19:10:00+00:00',
                dimension37: 'S20',
                dimension38: '2020-09-19T19:10:00+00:00',
                dimension89: 'null',
            });
        });

        it('should return correct product when eventType === Booking for outbound route', () => {
            mockRootStore.bookingStore.booking = mockedBooking;

            const store = new ConcreteTrackingStore(mockRootStore);

            const product = store.buildLCBProduct(
                EventTypes.Booking,
                mockedBaseHoliday,
                true,
                3,
                true,
                mockedBookingIdDimension,
            );

            expect(product).toEqual({
                dimension108: EventTypes.Booking,
                category: 'Large Cabin Bag: Outbound',
                id: 'LCBAll',
                name: 'Large Cabin Bag',
                price: 15,
                quantity: 3,
                coupon: '',
                dimension23: 'dimension23',
                dimension47: 'dimension47',
                dimension50: 'dimension50',
                dimension85: 'LGW|TFS',
                dimension173: 'bookingID',
                dimension35: '2020-09-12T07:25:00+00:00',
                dimension37: 'S20',
                dimension38: '2020-09-12T07:25:00+00:00',
                dimension89: 'null',
            });
        });

        describe('urgency message dimensions', () => {
            it.each([
                [EventTypes.AddToBasket, true],
                [EventTypes.AddToBasket, false],
                [EventTypes.RemoveFromBasket, true],
                [EventTypes.RemoveFromBasket, false],
                [EventTypes.AddLCBForAllPassengers, true],
                [EventTypes.AddLCBForAllPassengers, false],
                [EventTypes.Guest, true],
                [EventTypes.Guest, false],
                [EventTypes.Booking, true],
                [EventTypes.Booking, false],
            ])(
                'should build correctly the urgency message dimension when there IS a large cabin bag urgency message displayed',
                (
                    eventType:
                        | EventTypes.AddToBasket
                        | EventTypes.RemoveFromBasket
                        | EventTypes.AddLCBForAllPassengers
                        | EventTypes.Guest
                        | EventTypes.Booking,
                    isOutbound: boolean,
                ) => {
                    const store = new ConcreteTrackingStore(mockRootStore);
                    mockCabinBagsUrgencyMessage = 'test cabin bags urgency message';

                    const res = store.buildLCBProduct(eventType, mockedBaseHoliday, isOutbound, 3, false, undefined);

                    expect(res!['dimension89']).toEqual(mockCabinBagsUrgencyMessage);
                },
            );

            it.each([
                [EventTypes.AddToBasket, true],
                [EventTypes.AddToBasket, false],
                [EventTypes.RemoveFromBasket, true],
                [EventTypes.RemoveFromBasket, false],
                [EventTypes.AddLCBForAllPassengers, true],
                [EventTypes.AddLCBForAllPassengers, false],
                [EventTypes.Guest, true],
                [EventTypes.Guest, false],
                [EventTypes.Booking, true],
                [EventTypes.Booking, false],
            ])(
                'should build correctly the urgency message dimension when there is NOT a large cabin bag urgency message displayed',
                (
                    eventType:
                        | EventTypes.AddToBasket
                        | EventTypes.RemoveFromBasket
                        | EventTypes.AddLCBForAllPassengers
                        | EventTypes.Guest
                        | EventTypes.Booking,
                    isOutbound: boolean,
                ) => {
                    const store = new ConcreteTrackingStore(mockRootStore);

                    const res = store.buildLCBProduct(eventType, mockedBaseHoliday, isOutbound, 3, false, undefined);

                    expect(res!['dimension89']).toEqual('null');
                },
            );
        });
    });

    describe('buildLCBProducts', () => {
        const mockedBaseHoliday = {
            id: 'XXX234',
            dimension17: 'dimension17',
            dimension137: 'dimension137',
        } as IBaseHolidayProduct;

        it('should return product for remove all event when eventType === RemoveFromBasket AND isRemoveAllLCB === true', () => {
            const store = new ConcreteTrackingStore(mockRootStore);

            store.buildLCBProduct = jest.fn().mockReturnValue('lcb product');

            store.buildLCBProducts(EventTypes.RemoveFromBasket, mockedBaseHoliday, 3, true, mockedBookingIdDimension);

            expect(store.buildLCBProduct).toHaveBeenNthCalledWith(
                1,
                EventTypes.RemoveFromBasket,
                mockedBaseHoliday,
                true,
                3,
                true,
                mockedBookingIdDimension,
            );
            expect(store.buildLCBProduct).toHaveBeenNthCalledWith(
                2,
                EventTypes.RemoveFromBasket,
                mockedBaseHoliday,
                false,
                3,
                true,
                mockedBookingIdDimension,
            );
        });
    });

    describe('buildAllSeatsProducts', () => {
        it('should add dimension89 with the seats urgency message if the message was displayed', () => {
            const store = new ConcreteTrackingStore(mockRootStore);
            const [outboundInfo, inboundInfo] = mockedOffer.transport.routes;
            const selectedSeats = toJS(mockRootStore.seatMapStore.validatedSelectedSeats);
            const mockedBaseHoliday = {
                id: 'XXX234',
                dimension17: 'dimension17',
                dimension137: 'dimension137',
            } as IBaseHolidayProduct;
            mockSeatsUrgencyMessage = 'test urgency message';

            const res = store.buildAllSeatsProducts(
                EventTypes.PostBookingConfirmationBasket,
                selectedSeats,
                outboundInfo,
                inboundInfo,
                mockedBaseHoliday,
            );

            res.forEach(r => expect(r!['dimension89']).toEqual(mockSeatsUrgencyMessage));
        });

        it('should add dimension89 with null if the message was NOT displayed', () => {
            const store = new ConcreteTrackingStore(mockRootStore);
            const [outboundInfo, inboundInfo] = mockedOffer.transport.routes;
            const selectedSeats = toJS(mockRootStore.seatMapStore.validatedSelectedSeats);
            const mockedBaseHoliday = {
                id: 'XXX234',
                dimension17: 'dimension17',
                dimension137: 'dimension137',
            } as IBaseHolidayProduct;
            mockSeatsUrgencyMessage = 'null';

            const res = store.buildAllSeatsProducts(
                EventTypes.PostBookingConfirmationBasket,
                selectedSeats,
                outboundInfo,
                inboundInfo,
                mockedBaseHoliday,
            );

            res.forEach(r => expect(r!['dimension89']).toEqual(mockSeatsUrgencyMessage));
        });
    });

    describe('on post booking flow', () => {
        const [outboundInfo, inboundInfo] = mockedTransport.routes;
        const mockedBaseHoliday = { coupon: 'coupon' };
        const mockedSeats = 'ISeatsProduct[]';
        const mockedEvent = EventTypes.PostBookingSeatOutBasket;
        const mockedAmendmentCharges = 64;

        const mockStoreMethods = store => {
            store.buildBaseHolidayProduct = jest.fn().mockReturnValue(mockedBaseHoliday);
            store.buildAllSeatsProducts = jest.fn().mockReturnValue(mockedSeats);
            store.buildFlightSeatsProducts = jest.fn().mockReturnValue(mockedSeats);
            store.addToDataLayer = jest.fn();
        };

        beforeEach(() => {
            mockRootStore.layoutStore.isViewBookingPage = true;
            mockRootStore.viewBookingStore.booking = mockedBooking;
        });

        describe('buildSeatsPostBookingFlowProducts', () => {
            const flightNumber = '2025';
            const extraLegroomPrice = 40.99;
            const standardPrice = 7.99;
            const upFrontPrice = 22;
            const flightSeats = {
                seats: [
                    {
                        paxIndex: 1,
                        seatNumber: '13D',
                        priceBand: SeatType.ExtraLegroom,
                        price: extraLegroomPrice,
                        products: [],
                    },
                    {
                        paxIndex: 2,
                        seatNumber: '13E',
                        priceBand: SeatType.ExtraLegroom,
                        price: extraLegroomPrice,
                        products: [],
                    },
                    {
                        paxIndex: 3,
                        seatNumber: '14D',
                        priceBand: SeatType.RearStandard,
                        price: standardPrice,
                        products: [],
                    },
                    {
                        paxIndex: 4,
                        seatNumber: '14E',
                        priceBand: SeatType.RearStandard,
                        price: standardPrice,
                        products: [],
                    },
                    {
                        paxIndex: 5,
                        seatNumber: '14A',
                        priceBand: 'Up front',
                        price: upFrontPrice,
                        products: [],
                    },
                ],
                sectorId: '1',
                flightNumber: '2025',
                isSeatReservationPossible: true,
            } as ISelectedSeat;
            const direction = 'Outbound';
            const baseHoliday = {} as IBaseHolidayProduct;
            const aircraftTypeName = 'test';

            beforeEach(() => {
                mockRootStore.viewBookingStore.viewBookingPayload.amendPaymentPayload = {
                    selectedSeats: {
                        amendmentCharges: 0,
                        prevSeatSelection: [
                            {
                                seats: [
                                    {
                                        paxIndex: 1,
                                        seatNumber: '17A',
                                        priceBand: SeatType.RearStandard,
                                        price: standardPrice,
                                        products: [],
                                    },
                                    {
                                        paxIndex: 2,
                                        seatNumber: '17B',
                                        priceBand: SeatType.RearStandard,
                                        price: standardPrice,
                                        products: [],
                                    },
                                    {
                                        paxIndex: 3,
                                        seatNumber: '17C',
                                        priceBand: SeatType.RearStandard,
                                        price: standardPrice,
                                        products: [],
                                    },
                                    {
                                        paxIndex: 4,
                                        seatNumber: '17D',
                                        priceBand: SeatType.RearStandard,
                                        price: standardPrice,
                                        products: [],
                                    },
                                    {
                                        paxIndex: 5,
                                        seatNumber: '18D',
                                        priceBand: SeatType.RearStandard,
                                        price: standardPrice,
                                        products: [],
                                    },
                                ],
                                sectorId: '1',
                                flightNumber: '2025',
                                isSeatReservationPossible: true,
                            },
                        ],
                        newSeatSelection: [
                            {
                                flightNumber: '2025',
                                seats: [
                                    {
                                        seatNumber: '13D',
                                        price: 2,
                                    },
                                    {
                                        seatNumber: '13E',
                                        price: 2,
                                    },
                                    {
                                        seatNumber: '14D',
                                        price: 0,
                                    },
                                    {
                                        seatNumber: '14E',
                                        price: 0,
                                    },
                                    {
                                        seatNumber: '14A',
                                        price: 10,
                                    },
                                ],
                            },
                        ],
                    },
                };
            });

            it('should return 3 products when user upgrade 3 seats with 2 different bands and change 2 seats within same price band', () => {
                const store = new ConcreteTrackingStore(mockRootStore);

                const products = store['buildSeatsPostBookingFlowProducts'](
                    flightNumber,
                    flightSeats,
                    direction,
                    baseHoliday,
                    aircraftTypeName,
                    true,
                );

                const upgradedExtraLegRoom = products[0];
                const upgradedUpFront = products[1];
                const changedProducts = products[2];

                expect(products.length).toBe(3);

                expect(upgradedExtraLegRoom.category).toEqual('Seats: Outbound_upgrade_PB');
                expect(upgradedExtraLegRoom.name).toEqual('Extra legroom_upgrade_PB');
                expect(upgradedExtraLegRoom.id).toEqual('13D|13E_upgrade_PB');
                expect(upgradedExtraLegRoom.quantity).toEqual(2);
                expect(upgradedExtraLegRoom.price).toEqual(2);

                expect(upgradedUpFront.category).toEqual('Seats: Outbound_upgrade_PB');
                expect(upgradedUpFront.name).toEqual('Up front_upgrade_PB');
                expect(upgradedUpFront.id).toEqual('14A_upgrade_PB');
                expect(upgradedUpFront.quantity).toEqual(1);
                expect(upgradedUpFront.price).toEqual(10);

                expect(changedProducts.category).toEqual('Seats: Outbound_change_PB');
                expect(changedProducts.name).toEqual('Rear Standard_change_PB');
                expect(changedProducts.id).toEqual('14D|14E_change_PB');
                expect(changedProducts.quantity).toEqual(2);
                expect(changedProducts.price).toEqual(0);
            });

            it('should return price from priceDiff when isAmend false', () => {
                const store = new ConcreteTrackingStore(mockRootStore);

                const products = store['buildSeatsPostBookingFlowProducts'](
                    flightNumber,
                    flightSeats,
                    direction,
                    baseHoliday,
                    aircraftTypeName,
                    false,
                );

                expect(products.length).toBe(3);
                expect(products[0].price).toEqual(extraLegroomPrice - standardPrice);
                expect(products[1].price).toEqual(upFrontPrice - standardPrice);
                expect(products[2].price).toEqual(0);
            });
        });

        describe('trackSeatsAmendment', () => {
            beforeEach(() => {
                mockRootStore.viewBookingStore.isLoading = false;
                mockRootStore.viewBookingStore.viewBookingPayload = {
                    amendPaymentPayload: {
                        selectedSeats: {
                            amendmentCharges: mockedAmendmentCharges,
                            newSeatSelection: mockedNewSeatSelection,
                            prevSeatSelection: mockedPrevSeatSelection,
                        },
                    },
                };
            });

            it('should skip everything when NO booking in viewBookingStore', async () => {
                mockRootStore.viewBookingStore.booking = undefined;

                const store = new ConcreteTrackingStore(mockRootStore);

                mockStoreMethods(store);

                await store.trackSeatsAmendment();

                expect(getCreditPaidAmount).not.toHaveBeenCalled();
                expect(store.buildBaseHolidayProduct).not.toHaveBeenCalled();
                expect(store.buildAllSeatsProducts).not.toHaveBeenCalled();
                expect(store.addToDataLayer).not.toHaveBeenCalled();
            });

            it('should track seat changing when seats successfully amended', async () => {
                const { booking } = mockRootStore.viewBookingStore;

                const store = new ConcreteTrackingStore(mockRootStore);

                mockStoreMethods(store);

                await store.trackSeatsAmendment();

                expect(getCreditPaidAmount).toBeCalledWith(mockedPaymentInfo);
                expect(store.buildBaseHolidayProduct).toBeCalledWith(booking, EventTypes.PostBookingConfirmationBasket);

                expect(store.buildAllSeatsProducts).toBeCalledWith(
                    EventTypes.PostBookingConfirmationBasket,
                    mockedNewSeatSelection,
                    outboundInfo,
                    inboundInfo,
                    mockedBaseHoliday,
                );

                expect(store.addToDataLayer).toBeCalledWith(
                    expect.objectContaining({
                        event: EventTypes.PostBookingConfirmationBasket,
                        ecommerce: expect.objectContaining({
                            purchase: expect.objectContaining({
                                actionField: expect.objectContaining({
                                    event: EventTypes.PostBookingConfirmationBasket,
                                    timestamp: mockedTimestamp,
                                    revenue: mockedAmendmentCharges,
                                    coupon: mockedBaseHoliday.coupon,
                                    metric3: 27,
                                }),
                                products: mockedSeats,
                            }),
                        }),
                    }),
                );
            });
        });

        describe('trackPostBookingSeatsUpdated', () => {
            it('should skip everything when NO booking in viewBookingStore', async () => {
                mockRootStore.viewBookingStore.booking = undefined;

                const store = new ConcreteTrackingStore(mockRootStore);

                mockStoreMethods(store);

                store.trackPostBookingSeatsUpdated(mockedEvent, mockedSeatsFromWidget);

                expect(store.buildBaseHolidayProduct).not.toHaveBeenCalled();
                expect(store.buildAllSeatsProducts).not.toHaveBeenCalled();
                expect(store.addToDataLayer).not.toHaveBeenCalled();
            });

            it('should track seat changing on switch seatMapTabs', () => {
                mockRootStore.viewBookingStore.booking.seatSelection = mockedPrevSeatSelection;

                const store = new ConcreteTrackingStore(mockRootStore);

                mockStoreMethods(store);

                store.trackPostBookingSeatsUpdated(mockedEvent, mockedSeatsFromWidget);

                expect(store.buildBaseHolidayProduct).toHaveBeenCalledWith(
                    mockRootStore.viewBookingStore.booking,
                    mockedEvent,
                );

                expect(getSelectedSeatsFromWidgetData).toHaveBeenCalledWith(mockedSeatsFromWidget, true);

                expect(store.buildFlightSeatsProducts).toHaveBeenCalledWith(
                    EventTypes.PostBookingSeatOutBasket,
                    [{ test: 'processed' }],
                    outboundInfo,
                    mockedBaseHoliday,
                    false,
                    mockedPrevSeatSelection,
                );

                expect(store.addToDataLayer).toHaveBeenCalledWith({
                    event: mockedEvent,
                    dimension136: '',
                    ecommerce: {
                        detail: { products: mockedSeats },
                        impressions: [],
                    },
                });
            });
        });
    });

    describe('trackTransferChange', () => {
        it('should track transfer changes', () => {
            mockRootStore.bookingStore.selectedOffer = { ...mockedOffer };
            mockRootStore.bookingStore.transfer = { ...mockedTransfer };

            const store = new ConcreteTrackingStore(mockRootStore);

            store.buildBaseHolidayProduct = jest.fn().mockReturnValue({ currencyCode: CurrencyCode.GBP });
            store.buildTransferProduct = jest.fn().mockReturnValue('transfer product');
            store.addToDataLayer = jest.fn();

            store.trackTransferChange(mockedTransfer, EventTypes.AddToBasket);

            expect(store.addToDataLayer).toHaveBeenCalledWith({
                event: EventTypes.AddToBasket,
                ecommerce: {
                    currencyCode: CurrencyCode.GBP,
                    add: {
                        product: 'transfer product',
                    },
                },
            });
        });
    });

    describe('trackLCBChange', () => {
        const mockedBaseHoliday = { currencyCode: CurrencyCode.GBP };
        const mockStoreMethods = store => {
            store.pageName = 'pageName';
            store.buildBaseHolidayProduct = jest.fn().mockReturnValue(mockedBaseHoliday);
            store.buildLCBProducts = jest.fn().mockReturnValue(['lcb product', 'lcb product']);
            store.addToDataLayer = jest.fn();
        };

        it('should track add large cabin bag', () => {
            mockRootStore.bookingStore.selectedOffer = { ...mockedOffer };

            const store = new ConcreteTrackingStore(mockRootStore);

            mockStoreMethods(store);

            store.trackLCBChange(EventTypes.AddToBasket, 5, false);

            expect(store.buildBaseHolidayProduct).toHaveBeenCalledWith(mockedOffer, EventTypes.AddToBasket);
            expect(store.buildLCBProducts).toHaveBeenCalledWith(EventTypes.AddToBasket, mockedBaseHoliday, 5, false);
            expect(store.addToDataLayer).toHaveBeenCalledWith({
                event: EventTypes.AddToBasket,
                dimension136: 'pageName',
                dimension173: null,
                ecommerce: {
                    currencyCode: CurrencyCode.GBP,
                    add: {
                        products: ['lcb product', 'lcb product'],
                    },
                },
            });
        });

        it('should track remove large cabin bag', () => {
            mockRootStore.bookingStore.selectedOffer = { ...mockedOffer };

            const store = new ConcreteTrackingStore(mockRootStore);

            mockStoreMethods(store);

            store.trackLCBChange(EventTypes.RemoveFromBasket, 6, false);

            expect(store.buildBaseHolidayProduct).toHaveBeenCalledWith(mockedOffer, EventTypes.RemoveFromBasket);
            expect(store.buildLCBProducts).toHaveBeenCalledWith(
                EventTypes.RemoveFromBasket,
                mockedBaseHoliday,
                6,
                false,
            );
            expect(store.addToDataLayer).toHaveBeenCalledWith({
                event: EventTypes.RemoveFromBasket,
                dimension136: 'pageName',
                dimension173: null,
                ecommerce: {
                    currencyCode: CurrencyCode.GBP,
                    remove: {
                        products: ['lcb product', 'lcb product'],
                    },
                },
            });
        });

        it('should track add all LCB', () => {
            mockRootStore.bookingStore.selectedOffer = { ...mockedOffer };

            const store = new ConcreteTrackingStore(mockRootStore);

            mockStoreMethods(store);

            store.trackLCBChange(EventTypes.AddLCBForAllPassengers, 7, false);

            expect(store.buildBaseHolidayProduct).toHaveBeenCalledWith(mockedOffer, EventTypes.AddLCBForAllPassengers);
            expect(store.buildLCBProducts).toHaveBeenCalledWith(
                EventTypes.AddLCBForAllPassengers,
                mockedBaseHoliday,
                7,
                false,
            );
            expect(store.addToDataLayer).toHaveBeenCalledWith({
                event: EventTypes.AddLCBForAllPassengers,
                dimension136: 'pageName',
                dimension173: null,
                ecommerce: {
                    currencyCode: CurrencyCode.GBP,
                    add: {
                        products: ['lcb product', 'lcb product'],
                    },
                },
            });
        });

        it('should track remove all lcb', () => {
            mockRootStore.bookingStore.selectedOffer = { ...mockedOffer };

            const store = new ConcreteTrackingStore(mockRootStore);

            mockStoreMethods(store);

            store.trackLCBChange(EventTypes.RemoveFromBasket, 7, true);

            expect(store.buildBaseHolidayProduct).toHaveBeenCalledWith(mockedOffer, EventTypes.RemoveFromBasket);
            expect(store.buildLCBProducts).toHaveBeenCalledWith(
                EventTypes.RemoveFromBasket,
                mockedBaseHoliday,
                7,
                true,
            );
            expect(store.addToDataLayer).toHaveBeenCalledWith({
                event: EventTypes.RemoveFromBasket,
                dimension136: 'metaPageTitle|EN',
                dimension173: null,
                ecommerce: {
                    currencyCode: CurrencyCode.GBP,
                    remove: {
                        products: ['lcb product', 'lcb product'],
                    },
                },
            });
        });
    });

    describe('trackBookingAlterationDrawerPageLoad', () => {
        it('should call initializePageLoadObject with the new page params', async () => {
            const store = new ConcreteTrackingStore(mockRootStore);
            store.initializePageLoadObject = jest.fn();

            await store.trackBookingAlterationDrawerPageLoad(true);

            expect(store.initializePageLoadObject).toBeCalledWith({
                category: PageLoadCategory.Book,
                currencyCode: undefined,
                title: 'Board and Room - Book Hotel Details',
                url: 'https://www.easyjet.com/en/holidays/board-and-room',
            });
        });

        it('should add pageload to the dataLayer', async () => {
            const store = new ConcreteTrackingStore(mockRootStore);

            store.addToDataLayer = jest.fn();
            jest.spyOn(store, 'defaultGalleryMedia', 'get').mockReturnValue('test');

            await store.trackBookingAlterationDrawerPageLoad(true);

            expect(store.addToDataLayer).toHaveBeenCalledWith({
                channel: SitecoreChannel.Desktop,
                currencyCode: CurrencyCode.GBP,
                dimension1: '',
                dimension10: '',
                dimension11: '',
                dimension12: '',
                dimension13: '2020-20-02',
                dimension2: 'Website',
                dimension3: 'Package',
                dimension4: 'ENV',
                dimension5: 'v1.0.0',
                dimension6: 'EN',
                dimension7: 'https://www.easyjet.com/en/holidays/board-and-room',
                dimension8: 'Landscape',
                dimension9: 'Screen',
                dimension92: 'No',
                dimension88: 'test',
                dimension95: '',
                event: EventTypes.PageLoad,
                pageCategory: PageLoadCategory.Book,
                pageName: 'Board and Room - Book Hotel Details|EN',
                pageReferral: '',
                pageTitle: 'Board and Room - Book Hotel Details',
                atcomGrouping: null,
                atcomPromoCode: null,
                placeholders: null,
            });
        });

        it('should call initializePageLoadObject with the old page params', async () => {
            const store = new ConcreteTrackingStore(mockRootStore);
            store.initializePageLoadObject = jest.fn();

            await store.trackBookingAlterationDrawerPageLoad(false);

            expect(store.initializePageLoadObject).toBeCalledWith(undefined);
        });

        it('should NOT add pageload to the dataLayer', async () => {
            const store = new ConcreteTrackingStore(mockRootStore);

            await store.trackBookingAlterationDrawerPageLoad(false);
            expect(dataLayer).toHaveLength(0);
        });
    });

    describe('initializePageLoadObject', () => {
        let store;

        beforeEach(() => {
            store = new ConcreteTrackingStore(mockRootStore);
        });

        it('should correctly initialize the pageLoadObject', async () => {
            jest.spyOn(store, 'defaultGalleryMedia', 'get').mockReturnValue('test');

            await store.initializePageLoadObject();

            expect(store.pageLoadObject).toEqual({
                channel: SitecoreChannel.Desktop,
                currencyCode: CurrencyCode.GBP,
                dimension1: '',
                dimension10: '',
                dimension11: '',
                dimension12: '',
                dimension13: '2020-20-02',
                dimension2: 'Website',
                dimension3: 'Package',
                dimension4: 'ENV',
                dimension5: 'v1.0.0',
                dimension6: 'EN',
                dimension7: 'URL',
                dimension8: 'Landscape',
                dimension9: 'Screen',
                dimension92: 'No',
                dimension88: 'test',
                dimension95: '',
                event: 'pageload',
                pageCategory: '',
                pageName: 'metaPageTitle|EN',
                pageReferral: '',
                pageTitle: 'metaPageTitle',
                atcomGrouping: null,
                atcomPromoCode: null,
                placeholders: null,
            });
        });

        it('should correctly initialize the pageLoadObject for Post-Booking', async () => {
            mockRootStore.viewBookingStore.booking = mockedBooking;
            await store.initializePageLoadObject({ category: PageLoadCategory.PostBooking });

            expect(store.pageLoadObject).toEqual(
                expect.objectContaining({
                    pageCategory: 'Post-Booking',
                    customParams: {
                        genericValue1: null,
                        genericValue2: null,
                        genericValue3: null,
                        genericValue4: null,
                    },
                    dimension126: 'On Holiday',
                }),
            );
        });

        it('should set hotelId for view booking page', async () => {
            mockRootStore.layoutStore.isViewBookingPage = true;
            mockRootStore.viewBookingStore.booking = {
                ...mockedBooking,
                hotel: {
                    code: 'HOTEL-123',
                },
            };

            await store.initializePageLoadObject();

            expect(store.pageLoadObject).toEqual(
                expect.objectContaining({
                    id: mockedBooking.bookingReference,
                    revenue: mockedPaymentInfo.totalPrice,
                    dimension98: mockedPaymentInfo.balanceDueAmount,
                    dimension99: 20,
                    hotelId: 'HOTEL-123',
                }),
            );
        });

        it('should set hotelId for confirmation page', async () => {
            mockRootStore.layoutStore.isConfirmationPage = true;
            mockRootStore.bookingStore.isLoadingBookingConfirmationInfo = false;
            mockRootStore.bookingStore.booking = {
                hotel: {
                    code: 'CONF-HOTEL-999',
                },
            };

            await store.initializePageLoadObject();

            expect(store.pageLoadObject).toEqual(
                expect.objectContaining({
                    hotelId: 'CONF-HOTEL-999',
                }),
            );
        });

        it('should add extras page dimensions when isTradePortal is false and isExtrasPage is true', async () => {
            mockRootStore.layoutStore.isExtrasPage = true;
            mockRootStore.layoutStore.isHotelDetailsBookPage = false;
            mockRootStore.layoutStore.isTradePortal = false;
            mockRootStore.bookingStore.selectedOffer = { accom: { prom: '' } };

            const addExtrasPageDimensionsSpy = jest.spyOn(store, 'addExtrasPageDimensions');

            await store.initializePageLoadObject();

            expect(addExtrasPageDimensionsSpy).toHaveBeenCalled();
        });

        it('should add extras page dimensions when isTradePortal is false and isHotelDetailsBookPage is true', async () => {
            mockRootStore.layoutStore.isExtrasPage = false;
            mockRootStore.layoutStore.isHotelDetailsBookPage = true;
            mockRootStore.layoutStore.isTradePortal = false;
            mockRootStore.bookingStore.selectedOffer = { accom: { prom: '' } };

            const addExtrasPageDimensionsSpy = jest.spyOn(store, 'addExtrasPageDimensions');

            await store.initializePageLoadObject();

            expect(addExtrasPageDimensionsSpy).toHaveBeenCalled();
        });

        it('should NOT add extras page dimensions when both isExtrasPage and isHotelDetailsBookPage are false', async () => {
            mockRootStore.layoutStore.isExtrasPage = false;
            mockRootStore.layoutStore.isHotelDetailsBookPage = false;
            mockRootStore.layoutStore.isTradePortal = false;

            const addExtrasPageDimensionsSpy = jest.spyOn(store, 'addExtrasPageDimensions');

            await store.initializePageLoadObject();

            expect(addExtrasPageDimensionsSpy).not.toHaveBeenCalled();
        });

        it('should NOT add extras page dimensions when isTradePortal is true', async () => {
            mockRootStore.layoutStore.isExtrasPage = true;
            mockRootStore.layoutStore.isHotelDetailsBookPage = true;
            mockRootStore.layoutStore.isTradePortal = true;

            const addExtrasPageDimensionsSpy = jest.spyOn(store, 'addExtrasPageDimensions');

            await store.initializePageLoadObject();

            expect(addExtrasPageDimensionsSpy).not.toHaveBeenCalled();
        });
    });

    describe('buildBaseHolidayProduct', () => {
        it('should return object with confirmation params when withConfirmationData flag is true', () => {
            const store = new ConcreteTrackingStore(mockRootStore);

            const baseHolidayProduct = store.buildBaseHolidayProduct(
                mockedBooking,
                EventTypes.PostBookingConfirmationBasket,
                undefined,
                {
                    genericValue1: 'value1',
                    genericValue2: 'value2',
                },
                true,
            );

            expect(baseHolidayProduct).toStrictEqual(
                expect.objectContaining({ dimension81: '', dimension85: 'LGW|TFS' }),
            );
        });

        it('should return object with empty dimension186 when isHotelDetailsBookPage is true and giata code is NOT provided', () => {
            mockRootStore.layoutStore.isHotelDetailsBookPage = true;
            mockedBooking.package.accom.hotel = { ...mockedBooking.package.accom.hotel, giataCode: undefined };
            const store = new ConcreteTrackingStore(mockRootStore);

            const baseHolidayProduct = store.buildBaseHolidayProduct(
                mockedBooking,
                EventTypes.PostBookingConfirmationBasket,
                undefined,
                {
                    genericValue1: 'value1',
                    genericValue2: 'value2',
                },
                true,
            );

            expect(baseHolidayProduct).toStrictEqual(expect.objectContaining({ dimension186: '' }));
        });

        it('should return object with dimension186 when isHotelDetailsBookPage is true', () => {
            mockRootStore.layoutStore.isHotelDetailsBookPage = true;
            mockedBooking.package.accom.hotel = { ...mockedBooking.package.accom.hotel, giataCode: '12345' };
            const store = new ConcreteTrackingStore(mockRootStore);

            const baseHolidayProduct = store.buildBaseHolidayProduct(
                mockedBooking,
                EventTypes.PostBookingConfirmationBasket,
                undefined,
                {
                    genericValue1: 'value1',
                    genericValue2: 'value2',
                },
                true,
            );

            expect(baseHolidayProduct).toStrictEqual(expect.objectContaining({ dimension186: '12345' }));
        });

        it('should return object with dimension186 when isConfirmationPage is true', () => {
            mockRootStore.layoutStore.isConfirmationPage = true;
            mockedBooking.package.accom.hotel = { ...mockedBooking.package.accom.hotel, giataCode: '12345' };
            const store = new ConcreteTrackingStore(mockRootStore);

            const baseHolidayProduct = store.buildBaseHolidayProduct(
                mockedBooking,
                EventTypes.PostBookingConfirmationBasket,
                undefined,
                {
                    genericValue1: 'value1',
                    genericValue2: 'value2',
                },
                true,
            );

            expect(baseHolidayProduct).toStrictEqual(expect.objectContaining({ dimension186: '12345' }));
        });

        it('should accept and return custom params', () => {
            const store = new ConcreteTrackingStore(mockRootStore);

            const booking = {
                ...mockedBooking,
                extraLuggageInfo: { items: [] },
            };

            const baseHoliday = store.buildBaseHolidayProduct(
                booking,
                EventTypes.PostBookingConfirmationBasket,
                undefined,
                {
                    genericValue1: 'value1',
                    genericValue2: 'value2',
                },
            );

            expect(baseHoliday).toEqual(
                expect.objectContaining({
                    genericValue1: 'value1',
                    genericValue2: 'value2',
                    price: 286.67333333333335,
                    variant: 'Beach Getaway EN',
                }),
            );
        });

        it('should provide variant local name as fallback when itemName does not exist', () => {
            const store = new ConcreteTrackingStore(mockRootStore);

            const booking = {
                ...mockedBooking,
                extraLuggageInfo: { items: [] },
            };

            booking.package.accom.hotel.theme.itemName = undefined;

            const baseHoliday = store.buildBaseHolidayProduct(booking, EventTypes.PostBookingConfirmationBasket);

            expect(baseHoliday).toEqual(
                expect.objectContaining({
                    variant: 'Beach Getaway',
                }),
            );
        });

        it('should remove luggage price from total price', () => {
            const store = new ConcreteTrackingStore(mockRootStore);

            const booking = {
                ...mockedBooking,
                extraLuggageInfo: luggageInfoMock,
            };

            const baseHoliday = store.buildBaseHolidayProduct(
                booking,
                EventTypes.PostBookingConfirmationBasket,
                undefined,
            );

            expect(baseHoliday!.price).toEqual(200.00666666666666);
        });

        it('should return base holiday product with right brand  for luxury packages ', () => {
            const store = new ConcreteTrackingStore(mockRootStore);

            const booking = {
                ...mockedBooking,
                promoCollections: [OfferPromotionCodes.Luxury],
            };

            const baseHoliday = store.buildBaseHolidayProduct(
                booking,
                EventTypes.PostBookingConfirmationBasket,
                undefined,
            );

            expect(baseHoliday!.brand).toEqual(BrandValues.LuxuryCollection);
        });

        it('should return base holiday product with variant equal theme of hotel code for NOT luxury packages ', () => {
            const store = new ConcreteTrackingStore(mockRootStore);
            const baseHoliday = store.buildBaseHolidayProduct(
                mockedBooking,
                EventTypes.PostBookingConfirmationBasket,
                undefined,
            );

            expect(baseHoliday!.brand).toEqual(mockedBooking.package.accom.hotel.type.itemName);
        });
    });

    describe('trackSeatsPageLoad', () => {
        describe('on booking flow', () => {
            it('should track seat map popup loading for outbound direction', async () => {
                const store = new ConcreteTrackingStore(mockRootStore);

                store.initializePageLoadObject = jest.fn();
                store.addToDataLayer = jest.fn();

                await store.trackSeatsPageLoad(SeatMapFlightDirection.Outbound);

                expect(store.initializePageLoadObject).toHaveBeenCalledWith({
                    category: PageLoadCategory.Book,
                    title: 'Seats Outbound',
                    url: 'https://www.easyjet.com/en/holidays/booking/seats-outbound',
                    currencyCode: CurrencyCode.GBP,
                });

                expect(store.addToDataLayer).toHaveBeenCalled();
            });

            it('should track seat map popup loading for return direction', async () => {
                const store = new ConcreteTrackingStore(mockRootStore);

                store.initializePageLoadObject = jest.fn();
                store.addToDataLayer = jest.fn();

                await store.trackSeatsPageLoad(SeatMapFlightDirection.Inbound);

                expect(store.initializePageLoadObject).toHaveBeenCalledWith({
                    category: PageLoadCategory.Book,
                    title: 'Seats Return',
                    url: 'https://www.easyjet.com/en/holidays/booking/seats-return',
                    currencyCode: CurrencyCode.GBP,
                });

                expect(store.addToDataLayer).toHaveBeenCalled();
            });
        });

        it('should track seat map popup loading on post booking flow', async () => {
            mockRootStore.layoutStore.isViewBookingPage = true;

            const store = new ConcreteTrackingStore(mockRootStore);

            store.initializePageLoadObject = jest.fn();
            store.addToDataLayer = jest.fn();

            await store.trackSeatsPageLoad(SeatMapFlightDirection.Outbound);

            expect(store.initializePageLoadObject).toHaveBeenCalledWith({
                category: PageLoadCategory.PostBookingAddSeats,
                title: 'Post-Booking:Seats Outbound',
                url: 'https://www.easyjet.com/en/holidays/booking/seats-outbound',
                currencyCode: CurrencyCode.GBP,
            });

            expect(store.addToDataLayer).toHaveBeenCalled();
        });
    });

    describe('trackHoldLuggagePopupLoad', () => {
        it('should track hold luggage popup loading on booking flow', async () => {
            const store = new ConcreteTrackingStore(mockRootStore);

            store.initializePageLoadObject = jest.fn();
            store.addToDataLayer = jest.fn();

            await store.trackHoldLuggagePopupLoad();

            expect(store.initializePageLoadObject).toBeCalledWith({
                category: PageLoadCategory.Book,
                title: 'Bags',
                url: 'https://www.easyjet.com/en/holidays/booking/bags',
            });

            expect(store.addToDataLayer).toHaveBeenCalled();
        });

        it('should track hold luggage popup loading on post booking flow', async () => {
            mockRootStore.layoutStore.isViewBookingPage = true;

            const store = new ConcreteTrackingStore(mockRootStore);

            store.initializePageLoadObject = jest.fn();
            store.addToDataLayer = jest.fn();

            await store.trackHoldLuggagePopupLoad();

            expect(store.initializePageLoadObject).toBeCalledWith({
                category: PageLoadCategory.PostBookingAddBags,
                title: 'Bags',
                url: 'https://www.easyjet.com/en/holidays/booking/bags',
            });

            expect(store.addToDataLayer).toHaveBeenCalled();
        });
    });

    describe('external extras banners', () => {
        it('should track tile impression and call tracking functions on tile impression', () => {
            const store = new ConcreteTrackingStore(mockRootStore);
            store.trackEventWithParams = jest.fn();
            store.rootStore.layoutStore.fullUrl = 'https://www.easyjet.com/en/holidays/booking/my_booking';

            const params = {
                tileTitle: 'title',
                tileIndex: 1,
                destinationUrl: 'https://www.imdb.com/title/tt0149460/',
            };

            store.trackExternalExtrasTileImpression(params.tileTitle, params.tileIndex, params.destinationUrl);

            expect(store.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                {
                    eventCategory: EventCategories.ExternalExtrasModule,
                    eventAction: EventActions.Tile,
                    eventLabel: `Position${params.tileIndex}: ${params.tileTitle}`,
                    eventType: EventTypes.NonInteraction,
                },
                {
                    genericValue1: null,
                    genericValue2: null,
                    genericValue3: null,
                    genericValue4: null,
                    destinationUrl: params.destinationUrl,
                },
            );
        });

        it('should track tile click and call tracking functions on tile click', () => {
            const store = new ConcreteTrackingStore(mockRootStore);
            store.trackEventWithParams = jest.fn();

            const params = {
                tileTitle: 'title',
                tileIndex: 1,
                tilePrice: '2.28',
                destinationUrl: 'https://www.imdb.com/title/tt0149460/',
            };

            store.trackExternalExtrasTileClick(
                params.tileTitle,
                params.tileIndex,
                params.tilePrice,
                params.destinationUrl,
            );

            expect(store.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                {
                    eventCategory: EventCategories.ExternalExtrasModule,
                    eventAction: EventActions.TileClick,
                    eventLabel: params.tileTitle,
                    eventType: EventTypes.Interaction,
                },
                {
                    genericValue1: params.tileIndex.toString(),
                    genericValue2: params.tilePrice,
                    genericValue3: null,
                    genericValue4: null,
                    destinationUrl: params.destinationUrl,
                },
            );
        });

        it('should track view extras show and call tracking functions on click view extras', () => {
            const store = new ConcreteTrackingStore(mockRootStore);
            store.trackEventWithParams = jest.fn();

            store.trackExternalExtrasClickViewExtras();

            expect(store.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                {
                    eventCategory: EventCategories.ExternalExtrasModule,
                    eventAction: EventActions.ModuleClick,
                    eventLabel: 'View Your Extras',
                    eventType: EventTypes.Interaction,
                },
                {
                    genericValue1: null,
                    genericValue2: null,
                    genericValue3: null,
                    genericValue4: null,
                },
            );
        });

        it('should track view extras hide and call tracking functions when click hide extras', () => {
            const store = new ConcreteTrackingStore(mockRootStore);
            store.trackEventWithParams = jest.fn();

            store.trackExternalExtrasClickHide();

            expect(store.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                {
                    eventCategory: EventCategories.ExternalExtrasModule,
                    eventAction: EventActions.ModuleClick,
                    eventLabel: 'Hide',
                    eventType: EventTypes.Interaction,
                },
                {
                    genericValue1: null,
                    genericValue2: null,
                    genericValue3: null,
                    genericValue4: null,
                },
            );
        });
    });

    describe('trackLateCheckoutChange', () => {
        it('should track lateCheckout changes', () => {
            mockRootStore.bookingStore.selectedOffer = { ...mockedOffer };
            mockRootStore.bookingStore.lateRoomCheckout = { ...mockedLateRoomCheckout };

            const store = new ConcreteTrackingStore(mockRootStore);

            store.trackLateCheckoutChange(EventTypes.AddToBasket);

            expect(dataLayer).toHaveLength(1);

            expect(dataLayer[0]).toEqual({
                event: 'addToBasket',
                ecommerce: {
                    currencyCode: 'GBP',
                    add: {
                        product: {
                            brand: 'Resort',
                            category: 'Hotel Extras',
                            currencyCode: 'GBP',
                            dimension108: 'addToBasket',
                            dimension15: 1000,
                            dimension173: 'ABCN0/LCO',
                            dimension23: 'United States',
                            dimension35: '2020-09-12T07:25:00+00:00',
                            dimension37: 'S20',
                            dimension38: '2020-09-12T07:25:00+00:00',
                            dimension47: 7,
                            dimension50: 'A: 2, C: 1, I: 1',
                            dimension85: 'ABCN0/LCO',
                            id: 'lateCheckout',
                            name: 'Late Checkout Room',
                            price: 76,
                            quantity: 1,
                            variant: 'Beach',
                        },
                    },
                },
            });
        });
    });

    describe('trackBookingExtrasUpdate', () => {
        it('should track booking extras update', async () => {
            const store = new ConcreteTrackingStore(mockRootStore);

            store.addBookingFlowPageDimension = jest.fn().mockReturnValue({});
            store.addToDataLayer = jest.fn();

            await store.trackBookingExtrasUpdate(EventTypes.ExtrasSeatUpdate);

            expect(store.addBookingFlowPageDimension).toBeCalledWith(EventTypes.ExtrasSeatUpdate);
            expect(store.addToDataLayer).toBeCalledWith({});
        });
    });

    describe('trackExcursionsAction', () => {
        it('should call trackEventWithParams with correct parameters', () => {
            const excursions = [
                {
                    coverImageUrl: 'test_header.jpeg',
                    description: 'Test desrciption',
                    freeCancellation: true,
                    likelyToSellOut: false,
                    retailPrice: { currency: 'GBP', value: 66 },
                    reviewsAvg: 4.2,
                    reviewsNumber: 14,
                    title: 'Test title',
                    url: 'https://.sbox.musement.com/uk/athens/athens-tour-by-night-590/',
                },
            ] as any;

            const store = new ConcreteTrackingStore(mockRootStore);

            jest.spyOn(store, 'trackEventWithParams');

            store.trackExcursionsAction(
                excursions,
                { eventAction: EventActions.ExcursionsLoaded, eventLabel: '10' },
                { genericValue1: null, genericValue2: null, genericValue3: null },
            );

            expect(store.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                {
                    eventCategory: EventCategories.Excursions,
                    eventType: EventTypes.NonInteraction,
                    eventAction: EventActions.ExcursionsLoaded,
                    eventLabel: '10',
                    eventValue: null,
                },
                {
                    destinationUrl: null,
                    genericValue1: null,
                    genericValue3: null,
                    genericValue2: null,
                    genericValue4: null,
                },
            );
        });
    });

    describe('trackLCBBanners', () => {
        const store = new ConcreteTrackingStore(mockRootStore);
        store.trackEventWithParams = jest.fn();

        it('should call trackEventWithParams with NonInteraction eventType when eventLabel NOT click', () => {
            store.trackLCBBanners(EventLabels.CapacityFull);

            expect(store.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                {
                    eventCategory: EventCategories.Extras,
                    eventType: EventTypes.NonInteraction,
                    eventAction: EventActions.LargeCabinBags,
                    eventLabel: EventLabels.CapacityFull,
                },
                {
                    genericValue1: null,
                    genericValue2: null,
                    genericValue3: null,
                    genericValue4: null,
                    destinationUrl: null,
                },
            );
        });

        it('should call trackEventWithParams with Interaction eventType when eventLabel is click', () => {
            store.trackLCBBanners(EventLabels.CapacityFullClick);

            expect(store.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                {
                    eventCategory: EventCategories.Extras,
                    eventType: EventTypes.Interaction,
                    eventAction: EventActions.LargeCabinBags,
                    eventLabel: EventLabels.CapacityFullClick,
                },
                {
                    genericValue1: null,
                    genericValue2: null,
                    genericValue3: null,
                    genericValue4: null,
                    destinationUrl: null,
                },
            );
        });
    });

    describe('addBookingFlowPageDimension', () => {
        beforeEach(() => {
            setWebStorageItem(WebStorageKeys.SeatTogetherCheckboxDeparture, undefined, sessionStorage);

            setWebStorageItem(WebStorageKeys.SeatTogetherCheckboxReturn, undefined, sessionStorage);
        });

        it('should add booking flow page dimension', async () => {
            mockRootStore.layoutStore.isHotelDetailsBookPage = false;

            const store = new ConcreteTrackingStore(mockRootStore);
            store.pageName = 'guest details page | EN';
            store.pageTitle = 'guest details page';

            const result = await store.addBookingFlowPageDimension(EventTypes.Guest);

            expect(mockRootStore.bookingStore.fetchOffer).toBeCalledWith(undefined, false);
            expect(result).toEqual({
                dimension136: 'guest details page | EN',
                dimension188: 'unchecked',
                ecommerce: { detail: { products: [] } },
                event: EventTypes.Guest,
                pageTitle: 'guest details page',
            });
        });

        describe('with dimension 188', () => {
            const casesForDimension188 = [
                {
                    name: 'should set dimension188 to unavailable when both departure and return sitTogetherCheckbox are unavailable',
                    seatTogetherCheckboxDeparture: 'unavailable',
                    seatTogetherCheckboxReturn: 'unavailable',
                    dimension188: 'unavailable',
                },
                {
                    name: 'should set dimension188 to checked when departure sitTogetherCheckbox is checked',
                    seatTogetherCheckboxDeparture: 'checked',
                    seatTogetherCheckboxReturn: 'unchecked',
                    dimension188: 'checked',
                },
                {
                    name: 'should set dimension188 to checked when return sitTogetherCheckbox is checked',
                    seatTogetherCheckboxDeparture: 'unchecked',
                    seatTogetherCheckboxReturn: 'checked',
                    dimension188: 'checked',
                },
                {
                    name: 'should set dimension188 to checked when departure and return sitTogetherCheckbox are checked',
                    seatTogetherCheckboxDeparture: 'checked',
                    seatTogetherCheckboxReturn: 'checked',
                    dimension188: 'checked',
                },
                {
                    name: 'should set dimension188 to unchecked when departure and return sitTogetherCheckbox are unchecked',
                    seatTogetherCheckboxDeparture: 'unchecked',
                    seatTogetherCheckboxReturn: 'unchecked',
                    dimension188: 'unchecked',
                },
                {
                    name: 'should set dimension188 to unchecked when departure and return sitTogetherCheckbox are undefined',
                    seatTogetherCheckboxDeparture: undefined,
                    seatTogetherCheckboxReturn: undefined,
                    dimension188: 'unchecked',
                },
            ];

            describe('event type ExtrasSeatUpdate', () => {
                it.each(casesForDimension188)(
                    '$name',
                    async ({ seatTogetherCheckboxDeparture, seatTogetherCheckboxReturn, dimension188 }) => {
                        (getWebStorageItem as jest.Mock)
                            .mockReturnValueOnce(seatTogetherCheckboxDeparture)
                            .mockReturnValueOnce(seatTogetherCheckboxReturn);

                        const store = new ConcreteTrackingStore(mockRootStore);
                        store.pageName = 'guest details page | EN';
                        store.pageTitle = 'guest details page';

                        const result = await store.addBookingFlowPageDimension(EventTypes.ExtrasSeatUpdate);

                        expect(result).toEqual({
                            dimension136: 'guest details page | EN',
                            dimension188,
                            ecommerce: { detail: { products: [] } },
                            event: EventTypes.ExtrasSeatUpdate,
                            pageTitle: 'guest details page',
                        });
                    },
                );
            });

            describe('event type Guest', () => {
                it.each(casesForDimension188)(
                    '$name',
                    async ({ seatTogetherCheckboxDeparture, seatTogetherCheckboxReturn, dimension188 }) => {
                        (getWebStorageItem as jest.Mock)
                            .mockReturnValueOnce(seatTogetherCheckboxDeparture)
                            .mockReturnValueOnce(seatTogetherCheckboxReturn);

                        const store = new ConcreteTrackingStore(mockRootStore);
                        store.pageName = 'guest details page | EN';
                        store.pageTitle = 'guest details page';

                        const result = await store.addBookingFlowPageDimension(EventTypes.Guest);

                        expect(result).toEqual({
                            dimension136: 'guest details page | EN',
                            dimension188,
                            ecommerce: { detail: { products: [] } },
                            event: EventTypes.Guest,
                            pageTitle: 'guest details page',
                        });
                    },
                );
            });
        });

        it('should call fetchOffer with proper arguments on hotel details page', async () => {
            mockRootStore.layoutStore.isHotelDetailsBookPage = true;

            const store = new ConcreteTrackingStore(mockRootStore);

            await store.addBookingFlowPageDimension(EventTypes.Ecommerce);

            expect(mockRootStore.bookingStore.fetchOffer).toBeCalledWith(undefined, true);
        });

        it('should add products and impressions on extras page', async () => {
            mockRootStore.layoutStore.isExtrasPage = true;
            mockRootStore.bookingStore.selectedOffer = mockedOffer;
            mockRootStore.searchStore.selectedOfferIndex = 1;
            mockRootStore.bookingStore.extraLuggage.isLCBGreenPromoShown = true;
            mockRootStore.bookingStore.extraLuggage.isHBGreenPromoShown = false;

            const store = new ConcreteTrackingStore(mockRootStore);

            store.pageName = 'extras page | EN';
            store.pageTitle = 'extras page';
            store.buildProducts = jest.fn(() => ['base', 'flight', 'seat', 'bag'] as any);

            const result = await store.addBookingFlowPageDimension(EventTypes.Extras);

            expect(store.buildProducts).toHaveBeenCalledWith(mockedOffer, 1, EventTypes.Extras);
            expect(result).toEqual({
                dimension136: 'extras page | EN',
                ecommerce: {
                    detail: { products: ['base', 'flight', 'seat', 'bag'] },
                    impressions: [],
                },
                dimension101: 'OK',
                event: EventTypes.Extras,
                pageTitle: 'extras page',
                greenPromo: 'LCB:Y|HB:N',
                dimension89: 'null | null | null',
            });
        });
    });

    describe('buildProducts', () => {
        const mockedBaseHoliday = { baseHolidayProduct: 'base' };
        const mockedUrgencyMessage = { urgencyMessage: 'test' };
        const mockedSeats = [{ seatsProduct: 'seats' }];
        const mockedFlights = [{ flightDeparture: 'flightDeparture' }, { flightReturn: 'flightReturn' }];
        const mockedTransfer = { transferProduct: 'transfer' };
        const mockedBags = ['bag1', 'bag2'];
        const mockExtraLuggageProduct = [{ extraLuggageProduct: 'extra luggage' }];
        const mockedCabinBags = ['lcb product', 'lcb product'];
        const basePlusUrgency = { ...mockedBaseHoliday, ...mockedUrgencyMessage };
        const mockedAirportParkingProduct = { variant: 'Parking 1|P001|meet_and_greet' };

        const mockStoreMethods = store => {
            store.buildBaseHolidayProduct = jest.fn().mockReturnValue(mockedBaseHoliday);
            store.buildUrgencyMessagingDimensions = jest.fn().mockReturnValue(mockedUrgencyMessage);
            store.buildAllSeatsProducts = jest.fn().mockReturnValue(mockedSeats);
            store.buildFlightsProducts = jest.fn().mockReturnValue(mockedFlights);
            store.buildTransferProduct = jest.fn().mockReturnValue(mockedTransfer);
            store.buildBagsBookingFlowProducts = jest.fn().mockReturnValue(mockedBags);
            store.buildLCBProducts = jest.fn().mockReturnValue(mockedCabinBags);
            store.buildAirportParkingProduct = jest.fn().mockReturnValue(mockedAirportParkingProduct);
        };

        it('should build products correctly when buildProducts is called', () => {
            const store = new ConcreteTrackingStore(mockRootStore);

            mockStoreMethods(store);

            const res = store.buildProducts(mockedOffer, 0, EventTypes.Ecommerce);

            expect(store.buildTransferProduct).not.toHaveBeenCalled();
            expect(store.buildAirportParkingProduct).not.toHaveBeenCalled();

            expect(res).toEqual([basePlusUrgency, ...mockedFlights, ...mockedSeats]);
        });

        it('should build products correctly when buildProducts is called', () => {
            const store = new ConcreteTrackingStore(mockRootStore);

            mockStoreMethods(store);

            const res = store.buildProducts(mockedOffer, 0, EventTypes.ExtrasSeatUpdate);

            expect(store.buildTransferProduct).not.toHaveBeenCalled();
            expect(store.buildAirportParkingProduct).not.toHaveBeenCalled();

            expect(res).toEqual([basePlusUrgency, ...mockedFlights, ...mockedSeats, ...mockedCabinBags]);
        });

        it('should build products including transfer and seats on Holiday Extras page when buildProducts is called', () => {
            mockRootStore.layoutStore.isExtrasPage = true;
            mockRootStore.bookingStore.isFlightExternal = true;
            mockRootStore.bookingStore.extraLuggage.getExtraLuggageProductsForTracking = jest
                .fn()
                .mockResolvedValue(mockExtraLuggageProduct);

            const store = new ConcreteTrackingStore(mockRootStore);

            mockStoreMethods(store);

            const res = store.buildProducts(mockedOffer, 0, EventTypes.Ecommerce);

            expect(res).toEqual([basePlusUrgency, ...mockedFlights, ...mockedSeats, mockedTransfer, ...mockedBags]);
        });

        describe('urgency message dimensions', () => {
            it.each([EventTypes.ExtrasSeatUpdate, EventTypes.Guest])(
                'should build correctly the urgency message when there is a seats urgency message',
                (
                    eventType:
                        | EventTypes.Ecommerce
                        | EventTypes.Extras
                        | EventTypes.Guest
                        | EventTypes.ExtrasSeatUpdate
                        | EventTypes.ExtrasBagsUpdate
                        | EventTypes.ExternalExtrasUpdate,
                ) => {
                    const store = new ConcreteTrackingStore(mockRootStore);
                    mockSeatsUrgencyMessage = 'test seats urgency message';

                    const res = store.buildProducts(mockedOffer, 0, eventType);

                    expect(
                        res.find(product => product.category === ProductCategories.BaseHoliday)!['dimension89'],
                    ).toEqual(`null | ${mockSeatsUrgencyMessage} | null`);
                    expect(
                        res.find(product => product.category === ProductCategories.FlightDeparture)!['dimension89'],
                    ).toBeUndefined();
                    expect(
                        res.find(product => product.category === ProductCategories.FlightReturn)!['dimension89'],
                    ).toBeUndefined();
                    expect(res.find(product => product.category === 'Seats: Return')!['dimension89']).toEqual(
                        mockSeatsUrgencyMessage,
                    );
                    expect(res.find(product => product.category === 'Seats: Outbound')!['dimension89']).toEqual(
                        mockSeatsUrgencyMessage,
                    );
                },
            );

            it.each([EventTypes.ExtrasSeatUpdate, EventTypes.Guest])(
                'should build correctly the urgency message when there is NOT a seats urgency message',
                (
                    eventType:
                        | EventTypes.Ecommerce
                        | EventTypes.Extras
                        | EventTypes.Guest
                        | EventTypes.ExtrasSeatUpdate
                        | EventTypes.ExtrasBagsUpdate
                        | EventTypes.ExternalExtrasUpdate,
                ) => {
                    const store = new ConcreteTrackingStore(mockRootStore);

                    const res = store.buildProducts(mockedOffer, 0, eventType);

                    expect(
                        res.find(product => product.category === ProductCategories.BaseHoliday)!['dimension89'],
                    ).toEqual('null | null | null');
                    expect(
                        res.find(product => product.category === ProductCategories.FlightDeparture)!['dimension89'],
                    ).toBeUndefined();
                    expect(
                        res.find(product => product.category === ProductCategories.FlightReturn)!['dimension89'],
                    ).toBeUndefined();
                    expect(res.find(product => product.category === 'Seats: Return')!['dimension89']).toEqual('null');
                    expect(res.find(product => product.category === 'Seats: Outbound')!['dimension89']).toEqual('null');
                },
            );

            it.each([EventTypes.ExtrasSeatUpdate, EventTypes.Guest])(
                'should build correctly the urgency message when there are seats from different price bands AND there is a seats urgency message',
                (
                    eventType:
                        | EventTypes.Ecommerce
                        | EventTypes.Extras
                        | EventTypes.Guest
                        | EventTypes.ExtrasSeatUpdate
                        | EventTypes.ExtrasBagsUpdate
                        | EventTypes.ExternalExtrasUpdate,
                ) => {
                    mockRootStore.seatMapStore.validatedSelectedSeats[0].seats[0].priceBand = SeatType.ExtraLegroom;
                    mockRootStore.seatMapStore.validatedSelectedSeats[1].seats[0].priceBand = SeatType.ExtraLegroom;
                    const store = new ConcreteTrackingStore(mockRootStore);
                    mockSeatsUrgencyMessage = 'test seats urgency message';

                    const res = store.buildProducts(mockedOffer, 0, eventType);

                    res.filter(
                        product => product.category === 'Seats: Return' || product.category === 'Seats: Outbound',
                    ).forEach(product => {
                        expect(product['dimension89']).toEqual(mockSeatsUrgencyMessage);
                    });
                },
            );

            it('should NOT build the urgency message in dimension89 when the event is not one of the expected ones', () => {
                const store = new ConcreteTrackingStore(mockRootStore);
                mockSeatsUrgencyMessage = 'test seats urgency message';

                const res = store.buildProducts(mockedOffer, 0, EventTypes.ExternalExtrasUpdate);

                res.filter(product => product.category !== ProductCategories.BaseHoliday).forEach(product => {
                    expect(product['dimension89']).toBeUndefined();
                });
            });
        });

        describe('on Extras page on trade portal', () => {
            beforeEach(() => {
                mockRootStore.layoutStore.isExtrasPage = true;
                mockRootStore.layoutStore.isTradePortal = true;
            });

            it('should add bags products only for external flight', () => {
                mockRootStore.bookingStore.isFlightExternal = true;
                mockRootStore.bookingStore.extraLuggage = {
                    getExtraLuggageProductsForTracking: jest.fn().mockReturnValue([{ title: 'luggage' }]),
                };

                const store = new ConcreteTrackingStore(mockRootStore);
                const baseHoliday = {
                    test: 'test',
                };

                store.buildBaseHolidayProduct = jest.fn().mockReturnValue(baseHoliday);
                store.buildTransferProduct = jest.fn().mockReturnValue({ category: ProductCategories.Transfers });
                store.buildBagsBookingFlowProducts = jest.fn().mockReturnValue({ brand: 'my luggage' });

                const result = store.buildProducts(mockedOffer, 1, EventTypes.Ecommerce);

                expect(store.rootStore.bookingStore.extraLuggage.getExtraLuggageProductsForTracking).toHaveBeenCalled();
                expect(store.buildBagsBookingFlowProducts).toHaveBeenCalledWith(
                    mockedOffer.transport.routes,
                    [{ title: 'luggage' }],
                    {
                        dimension55: '',
                        dimension89: 'null',
                        test: 'test',
                    },
                    mockedOffer.accom.isExt,
                );

                expect(result).toEqual(expect.arrayContaining([{ brand: 'my luggage' }]));
            });

            it('should NOT add bags products when flight is internal', () => {
                mockRootStore.bookingStore.isFlightExternal = false;
                mockRootStore.bookingStore.extraLuggage = {
                    getExtraLuggageProductsForTracking: jest.fn().mockReturnValue([{ title: 'luggage' }]),
                };

                const store = new ConcreteTrackingStore(mockRootStore);
                const baseHoliday = {
                    test: 'test',
                };

                store.buildBaseHolidayProduct = jest.fn().mockReturnValue(baseHoliday);
                store.buildTransferProduct = jest.fn().mockReturnValue({ category: ProductCategories.Transfers });
                store.buildBagsBookingFlowProducts = jest.fn().mockReturnValue({ brand: 'my luggage' });

                store.buildProducts(mockedOffer, 1, EventTypes.Ecommerce);

                expect(
                    store.rootStore.bookingStore.extraLuggage.getExtraLuggageProductsForTracking,
                ).not.toHaveBeenCalled();
                expect(store.buildBagsBookingFlowProducts).not.toHaveBeenCalled();
            });
        });

        it('should add lcb products when EventTypes == Guest', () => {
            const store = new ConcreteTrackingStore(mockRootStore);

            mockStoreMethods(store);

            const result = store.buildProducts(mockedOffer, 0, EventTypes.Guest);

            expect(store.buildLCBProducts).toHaveBeenCalledWith(EventTypes.Guest, basePlusUrgency, 2);
            expect(result).toEqual([basePlusUrgency, ...mockedFlights, ...mockedSeats, ...mockedCabinBags]);
        });

        it('should add lcb products when EventTypes == Extras', () => {
            const store = new ConcreteTrackingStore(mockRootStore);

            mockStoreMethods(store);

            const result = store.buildProducts(mockedOffer, 0, EventTypes.Extras);

            expect(store.buildLCBProducts).toHaveBeenCalledWith(EventTypes.Extras, basePlusUrgency, 2);
            expect(result).toEqual([basePlusUrgency, ...mockedFlights, ...mockedSeats, ...mockedCabinBags]);
        });

        it('should add lcb products when EventTypes == ExtrasSeatUpdate', () => {
            const store = new ConcreteTrackingStore(mockRootStore);
            mockStoreMethods(store);

            const result = store.buildProducts(mockedOffer, 0, EventTypes.ExtrasSeatUpdate);

            expect(store.buildLCBProducts).toHaveBeenCalledWith(EventTypes.ExtrasSeatUpdate, basePlusUrgency, 2);
            expect(result).toEqual([basePlusUrgency, ...mockedFlights, ...mockedSeats, ...mockedCabinBags]);
        });

        it('should add lcb products when EventTypes == ExtrasBagsUpdate', () => {
            const store = new ConcreteTrackingStore(mockRootStore);
            mockStoreMethods(store);

            const result = store.buildProducts(mockedOffer, 0, EventTypes.ExtrasBagsUpdate);

            expect(store.buildLCBProducts).toHaveBeenCalledWith(EventTypes.ExtrasBagsUpdate, basePlusUrgency, 2);
            expect(result).toEqual([basePlusUrgency, ...mockedFlights, ...mockedSeats, ...mockedCabinBags]);
        });

        describe('airport parking product', () => {
            it('should NOT add parking products when store is not holidaysRootStore', () => {
                const store = new ConcreteTrackingStore(mockRootStore);
                store.buildAirportParkingProduct = jest.fn().mockReturnValue(mockedAirportParkingProduct);

                const result = store.buildProducts(mockedOffer, 0, EventTypes.ExternalExtrasUpdate);

                expect(store.buildAirportParkingProduct).not.toHaveBeenCalled();
                expect(result).not.toEqual(expect.arrayContaining([{ variant: 'Parking 1|P001|meet_and_greet' }]));
            });

            it('should NOT add parking products when store is holidaysStore and selectedParking is null', () => {
                mockRootStore.airportParkingStore = {
                    selectedAirportParking: null,
                };

                const store = new ConcreteTrackingStore(mockRootStore);
                store.buildAirportParkingProduct = jest.fn().mockReturnValue(mockedAirportParkingProduct);

                const result = store.buildProducts(mockedOffer, 0, EventTypes.ExternalExtrasUpdate);

                expect(store.buildAirportParkingProduct).not.toHaveBeenCalled();
                expect(result).not.toEqual(expect.arrayContaining([{ variant: 'Parking 1|P001|meet_and_greet' }]));
            });

            it('should add parking products when store is holidaysStore and selectedParking exists', () => {
                const mockedSelectedParking = {
                    title: 'Parking 1',
                    bookingDetails: {
                        productCode: 'P001',
                        totalPrice: 30,
                        type: 'meet_and_greet',
                    },
                };

                const baseHoliday = {
                    test: 'test',
                };

                mockRootStore.airportParkingStore = {
                    selectedAirportParking: mockedSelectedParking,
                };
                const store = new ConcreteTrackingStore(mockRootStore);
                store.buildAirportParkingProduct = jest.fn().mockReturnValue(mockedAirportParkingProduct);
                store.buildBaseHolidayProduct = jest.fn().mockReturnValue(baseHoliday);

                const result = store.buildProducts(mockedOffer, 0, EventTypes.ExternalExtrasUpdate);

                expect(store.buildAirportParkingProduct).toHaveBeenCalledWith(
                    mockedSelectedParking,
                    EventTypes.ExternalExtrasUpdate,
                    {
                        dimension55: '',
                        dimension89: 'null',
                        test: 'test',
                    },
                );
                expect(result).toEqual(expect.arrayContaining([{ variant: 'Parking 1|P001|meet_and_greet' }]));
            });
        });
    });

    describe('getDimension187', () => {
        it('should return null if eventype is not ExtrasSeatUpdate and Guest ', () => {
            const store = new ConcreteTrackingStore(mockRootStore);
            expect(store.getDimension187(EventTypes.ShowDeals, 'unavailable')).toBe(null);
        });

        it('should return null if seatTogetherCheckboxValue is undefined', () => {
            const store = new ConcreteTrackingStore(mockRootStore);
            expect(store.getDimension187(EventTypes.ExtrasSeatUpdate, undefined)).toBe(null);
        });

        it('should return seatTogetherCheckboxValue value', () => {
            const store = new ConcreteTrackingStore(mockRootStore);
            expect(store.getDimension187(EventTypes.ExtrasSeatUpdate, 'checked')).toBe('checked');
            expect(store.getDimension187(EventTypes.ExtrasSeatUpdate, 'unchecked')).toBe('unchecked');
            expect(store.getDimension187(EventTypes.ExtrasSeatUpdate, 'unavailable')).toBe('unavailable');
        });
    });

    describe('clearSitTogetherSessionStorage', () => {
        it('should remove SeatTogetherCheckboxDeparture and SeatTogetherCheckboxReturn session values', () => {
            const store = new ConcreteTrackingStore(mockRootStore);
            store.clearSitTogetherSessionStorage();

            expect(removeWebStorageItem).toHaveBeenCalledWith(WebStorageKeys.SeatTogetherCheckboxDeparture, {});
            expect(removeWebStorageItem).toHaveBeenCalledWith(WebStorageKeys.SeatTogetherCheckboxReturn, {});
        });
    });

    describe('buildUrgencyMessagingDimensions', () => {
        it('should add a cabin bag urgency message in dimension89 when there IS a cabin bags urgency message displayed', () => {
            const store = new ConcreteTrackingStore(mockRootStore);
            mockCabinBagsUrgencyMessage = 'test cabin bags urgency message';

            const res = store.buildUrgencyMessagingDimensions(EventTypes.Booking, mockedOffer.accom.unit);

            expect(res!.dimension89).toEqual(`null | null | ${mockCabinBagsUrgencyMessage}`);
        });

        it('should add a null urgency message in dimension89 when there is NOT a cabin bags urgency message displayed', () => {
            const store = new ConcreteTrackingStore(mockRootStore);

            const res = store.buildUrgencyMessagingDimensions(EventTypes.Guest, mockedOffer.accom.unit);

            expect(res!.dimension89).toEqual('null | null | null');
        });

        it('should add a urgency message for rooms only in dimension 89 when the event type is not one of the expected ones', () => {
            const store = new ConcreteTrackingStore(mockRootStore);

            const res = store.buildUrgencyMessagingDimensions(EventTypes.AmendTransferSelect, mockedOffer.accom.unit);

            expect(res!.dimension89).toEqual('null');
        });
    });

    describe('trackSeatMapTabSwitching', () => {
        it('should NOT track when it is NOT view booking page', () => {
            const store = new ConcreteTrackingStore(mockRootStore);
            store.trackPostBookingSeatsUpdated = jest.fn();

            store.trackSeatMapTabSwitching(NavigationActionMode.ContinueToReturn, mockedSeatsFromWidget, 2, true);

            expect(store.trackPostBookingSeatsUpdated).not.toHaveBeenCalled();
        });

        it('should NOT track when widgetData is undefined', () => {
            mockRootStore.layoutStore.isViewBookingPage = true;

            const store = new ConcreteTrackingStore(mockRootStore);

            store.trackPostBookingSeatsUpdated = jest.fn();

            store.trackSeatMapTabSwitching(NavigationActionMode.ContinueToReturn, undefined, 2, true);

            expect(store.trackPostBookingSeatsUpdated).not.toHaveBeenCalled();
        });

        it('should NOT track when hasSelectionChanged is false', () => {
            mockRootStore.layoutStore.isViewBookingPage = true;

            const store = new ConcreteTrackingStore(mockRootStore);

            store.trackPostBookingSeatsUpdated = jest.fn();

            store.trackSeatMapTabSwitching(NavigationActionMode.ContinueToReturn, mockedSeatsFromWidget, 2, false);

            expect(store.trackPostBookingSeatsUpdated).not.toHaveBeenCalled();
        });

        it('should NOT track when event type is EmptySelection', () => {
            mockRootStore.layoutStore.isViewBookingPage = true;

            const store = new ConcreteTrackingStore(mockRootStore);

            store.trackPostBookingSeatsUpdated = jest.fn();

            store.trackSeatMapTabSwitching(NavigationActionMode.EmptySelection, mockedSeatsFromWidget, 2, false);

            expect(store.trackPostBookingSeatsUpdated).not.toHaveBeenCalled();
        });

        describe('EventTypes.postBookingSeatOutBasket', () => {
            let store;

            beforeEach(() => {
                mockRootStore.layoutStore.isViewBookingPage = true;

                store = new ConcreteTrackingStore(mockRootStore);
            });

            it('should NOT track when it is partial selection', () => {
                const partialSelection = [{ seats: [{}] }, {}];

                store.trackPostBookingSeatsUpdated = jest.fn();

                store.trackSeatMapTabSwitching(
                    NavigationActionMode.ContinueToReturn,
                    partialSelection as ISelectedSeat[],
                    2,
                    true,
                );

                expect(store.trackPostBookingSeatsUpdated).not.toHaveBeenCalled();
            });

            it('should track when we selected new seats on view booking page', () => {
                store.trackPostBookingSeatsUpdated = jest.fn();

                store.trackSeatMapTabSwitching(NavigationActionMode.ContinueToReturn, mockedSeatsFromWidget, 2, true);

                expect(store.trackPostBookingSeatsUpdated).toHaveBeenCalledWith(
                    EventTypes.PostBookingSeatOutBasket,
                    mockedSeatsFromWidget,
                );
            });
        });

        describe('EventTypes.postBookingSeatInBasket', () => {
            let store;

            beforeEach(() => {
                mockRootStore.layoutStore.isViewBookingPage = true;
                store = new ConcreteTrackingStore(mockRootStore);
            });

            it('should NOT track when it is partial selection', () => {
                const partialSelection = [{}, { seats: [{}] }];

                store.trackPostBookingSeatsUpdated = jest.fn();

                store.trackSeatMapTabSwitching(
                    NavigationActionMode.ConfirmSeats,
                    partialSelection as ISelectedSeat[],
                    2,
                    true,
                );

                expect(store.trackPostBookingSeatsUpdated).not.toHaveBeenCalled();
            });

            it('should track when we selected new seats on view booking page', () => {
                store.trackPostBookingSeatsUpdated = jest.fn();

                store.trackSeatMapTabSwitching(NavigationActionMode.ConfirmSeats, mockedSeatsFromWidget, 2, true);

                expect(store.trackPostBookingSeatsUpdated).toHaveBeenCalledWith(
                    EventTypes.PostBookingSeatInBasket,
                    mockedSeatsFromWidget,
                );
            });
        });
    });

    describe('addShortlistData', () => {
        it('should call addToDataLayer with correct data', () => {
            const mockProducts = [
                {
                    id: 'ej:CODE1',
                    dimension126: null,
                    dimension18: null,
                    dimension20: null,
                    dimension35: null,
                    dimension47: 1,
                },
                {
                    id: 'ej:CODE2',
                    dimension126: 9,
                    dimension18: 'dimension18',
                    dimension20: 'dimension20',
                    dimension35: 'dimension35',
                    dimension47: 7,
                },
            ];
            const store = new ConcreteTrackingStore(mockRootStore);
            store.addToDataLayer = jest.fn();
            store.pageName = 'test-name';
            store.addShortlistData(EventTypes.ShortlistAdded, mockProducts);

            expect(store.addToDataLayer).toHaveBeenCalledWith({
                dimension13: mockedTimestamp,
                dimension136: 'test-name',
                event: 'shortlist_added',
                products: mockProducts,
            });
        });
    });

    describe('trackShortlistView', () => {
        it('should call createShortlistViewProducts and addShortlistData', () => {
            const store = new ConcreteTrackingStore(mockRootStore);

            store.addToDataLayer = jest.fn();
            store.pageName = 'test-name';

            store.trackShortlistView([mockedOffer]);

            expect(store.addToDataLayer).toHaveBeenCalledWith({
                event: EventTypes.ShortlistView,
                dimension13: mockedTimestamp,
                dimension136: 'test-name',
                ecommerce: {
                    detail: {
                        impressions: [mockShortlistViewProduct],
                    },
                },
            });
            expect(createShortlistViewProduct).toHaveBeenCalledWith(mockedOffer);
        });
    });

    describe('trackShortlistEvent', () => {
        it('should call addShortlistData with ShortlistAdded when state is true', () => {
            const store = new ConcreteTrackingStore(mockRootStore);
            store.addShortlistData = jest.fn();
            store.trackShortlistEvent(true, []);
            expect(store.addShortlistData).toHaveBeenCalledWith(EventTypes.ShortlistAdded, []);
        });

        it('should call addShortlistData with ShortlistRemoved when state is false', () => {
            const store = new ConcreteTrackingStore(mockRootStore);
            store.addShortlistData = jest.fn();
            store.trackShortlistEvent(false, []);
            expect(store.addShortlistData).toHaveBeenCalledWith(EventTypes.ShortlistRemoved, []);
        });

        it('should call createProduct for each product', () => {
            const mockFlightsOffers = [{ id: 'first' }, { id: 'second' }] as IOffer[];
            const store = new ConcreteTrackingStore(mockRootStore);
            store.addShortlistData = jest.fn();
            store.trackShortlistEvent(false, mockFlightsOffers);
            expect(createProduct).toHaveBeenCalledTimes(2);
            expect(createProduct).toHaveBeenNthCalledWith(1, mockFlightsOffers[0]);
            expect(createProduct).toHaveBeenNthCalledWith(2, mockFlightsOffers[1]);
        });
    });

    describe('trackHotelBrowseEcommerce', () => {
        it('should push ecommerse browse data to analitics', () => {
            mockRootStore.layoutStore.isHotelDetailsBrowsePage = true;
            mockRootStore.layoutStore.layout = {
                sitecore: {
                    context: {
                        parents: [
                            {
                                code: 'ESBABA',
                                name: 'Barcelona City',
                                itemName: 'Barcelona City',
                                type: '{538939B3-07EC-4C23-BF8C-3A68DE0FDC93}',
                            },
                            {
                                code: 'ESBA',
                                name: 'Barcelona',
                                itemName: 'Barcelona',
                                type: '{2F42EC14-7E56-467A-B300-AB9723C74546}',
                            },
                            {
                                code: 'ES',
                                name: 'Spain',
                                itemName: 'Spain',
                                type: '{5F03C6EF-EF52-4F2E-BC5A-B1F065A1E745}',
                            },
                        ],
                        parentPages: [
                            {
                                key: 'Destination Hub',
                                value: '/destinations',
                            },
                            {
                                key: 'Spain',
                                value: '/spain',
                            },
                            {
                                key: 'Barcelona',
                                value: '/spain/barcelona',
                            },
                            {
                                key: 'Barcelona City',
                                value: '/spain/barcelona/barcelona-city',
                            },
                            {
                                key: 'SB Icaria Barcelona',
                                value: '/spain/barcelona/barcelona-city/sb-icaria-barcelona',
                            },
                        ],
                    },
                    route: {
                        name: 'SB Icaria Barcelona-HBG',
                        fields: {
                            Code: mockSitecoreField('X9014935'),
                            Name: mockSitecoreField('SB Icaria Barcelona'),
                        },
                        templateId: '28e5e169-8f72-4f90-a277-280a8302b607',
                    },
                },
            };

            mockRootStore.layoutStore.pageFields = {
                StarRating: mockSitecoreField(5),
                Price: mockSitecoreField(1000),
                GiataCode: mockSitecoreField('123456'),
            };

            const store = new ConcreteTrackingStore(mockRootStore);
            store.addToDataLayer = jest.fn();

            store.trackHotelBrowseEcommerce();

            expect(store.addToDataLayer).toHaveBeenCalledWith({
                dimension136: 'Browse Hotel Details|EN',
                ecommerce: {
                    detail: {
                        products: [
                            {
                                category: 'Base Holiday',
                                currencyCode: 'GBP',
                                dimension108: 'browse_ecommerce',
                                dimension13: '2020-20-02',
                                dimension23: 'Spain',
                                dimension25: 'Barcelona',
                                dimension27: 'Barcelona City',
                                dimension57: 5,
                                dimension72: 1000,
                                dimension186: '123456',
                                id: 'X9014935',
                                name: 'SB Icaria Barcelona',
                            },
                        ],
                    },
                },
                event: 'browse_ecommerce',
                pageTitle: '',
            });
        });

        it('should push ecommerce browse data with empty dimensions when layout and fields are empty', () => {
            mockRootStore.layoutStore.isHotelDetailsBrowsePage = true;
            mockRootStore.layoutStore.pageFields = {};
            mockRootStore.layoutStore.layout = {
                sitecore: {
                    context: {
                        parents: [],
                        parentPages: [],
                    },
                    route: {
                        fields: {},
                    },
                },
            };

            const store = new ConcreteTrackingStore(mockRootStore);
            store.addToDataLayer = jest.fn();

            store.trackHotelBrowseEcommerce();

            expect(store.addToDataLayer).toHaveBeenCalledWith({
                dimension136: 'Browse Hotel Details|EN',
                ecommerce: {
                    detail: {
                        products: [
                            {
                                category: 'Base Holiday',
                                currencyCode: 'GBP',
                                dimension108: 'browse_ecommerce',
                                dimension13: '2020-20-02',
                                dimension23: '',
                                dimension25: '',
                                dimension27: '',
                                dimension57: '',
                                dimension72: '',
                                dimension186: '',
                                id: '',
                                name: '',
                            },
                        ],
                    },
                },
                event: 'browse_ecommerce',
                pageTitle: '',
            });
        });

        it('should NOT call addToDataLayer on not isHotelDetailsBrowsePage', () => {
            mockRootStore.layoutStore.layout = {};
            const store = new ConcreteTrackingStore(mockRootStore);
            store.addToDataLayer = jest.fn();

            store.trackHotelBrowseEcommerce();

            expect(store.addToDataLayer).not.toHaveBeenCalled();
        });

        it('should NOT call addToDataLayer when layout does not exist', () => {
            mockRootStore.layoutStore.isHotelDetailsBrowsePage = true;
            const store = new ConcreteTrackingStore(mockRootStore);
            store.addToDataLayer = jest.fn();

            store.trackHotelBrowseEcommerce();

            expect(store.addToDataLayer).not.toHaveBeenCalled();
        });
    });

    describe('tests with one time store initialization', () => {
        let store;
        const errorMessageMock = 'Incorrect Address, please re-enter';
        const errorTypeMock = 'Form Error: Lead Passenger';
        const feefoNameMock = 'Our customers love us';
        const feefoLinkTextMock = 'Why book with us';
        const altBoardLabelMock = 'See other options';

        beforeEach(() => {
            mockRootStore.layoutStore.sitePath = 'sitePath';
            mockRootStore.layoutStore.pageTitle = 'pageTitle';

            store = new ConcreteTrackingStore(mockRootStore);
            store.addToDataLayer = jest.fn();
            store.trackEventWithParams = jest.fn();
        });

        describe('trackCustomerFeedback', () => {
            it('should track feefo view', () => {
                store.trackCustomerFeedback(feefoNameMock);

                expect(store.trackEventWithParams).toHaveBeenCalledWith(
                    EventTypes.FeefoFeedbackViewed,
                    {
                        cta: undefined,
                        destination: '',
                        name: feefoNameMock,
                    },
                    {},
                    true,
                );
            });

            it('should track feefo interaction', () => {
                store.trackCustomerFeedback(
                    feefoNameMock,
                    mockSitecoreField(mockSitecoreLinkField('they-eat-our-dogs', feefoLinkTextMock)),
                );

                expect(store.trackEventWithParams).toHaveBeenCalledWith(
                    EventTypes.FeefoFeedbackInteracted,
                    {
                        cta: feefoLinkTextMock,
                        destination: 'sitePaththey-eat-our-dogs',
                        name: feefoNameMock,
                    },
                    {},
                    true,
                );
            });
        });

        describe('trackOpenBoardsPopup', () => {
            it('should track click on see options button', () => {
                store.pageTitle = 'pageTitle from tracking store';

                store.trackOpenBoardsPopup(mockedOffer, altBoardLabelMock);

                expect(store.trackEventWithParams).toHaveBeenCalledWith(
                    EventTypes.GenericEvent,
                    {
                        eventAction: EventActions.SeeOptions,
                        eventCategory: EventCategories.BoardOptions,
                        eventLabel: altBoardLabelMock,
                        eventType: EventTypes.Interaction,
                        eventValue: null,
                    },
                    {
                        destinationUrl: 'pageTitle from tracking store',
                        genericValue1: 'Hotel Example',
                        genericValue2: 'Bed and Breakfast',
                        genericValue3: null,
                        genericValue4: null,
                    },
                );
            });
        });

        describe('trackSelectAltBoard', () => {
            it('should track click on select other board option', () => {
                store.trackSelectAltBoard('All inclusive', EventActions.Select, {});

                expect(store.trackEventWithParams).toHaveBeenCalledWith(
                    EventTypes.GenericEvent,
                    {
                        eventAction: EventActions.Select,
                        eventCategory: EventCategories.BoardOptions,
                        eventLabel: 'All inclusive',
                        eventType: EventTypes.Interaction,
                        eventValue: null,
                    },
                    {},
                );
            });

            it('should send BOARD_BASIS_CARD_SELECT engage event when selecting with a boardCode', () => {
                mockRootStore.engageStore.sendCustomEvent = jest.fn();
                store.trackSelectAltBoard('All Inclusive', EventActions.Select, {}, 'AI');

                expect(mockRootStore.engageStore.sendCustomEvent).toHaveBeenCalledWith('BOARD_BASIS_CARD_SELECT', {
                    boardBasis: 'allInclusive',
                });
            });

            it('should NOT send BOARD_BASIS_CARD_SELECT engage event when eventAction is not Select', () => {
                mockRootStore.engageStore.sendCustomEvent = jest.fn();
                store.trackSelectAltBoard('All Inclusive', EventActions.Deselect, {}, 'AI');

                expect(mockRootStore.engageStore.sendCustomEvent).not.toHaveBeenCalled();
            });
        });

        describe('trackValidation', () => {
            it('Should track validation error', () => {
                mockRootStore.layoutStore.getPhrase = jest.fn().mockReturnValueOnce(undefined);

                store.trackValidation(null, errorMessageMock);

                expect(mockRootStore.layoutStore.getPhrase).toHaveBeenCalledWith(errorMessageMock);
                expect(store.addToDataLayer).toHaveBeenCalledWith({
                    event: EventTypes.ValidationMessage,
                    dimension13: mockedTimestamp,
                    dimension93: '',
                    dimension94: errorMessageMock,
                    dimension136: '',
                });
            });

            it('Should populate error message from dictionary', () => {
                mockRootStore.layoutStore.getPhrase = jest.fn().mockReturnValueOnce(errorMessageMock);

                store.trackValidation(errorTypeMock, errorMessageMock);

                expect(store.addToDataLayer).toHaveBeenCalledWith({
                    event: EventTypes.ValidationMessage,
                    dimension13: mockedTimestamp,
                    dimension93: errorTypeMock,
                    dimension94: errorMessageMock,
                    dimension136: '',
                });
            });

            it('Should populate empty string when field is nullable', () => {
                store.trackValidation(null, errorMessageMock);

                expect(store.addToDataLayer).toHaveBeenCalledWith({
                    event: EventTypes.ValidationMessage,
                    dimension13: mockedTimestamp,
                    dimension93: '',
                    dimension94: errorMessageMock,
                    dimension136: '',
                });
            });
        });

        describe('trackPromocodeError', () => {
            beforeEach(() => {
                store.trackValidation = jest.fn();
            });

            it('should track promocode error', () => {
                mockRootStore.bookingStore.promoCode = {
                    promocodeValidationErrors: [validationErrorOnBlurMock, validationErrorOnTypeMock],
                    promocodeErrorCode: ApiErrors.PromocodeIsRequired,
                };

                store.trackPromocodeError();

                expect(store.trackValidation).toHaveBeenCalledWith('Promo Code', 'error Message OnBlur');
            });

            it('should track promocode validation error', () => {
                mockRootStore.bookingStore.promoCode = {
                    promocodeValidationErrors: [validationErrorOnBlurMock, validationErrorOnTypeMock],
                    promocodeErrorCode: ApiErrors.PromocodeValidation,
                };

                store.trackPromocodeError();

                expect(store.trackValidation).toHaveBeenCalledWith(
                    'Promo Code',
                    'Holidays.Promotion.Criteria.Errors.MultipleErrors error Message OnBlur, error Message OnType',
                );
            });

            it('should skip tracking when NO error for tracking', () => {
                store.trackPromocodeError();

                expect(store.trackValidation).not.toHaveBeenCalled();
            });
        });

        describe('errorTracking', () => {
            it('should NOT track when isAnalyticsDisabled returns true', () => {
                jest.mocked(isAnalyticsDisabled).mockReturnValueOnce(true);
                mockRootStore.layoutStore.layout = { sitecore: { route: {} } };

                store.errorTracking({ response: { status: 500 }, message: 'Server Error' } as any);

                expect(store.addToDataLayer).not.toHaveBeenCalled();
            });

            it('should NOT track when layout route is missing', () => {
                jest.mocked(isAnalyticsDisabled).mockReturnValueOnce(false);
                mockRootStore.layoutStore.layout = { sitecore: { route: null } };

                store.errorTracking({ response: { status: 500 }, message: 'Server Error' } as any);

                expect(store.addToDataLayer).not.toHaveBeenCalled();
            });

            it('should track error with response status and error data', () => {
                jest.mocked(isAnalyticsDisabled).mockReturnValueOnce(false);
                mockRootStore.layoutStore.layout = { sitecore: { route: {} } };

                store.errorTracking({
                    response: { status: 404, data: { error: 'Not Found', code: 'ERR_404' } },
                    message: 'Request failed',
                } as any);

                expect(store.addToDataLayer).toHaveBeenCalledWith({
                    event: EventTypes.ErrorMessage,
                    dimension13: mockedTimestamp,
                    dimension86: 404,
                    dimension87: 'Not Found',
                    dimension88: 'ERR_404',
                    dimension136: store.buildPageName(store.getPageTitle()),
                });
            });

            it('should fall back to message when response is undefined', () => {
                jest.mocked(isAnalyticsDisabled).mockReturnValueOnce(false);
                mockRootStore.layoutStore.layout = { sitecore: { route: {} } };

                store.errorTracking({ response: undefined, message: 'Network Error' } as any);

                expect(store.addToDataLayer).toHaveBeenCalledWith({
                    event: EventTypes.ErrorMessage,
                    dimension13: mockedTimestamp,
                    dimension86: 'Network Error',
                    dimension87: 'Network Error',
                    dimension88: '',
                    dimension136: store.buildPageName(store.getPageTitle()),
                });
            });

            it('should use empty string for dimension88 when response data code is missing', () => {
                jest.mocked(isAnalyticsDisabled).mockReturnValueOnce(false);
                mockRootStore.layoutStore.layout = { sitecore: { route: {} } };

                store.errorTracking({
                    response: { status: 500, data: { error: 'Internal Server Error' } },
                    message: 'Server Error',
                } as any);

                expect(store.addToDataLayer).toHaveBeenCalledWith(
                    expect.objectContaining({
                        dimension88: '',
                    }),
                );
            });
        });
    });

    describe('BD4 recommender', () => {
        const mockCampaignInfo = ['mock-campaign-1', 'mock-campaign-2'];
        const bd4RecommenderTracking: IBd4Tracking = {
            pToken: 'pToken',
            tracking: null,
            apiUrl: 'apiUrl',
            recoInfo: {
                placementId: Bd4TravelPlacementId.HotelBook,
                modelId: 'reco',
                strategy: 'collab',
                campaignInfo: mockCampaignInfo,
            },
        };
        const offers = [
            { accom: { id: 'offer-1' }, pricePP: 100, price: 200, tracking: { campaignInfo: ['summer-deals'] } },
            { accom: { id: 'offer-2' }, pricePP: 200, price: 400, tracking: { campaignInfo: ['winter-specials'] } },
            { accom: { id: 'offer-3' }, pricePP: 300, price: 600, tracking: { campaignInfo: ['spring-offers'] } },
            { accom: { id: 'offer-4' }, pricePP: 400, price: 800 },
            { accom: { id: 'offer-5' }, pricePP: 500, price: 1000 },
        ] as IOffer[];

        const slideOptions = {
            currentSlide: 0,
            previousSlide: 0,
            slidesToShow: 3,
            slidesToSlide: 1,
            totalItems: 5,
        };

        it('Should trackRecommenderLoaded', async () => {
            const store = new ConcreteTrackingStore(mockRootStore);
            store.setBd4RecommenderTracking(bd4RecommenderTracking);
            store.setBd4RecommenderPlacementId(Bd4TravelPlacementId.HotelBook);
            await store.trackRecommenderLoaded(offers, slideOptions);

            expect(dataLayer[0]).toEqual({
                dimension13: mockedTimestamp,
                dimension136: '',
                dimension143: bd4RecommenderTracking.pToken,
                dimension147: Bd4TravelPlacementId.HotelBook,
                dimension148: 0,
                dimension149: slideOptions.totalItems,
                dimension150: {
                    placementId: Bd4TravelPlacementId.HotelBook,
                    modelId: 'reco',
                    strategy: 'collab',
                    campaignInfo: mockCampaignInfo,
                },
                dimension152: 0,
                dimension153: slideOptions.slidesToShow,
                event: EventTypes.RecommenderLoaded,
                recommender: [
                    {
                        id: 'offer-1',
                        price: 100,
                        dimension15: 200,
                        position: 0,
                        tracking: { campaignInfo: ['summer-deals'] },
                    },
                    {
                        id: 'offer-2',
                        price: 200,
                        dimension15: 400,
                        position: 1,
                        tracking: { campaignInfo: ['winter-specials'] },
                    },
                    {
                        id: 'offer-3',
                        price: 300,
                        dimension15: 600,
                        position: 2,
                        tracking: { campaignInfo: ['spring-offers'] },
                    },
                ],
            });
        });

        it('Should allow trackRecommenderLoaded with different data', async () => {
            const store = new ConcreteTrackingStore(mockRootStore);
            store.setBd4RecommenderTracking(bd4RecommenderTracking);
            store.setBd4RecommenderPlacementId(Bd4TravelPlacementId.HotelBook);

            await store.trackRecommenderLoaded(offers, slideOptions);

            const differentOffers = [
                { accom: { id: 'offer-6' }, pricePP: 600, price: 1200 },
                { accom: { id: 'offer-7' }, pricePP: 700, price: 1400 },
            ] as IOffer[];

            await store.trackRecommenderLoaded(differentOffers, slideOptions);

            expect(dataLayer).toHaveLength(2);
            expect(dataLayer[0].event).toBe(EventTypes.RecommenderLoaded);
            expect(dataLayer[1].event).toBe(EventTypes.RecommenderLoaded);
            expect(dataLayer[0].recommender[0].id).toBe('offer-1');
            expect(dataLayer[1].recommender[0].id).toBe('offer-6');
        });

        it('Should create correct recoInfo structure in dimension150', async () => {
            const store = new ConcreteTrackingStore(mockRootStore);
            store.setBd4RecommenderTracking(bd4RecommenderTracking);
            store.setBd4RecommenderPlacementId(Bd4TravelPlacementId.HotelBook);
            await store.trackRecommenderLoaded(offers, slideOptions);

            const event = dataLayer[0];
            expect(event.dimension150).toEqual({
                placementId: Bd4TravelPlacementId.HotelBook,
                modelId: 'reco',
                strategy: 'collab',
                campaignInfo: mockCampaignInfo,
            });
        });

        it('Should trackRecommenderNotLoaded with apiMessage error', async () => {
            const store = new ConcreteTrackingStore(mockRootStore);
            store.setBd4RecommenderTracking({ ...bd4RecommenderTracking, apiMessage: 'apiMessageError' });
            store.setBd4RecommenderPlacementId(Bd4TravelPlacementId.HotelBook);
            await store.trackRecommenderNotLoaded();

            expect(dataLayer[0]).toEqual({
                dimension13: mockedTimestamp,
                dimension136: '',
                dimension143: bd4RecommenderTracking.pToken,
                dimension147: Bd4TravelPlacementId.HotelBook,
                dimension150: bd4RecommenderTracking.recoInfo,
                dimension151: 'apiMessageError',
                event: EventTypes.RecommenderNotLoaded,
            });
        });

        it('Should trackRecommenderNotLoaded with custom error', async () => {
            const store = new ConcreteTrackingStore(mockRootStore);
            store.setBd4RecommenderPlacementId(Bd4TravelPlacementId.HotelBook);
            await store.trackRecommenderNotLoaded('error');

            expect(dataLayer[0]).toEqual({
                dimension13: mockedTimestamp,
                dimension136: '',
                dimension143: '',
                dimension147: Bd4TravelPlacementId.HotelBook,
                dimension150: undefined,
                dimension151: 'error',
                event: EventTypes.RecommenderNotLoaded,
            });
        });

        it('Should trackRecommenderPagination', () => {
            const store = new ConcreteTrackingStore(mockRootStore);
            store.setBd4RecommenderTracking(bd4RecommenderTracking);
            store.setBd4RecommenderPlacementId(Bd4TravelPlacementId.HotelBook);
            store.trackRecommenderPagination(offers, { ...slideOptions, currentSlide: 2, previousSlide: 1 });

            expect(dataLayer[0]).toEqual({
                dimension13: mockedTimestamp,
                dimension136: '',
                dimension143: bd4RecommenderTracking.pToken,
                dimension147: Bd4TravelPlacementId.HotelBook,
                dimension148: 2,
                dimension149: slideOptions.totalItems,
                dimension150: bd4RecommenderTracking.recoInfo,
                dimension152: 1,
                dimension153: slideOptions.slidesToShow,
                event: EventTypes.RecommenderPagination,
                recommender: [
                    { id: 'offer-3', price: 300, dimension15: 600, tracking: { campaignInfo: ['spring-offers'] } },
                    { id: 'offer-4', price: 400, dimension15: 800 },
                    { id: 'offer-5', price: 500, dimension15: 1000 },
                ],
            });
        });

        it('Should trackRecommenderInteraction', () => {
            const store = new ConcreteTrackingStore(mockRootStore);
            store.setBd4RecommenderTracking(bd4RecommenderTracking);
            store.setBd4RecommenderPlacementId(Bd4TravelPlacementId.HotelBook);
            store.trackRecommenderInteraction(RecommenderMedium.Image, offers[0], 0, slideOptions);

            expect(dataLayer[0]).toEqual({
                dimension13: mockedTimestamp,
                dimension136: '',
                dimension143: bd4RecommenderTracking.pToken,
                dimension147: Bd4TravelPlacementId.HotelBook,
                dimension148: 0,
                dimension149: slideOptions.totalItems,
                dimension150: {
                    placementId: Bd4TravelPlacementId.HotelBook,
                    modelId: 'reco',
                    strategy: 'collab',
                    campaignInfo: ['summer-deals'],
                    position: 0,
                },
                dimension152: 0,
                dimension153: slideOptions.slidesToShow,
                event: EventTypes.RecommenderInteraction,
                id: 'offer-1',
                price: 100,
                dimension15: 200,
                dimension154: RecommenderMedium.Image,
                dimension155: 0,
                tracking: {
                    campaignInfo: ['summer-deals'],
                },
            });
        });

        it('Should trackRecommenderHotelClick', () => {
            const store = new ConcreteTrackingStore(mockRootStore);
            store.setBd4RecommenderTracking(bd4RecommenderTracking);
            store.setBd4RecommenderPlacementId(Bd4TravelPlacementId.HotelBook);
            store.trackRecommenderHotelClick(offers[1], 1, slideOptions);

            expect(dataLayer[0]).toEqual({
                dimension13: mockedTimestamp,
                dimension136: '',
                dimension143: bd4RecommenderTracking.pToken,
                dimension147: Bd4TravelPlacementId.HotelBook,
                dimension149: slideOptions.totalItems,
                dimension150: {
                    placementId: Bd4TravelPlacementId.HotelBook,
                    modelId: 'reco',
                    strategy: 'collab',
                    campaignInfo: ['winter-specials'],
                    position: 1,
                },
                dimension153: slideOptions.slidesToShow,
                event: EventTypes.RecommenderHotelClick,
                id: 'offer-2',
                price: 200,
                dimension15: 400,
                dimension155: 1,
                tracking: {
                    campaignInfo: ['winter-specials'],
                },
            });
        });

        it('Should trackRecommenderInteraction without campaignInfo fields when offer has no campaign info', () => {
            const store = new ConcreteTrackingStore(mockRootStore);
            store.setBd4RecommenderTracking(bd4RecommenderTracking);
            store.setBd4RecommenderPlacementId(Bd4TravelPlacementId.HotelBook);
            store.trackRecommenderInteraction(RecommenderMedium.Image, offers[3], 3, slideOptions);

            expect(dataLayer[0]).toEqual({
                dimension13: mockedTimestamp,
                dimension136: '',
                dimension143: bd4RecommenderTracking.pToken,
                dimension147: Bd4TravelPlacementId.HotelBook,
                dimension148: 0,
                dimension149: slideOptions.totalItems,
                dimension150: {
                    placementId: Bd4TravelPlacementId.HotelBook,
                    modelId: 'reco',
                    strategy: 'collab',
                    position: 3,
                },
                dimension152: 0,
                dimension153: slideOptions.slidesToShow,
                event: EventTypes.RecommenderInteraction,
                id: 'offer-4',
                price: 400,
                dimension15: 800,
                dimension154: RecommenderMedium.Image,
                dimension155: 3,
            });

            expect(dataLayer[0].dimension150).not.toHaveProperty('campaignInfo');
            expect(dataLayer[0]).not.toHaveProperty('tracking');
        });

        it('Should trackRecommenderHotelClick without campaignInfo fields when offer has no campaign info', () => {
            const store = new ConcreteTrackingStore(mockRootStore);
            store.setBd4RecommenderTracking(bd4RecommenderTracking);
            store.setBd4RecommenderPlacementId(Bd4TravelPlacementId.HotelBook);
            store.trackRecommenderHotelClick(offers[4], 4, slideOptions);

            expect(dataLayer[0]).toEqual({
                dimension13: mockedTimestamp,
                dimension136: '',
                dimension143: bd4RecommenderTracking.pToken,
                dimension147: Bd4TravelPlacementId.HotelBook,
                dimension149: slideOptions.totalItems,
                dimension150: {
                    placementId: Bd4TravelPlacementId.HotelBook,
                    modelId: 'reco',
                    strategy: 'collab',
                    position: 4,
                },
                dimension153: slideOptions.slidesToShow,
                event: EventTypes.RecommenderHotelClick,
                id: 'offer-5',
                price: 500,
                dimension15: 1000,
                dimension155: 4,
            });

            expect(dataLayer[0].dimension150).not.toHaveProperty('campaignInfo');
            expect(dataLayer[0]).not.toHaveProperty('tracking');
        });

        it('Should trackRecommenderInteraction with empty campaignInfo array treated as no campaign info', () => {
            const store = new ConcreteTrackingStore(mockRootStore);
            store.setBd4RecommenderTracking(bd4RecommenderTracking);
            store.setBd4RecommenderPlacementId(Bd4TravelPlacementId.HotelBook);

            const offerWithEmptyCampaignInfo = {
                accom: { id: 'offer-empty' },
                pricePP: 150,
                price: 300,
                tracking: { campaignInfo: [] },
            } as any as IOffer;

            store.trackRecommenderInteraction(RecommenderMedium.Image, offerWithEmptyCampaignInfo, 0, slideOptions);

            expect(dataLayer[0]).toEqual({
                dimension13: mockedTimestamp,
                dimension136: '',
                dimension143: bd4RecommenderTracking.pToken,
                dimension147: Bd4TravelPlacementId.HotelBook,
                dimension148: 0,
                dimension149: slideOptions.totalItems,
                dimension150: {
                    placementId: Bd4TravelPlacementId.HotelBook,
                    modelId: 'reco',
                    strategy: 'collab',
                    position: 0,
                },
                dimension152: 0,
                dimension153: slideOptions.slidesToShow,
                event: EventTypes.RecommenderInteraction,
                id: 'offer-empty',
                price: 150,
                dimension15: 300,
                dimension154: RecommenderMedium.Image,
                dimension155: 0,
            });

            expect(dataLayer[0].dimension150).not.toHaveProperty('campaignInfo');
            expect(dataLayer[0]).not.toHaveProperty('tracking');
        });
    });

    describe('call trackHolidayTypes method', () => {
        it('should add correct data to dataLayer', () => {
            mockRootStore.layoutStore.holidayThemeTypes = 'test';

            const store = new ConcreteTrackingStore(mockRootStore);

            store.addToDataLayer = jest.fn();
            store.trackHolidayTypes();

            expect(store.addToDataLayer).toHaveBeenCalledWith({
                event: EventTypes.HolidayTypeCodes,
                eventParams: {
                    location: '',
                    typesCode: 'test',
                },
            });
        });
    });

    describe('call trackHomepageAction method', () => {
        const eventParams = {
            cta: 'cta',
            OverlayMessage: 'test',
        };

        it('should add correct data to dataLayer when it is Home Page', () => {
            mockRootStore.layoutStore.isHomePage = true;

            const store = new ConcreteTrackingStore(mockRootStore);

            store.addToDataLayer = jest.fn();
            store.trackHomepageAction(EventTypes.CTAClick, eventParams);

            expect(store.addToDataLayer).toHaveBeenCalledWith({ event: EventTypes.CTAClick, eventParams });
        });

        it('should NOT add data to dataLayer when it is not Home Page', () => {
            const store = new ConcreteTrackingStore(mockRootStore);

            store.addToDataLayer = jest.fn();
            store.trackHomepageAction(EventTypes.CTAClick, eventParams);

            expect(store.addToDataLayer).not.toHaveBeenCalled();
        });
    });

    describe('call forceOptimizeSRPEvent method', () => {
        it('should add optimizeSRP event to dataLayer', () => {
            const store = new ConcreteTrackingStore(mockRootStore);

            store.addToDataLayer = jest.fn();
            store.forceOptimizeSRPEvent();

            expect(store.addToDataLayer).toHaveBeenCalledWith({ event: EventTypes.OptimizeSRP });
        });
    });

    describe('Product Click', () => {
        it('Should track product and promo click for sponsored hotel', () => {
            const store = new ConcreteTrackingStore(mockRootStore);

            store.setBd4SortTracking(bd4SortTracking);
            store.trackSearchProductClick({ ...mockedOffer, isSponsored: true }, 0);

            expect(dataLayer[0]).toEqual({
                event: EventTypes.ProductClick,
                dimension136: '',
                pageTitle: '',
                ecommerce: {
                    click: {
                        actionField: { list: '' },
                        products: [expect.objectContaining({ dimension82: 'Sponsored' })],
                    },
                },
            });
            expect(dataLayer[1]).toEqual({
                event: EventTypes.PromoClick,
                dimension136: '',
                ecommerce: {
                    promoClick: {
                        promotions: [
                            {
                                id: 'X9017210',
                                name: 'Sponsored: Hotel Example',
                                creative: 'sponsored_campaign',
                                position: 1,
                            },
                        ],
                    },
                },
            });
        });

        it('Should track only product click for NOT sponsored hotel', () => {
            const store = new ConcreteTrackingStore(mockRootStore);

            store.trackSearchProductClick(mockedOffer, 0);

            expect(dataLayer).toHaveLength(1);
            expect(dataLayer[0]).toEqual({
                event: EventTypes.ProductClick,
                dimension136: '',
                pageTitle: '',
                ecommerce: {
                    click: {
                        actionField: { list: '' },
                        products: [expect.not.objectContaining({ dimension82: 'Sponsored' })],
                    },
                },
            });
        });

        it('should track without a products when baseProduct is not presented and it is recommended', () => {
            const store = new ConcreteTrackingStore(mockRootStore);
            const trackPromoClickSpy = jest.spyOn(store, 'trackPromoClick');

            store.buildBaseHolidayProduct = jest.fn().mockReturnValue(null);
            store.addToDataLayer = jest.fn();
            store.trackSearchProductClick(mockedOffer, 0, true);

            expect(store.addToDataLayer).toHaveBeenCalledWith({
                event: EventTypes.ProductClick,
                dimension136: '',
                pageTitle: '',
                ecommerce: {
                    click: {
                        actionField: { list: ' - Recommended' },
                        products: [],
                    },
                },
            });

            expect(trackPromoClickSpy).not.toHaveBeenCalled();
        });

        it('should track product click (product_click_map) when map-popup is open', () => {
            const store = new ConcreteTrackingStore(mockRootStore);

            store.trackSearchProductClick(mockedOffer, -1, false, true);

            expect(dataLayer).toHaveLength(1);
            expect(dataLayer[0]).toEqual({
                event: EventTypes.ProductClick,
                dimension136: '',
                pageTitle: '',
                ecommerce: {
                    click: {
                        actionField: { list: '' },
                        products: [expect.objectContaining({ dimension108: EventTypes.ProductClickMap })],
                    },
                },
            });
        });
    });

    describe('getFilterCategoryTrackingName', () => {
        let store: BaseTrackingStore;

        beforeEach(() => {
            store = new ConcreteTrackingStore(mockRootStore);
        });

        it('should return "Tripadvisor Rating" for FilterGroupCodes.TripAdvisorRating', () => {
            const filterCategory = store.getFilterCategoryTrackingName(FilterGroupCodes.TripAdvisorRating);

            expect(filterCategory).toBe('Tripadvisor Rating');
        });

        it('should return "Star Rating" for FilterGroupCodes.StarRating', () => {
            const filterCategory = store.getFilterCategoryTrackingName(FilterGroupCodes.StarRating);

            expect(filterCategory).toBe('Star Rating');
        });

        it('should return static "Destinations" string for Destination filter code', () => {
            const filterCategory = store.getFilterCategoryTrackingName(FilterGroupCodes.Destination);

            expect(filterCategory).toBe('Destinations');
        });

        it('should return static "Board" string for BoardType filter code', () => {
            const filterCategory = store.getFilterCategoryTrackingName(FilterGroupCodes.BoardType);

            expect(filterCategory).toBe('Board');
        });

        it('should return group code if there is no dictionary related with code', () => {
            const filterCategory = store.getFilterCategoryTrackingName('groupCode');

            expect(mockRootStore.layoutStore.getPhrase).not.toHaveBeenCalled();
            expect(filterCategory).toBe('groupCode');
        });

        it('should return "All" when code is not provided', () => {
            const filterCategory = store.getFilterCategoryTrackingName(undefined);

            expect(filterCategory).toBe('All');
        });

        it('should return "Recommended" when quickFilterType is FilterGroupCodes.Recommended', () => {
            const filterCategory = store.getFilterCategoryTrackingName(
                FilterGroupCodes.StarRating,
                FilterGroupCodes.Recommended,
            );

            expect(filterCategory).toBe('Recommended');
        });

        it('should return "Recently Used" when quickFilterType is FilterGroupCodes.RecentlyUsed', () => {
            const filterCategory = store.getFilterCategoryTrackingName(
                FilterGroupCodes.StarRating,
                FilterGroupCodes.RecentlyUsed,
            );

            expect(filterCategory).toBe('Recently Used');
        });

        it('should return "Recommended" when only quickFilterType is provided without code', () => {
            const filterCategory = store.getFilterCategoryTrackingName(undefined, FilterGroupCodes.Recommended);

            expect(filterCategory).toBe('Recommended');
        });
    });

    describe('getPageCurrency', () => {
        it('should return market store currency when isHotelDetailsBookPage is true', async () => {
            mockRootStore.layoutStore.isHotelDetailsBookPage = true;
            mockRootStore.marketStore.currency = CurrencyCode.EUR;

            const store = new ConcreteTrackingStore(mockRootStore);

            const result = await store.getPageCurrency();

            expect(result).toBe(mockRootStore.marketStore.currency);
        });

        it('should return market store currency when isGuestDetailsPage is true', async () => {
            mockRootStore.layoutStore.isGuestDetailsPage = true;

            const store = new ConcreteTrackingStore(mockRootStore);

            const result = await store.getPageCurrency();

            expect(result).toBe(mockRootStore.marketStore.currency);
        });

        it('should return market store currency when isExtrasPage is true', async () => {
            mockRootStore.layoutStore.isExtrasPage = true;

            const store = new ConcreteTrackingStore(mockRootStore);

            const result = await store.getPageCurrency();

            expect(result).toBe(mockRootStore.marketStore.currency);
        });

        it('should return market store currency when isPromoPage is true', async () => {
            mockRootStore.layoutStore.isPromoPage = true;

            const store = new ConcreteTrackingStore(mockRootStore);

            const result = await store.getPageCurrency();

            expect(result).toBe(mockRootStore.marketStore.currency);
        });

        it('should return market store currency when isSearchResultsPage is true', async () => {
            mockRootStore.layoutStore.isSearchResultsPage = true;

            const store = new ConcreteTrackingStore(mockRootStore);

            const result = await store.getPageCurrency();

            expect(result).toBe(mockRootStore.marketStore.currency);
        });
    });

    describe('getPageTitle', () => {
        let store: BaseTrackingStore;

        beforeEach(() => {
            store = new ConcreteTrackingStore(mockRootStore);
        });

        it('should return meta page title when NO tracking title provided', () => {
            expect(store.getPageTitle()).toBe('metaPageTitle');
        });

        it('should return tracking title when it is provided', () => {
            mockRootStore.layoutStore.pageFields = {
                TrackingPageTitle: mockSitecoreField('Ho ho ho country holidays page'),
                HolidayThemes: [holidayThemeMock],
            };

            expect(store.getPageTitle()).toBe('Ho ho ho country holidays page');
        });

        it('should return tracking title when it is provided', () => {
            mockRootStore.layoutStore.isDynamicPromoPage = true;
            mockRootStore.layoutStore.pageFields = {
                TrackingPageTitle: mockSitecoreField('{holidayTheme} country holidays page'),
                HolidayThemes: [{ fields: {} }],
            };

            expect(store.getPageTitle()).toBe(' country holidays page');
        });

        it('should return tracking title when it is provided with holiday theme', () => {
            mockRootStore.layoutStore.isDynamicPromoPage = true;
            mockRootStore.layoutStore.pageFields = {
                TrackingPageTitle: mockSitecoreField('{holidayTheme} country holidays'),
                HolidayThemes: [holidayThemeMock],
            };

            expect(store.getPageTitle()).toBe('Beach country holidays');
        });

        it('should return tracking title when it is provided with season', () => {
            mockRootStore.layoutStore.isDynamicPromoPage = true;
            mockRootStore.layoutStore.pageFields = {
                TrackingPageTitle: mockSitecoreField('{season} country holidays'),
                HolidayThemes: [holidayThemeMock],
            };

            mockRootStore.promoPageStore.getSeasonName = jest.fn(() => 'Summer');

            expect(store.getPageTitle()).toBe('Summer country holidays');
        });
    });

    describe('SetPrices', () => {
        it('should assign minPrice AND maxPrice when hotelsStore has correct value', () => {
            const store = new ConcreteTrackingStore(mockRootStore);

            store.setPrices();

            expect(store.minPrice).toBe(33);
            expect(store.maxPrice).toBe(21);
        });
    });

    describe('trackAccountIdentifiedEvent', () => {
        it('should add proper data to dataLayer when isAccountExists === true', () => {
            const store = new ConcreteTrackingStore(mockRootStore);

            store.addToDataLayer = jest.fn();

            store.trackAccountIdentifiedEvent(true);

            expect(store.addToDataLayer).toHaveBeenCalledWith({
                dimension13: '2020-20-02',
                dimension136: '',
                event: 'accountIdentified',
            });
        });

        it('should add proper data to dataLayer when isAccountExists === false', () => {
            const store = new ConcreteTrackingStore(mockRootStore);

            store.addToDataLayer = jest.fn();

            store.trackAccountIdentifiedEvent(false);

            expect(store.addToDataLayer).toHaveBeenCalledWith({
                dimension13: '2020-20-02',
                dimension136: '',
                event: 'accountNotIdentified',
            });
        });
    });

    describe('trackEventWithParams ', () => {
        beforeEach(() => {
            mockRootStore.viewBookingStore.isLoading = false;
        });

        const trackEventObject: [
            EventTypes,
            IEventParams,
            ICustomParams,
            undefined,
            undefined,
            Partial<ICoreParams> | undefined,
        ] = [
            EventTypes.GenericEvent,
            {
                eventCategory: EventCategories.SportsEquipment,
                eventAction: EventActions.CannotAccommodateModal,
                eventLabel: EventLabels.Impression,
                eventType: EventTypes.NonInteraction,
            },
            {
                genericValue1: 'Sports Equipment / Adding Shared Transport',
                genericValue2: null,
                genericValue3: null,
                genericValue4: null,
                destinationUrl: null,
            },
            undefined,
            undefined,
            { pageName: 'pageTitle|EN' },
        ];

        it('should add a custom page name when pageName property is provided', async () => {
            const store = new ConcreteTrackingStore(mockRootStore);
            store['pageLoadLayoutId'] = 'id';

            store.addToDataLayer = jest.fn();

            await store.trackEventWithParams(...trackEventObject);

            expect(store.addToDataLayer).toHaveBeenCalledWith(
                expect.objectContaining({ coreParams: { pageName: 'pageTitle|EN' } }),
            );
        });

        it('should NOT add a custom page name when pageName property is NOT provided', async () => {
            const store = new ConcreteTrackingStore(mockRootStore);
            store['pageLoadLayoutId'] = 'id';

            store.addToDataLayer = jest.fn();

            trackEventObject[trackEventObject.length - 1] = undefined;

            await store.trackEventWithParams(...trackEventObject);

            expect(store.addToDataLayer).toHaveBeenCalledWith(expect.objectContaining({ coreParams: {} }));
        });
    });

    describe('getFilterActionDimensions', () => {
        let store;
        const mockFilterCategoryTrackingName = 'filterCategoryTrackingName';
        const mockFilterSelectionTrackingName = 'filterSelectionTrackingName';

        beforeEach(() => {
            store = new ConcreteTrackingStore(mockRootStore);
            store.getFilterCategoryTrackingName = jest.fn().mockReturnValue(mockFilterCategoryTrackingName);
            mockGetFilterSelectionTrackingName.mockReturnValue(mockFilterSelectionTrackingName);
        });

        it('should return dimensions for select action with filters', () => {
            const res = store.getFilterActionDimensions(true, {
                groupCode: FilterGroupCodes.TripAdvisorRating,
                name: 'tripAdvisorRating name',
                trackingId: 'TripAdvisor Rating',
            });

            expect(store.getFilterCategoryTrackingName).toHaveBeenCalledWith(
                FilterGroupCodes.TripAdvisorRating,
                undefined,
            );
            expect(res).toEqual({
                dimension158: EventActions.Select,
                dimension159: mockFilterCategoryTrackingName,
                dimension160: mockFilterSelectionTrackingName,
            });
            expect(mockGetFilterSelectionTrackingName).toHaveBeenCalledWith({
                groupCode: FilterGroupCodes.TripAdvisorRating,
                name: 'tripAdvisorRating name',
                trackingId: 'TripAdvisor Rating',
            });
        });

        it('should pass groupCode and quickFilterType to getFilterCategoryTrackingName', () => {
            store.getFilterActionDimensions(
                true,
                {
                    groupCode: FilterGroupCodes.TripAdvisorRating,
                    name: 'tripAdvisorRating name',
                },
                FilterGroupCodes.Recommended,
            );

            expect(store.getFilterCategoryTrackingName).toHaveBeenCalledWith(
                FilterGroupCodes.TripAdvisorRating,
                FilterGroupCodes.Recommended,
            );
        });
    });

    describe('trackTransferAndSportsEquipmentChange', () => {
        it('should be called with according parameters for when isTransferRemoveSE === false ', () => {
            const store = new ConcreteTrackingStore(mockRootStore);
            store.trackEventWithParams = jest.fn();

            store.getPageTitle = jest.fn(() => 'pageTitle');

            store.trackTransferAndSportsEquipmentChange(false);

            expect(store.getPageTitle).toHaveBeenCalled();
            expect(store.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                {
                    eventCategory: EventCategories.SportsEquipment,
                    eventAction: `Modal - Minus ${mockRootStore.layoutStore.SEAccommodationNoticePeriod} Days`,
                    eventLabel: EventLabels.Impression,
                    eventType: EventTypes.NonInteraction,
                },
                {
                    genericValue1: 'Shared Transfer / Adding Sports Equipment',
                    genericValue2: null,
                    genericValue3: null,
                    genericValue4: null,
                    destinationUrl: null,
                },
                undefined,
                undefined,
                { pageName: 'pageTitle|EN' },
            );
        });

        it('should be called with according parameters for when isTransferRemoveSE === true ', () => {
            mockRootStore.bookingStore.isEnoughTimeForAddSETransfer = true;
            const store = new ConcreteTrackingStore(mockRootStore);

            store.getPageTitle = jest.fn(() => 'pageTitle');

            store.trackEventWithParams = jest.fn();

            store.trackTransferAndSportsEquipmentChange(true);

            expect(store.getPageTitle).toHaveBeenCalled();
            expect(store.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                {
                    eventCategory: EventCategories.SportsEquipment,
                    eventAction: EventActions.CannotAccommodateModal,
                    eventLabel: EventLabels.Impression,
                    eventType: EventTypes.NonInteraction,
                },
                {
                    genericValue1: 'Sports Equipment / Adding Shared Transport',
                    genericValue2: null,
                    genericValue3: null,
                    genericValue4: null,
                    destinationUrl: null,
                },
                undefined,
                undefined,
                { pageName: 'pageTitle|EN' },
            );
        });
    });

    describe('personalized tracking', () => {
        let store: BaseTrackingStore;

        beforeEach(() => {
            store = new ConcreteTrackingStore(mockRootStore);
            jest.spyOn(store, 'trackEventWithParams');
            jest.spyOn(store, 'trackHomepageAction');
        });

        describe('trackHeroBannerImpression', () => {
            it('should call trackEventWithParams with correct parameters', () => {
                const uniqueId = 'testUniqueId';
                const title = 'Test Title';
                const subtitle = 'Test Subtitle';
                const position = 1;

                store.trackHeroBannerImpression(uniqueId, title, subtitle, position);

                expect(logger.info).toHaveBeenCalledWith(
                    `Tracking hero banner impression: {\"uniqueId\":\"testUniqueId\",\"title\":\"Test Title\",\"subtitle\":\"Test Subtitle\",\"position\":1,\"friendlyId\":\"friendlyId\",\"selectionAttr\":\"selectionAttr\",\"sitecoreAnalyticsCookie\":\"\"}`,
                );

                expect(store.trackEventWithParams).toHaveBeenCalledWith(
                    EventTypes.GenericEvent,
                    {
                        eventAction: EventActions.HeroBannerImpression,
                        eventCategory: EventCategories.Homepage,
                        eventLabel: title,
                        eventType: EventTypes.NonInteraction,
                        eventValue: 'null',
                        position,
                    },
                    {
                        ...GENERIC_CUSTOM_PARAMS_EMPTY,
                        genericValue1: subtitle,
                        genericValue2: 'null',
                        genericValue3: 'null',
                        genericValue4: 'friendlyId|selectionAttr',
                    },
                );
            });

            it('should use default values when experimentsByUniqueId does NOT contain the uniqueId', () => {
                mockRootStore.engageStore.experimentsByUniqueId = {};

                const uniqueId = 'nonExistentUniqueId';
                const title = 'Test Title';
                const subtitle = 'Test Subtitle';
                const position = 1;

                store.trackHeroBannerImpression(uniqueId, title, subtitle, position);

                expect(store.trackEventWithParams).toHaveBeenCalledWith(
                    EventTypes.GenericEvent,
                    {
                        eventAction: EventActions.HeroBannerImpression,
                        eventCategory: EventCategories.Homepage,
                        eventLabel: title,
                        eventType: EventTypes.NonInteraction,
                        eventValue: 'null',
                        position,
                    },
                    {
                        ...GENERIC_CUSTOM_PARAMS_EMPTY,
                        genericValue1: subtitle,
                        genericValue2: 'null',
                        genericValue3: 'null',
                        genericValue4: 'Default|Default',
                    },
                );
            });
        });

        describe('trackPromoBlocksImpression', () => {
            it('should call trackEventWithParams with correct parameters for big theme', () => {
                const uniqueId = 'testUniqueId';
                const variant = PromoBlocksThemes.Big;
                const eventLabel = 'Mock Event Label';
                const genericValue2 = 'Mock Generic Value 2';

                store.trackPromoBlocksImpression(uniqueId, variant, eventLabel, genericValue2);

                expect(store.trackEventWithParams).toHaveBeenCalledWith(
                    EventTypes.GenericEvent,
                    {
                        eventCategory: EventCategories.Module,
                        eventAction: EventActions.Impressions,
                        eventLabel,
                        eventType: EventTypes.NonInteraction,
                        eventValue: 'null',
                    },
                    {
                        genericValue1: `Promo:${variant}`,
                        genericValue2,
                        genericValue3: 'null',
                        genericValue4: 'friendlyId|selectionAttr',
                        destinationUrl: null,
                    },
                );
            });

            it('should call trackEventWithParams with correct parameters for featured destinations', () => {
                const uniqueId = 'testUniqueId';
                const variant = PromoBlocksThemes.FeaturedDestinationsVariant;
                const eventLabel = 'Mock Event Label';
                const genericValue2 = 'Mock Generic Value 2';

                store.trackPromoBlocksImpression(uniqueId, variant, eventLabel, genericValue2);

                expect(store.trackEventWithParams).toHaveBeenCalledWith(
                    EventTypes.GenericEvent,
                    {
                        eventCategory: EventCategories.Module,
                        eventAction: EventActions.Impressions,
                        eventLabel,
                        eventType: EventTypes.NonInteraction,
                        eventValue: 'null',
                    },
                    {
                        genericValue1: `Promo:${variant}`,
                        genericValue2,
                        genericValue3: 'null',
                        genericValue4: 'friendlyId|selectionAttr',
                        destinationUrl: null,
                    },
                );
            });

            it('should use default values when experimentsByUniqueId does NOT contain the uniqueId', () => {
                const uniqueId = 'nonExistentUniqueId';
                const variant = PromoBlocksThemes.Big;
                const eventLabel = 'Default Event Label';
                const genericValue2 = 'Default Generic Value 2';

                store.trackPromoBlocksImpression(uniqueId, variant, eventLabel, genericValue2);

                expect(store.trackEventWithParams).toHaveBeenCalledWith(
                    EventTypes.GenericEvent,
                    {
                        eventCategory: EventCategories.Module,
                        eventAction: EventActions.Impressions,
                        eventLabel,
                        eventType: EventTypes.NonInteraction,
                        eventValue: 'null',
                    },
                    {
                        genericValue1: `Promo:${variant}`,
                        genericValue2,
                        genericValue3: 'null',
                        genericValue4: 'Default|Default',
                        destinationUrl: null,
                    },
                );
            });
        });

        describe('trackPromoBlockClick', () => {
            it('should call trackEventWithParams with correct parameters', () => {
                const uniqueId = 'testUniqueId';
                const variant = PromoBlocksThemes.Big;
                const eventLabel = 'Mock Event Label';
                const genericValue2 = 'Mock Generic Value 2';
                const genericValue3 = 'Mock Generic Value 3';
                const destinationUrl = 'https://www.example.com';

                store.trackPromoBlockClick(uniqueId, variant, eventLabel, genericValue2, genericValue3, destinationUrl);

                expect(store.trackEventWithParams).toHaveBeenCalledWith(
                    EventTypes.GenericEvent,
                    {
                        eventCategory: EventCategories.Module,
                        eventAction: EventActions.ImpressionClicked,
                        eventLabel,
                        eventType: EventTypes.Interaction,
                        eventValue: 'null',
                    },
                    {
                        genericValue1: `Promo:${variant}`,
                        genericValue2,
                        genericValue3,
                        genericValue4: 'friendlyId|selectionAttr',
                        destinationUrl,
                    },
                );
            });

            it('should use default values when experimentsByUniqueId does NOT contain the uniqueId', () => {
                const uniqueId = 'nonExistentUniqueId';
                const variant = PromoBlocksThemes.Big;
                const eventLabel = 'Mock Event Label';
                const genericValue2 = 'Mock Generic Value 2';
                const genericValue3 = 'Mock Generic Value 3';
                const destinationUrl = 'https://www.example.com';

                store.trackPromoBlockClick(uniqueId, variant, eventLabel, genericValue2, genericValue3, destinationUrl);

                expect(store.trackEventWithParams).toHaveBeenCalledWith(
                    EventTypes.GenericEvent,
                    {
                        eventCategory: EventCategories.Module,
                        eventAction: EventActions.ImpressionClicked,
                        eventLabel,
                        eventType: EventTypes.Interaction,
                        eventValue: 'null',
                    },
                    {
                        genericValue1: `Promo:${variant}`,
                        genericValue2,
                        genericValue3,
                        genericValue4: 'Default|Default',
                        destinationUrl,
                    },
                );
            });
        });

        describe('trackFeaturedHotelsImpression', () => {
            it('should call trackEventWithParams with correct parameters for given hotels', () => {
                const uniqueId = 'testUniqueId';

                store.trackFeaturedHotelsImpression(uniqueId, featuredHotelsMock);

                expect(store.trackEventWithParams).toHaveBeenCalledWith(
                    EventTypes.GenericEvent,
                    {
                        eventAction: EventActions.FeaturedHotels,
                        eventCategory: EventCategories.Homepage,
                        eventLabel: 'Hotel One|Hotel Two',
                        eventType: EventTypes.NonInteraction,
                        eventValue: 'null',
                    },
                    {
                        ...GENERIC_CUSTOM_PARAMS_EMPTY,
                        genericValue1: 'Country One|Country Two',
                        genericValue2: 'Region One|Region Two',
                        genericValue3: '100|200',
                        genericValue4: 'friendlyId|selectionAttr',
                    },
                );
            });

            it('should use default values when experimentsByUniqueId does NOT contain the uniqueId', () => {
                const uniqueId = 'nonExistentUniqueId';

                store.trackFeaturedHotelsImpression(uniqueId, featuredHotelsMock.slice(0, 1));

                expect(store.trackEventWithParams).toHaveBeenCalledWith(
                    EventTypes.GenericEvent,
                    {
                        eventAction: EventActions.FeaturedHotels,
                        eventCategory: EventCategories.Homepage,
                        eventLabel: 'Hotel One',
                        eventType: EventTypes.NonInteraction,
                        eventValue: 'null',
                    },
                    {
                        ...GENERIC_CUSTOM_PARAMS_EMPTY,
                        genericValue1: 'Country One',
                        genericValue2: 'Region One',
                        genericValue3: '100',
                        genericValue4: 'Default|Default',
                    },
                );
            });
        });

        describe('trackPersonalizedClick', () => {
            it('should call trackHomepageAction with correct parameters', () => {
                const event = EventTypes.CTAClick;
                const uniqueId = 'testUniqueId';
                const location = 'Mock Location';
                const name = 'Mock Name';
                const destination = 'Mock Destination';
                const extraProps = { position: '2', price: '100', section: 'Mock Section' };

                store.trackPersonalizedClick(event, uniqueId, location, name, destination, extraProps);

                expect(store.trackHomepageAction).toHaveBeenCalledWith(event, {
                    location,
                    name,
                    destination,
                    friendlyID: 'friendlyId',
                    selection_attribute: 'selectionAttr',
                    ...extraProps,
                });
            });

            it('should use default values when experimentsByUniqueId does NOT contain the uniqueId', () => {
                const event = EventTypes.CTAClick;
                const uniqueId = 'nonExistentUniqueId';
                const location = 'Default Location';
                const name = 'Default Name';
                const destination = 'Default Destination';
                const extraProps = { position: '2', price: '50', section: 'Default Section' };

                store.trackPersonalizedClick(event, uniqueId, location, name, destination, extraProps);

                expect(store.trackHomepageAction).toHaveBeenCalledWith(event, {
                    location,
                    name,
                    destination,
                    friendlyID: 'Default',
                    selection_attribute: 'Default',
                    ...extraProps,
                });
            });
        });

        describe('trackManageHolidayImpression', () => {
            it('should call trackEventWithParams with correct parameters', () => {
                const uniqueId = 'testUniqueId';
                const eventLabel = 'Get ready for your upcoming holiday';
                const ctaText = 'Manage your holiday';
                const destinationUrl = '/en/booking/my_bookings';

                store.trackManageHolidayImpression(uniqueId, eventLabel, ctaText, destinationUrl);

                expect(store.trackEventWithParams).toHaveBeenCalledWith(
                    EventTypes.GenericEvent,
                    {
                        eventCategory: EventCategories.Module,
                        eventAction: EventActions.Impressions,
                        eventLabel,
                        eventType: EventTypes.NonInteraction,
                        eventValue: 'null',
                    },
                    {
                        ...GENERIC_CUSTOM_PARAMS_EMPTY,
                        genericValue1: GenericValue.ManageHoliday,
                        genericValue2: 'null',
                        genericValue3: ctaText,
                        genericValue4: 'friendlyId|selectionAttr',
                        destinationUrl,
                    },
                );
            });

            it('should use default values when experimentsByUniqueId does NOT contain the uniqueId', () => {
                mockRootStore.engageStore.experimentsByUniqueId = {};

                const eventLabel = 'Get ready for your upcoming holiday';
                const ctaText = 'Manage your holiday';
                const destinationUrl = '/en/booking/my_bookings';

                store.trackManageHolidayImpression('nonExistentUniqueId', eventLabel, ctaText, destinationUrl);

                expect(store.trackEventWithParams).toHaveBeenCalledWith(
                    EventTypes.GenericEvent,
                    {
                        eventCategory: EventCategories.Module,
                        eventAction: EventActions.Impressions,
                        eventLabel,
                        eventType: EventTypes.NonInteraction,
                        eventValue: 'null',
                    },
                    {
                        ...GENERIC_CUSTOM_PARAMS_EMPTY,
                        genericValue1: GenericValue.ManageHoliday,
                        genericValue2: 'null',
                        genericValue3: ctaText,
                        genericValue4: 'Default|Default',
                        destinationUrl,
                    },
                );
            });
        });

        describe('trackManageHolidayClick', () => {
            it('should call trackEventWithParams with correct parameters', () => {
                const uniqueId = 'testUniqueId';
                const eventLabel = 'Get ready for your upcoming holiday';
                const ctaText = 'Manage your holiday';
                const destinationUrl = '/en/booking/my_bookings';

                store.trackManageHolidayClick(uniqueId, eventLabel, ctaText, destinationUrl);

                expect(store.trackEventWithParams).toHaveBeenCalledWith(
                    EventTypes.GenericEvent,
                    {
                        eventCategory: EventCategories.Module,
                        eventAction: EventActions.ImpressionClicked,
                        eventLabel,
                        eventType: EventTypes.Interaction,
                        eventValue: 'null',
                    },
                    {
                        ...GENERIC_CUSTOM_PARAMS_EMPTY,
                        genericValue1: GenericValue.ManageHoliday,
                        genericValue2: 'null',
                        genericValue3: ctaText,
                        genericValue4: 'friendlyId|selectionAttr',
                        destinationUrl,
                    },
                );
            });

            it('should use default values when experimentsByUniqueId does NOT contain the uniqueId', () => {
                mockRootStore.engageStore.experimentsByUniqueId = {};

                const uniqueId = 'nonExistentUniqueId';
                const eventLabel = 'Get ready for your upcoming holiday';
                const ctaText = 'Manage your holiday';
                const destinationUrl = '/en/booking/my_bookings';

                store.trackManageHolidayClick(uniqueId, eventLabel, ctaText, destinationUrl);

                expect(store.trackEventWithParams).toHaveBeenCalledWith(
                    EventTypes.GenericEvent,
                    {
                        eventCategory: EventCategories.Module,
                        eventAction: EventActions.ImpressionClicked,
                        eventLabel,
                        eventType: EventTypes.Interaction,
                        eventValue: 'null',
                    },
                    {
                        ...GENERIC_CUSTOM_PARAMS_EMPTY,
                        genericValue1: GenericValue.ManageHoliday,
                        genericValue2: 'null',
                        genericValue3: ctaText,
                        genericValue4: 'Default|Default',
                        destinationUrl,
                    },
                );
            });
        });
    });

    describe('trackBackToFlightsClick', () => {
        it('should add proper data to dataLayer when referral is not available', async () => {
            const store = new ConcreteTrackingStore(mockRootStore);
            store['pageLoadLayoutId'] = 'id';
            store['pageCategory'] = '';
            store['pageName'] = '';
            await store.initializePageLoadObject({
                category: EventLabels.Back,
                title: EventCategories.HotelDetailsPage,
                url: '',
                pageReferral: '',
            });

            store.addToDataLayer = jest.fn();

            await store.trackBackToFlightsClick('https://www.easyjet.com/en/buy/flights');

            expect(store.addToDataLayer).toHaveBeenCalledWith(
                expect.objectContaining({
                    event: EventTypes.GenericEvent,
                    coreParams: expect.objectContaining({
                        pageReferral: null,
                        referralPageName: null,
                        referralPageCategory: null,
                    }),
                    eventParams: {
                        eventAction: EventActions.AirlineInterstitialPage,
                        eventCategory: EventCategories.HotelDetailsPage,
                        eventLabel: EventLabels.Back,
                        eventType: EventTypes.Interaction,
                    },
                    customParams: {
                        genericValue1: null,
                        genericValue2: null,
                        genericValue3: null,
                        genericValue4: null,
                        destinationUrl: 'https://www.easyjet.com/en/buy/flights',
                    },
                }),
            );
        });

        it('should add proper data to dataLayer when referral is available', async () => {
            const store = new ConcreteTrackingStore(mockRootStore);
            store['pageLoadLayoutId'] = 'id';
            store['pageCategory'] = 'Flights';
            store['pageName'] = 'Flight Search|EN';
            await store.initializePageLoadObject({
                category: 'Book',
                title: 'Hotel Detail Page',
                url: '',
                pageReferral: 'Airline page',
            });

            store.addToDataLayer = jest.fn();

            await store.trackBackToFlightsClick('https://www.easyjet.com/en/buy/flights');

            expect(store.addToDataLayer).toHaveBeenCalledWith(
                expect.objectContaining({
                    event: EventTypes.GenericEvent,
                    coreParams: expect.objectContaining({
                        pageReferral: 'Airline page',
                        referralPageName: 'Flight Search|EN',
                        referralPageCategory: 'Flights',
                    }),
                    eventParams: {
                        eventAction: 'Airline Interstitial Page',
                        eventCategory: 'Hotel Details Page',
                        eventLabel: 'Back',
                        eventType: 'interaction',
                    },
                    customParams: {
                        genericValue1: null,
                        genericValue2: null,
                        genericValue3: null,
                        genericValue4: null,
                        destinationUrl: 'https://www.easyjet.com/en/buy/flights',
                    },
                }),
            );
        });
    });

    describe('trackUnavailablePopup', () => {
        it('should call trackEventWithParams with correct data', () => {
            mockRootStore.bookingStore.selectedOffer = mockedOffer;
            mockRootStore.searchStore = {
                searchWho: {
                    adultsQuantity: 2,
                    childrenQuantity: 1,
                    infantsQuantity: 0,
                },
                searchWhen: {
                    from: new Date('10-10-2020'),
                    to: new Date('12-12-2020'),
                },
            };
            const store = new ConcreteTrackingStore(mockRootStore);

            store.trackEventWithParams = jest.fn();
            store.trackUnavailablePopup();

            expect(store.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                {
                    eventCategory: EventCategories.HolidayUnavailable,
                    eventAction: EventActions.Popup,
                    eventLabel: null,
                    eventType: EventTypes.NonInteraction,
                },
                {
                    genericValue1: 'Hotel Example | Beach Getaway | Resort',
                    genericValue2: 'London Gatwick | Tenerife Airport',
                    genericValue3: `${new Date('10-10-2020')} | ${new Date('12-12-2020')}`,
                    genericValue4: 'A: 2, C: 1, I: 1',
                    destinationUrl: null,
                },
            );
        });

        it('should call trackEventWithParams without selected offer, dates and guests ', () => {
            mockRootStore.bookingStore.selectedOffer = {};
            mockRootStore.searchStore = { searchWho: {}, searchWhen: {} };
            mockGetPassengerConfig = 'A: 0, C: 0, I: 0';

            const store = new ConcreteTrackingStore(mockRootStore);

            store.trackEventWithParams = jest.fn();
            store.trackUnavailablePopup();

            expect(store.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                {
                    eventCategory: EventCategories.HolidayUnavailable,
                    eventAction: EventActions.Popup,
                    eventLabel: null,
                    eventType: EventTypes.NonInteraction,
                },
                {
                    genericValue1: '',
                    genericValue2: '',
                    genericValue3: '',
                    genericValue4: 'A: 0, C: 0, I: 0',
                    destinationUrl: null,
                },
            );
        });

        it('should call trackEventWithParams with correct data when isNotEnoughLCBForLuxBooking is true', () => {
            mockRootStore.bookingStore.isNotEnoughLCBForLuxBooking = true;
            mockRootStore.bookingStore.selectedOffer = mockedOffer;
            const store = new ConcreteTrackingStore(mockRootStore);

            store.trackEventWithParams = jest.fn();
            store.trackUnavailablePopup();

            expect(store.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                {
                    eventCategory: EventCategories.HolidayUnavailable,
                    eventAction: EventActions.PopupLux,
                    eventLabel: EventLabels.LCBFull,
                    eventType: EventTypes.NonInteraction,
                },
                {
                    genericValue1: 'Hotel Example | Beach Getaway | Resort',
                    genericValue2: 'London Gatwick | Tenerife Airport',
                    genericValue3: '',
                    genericValue4: 'A: 2, C: 1, I: 1',
                    destinationUrl: null,
                },
            );
        });
    });

    describe('trackEcoCertified', () => {
        it('should call addToDataLayer with correct data', () => {
            const store = new ConcreteTrackingStore(mockRootStore);
            store.addToDataLayer = jest.fn();

            store.trackEcoCertified(EventTypes.EcoCertifiedIcon, 'hover');

            expect(store.addToDataLayer).toHaveBeenCalledWith({
                event: EventTypes.EcoCertifiedIcon,
                eventParams: {
                    action: 'hover',
                },
            });
        });
    });

    describe('buildSearchDetailObjectBase', () => {
        it('should build search object', () => {
            const date = new Date('2020-01-01T12:00:00.000Z');
            mockRootStore.searchStore.searchWho.isAutoAllocation = true;
            mockRootStore.searchStore.searchFrom.origins = ['LGW'];
            mockRootStore.searchStore.originsWithNames = [];
            mockRootStore.searchStore.searchTo.selectedDestinations = ['ALC'];
            mockRootStore.searchStore.searchTo.isAnywhereSelected = false;
            mockRootStore.searchStore.searchWhen.to = date;
            mockRootStore.searchStore.searchWhen.from = date;
            mockRootStore.hotelsStore.numberOfHotels = 20;

            const store = new ConcreteTrackingStore(mockRootStore);
            const searchObject = store.buildSearchDetailObjectBase(altOffers, EventTypes.PageLoad, {
                dimension22: 'dimension22',
                dimension25: 'dimension25',
                dimension26: 'dimension26',
            });

            expect(searchObject).toStrictEqual({
                dimension108: EventTypes.PageLoad,
                currencyCode: 'GBP',
                dimension13: '2020-20-02',
                dimension18: 'DFG',
                dimension19: 'LGW',
                dimension20: 'Belfast City',
                dimension21: 'SRT',
                dimension22: 'dimension22',
                dimension23: 'Hungary',
                dimension24: 'HRY',
                dimension25: 'dimension25',
                dimension26: 'dimension26',
                dimension27: 'Hungary',
                dimension28: 'HRY',
                dimension29: 'No',
                dimension30: 1,
                dimension31: 'No',
                dimension32: 1,
                dimension33: 'Exact',
                dimension34: NO_FLEXIBILITY,
                dimension35: date,
                dimension36: date,
                dimension37: 'W20',
                dimension40: 4,
                dimension41: 'Exact',
                dimension42: date,
                dimension43: date,
                dimension44: 'W20',
                dimension47: 4,
                dimension49:
                    mockRootStore.searchStore.searchWho.adultsQuantity +
                    mockRootStore.searchStore.searchWho.childrenQuantity,
                dimension50: 'A: 2, C: 1, I: 1',
                dimension51: mockRootStore.searchStore.searchWho.adultsQuantity,
                dimension52: mockRootStore.searchStore.searchWho.childrenQuantity,
                dimension53: mockRootStore.searchStore.searchWho.infantsQuantity,
                dimension54: mockGetNumberOfRooms,
                dimension62: 6,
                dimension79: 5,
                dimension61: 20,
                dimension75: 'relevance_bd4',
                dimension162: 'No',
            });
        });

        it('should call addBd4DimensionsToObject when event is SearchFilterUpdate', () => {
            const store = new ConcreteTrackingStore(mockRootStore);
            store['addBd4DimensionsToObject'] = jest.fn();
            store.buildSearchDetailObjectBase(altOffers, EventTypes.SearchFilterUpdate, {
                dimension22: 'dimension22',
                dimension25: 'dimension25',
                dimension26: 'dimension26',
            });

            expect(store['addBd4DimensionsToObject']).toHaveBeenCalled();
        });

        it('should call addBd4DimensionsToObject when event is PromoPageFilterUpdate', () => {
            const store = new ConcreteTrackingStore(mockRootStore);
            store['addBd4DimensionsToObject'] = jest.fn();
            store.buildSearchDetailObjectBase(altOffers, EventTypes.PromoPageFilterUpdate, {
                dimension22: 'dimension22',
                dimension25: 'dimension25',
                dimension26: 'dimension26',
            });

            expect(store['addBd4DimensionsToObject']).toHaveBeenCalled();
        });

        it('should add dimension74 with total when event is OffersPriceViewChange', () => {
            mockRootStore.layoutStore.isOffersPriceViewTotal = true;
            const store = new ConcreteTrackingStore(mockRootStore);

            const searchObject = store.buildSearchDetailObjectBase(altOffers, EventTypes.OffersPriceViewChange, {
                dimension22: 'dimension22',
                dimension25: 'dimension25',
                dimension26: 'dimension26',
            });

            expect(searchObject.dimension74).toBe('Total');
        });

        it('should add dimension74 with Per Person when event is OffersPriceViewChange', () => {
            mockRootStore.layoutStore.isOffersPriceViewTotal = false;
            const store = new ConcreteTrackingStore(mockRootStore);

            const searchObject = store.buildSearchDetailObjectBase(altOffers, EventTypes.OffersPriceViewChange, {
                dimension22: 'dimension22',
                dimension25: 'dimension25',
                dimension26: 'dimension26',
            });

            expect(searchObject.dimension74).toBe('Per Person');
        });

        it('should get origins from searchFrom store', async () => {
            mockRootStore.searchStore.searchFrom.origins = ['LGW'];
            mockRootStore.searchStore.originsWithNames = [];
            const store = new ConcreteTrackingStore(mockRootStore);

            const result = store.buildSearchDetailObjectBase([], EventTypes.Booking, {
                dimension22: 'dimension22',
                dimension25: 'dimension25',
                dimension26: 'dimension26',
            });

            expect(result.dimension19).toBe('LGW');
            expect(result.dimension30).toBe(1);
        });

        it('should get empty origins when origins are NOT provided', async () => {
            mockRootStore.searchStore.searchFrom.origins = undefined;
            const store = new ConcreteTrackingStore(mockRootStore);

            const result = store.buildSearchDetailObjectBase([], EventTypes.Booking, {
                dimension22: 'dimension22',
                dimension25: 'dimension25',
                dimension26: 'dimension26',
            });

            expect(result.dimension19).toBe('');
            expect(result.dimension30).toBe(0);
        });

        it('should NOT put dimension162 for FlightFiltersUpdate event', () => {
            const store = new ConcreteTrackingStore(mockRootStore);

            const result = store.buildSearchDetailObjectBase([], EventTypes.FlightFiltersUpdate, {
                dimension22: 'dimension22',
                dimension25: 'dimension25',
                dimension26: 'dimension26',
            });

            expect(result.dimension162).toBe(undefined);
        });
    });

    describe('addBookingConfirmationDimensions', () => {
        const mockedBaseHoliday = { baseHolidayProduct: 'base' };
        const mockedUrgencyMessage = { urgencyMessage: 'test' };
        const mockedSeats = [{ seatsProduct: 'seats' }];
        const mockedFlights = [{ flightDeparture: 'flightDeparture' }, { flightReturn: 'flightReturn' }];
        const mockedTransfer = { transferProduct: 'transfer' };
        const mockedBags = ['bag1', 'bag2'];
        const mockedCabinBags = ['lcb product', 'lcb product'];
        const mockedAirportParkingProduct = { category: 'external extras' };

        const mockStoreMethods = store => {
            store.buildBaseHolidayProduct = jest.fn().mockReturnValue(mockedBaseHoliday);
            store.buildUrgencyMessagingDimensions = jest.fn().mockReturnValue(mockedUrgencyMessage);
            store.buildAllSeatsProducts = jest.fn().mockReturnValue(mockedSeats);
            store.buildFlightsProducts = jest.fn().mockReturnValue(mockedFlights);
            store.buildTransferProduct = jest.fn().mockReturnValue(mockedTransfer);
            store.buildBagsBookingFlowProducts = jest.fn().mockReturnValue(mockedBags);
            store.buildLCBProducts = jest.fn().mockReturnValue(mockedCabinBags);
            store.buildAirportParkingProduct = jest.fn().mockReturnValue(mockedAirportParkingProduct);
        };

        it('should add airport parking data to dimensions when airport parking is present', async () => {
            mockRootStore.bookingStore.booking = mockBooking;
            mockRootStore.bookingStore.extraLuggage.getExtraLuggageProductsForTracking = jest.fn(() => []);
            const store = new ConcreteTrackingStore(mockRootStore);

            mockStoreMethods(store);

            const result = await store.addBookingConfirmationDimensions(EventTypes.Purchase);
            const ecommerce = result?.ecommerce as IEcommercePurchase;

            expect(store.buildAirportParkingProduct).toHaveBeenCalledWith(
                mockBooking.airportParking,
                EventTypes.Purchase,
                {
                    baseHolidayProduct: 'base',
                    dimension66: 'Partial Credit',
                    dimension67: 'Partial',
                    dimension68: 10000,
                    dimension69: 1000,
                    metric3: 27,
                    revenue: 10,
                    urgencyMessage: 'test',
                },
            );
            expect(ecommerce?.purchase.products).toEqual(expect.arrayContaining([mockedAirportParkingProduct]));
        });

        it('should return null if booking is not available', async () => {
            const store = new ConcreteTrackingStore(mockRootStore);

            mockRootStore.bookingStore.booking = null;
            const result = await store.addBookingConfirmationDimensions(EventTypes.Booking);
            expect(result).toBeNull();
        });

        it('should return null if baseHoliday is not built', async () => {
            const store = new ConcreteTrackingStore(mockRootStore);

            mockRootStore.bookingStore.booking = {};
            jest.spyOn(store, 'buildBaseHolidayProduct').mockReturnValue(null);
            const result = await store.addBookingConfirmationDimensions(EventTypes.Booking);
            expect(result).toBeNull();
        });

        it('should build and return the correct ecommerce object', async () => {
            const store = new ConcreteTrackingStore(mockRootStore);

            mockRootStore.bookingStore.booking = mockBooking;
            mockRootStore.bookingStore.extraLuggage.getExtraLuggageProductsForTracking = jest.fn(() => []);

            mockStoreMethods(store);

            const result = await store.addBookingConfirmationDimensions(EventTypes.Booking);

            expect(result).toEqual({
                event: EventTypes.Booking,
                dimension136: store.pageName,
                dimension188: 'unchecked',
                enhancedConversion: null,
                pageTitle: store.pageTitle,
                flightReference: 'K6578ZK',
                ecommerce: {
                    purchase: {
                        actionField: {
                            coupon: undefined,
                            event: EventTypes.Booking,
                            id: 'bookingReference',
                            metric3: 27,
                            revenue: 10,
                            timestamp: '2020-20-02',
                        },
                        products: expect.any(Array),
                    },
                },
                paymentMethod: 'ApplePay - Mastercard',
            });
        });

        it('should return dimensions unchanged if no airport parking data', async () => {
            mockBooking.airportParking = undefined;
            mockRootStore.bookingStore.booking = mockBooking;
            mockRootStore.bookingStore.extraLuggage.getExtraLuggageProductsForTracking = jest.fn(() => []);
            const store = new ConcreteTrackingStore(mockRootStore);

            mockStoreMethods(store);

            const result = await store.addBookingConfirmationDimensions(EventTypes.Purchase);
            const ecommerce = result?.ecommerce as IEcommercePurchase;

            expect(store.buildAirportParkingProduct).not.toHaveBeenCalled();
            expect(ecommerce?.purchase.products).not.toEqual(expect.arrayContaining([mockedAirportParkingProduct]));
        });

        describe('urgency message dimensions', () => {
            it('should return the urgency message dimensions properly formatted', async () => {
                const store = new ConcreteTrackingStore(mockRootStore);
                mockBooking.seatSelection![0].flightNumber = mockBooking.package.transport.routes[0].fltNo;
                mockBooking.seatSelection![1].flightNumber = mockBooking.package.transport.routes[1].fltNo;
                mockRootStore.bookingStore.booking = mockBooking;
                mockRootStore.bookingStore.extraLuggage.getExtraLuggageProductsForTracking = jest.fn(() => []);
                mockSeatsUrgencyMessage = 'test seats urgency message';

                const result = await store.addBookingConfirmationDimensions(EventTypes.Booking);
                const ecommerce = result?.ecommerce as IEcommercePurchase;
                const products = ecommerce?.purchase.products || [];

                expect(
                    products.find(product => product.category === ProductCategories.BaseHoliday)!['dimension89'],
                ).toEqual(`null | ${mockSeatsUrgencyMessage} | null`);
                expect(
                    products.find(product => product.category === ProductCategories.FlightDeparture)!['dimension89'],
                ).toBeUndefined();
                expect(
                    products.find(product => product.category === ProductCategories.FlightReturn)!['dimension89'],
                ).toBeUndefined();
                expect(products.find(product => product.category === 'Seats: Return')!['dimension89']).toEqual(
                    mockSeatsUrgencyMessage,
                );
                expect(products.find(product => product.category === 'Seats: Outbound')!['dimension89']).toEqual(
                    mockSeatsUrgencyMessage,
                );
            });
        });
    });

    describe('buildAirportParkingProduct', () => {
        it('should build a valid airport parking product with dimensions', () => {
            const mockedBaseHoliday = {
                brand: 'brand',
                variant: 'beach',
                category: ProductCategories.ExternalExtras,
                coupon: 'PROMO123',
                currencyCode: 'GBP',
                dimension64: 10,
                dimension19: 'LGW',
                dimension21: 'AGP',
                dimension23: 'Spain',
                dimension25: 'Costa del Sol',
                dimension27: 'Marbella',
                dimension35: '2025-08-01',
                dimension42: '2025-08-10',
            };
            const mockedAirportParking = {
                title: 'Parking 1',
                bookingDetails: {
                    productCode: 'P001',
                    totalPrice: 30,
                    type: 'meet_and_greet',
                },
                address: '123 Airport Road',
                description: 'Secure parking near the airport',
            };
            const store = new ConcreteTrackingStore(mockRootStore);

            const result = store.buildAirportParkingProduct(
                mockedAirportParking as IAirportParking,
                EventTypes.ExternalExtrasList,
                mockedBaseHoliday as IBaseHolidayProduct,
            );

            expect(result).toMatchObject({
                category: ProductCategories.ExternalExtras,
                currencyCode: 'GBP',
                quantity: 1,
                item_generic_1: 'Parking 1|P001|meet_and_greet',
                item_generic_2: 'London Gatwick',
                brand: 'brand',
                variant: 'beach',
                dimension108: EventTypes.ExternalExtrasList,
                id: 'External Extras',
                dimension19: 'LGW',
                dimension21: 'AGP',
                dimension23: 'Spain',
                dimension25: 'Costa del Sol',
                dimension27: 'Marbella',
                dimension35: '2025-08-01',
                dimension42: '2025-08-10',
            });
        });
    });

    describe('defaultGalleryMedia', () => {
        let store;

        beforeEach(() => {
            store = new ConcreteTrackingStore(mockRootStore);
        });

        it('should return defaultGalleryMediaContent when isHotelDetailsBookPage is true', () => {
            store.rootStore.layoutStore.isHotelDetailsBookPage = true;
            store.rootStore.bookingStore.selectedOffer = { hotel: { youtubeVideoId: 'video' } };

            expect(store.defaultGalleryMedia).toBe('test');
            expect(mockGetDefaultGalleryMediaContent).toHaveBeenCalledWith(true);
        });

        it('should return defaultGalleryMediaContent when isHotelDetailsBrowsePage is true', () => {
            store.rootStore.layoutStore.isHotelDetailsBrowsePage = true;
            store.rootStore.layoutStore.layout = {
                sitecore: { route: { fields: { YoutubeVideoId: { value: '' } } } },
            };

            expect(store.defaultGalleryMedia).toBe('test');
            expect(mockGetDefaultGalleryMediaContent).toHaveBeenCalledWith(false);
        });

        it('should return empty string when is NOT hotel detail page', () => {
            expect(store.defaultGalleryMedia).toBe('');
            expect(mockGetDefaultGalleryMediaContent).not.toHaveBeenCalled();
        });
    });

    describe('getPlaceholdersGrouping', () => {
        let store: BaseTrackingStore;

        beforeEach(() => {
            store = new ConcreteTrackingStore(mockRootStore);
        });

        it('should return empty string when contentOrder are not available', () => {
            mockRootStore.engageStore.contentOrder = null;

            const result = store['getPlaceholdersGrouping']();

            expect(result).toBe('');
        });

        it('should return component names from contentOrder when available', () => {
            mockRootStore.engageStore.contentOrder = {
                groupName: 'Test',
                placeholders: {
                    'sorter-wrapper-inner': [
                        { componentName: 'ContentOrderComponent1' },
                        { componentName: 'ContentOrderComponent2' },
                    ],
                },
            };

            const result = store['getPlaceholdersGrouping']();

            expect(result).toBe('ContentOrderComponent1|ContentOrderComponent2');
        });

        it('should return empty string when contentOrder has no placeholders', () => {
            mockRootStore.engageStore.contentOrder = { groupName: 'Test' };

            const result = store['getPlaceholdersGrouping']();

            expect(result).toBe('');
        });
    });

    describe('addExtrasPageDimensions', () => {
        let store: BaseTrackingStore;
        let pageLoadObject: IPageLoadObject;

        beforeEach(() => {
            store = new ConcreteTrackingStore(mockRootStore);
            pageLoadObject = {} as IPageLoadObject;
        });

        describe('getAtcomGrouping', () => {
            it('should return default grouping when not personalized', () => {
                const result = store['getAtcomGrouping'](false);
                expect(result).toBe(`${PersonalizationNames.Default} - ${PersonalizationNames.Standard}`);
            });

            it('should return grouping name when personalized and grouping name exists', () => {
                mockRootStore.engageStore.contentOrder = { groupName: 'Test Grouping' } as IContentOrder;

                const result = store['getAtcomGrouping'](true);

                expect(result).toBe(mockRootStore.engageStore.contentOrder.groupName);
            });

            it('should return Default when personalized but no grouping name', () => {
                mockRootStore.engageStore.contentOrder = null;

                const result = store['getAtcomGrouping'](true);

                expect(result).toBe('Default');
            });
        });

        it('should set dimensions for personalized content with valid placeholders', async () => {
            jest.spyOn(cookiesUtils, 'getCookie').mockReturnValue('1');
            mockRootStore.engageStore.engage = {};
            mockRootStore.engageStore.contentOrder = {
                groupName: 'Custom Grouping',
            };
            mockRootStore.bookingStore.selectedOffer = {
                accom: { prom: 'EMAIL25' },
            };

            const getPlaceholdersGroupingSpy = jest
                .spyOn(store as any, 'getPlaceholdersGrouping')
                .mockReturnValue('Banner|PromoBlock');

            await store['addExtrasPageDimensions'](pageLoadObject);

            expect(pageLoadObject).toEqual({
                atcomPromoCode: 'EMAIL25',
                atcomGrouping: 'Custom Grouping',
                placeholders: 'Banner|PromoBlock',
            });
            expect(getPlaceholdersGroupingSpy).toHaveBeenCalled();
        });

        it('should fallback to default personalization name when NOT personalized', async () => {
            jest.spyOn(cookiesUtils, 'getCookie').mockReturnValue('');
            mockRootStore.engageStore.contentOrder = {
                groupName: undefined,
            };
            mockRootStore.bookingStore.selectedOffer = {
                accom: { prom: 'DEAL10' },
            };

            jest.spyOn(store as any, 'getPlaceholdersGrouping').mockReturnValue('');

            await store['addExtrasPageDimensions'](pageLoadObject);

            expect(pageLoadObject).toEqual({
                atcomPromoCode: 'DEAL10',
                atcomGrouping: 'Default - Standard',
                placeholders: '',
            });
        });

        it('should handle absence of placeholders gracefully', async () => {
            jest.spyOn(cookiesUtils, 'getCookie').mockReturnValue('1');
            mockRootStore.engageStore.engage = {};
            mockRootStore.engageStore.contentOrder = {
                groupName: 'SomeGroup',
            };
            mockRootStore.bookingStore.selectedOffer = { accom: { prom: '' } };

            jest.spyOn(store as any, 'getPlaceholdersGrouping').mockReturnValue('');

            await store['addExtrasPageDimensions'](pageLoadObject);

            expect(pageLoadObject).toEqual({
                atcomPromoCode: '',
                atcomGrouping: 'SomeGroup',
                placeholders: '',
            });
        });

        it('should set placeholders to empty string when contentOrder is turned off', async () => {
            jest.spyOn(cookiesUtils, 'getCookie').mockReturnValue('1');
            mockRootStore.engageStore.engage = {};
            mockRootStore.engageStore.contentOrder = null;
            mockRootStore.bookingStore.selectedOffer = { accom: { prom: '' } };

            jest.spyOn(store as any, 'getPlaceholdersGrouping').mockReturnValue('');

            await store['addExtrasPageDimensions'](pageLoadObject);

            expect(pageLoadObject).toEqual({
                atcomPromoCode: '',
                atcomGrouping: 'Default',
                placeholders: '',
            });
        });
    });

    describe('trackSeatMapSitTogetherClick', () => {
        let store: BaseTrackingStore;

        beforeEach(() => {
            store = new ConcreteTrackingStore(mockRootStore);
            store.trackEventWithParams = jest.fn();
        });

        it('should push the correct parameters in outbound flight when sit together checkbox gets checked', () => {
            store.trackSeatMapSitTogetherClick({ flightDirection: SeatMapFlightDirection.Outbound, isChecked: true });

            expect(store.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                {
                    eventAction: EventActions.Checked,
                    eventCategory: EventCategories.SitTogetherCheckbox,
                    eventLabel: 'Seats: Outbound',
                    eventType: EventTypes.Interaction,
                },
                {
                    destinationUrl: null,
                    genericValue1: null,
                    genericValue2: null,
                    genericValue3: null,
                    genericValue4: null,
                },
            );
        });

        it('should push the correct parameters in inbound flight when sit together checkbox gets unchecked', () => {
            store.trackSeatMapSitTogetherClick({ flightDirection: SeatMapFlightDirection.Inbound, isChecked: false });

            expect(store.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                {
                    eventAction: EventActions.Unchecked,
                    eventCategory: EventCategories.SitTogetherCheckbox,
                    eventLabel: 'Seats: Inbound',
                    eventType: EventTypes.Interaction,
                },
                {
                    destinationUrl: null,
                    genericValue1: null,
                    genericValue2: null,
                    genericValue3: null,
                    genericValue4: null,
                },
            );
        });
    });

    describe('trackSeatMapSitTogetherImpression', () => {
        let store: BaseTrackingStore;

        beforeEach(() => {
            store = new ConcreteTrackingStore(mockRootStore);
            store.trackEventWithParams = jest.fn();
        });

        it('should push the correct parameters in outbound flight when sit together checkbox is available', () => {
            store.trackSeatMapSitTogetherImpression({
                flightDirection: SeatMapFlightDirection.Outbound,
                isAvailable: true,
            });

            expect(store.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                {
                    eventAction: 'Impression: Available',
                    eventCategory: EventCategories.SitTogetherCheckbox,
                    eventLabel: 'Seats: Outbound',
                    eventType: EventTypes.NonInteraction,
                },
                {
                    destinationUrl: null,
                    genericValue1: null,
                    genericValue2: null,
                    genericValue3: null,
                    genericValue4: null,
                },
            );
        });

        it('should push the correct parameters in inbound flight when sit together checkbox is not available', () => {
            store.trackSeatMapSitTogetherImpression({
                flightDirection: SeatMapFlightDirection.Inbound,
                isAvailable: false,
            });

            expect(store.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                {
                    eventAction: 'Impression: Unavailable',
                    eventCategory: EventCategories.SitTogetherCheckbox,
                    eventLabel: 'Seats: Inbound',
                    eventType: EventTypes.NonInteraction,
                },
                {
                    destinationUrl: null,
                    genericValue1: null,
                    genericValue2: null,
                    genericValue3: null,
                    genericValue4: null,
                },
            );
        });
    });

    describe('trackUrgencyMessageTileImpression', () => {
        it('should track seats urgency message impression when called', () => {
            const store = new ConcreteTrackingStore(mockRootStore);
            store.trackEventWithParams = jest.fn();
            const impressionLabel = 'test label';

            store.trackUrgencyMessageTileImpression(impressionLabel);

            expect(store.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                {
                    eventCategory: EventCategories.UrgencyMessage,
                    eventAction: EventActions.SeatImpressions,
                    eventLabel: impressionLabel,
                    eventType: EventTypes.NonInteraction,
                },
                {
                    destinationUrl: null,
                    genericValue1: null,
                    genericValue2: null,
                    genericValue3: null,
                    genericValue4: null,
                },
            );
        });
    });

    describe('isIEcommerceDetailObj', () => {
        it('should return true for IEcommerceDetailObj', () => {
            const store = new ConcreteTrackingStore(mockRootStore);
            const detailObj = {
                detail: {
                    actionField: { list: 'testList' },
                    products: [],
                },
            };

            expect(store.isIEcommerceDetailObj(detailObj as TEnhancedEcommerce)).toBe(true);
        });

        it('should return false for non-IEcommerceDetailObj', () => {
            const store = new ConcreteTrackingStore(mockRootStore);
            const nonDetailObj = { event: EventTypes.PageLoad };

            expect(store.isIEcommerceDetailObj(nonDetailObj as TEnhancedEcommerce)).toBe(false);
        });
    });

    describe('trackSearchCriteria', () => {
        const product = {
            currencyCode: CurrencyCode.GBP,
            dimension19: 'LGW|LTN|SEN|STN',
            dimension34: NO_FLEXIBILITY,
            dimension35: '2025-10-08',
            dimension37: 'S25',
            dimension40: 48,
            dimension42: '2025-10-10',
            dimension44: 'S25',
            dimension47: 2,
            dimension50: 'A: 2, C: 0, I: 0',
            dimension54: "I don't mind",
            dimension62: 0,
            dimension61: 445,
            dimension75: 'relevance_bd4',
            dimension162: 'Yes',
        };
        const ecommerce = {
            detail: {
                products: [product],
            },
            impressions: [],
        };

        it('should call addToDataLayer with right params', async () => {
            mockRootStore.layoutStore.isSearchResultsPage = true;
            mockRootStore.searchStore.searchWhen.isMonthSearch = false;

            const store = new ConcreteTrackingStore(mockRootStore);
            store.pageName = 'Search Page';
            store.pageLoadObject = { pageReferral: `https://example.com/referral` } as unknown as IPageLoadObject;
            store.addToDataLayer = jest.fn();
            store.rootStore.searchStore.searchTo.selectedDestinations = [{ name: 'Italy', code: 'IT' }];

            await store.trackSearchCriteria(ecommerce, EventTypes.Search);

            expect(store.addToDataLayer).toHaveBeenCalledWith({
                event: EventTypes.Search,
                holidaySearchSelections: [
                    {
                        item_category: 'Destination',
                        item_category2: 'Italy',
                        item_category3: null,
                        item_category4: null,
                        item_category5: null,
                        item_id: 'IT',
                        item_name: '',
                        item_variant: null,
                        item_generic_1: null,
                        price: 0,
                        quantity: 1,
                    },
                ],
                currencyCode: product.currencyCode,
                pageName: store.pageName,
                multiple_departure_airports_number: 4,
                multiple_destinations_number: 1,
                departure_date_flexibility: product.dimension34,
                departure_date: product.dimension35,
                departure_season: product.dimension37,
                days_to_departure: product.dimension40,
                return_date: product.dimension42,
                return_season: product.dimension44,
                number_of_nights: product.dimension47,
                pax_config: product.dimension50,
                rooms_number: product.dimension54,
                search_results_number: product.dimension61,
                pagination_first_page_results: product.dimension62,
                sort_by: product.dimension75,
                anywhere_selected: product.dimension162,
                pageReferral: store.pageLoadObject?.pageReferral,
            });
        });

        it('should call addToDataLayer with right params when isMonthSearch is true', async () => {
            mockRootStore.layoutStore.isSearchResultsPage = true;
            mockRootStore.searchStore.searchWhen.isMonthSearch = true;

            const store = new ConcreteTrackingStore(mockRootStore);
            store.pageName = 'Search Page';
            store.pageLoadObject = { pageReferral: `https://example.com/referral` } as unknown as IPageLoadObject;
            store.addToDataLayer = jest.fn();

            await store.trackSearchCriteria(ecommerce, EventTypes.Search);

            expect(store.addToDataLayer).toHaveBeenCalledWith(
                expect.objectContaining({
                    departure_date_flexibility: 'Month',
                }),
            );
        });

        it('should pass 0 to multiple_departure_airports_number when nothing selected', async () => {
            const product2 = { ...product, dimension19: '' };
            const ecommerce = {
                detail: {
                    products: [product2],
                },
                impressions: [],
            };
            mockRootStore.layoutStore.isSearchResultsPage = true;
            mockRootStore.searchStore.searchWhen.isMonthSearch = true;

            const store = new ConcreteTrackingStore(mockRootStore);
            store.pageName = 'Search Page';
            store.pageLoadObject = { pageReferral: `https://example.com/referral` } as unknown as IPageLoadObject;
            store.addToDataLayer = jest.fn();

            await store.trackSearchCriteria(ecommerce, EventTypes.Search);

            expect(store.addToDataLayer).toHaveBeenCalledWith(
                expect.objectContaining({
                    multiple_departure_airports_number: 0,
                }),
            );
        });

        it('should NOT call addToDataLayer on not search result page', () => {
            mockRootStore.layoutStore.isSearchResultsPage = false;
            mockRootStore.searchStore.searchWhen.isMonthSearch = true;

            const store = new ConcreteTrackingStore(mockRootStore);
            store.pageName = 'Search Page';
            store.pageLoadObject = { pageReferral: `https://example.com/referral` } as unknown as IPageLoadObject;
            store.addToDataLayer = jest.fn();

            store.trackSearchCriteria(ecommerce, EventTypes.Search);

            expect(store.addToDataLayer).not.toHaveBeenCalled();
        });

        it('should NOT call addToDataLayer when isIEcommerceDetailObj is false', () => {
            mockRootStore.layoutStore.isSearchResultsPage = true;
            mockRootStore.searchStore.searchWhen.isMonthSearch = true;

            const store = new ConcreteTrackingStore(mockRootStore);
            store.pageName = 'Search Page';
            store.pageLoadObject = { pageReferral: `https://example.com/referral` } as unknown as IPageLoadObject;
            store.addToDataLayer = jest.fn();

            store.trackSearchCriteria({}, EventTypes.Search);

            expect(store.addToDataLayer).not.toHaveBeenCalled();
        });

        it('should call addToDataLayer with cheapest month param', async () => {
            mockRootStore.layoutStore.isSearchResultsPage = true;
            mockRootStore.searchStore.searchWhen.isMonthSearch = true;
            mockRootStore.searchStore.searchWhen.isCheapestMonthSelected = true;
            mockRootStore.searchStore.searchWhen.hasCheapestMonthLoaded = true;

            const store = new ConcreteTrackingStore(mockRootStore);

            store.addToDataLayer = jest.fn();

            await store.trackSearchCriteria(ecommerce, EventTypes.Search);

            expect(store.addToDataLayer).toHaveBeenCalledWith(
                expect.objectContaining({
                    departure_date: `${product.dimension35} | Cheapest Month`,
                }),
            );
        });
    });

    describe('trackMapEvent', () => {
        it('should call trackEventWithParams with correct parameters when action and label are provided', () => {
            const store = new ConcreteTrackingStore(mockRootStore);
            store.trackEventWithParams = jest.fn();

            store.trackMapEvent({ action: EventActions.CloseMapClick, label: EventLabels.DestinationGuide });

            expect(store.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                {
                    eventCategory: EventCategories.Map,
                    eventAction: EventActions.CloseMapClick,
                    eventLabel: EventLabels.DestinationGuide,
                    eventType: EventTypes.Interaction,
                },
                {
                    genericValue1: null,
                    genericValue2: null,
                    genericValue3: null,
                    genericValue4: null,
                    destinationUrl: null,
                },
            );
        });
    });

    describe('trackMapPointsOfInterestInteraction', () => {
        it('should call trackEventWithParams with correct parameters', () => {
            const store = new ConcreteTrackingStore(mockRootStore);
            store.trackEventWithParams = jest.fn();

            store.trackMapPointsOfInterestInteraction('test');

            expect(store.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                {
                    eventCategory: EventCategories.Map,
                    eventAction: EventActions.POI,
                    eventLabel: 'test',
                    eventType: EventTypes.Interaction,
                },
                {
                    genericValue1: null,
                    genericValue2: null,
                    genericValue3: null,
                    genericValue4: null,
                    destinationUrl: null,
                },
            );
        });
    });

    describe('trackOptimizelyDecisionData', () => {
        it('should NOT call addToDataLayer when decisionEventDispatched is false', () => {
            const store = new ConcreteTrackingStore(mockRootStore);
            store.addToDataLayer = jest.fn();

            const mockPayload = {
                userId: 'test-user-123',
                attributes: {
                    customAttribute1: 'value1',
                    customAttribute2: 'value2',
                },
                decisionInfo: {
                    ruleKey: 'test-rule-key',
                    flagKey: 'test-flag-key',
                    enabled: true,
                    variationKey: 'variation-a',
                    decisionEventDispatched: false,
                },
            } as unknown as DecisionListenerPayload;

            store.trackOptimizelyDecisionData(mockPayload);

            expect(store.addToDataLayer).not.toHaveBeenCalled();
        });

        it('should call addToDataLayer with correct data', () => {
            const store = new ConcreteTrackingStore(mockRootStore);
            store.addToDataLayer = jest.fn();

            const mockPayload = {
                userId: 'test-user-123',
                attributes: {
                    customAttribute1: 'value1',
                    customAttribute2: 'value2',
                },
                decisionInfo: {
                    ruleKey: 'test-rule-key',
                    flagKey: 'test-flag-key',
                    enabled: true,
                    variationKey: 'variation-a',
                    decisionEventDispatched: true,
                },
            } as unknown as DecisionListenerPayload;

            store.trackOptimizelyDecisionData(mockPayload);

            expect(store.addToDataLayer).toHaveBeenCalledTimes(1);
            expect(store.addToDataLayer).toHaveBeenCalledWith({
                event: EventTypes.OptimizelyFlagDecision,
                userId: 'test-user-123',
                ruleKey: 'test-rule-key',
                flagKey: 'test-flag-key',
                variationKey: 'variation-a',
                isEnabled: true,
                customAttribute1: 'value1',
                customAttribute2: 'value2',
            });
        });
    });

    describe('searchEditTrigger', () => {
        beforeEach(() => {
            mockRootStore.hotelsStore.status = DataStatus.Loaded;
            mockRootStore.searchStore.searchTo.isLoadingDestinations = false;
        });

        it('should add correct data to dataLayer on search results page when the user edits the search', async () => {
            const urgencyMessageMock = { urgencyMessage: 'test' };

            mockRootStore.layoutStore.isSearchResultsPage = true;
            mockRootStore.hotelsStore.offers = [mockedOffer];

            const store = new ConcreteTrackingStore(mockRootStore);

            store.addToDataLayer = jest.fn();
            store.initializePageLoadObject = jest.fn().mockResolvedValue('');
            store.buildUrgencyMessagingDimensions = jest.fn().mockReturnValue(urgencyMessageMock);
            store.trackSearchCriteria = jest.fn();

            await store.searchEditTrigger();

            expect(store.addToDataLayer).toHaveBeenNthCalledWith(1, null);
            expect(store.addToDataLayer).toHaveBeenNthCalledWith(
                2,
                expect.objectContaining({
                    event: EventTypes.SearchCriteriaUpdate,
                    ecommerce: {
                        impressions: [expect.objectContaining(urgencyMessageMock)],
                        detail: {
                            products: [expect.objectContaining({ dimension108: EventTypes.SearchCriteriaUpdate })],
                        },
                    },
                }),
            );

            expect(store.addToDataLayer).toHaveBeenNthCalledWith(3, { event: EventTypes.Bd4tProductList });
            expect(store.trackSearchCriteria).toHaveBeenCalledWith(
                {
                    detail: {
                        products: [expect.any(Object)],
                    },
                    impressions: [expect.any(Object)],
                },
                EventTypes.SearchEdit,
            );
        });

        it('should add correct data to dataLayer on Promo Page when the user edits the search', async () => {
            mockRootStore.layoutStore.isPromoPage = true;

            const store = new ConcreteTrackingStore(mockRootStore);

            store.addToDataLayer = jest.fn();
            store.initializePageLoadObject = jest.fn().mockResolvedValue('');
            store.trackSearchCriteria = jest.fn();

            await store.searchEditTrigger();

            expect(store.addToDataLayer).toHaveBeenNthCalledWith(1, null);
            expect(store.addToDataLayer).toHaveBeenNthCalledWith(
                2,
                expect.objectContaining({
                    event: EventTypes.PromoPageCriteriaUpdate,
                    ecommerce: {
                        impressions: [],
                        detail: {
                            products: [expect.objectContaining({ dimension108: EventTypes.PromoPageCriteriaUpdate })],
                        },
                    },
                }),
            );

            expect(store.addToDataLayer).toHaveBeenNthCalledWith(3, { event: EventTypes.Bd4tProductList });
        });
    });

    describe('buildEcommerceObjectOnPageLoad', () => {
        let store;

        beforeEach(() => {
            mockRootStore.layoutStore = {
                isHotelDetailsBookPage: false,
                isSearchResultsPage: false,
                isExtrasPage: false,
                isGuestDetailsPage: false,
                isConfirmationPage: false,
                isPromoPage: false,
            };
            store = new ConcreteTrackingStore(mockRootStore);
            store.addBookingFlowPageDimension = jest.fn().mockResolvedValue({});
            store.addSearchResultsDimensions = jest.fn().mockResolvedValue({});
            store.addBookingConfirmationDimensions = jest.fn().mockResolvedValue({});
        });

        it('should call addBookingFlowPageDimension with Ecommerce on hotel details book page', async () => {
            store.rootStore.layoutStore.isHotelDetailsBookPage = true;

            await store.buildEcommerceObjectOnPageLoad();

            expect(store.addBookingFlowPageDimension).toHaveBeenCalledWith(EventTypes.Ecommerce);
        });

        it('should call addSearchResultsDimensions with SearchCriteria on search results page', async () => {
            store.rootStore.layoutStore.isSearchResultsPage = true;

            await store.buildEcommerceObjectOnPageLoad();

            expect(store.addSearchResultsDimensions).toHaveBeenCalledWith(EventTypes.SearchCriteria);
        });

        it('should call addBookingFlowPageDimension with Extras on extras page', async () => {
            store.rootStore.layoutStore.isExtrasPage = true;

            await store.buildEcommerceObjectOnPageLoad();

            expect(store.addBookingFlowPageDimension).toHaveBeenCalledWith(EventTypes.Extras);
        });

        it('should call addBookingFlowPageDimension with Guest on guest details page', async () => {
            store.rootStore.layoutStore.isGuestDetailsPage = true;

            await store.buildEcommerceObjectOnPageLoad();

            expect(store.addBookingFlowPageDimension).toHaveBeenCalledWith(EventTypes.Guest);
        });

        it('should call addBookingConfirmationDimensions with Purchase on confirmation page when shouldTrackPurchase returns true', async () => {
            store.rootStore.layoutStore.isConfirmationPage = true;

            await store.buildEcommerceObjectOnPageLoad();

            expect(store.addBookingConfirmationDimensions).toHaveBeenCalledWith(EventTypes.Purchase);
        });

        it('should call addSearchResultsDimensions with PromoPageDefaultFilters on promo page', async () => {
            store.rootStore.layoutStore.isPromoPage = true;

            await store.buildEcommerceObjectOnPageLoad();

            expect(store.addSearchResultsDimensions).toHaveBeenCalledWith(EventTypes.PromoPageDefaultFilters);
        });

        it('should return null when no page flag is set', async () => {
            const result = await store.buildEcommerceObjectOnPageLoad();

            expect(result).toBeNull();
        });
    });

    describe('addSearchResultsDimensions', () => {
        let store;

        beforeEach(() => {
            mockRootStore.hotelsStore.status = DataStatus.Loaded;
            mockRootStore.searchStore.searchTo.isLoadingDestinations = false;
        });

        it('should return null when neither isSearchResultsPage nor isPromoPage', async () => {
            mockRootStore.layoutStore.isSearchResultsPage = false;
            mockRootStore.layoutStore.isPromoPage = false;
            store = new ConcreteTrackingStore(mockRootStore);

            const result = await store.addSearchResultsDimensions(EventTypes.SearchCriteria);

            expect(result).toBeNull();
        });

        it('should return null when hotelsStore status is DataStatus.Error', async () => {
            mockRootStore.layoutStore.isSearchResultsPage = true;
            mockRootStore.hotelsStore.status = DataStatus.Error;
            store = new ConcreteTrackingStore(mockRootStore);

            const result = await store.addSearchResultsDimensions(EventTypes.SearchCriteria);

            expect(result).toBeNull();
        });

        it('should return ecommerce object with correct event and products on search results page', async () => {
            mockRootStore.layoutStore.isSearchResultsPage = true;
            mockRootStore.hotelsStore.offers = [mockedOffer];
            const searchDetailMock = { dimension108: EventTypes.SearchCriteria, name: 'test' };

            store = new ConcreteTrackingStore(mockRootStore);
            store.buildSearchDetailObject = jest.fn().mockReturnValue(searchDetailMock);
            store.buildBaseHolidayProduct = jest.fn().mockReturnValue({ id: 'hotel1' });
            store.buildUrgencyMessagingDimensions = jest.fn().mockReturnValue({});

            const result = await store.addSearchResultsDimensions(EventTypes.SearchCriteria);

            expect(result).toEqual(
                expect.objectContaining({
                    event: EventTypes.SearchCriteria,
                    ecommerce: {
                        detail: { products: [expect.objectContaining({ dimension108: EventTypes.SearchCriteria })] },
                        impressions: [expect.any(Object)],
                    },
                }),
            );
        });

        it('should use buildPromoPageDetailObject on promo page', async () => {
            mockRootStore.layoutStore.isPromoPage = true;
            mockRootStore.hotelsStore.offers = [];

            store = new ConcreteTrackingStore(mockRootStore);
            store.buildPromoPageDetailObject = jest.fn().mockReturnValue({ name: 'promo' } as any);
            store.buildUrgencyMessagingDimensions = jest.fn().mockReturnValue({});

            const result = await store.addSearchResultsDimensions(EventTypes.PromoPageDefaultFilters);

            expect(store.buildPromoPageDetailObject).toHaveBeenCalledWith([], EventTypes.PromoPageDefaultFilters);
            expect(result).toEqual(expect.objectContaining({ event: EventTypes.PromoPageDefaultFilters }));
        });

        it('should override dimension108 in detail object when dimension108 param is provided', async () => {
            mockRootStore.layoutStore.isSearchResultsPage = true;
            mockRootStore.hotelsStore.offers = [];

            store = new ConcreteTrackingStore(mockRootStore);
            store.buildSearchDetailObject = jest.fn().mockReturnValue({ dimension108: EventTypes.SearchFilterUpdate });
            store.buildUrgencyMessagingDimensions = jest.fn().mockReturnValue({});

            const result = await store.addSearchResultsDimensions(
                EventTypes.SearchFilterUpdate,
                undefined,
                EventTypes.SearchFilterUpdateMap,
            );

            expect(result?.ecommerce?.detail?.products[0].dimension108).toBe(EventTypes.SearchFilterUpdateMap);
        });

        it('should use ProductView as impressions dimension108 when no override is provided', async () => {
            mockRootStore.layoutStore.isSearchResultsPage = true;
            mockRootStore.hotelsStore.offers = [mockedOffer];

            store = new ConcreteTrackingStore(mockRootStore);
            store.buildSearchDetailObject = jest.fn().mockReturnValue({});
            store.buildBaseHolidayProduct = jest.fn().mockReturnValue({ id: 'hotel1' });
            store.buildUrgencyMessagingDimensions = jest.fn().mockReturnValue({});

            await store.addSearchResultsDimensions(EventTypes.SearchFilterUpdate);

            expect(store.buildBaseHolidayProduct).toHaveBeenCalledWith(mockedOffer, EventTypes.ProductView, 0);
        });

        it('should add onsite_search_origin field when eventType is SearchCriteria', async () => {
            mockRootStore.layoutStore.isSearchResultsPage = true;
            mockRootStore.hotelsStore.offers = [];

            store = new ConcreteTrackingStore(mockRootStore);
            store.buildSearchDetailObject = jest.fn().mockReturnValue({});
            store.buildUrgencyMessagingDimensions = jest.fn().mockReturnValue({});

            const result = await store.addSearchResultsDimensions(EventTypes.SearchCriteria);

            expect(result).toHaveProperty('onsite_search_origin');
        });

        it('should NOT add onsite_search_origin field when eventType is not SearchCriteria', async () => {
            mockRootStore.layoutStore.isSearchResultsPage = true;
            mockRootStore.hotelsStore.offers = [];

            store = new ConcreteTrackingStore(mockRootStore);
            store.buildSearchDetailObject = jest.fn().mockReturnValue({});
            store.buildUrgencyMessagingDimensions = jest.fn().mockReturnValue({});

            const result = await store.addSearchResultsDimensions(EventTypes.SearchFilterUpdate);

            expect(result).not.toHaveProperty('onsite_search_origin');
        });
    });

    describe('searchInteractionTrigger', () => {
        let store;
        const mockEcommerce = { event: 'mock_event', ecommerce: { detail: { products: [] }, impressions: [] } };

        beforeEach(() => {
            store = new ConcreteTrackingStore(mockRootStore);
            store.addToDataLayer = jest.fn();
            store.addSearchResultsDimensions = jest.fn().mockResolvedValue(mockEcommerce);
            store.rootStore.queryParamsStore.isMap = false;
            store.rootStore.layoutStore.isSearchResultsPage = true;
        });

        it('should pass SearchFilterUpdateMap as dimension108 when event is SearchFilterUpdate and isMap is true', async () => {
            store.rootStore.queryParamsStore.isMap = true;

            await store.searchInteractionTrigger(EventTypes.SearchFilterUpdate, EventTypes.PromoPageFilterUpdate);

            expect(store.addSearchResultsDimensions).toHaveBeenCalledWith(
                EventTypes.SearchFilterUpdate,
                undefined,
                EventTypes.SearchFilterUpdateMap,
            );
        });

        it('should pass undefined as dimension108 when event is SearchFilterUpdate and isMap is false', async () => {
            store.rootStore.queryParamsStore.isMap = false;

            await store.searchInteractionTrigger(EventTypes.SearchFilterUpdate, EventTypes.PromoPageFilterUpdate);

            expect(store.addSearchResultsDimensions).toHaveBeenCalledWith(
                EventTypes.SearchFilterUpdate,
                undefined,
                undefined,
            );
        });

        it('should pass undefined as dimension108 when event is not SearchFilterUpdate even if isMap is true', async () => {
            store.rootStore.queryParamsStore.isMap = true;

            await store.searchInteractionTrigger(EventTypes.AddToBasket, EventTypes.PromoPageFilterUpdate);

            expect(store.addSearchResultsDimensions).toHaveBeenCalledWith(EventTypes.AddToBasket, undefined, undefined);
        });

        it('should use searchResultsEvent as eventType when isSearchResultsPage is true', async () => {
            store.rootStore.layoutStore.isSearchResultsPage = true;

            await store.searchInteractionTrigger(EventTypes.SearchFilterUpdate, EventTypes.PromoPageFilterUpdate);

            expect(store.addSearchResultsDimensions).toHaveBeenCalledWith(
                EventTypes.SearchFilterUpdate,
                undefined,
                undefined,
            );
        });

        it('should use promoPageEvent as eventType when isSearchResultsPage is false', async () => {
            store.rootStore.layoutStore.isSearchResultsPage = false;

            await store.searchInteractionTrigger(EventTypes.SearchFilterUpdate, EventTypes.PromoPageFilterUpdate);

            expect(store.addSearchResultsDimensions).toHaveBeenCalledWith(
                EventTypes.PromoPageFilterUpdate,
                undefined,
                undefined,
            );
        });

        it('should pass extraDetailDimensions to addSearchResultsDimensions', async () => {
            const extraDimensions = { dimension158: 'Select', dimension159: 'Star Rating', dimension160: '4 stars' };

            await store.searchInteractionTrigger(
                EventTypes.SearchFilterUpdate,
                EventTypes.PromoPageFilterUpdate,
                extraDimensions,
            );

            expect(store.addSearchResultsDimensions).toHaveBeenCalledWith(
                EventTypes.SearchFilterUpdate,
                extraDimensions,
                undefined,
            );
        });

        it('should call addToDataLayer with ecommerce result then with Bd4tProductList', async () => {
            await store.searchInteractionTrigger(EventTypes.SearchFilterUpdate, EventTypes.PromoPageFilterUpdate);

            expect(store.addToDataLayer).toHaveBeenCalledTimes(2);
            expect(store.addToDataLayer).toHaveBeenNthCalledWith(1, mockEcommerce);
            expect(store.addToDataLayer).toHaveBeenNthCalledWith(2, { event: EventTypes.Bd4tProductList });
        });
    });

    describe('trackSearchFiltersUpdate', () => {
        const filterMock = {
            groupCode: FilterGroupCodes.StarRating,
            name: '4 stars',
            code: 'AI',
            count: 1,
        };

        it('should call getFilterActionDimensions with correct arguments and then call searchInteractionTrigger', async () => {
            mockRootStore.hotelsStore.status = DataStatus.Loading;
            mockRootStore.searchFiltersStore = { filters: [] };
            const store = new ConcreteTrackingStore(mockRootStore);

            jest.spyOn(store, 'getFilterActionDimensions');
            jest.spyOn(store, 'searchInteractionTrigger').mockResolvedValue(undefined);

            await store.trackSearchFiltersUpdate(true, filterMock);

            expect(store.getFilterActionDimensions).toHaveBeenCalledWith(true, filterMock, undefined);
            expect(store.searchInteractionTrigger).toHaveBeenCalledWith(
                EventTypes.SearchFilterUpdate,
                EventTypes.PromoPageFilterUpdate,
                expect.any(Object),
            );
        });

        it('should pass quickFilterType to getFilterActionDimensions', async () => {
            mockRootStore.hotelsStore.status = DataStatus.Loading;
            const store = new ConcreteTrackingStore(mockRootStore);

            jest.spyOn(store, 'getFilterActionDimensions');
            jest.spyOn(store, 'searchInteractionTrigger').mockResolvedValue(undefined);

            await store.trackSearchFiltersUpdate(false, filterMock, FilterGroupCodes.Recommended);

            expect(store.getFilterActionDimensions).toHaveBeenCalledWith(
                false,
                filterMock,
                FilterGroupCodes.Recommended,
            );
        });

        it('should send BOARD_BASIS_FILTER engage event when BoardType filter is selected', async () => {
            mockRootStore.hotelsStore.status = DataStatus.Loading;
            mockRootStore.engageStore.sendCustomEvent = jest.fn();
            const boardTypeFilter = {
                groupCode: FilterGroupCodes.BoardType,
                name: 'All Inclusive',
                code: 'AI',
                count: 1,
            };
            const store = new ConcreteTrackingStore(mockRootStore);

            jest.spyOn(store, 'searchInteractionTrigger').mockResolvedValue(undefined);

            await store.trackSearchFiltersUpdate(true, boardTypeFilter);

            expect(mockRootStore.engageStore.sendCustomEvent).toHaveBeenCalledWith('BOARD_BASIS_FILTER', {
                boardBasis: 'allInclusive',
            });
        });

        it('should NOT send BOARD_BASIS_FILTER engage event when BoardType filter is deselected', async () => {
            mockRootStore.hotelsStore.status = DataStatus.Loading;
            mockRootStore.engageStore.sendCustomEvent = jest.fn();
            const boardTypeFilter = {
                groupCode: FilterGroupCodes.BoardType,
                name: 'All Inclusive',
                code: 'AI',
                count: 1,
            };
            const store = new ConcreteTrackingStore(mockRootStore);

            jest.spyOn(store, 'searchInteractionTrigger').mockResolvedValue(undefined);

            await store.trackSearchFiltersUpdate(false, boardTypeFilter);

            expect(mockRootStore.engageStore.sendCustomEvent).not.toHaveBeenCalled();
        });
    });

    describe('searchPaginationChangeTrigger', () => {
        it('should call searchInteractionTrigger with SearchResultsPagination and PromoPagePagination', async () => {
            const store = new ConcreteTrackingStore(mockRootStore);
            store.searchInteractionTrigger = jest.fn();

            await store.searchPaginationChangeTrigger();

            expect(store.searchInteractionTrigger).toHaveBeenCalledWith(
                EventTypes.SearchResultsPagination,
                EventTypes.PromoPagePagination,
            );
        });
    });

    describe('searchSortUpdateTrigger', () => {
        it('should call searchInteractionTrigger with SearchSortUpdate and PromoPageSortUpdate', async () => {
            const store = new ConcreteTrackingStore(mockRootStore);
            store.searchInteractionTrigger = jest.fn();

            await store.searchSortUpdateTrigger();

            expect(store.searchInteractionTrigger).toHaveBeenCalledWith(
                EventTypes.SearchSortUpdate,
                EventTypes.PromoPageSortUpdate,
            );
        });
    });
});
