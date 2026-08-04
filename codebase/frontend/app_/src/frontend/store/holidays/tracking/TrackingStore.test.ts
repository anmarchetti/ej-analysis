import { ENGLISH } from 'code/cmsLang';
import { CurrencyCode } from 'code/currency';
import {
    createMockStores,
    mockAmendDatesOfferWithPrice,
    mockAmendPaymentInfo,
    mockAmendPaymentPayload,
    mockAmendPaymentRefundInfo,
    mockBooking,
    mockFeesTrackingProduct,
    mockFlightsRoutes,
    mockOutboundFlight,
    mockTransferWithAmendmentCharges,
    mockValidatedFlights,
} from 'frontend/__mocks__';
import { mockHotel } from 'frontend/__mocks__/hotel';
import { inspireRecommendationResponse, mockGetQuizResultParams } from 'frontend/__mocks__/inspireMeQuiz';
import { mockedOffer } from 'frontend/__mocks__/offer';
import {
    mockedLateRoomCheckout,
    mockedPaymentInfo,
    mockedTimestamp,
    mockedTransfer,
} from 'frontend/__mocks__/tracking';
import { mockedTransport } from 'frontend/__mocks__/transport';
import { SitecoreChannel } from 'frontend/store/base/tracking/sitecore/constants';
import { removeRelatedRegions } from 'frontend/utils/destinations.utils';
import { getLocationHierarchy } from 'frontend/utils/getLocationHierarchy';
import * as offerUtils from 'frontend/utils/offer.utils';
import * as paymentUtils from 'frontend/utils/paymentTransaction';
import AxiosRequest from 'frontend/utils/request';
import * as routeUtils from 'frontend/utils/route.utils';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { createABTestsPipedList } from 'frontend/utils/tracking/abTests.utils';
import { getQuizTabIdentifyingUrl } from 'frontend/utils/tracking/inspireMeQuiz.utils';
import { isAnalyticsDisabled } from 'frontend/utils/tracking/isAnalyticsDisabled';
import * as trackingUtils from 'frontend/utils/tracking/tracking.utils';
import { NO_FLEXIBILITY } from 'frontend/utils/tracking/tracking.utils';
import { ViewBookingTrackingEvents } from 'frontend/utils/tracking/viewBooking.utils';
import { AmendmentType } from 'models/data/IBookingInfo';
import { AmendEventActions, AmendEventLabels, GenericValues } from 'models/data/tracking/AmendEvent';
import { ICustomParams } from 'models/data/tracking/IEventWithParams';
import { IPageLoadObject } from 'models/data/tracking/IPageLoadObject';
import { DataStatus } from 'models/enum/DataStatus';
import { DestinationType } from 'models/enum/DestinationType';
import { FilterGroupCodes } from 'models/enum/FilterGroupCodes';
import { GuestType } from 'models/enum/GuestType';
import { DynamicQuestionTitle, StaticQuestionTitle } from 'models/enum/InspireMeQuiz';
import { RouteDirection } from 'models/enum/RouteDirection';
import { BookingType } from 'models/enum/tracking/BookingType';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { EventActions, EventCategories } from 'models/enum/tracking/GenericEventParams';
import PageLoadCategory from 'models/enum/tracking/PageLoadCategory';
import { ProductCategories, ProductDimensions } from 'models/enum/tracking/ProductCategories';
import { TransferType } from 'models/enum/transfer/TransferType';
import { RoomAllocation } from 'models/RoomAllocation';
import { mockFeesPerPersons } from 'frontend/components/common/PriceBreakdown/__mocks__/priceBreakdown';

import TrackingStore from './TrackingStore';
import { TrackingChangeFeeStore } from './TrackingStore.changeFee';
import { TrackingHotelChangeStore } from './TrackingStore.hotelChange';

jest.mock('frontend/utils/request');
jest.mock('frontend/utils/tracking/isAnalyticsDisabled', () => ({
    isAnalyticsDisabled: jest.fn(() => false),
}));
jest.mock('frontend/utils/getLocationHierarchy', () => ({
    getLocationHierarchy: jest.fn(() => ({ country: { code: 'ES', name: 'United States' } })),
}));

jest.mock('frontend/utils/tracking/abTests.utils', () => ({
    getLayoutABTests: jest.fn().mockReturnValue([]),
    getStorageABTests: jest.fn().mockReturnValue([]),
    createABTestsPipedList: jest.fn().mockReturnValue(''),
}));

jest.mock('frontend/utils/layout.utils', () => ({
    findComponentByName: jest.fn().mockReturnValue({}),
}));

jest.mock('frontend/utils/offer.utils', () => ({
    ...jest.requireActual('frontend/utils/offer.utils'),
    getHotelContractType: jest.fn(args => args),
}));

jest.mock('frontend/utils/tracking/tracking.utils', () => ({
    ...jest.requireActual('frontend/utils/tracking/tracking.utils'),
    getScreenSize: jest.fn(() => 'Screen'),
    getTimestamp: jest.fn(() => mockedTimestamp),
    shouldTrackPurchase: jest.fn(() => true),
}));

jest.mock('frontend/utils/date.utils', () => ({
    ...jest.requireActual('frontend/utils/date.utils'),
    getDaysDifferenceRoundedFloor: jest.fn(() => 1),
}));

jest.mock('frontend/utils/paymentTransaction');
jest.mock('frontend/utils/tracking/inspireMeQuiz.utils');

Object.defineProperties(window, {
    dataLayer: { value: [], writable: true },
    location: { value: { href: 'URL', origin: 'ENV' } },
});
const createRootStore = () =>
    createMockStores({
        bookingStore: {
            alternativeFlights: [],
            isValidatingPackage: false,
            isLoadingOffer: false,
            isPackageValid: true,
            fetchOffer: jest.fn(),
            bookingInfoPayload: {},
            extraLuggage: {
                getExtraLuggageProductsForTracking: jest.fn(() => []),
                getLargeCabinBagsPriceByRoute: jest.fn(() => 15),
            },
            outboundFlight: { direction: RouteDirection.Outbound, depName: 'TestDepartureAirport' },
        },
        appStore: { isScreenExtraSmall: false },
        hotelsStore: { status: DataStatus.Loaded, offers: [], hasHotels: true },
        layoutStore: {
            lang: ENGLISH,
            layout: {},
            layoutName: 'Test',
            pageTitle: 'Book Hotel Details',
            pageFields: {
                PageCategory: mockSitecoreField('PageCategory'),
                TrackingPageTitle: mockSitecoreField('PageTitle'),
            },
            isOffersPriceViewTotal: false,
            isShortlistPage: false,
        },
        metadataStore: { metaPageTitle: 'PageTitle' },
        userStore: { isLoggedIn: false },
        searchStore: {
            searchFrom: {
                origins: [],
            },
            originsWithName: [],
            searchTo: {
                isLoadingDestinations: false,
                selectedDestinations: [],
                selectedDestinationCodes: [],
            },
            searchWhen: {},
            searchWho: {
                roomsAllocation: [new RoomAllocation()],
                roomsAllocationLength: 1,
                isAutoAllocation: false,
                adultsQuantity: 2,
                childrenQuantity: 1,
                infantsQuantity: 1,
            },
            take: 10,
            page: 1,
            selectedOfferIndex: 1,
        },
        seatMapStore: {
            isEnabledToBookSeats: false,
            validatedSelectedSeats: [],
            getFlightAircraftType: jest.fn(() => 'plane'),
        },
        viewBookingStore: {
            viewBookingPayload: {
                amendPaymentPayload: {
                    selectedFlight: {
                        promoCodeBreakDown: {},
                    },
                },
                package: {
                    transport: {
                        routes: mockFlightsRoutes,
                    },
                },
            },
            dimension66: 'Other',
            paymentMethod: 'Visa',
        },
        payStore: { currency: CurrencyCode.EUR },
        marketStore: { currency: CurrencyCode.GBP },
        flightsPassengersStore: { LCBCount: 4 },
        alternativeFlightsStore: { sortAndFilterFlights: jest.fn().mockReturnValue([]) },
        amendPaymentStore: {},
        amendTransfersStore: {},
        engageStore: { sendPromoCodeEvent: jest.fn(), sendCustomEvent: jest.fn() },
        queryParamsStore: { isMap: false },
        promoPageStore: { boardTypeToParentMap: {} },
    });
let rootStore = createRootStore();

describe('<TrackingStore />', () => {
    beforeEach(() => {
        dataLayer = [];
        rootStore = createRootStore();
    });

    describe('common tests', () => {
        let store: TrackingStore;

        beforeEach(() => {
            store = new TrackingStore(rootStore);
            store.addToDataLayer = jest.fn();
            store.trackSearchCriteria = jest.fn();
            store.getFilterActionDimensions = jest.fn().mockReturnValue({});
            AxiosRequest.post = jest.fn().mockResolvedValue({ data: {} });
        });

        it('should add TrackingChangeFeeStore AND TrackingHotelChangeStore instance to changeFee property during initialization', () => {
            expect(store.changeFee instanceof TrackingChangeFeeStore).toBe(true);
            expect(store.changeHotel instanceof TrackingHotelChangeStore).toBe(true);
        });

        describe('getPrices', () => {
            it('should return additional prices with fees', () => {
                expect(store.getPrices(mockAmendPaymentInfo, true)).toStrictEqual({
                    metric6: 0,
                    revenue: 100,
                    productPrice: 80,
                    fees: { feesCount: 1, feesPerPersonAmount: 10 },
                    amendmentCharges: 100,
                });
            });

            it('should return additional prices without fees', () => {
                const result = store.getPrices({
                    ...mockAmendPaymentInfo,
                    feesPerPersons: [],
                });

                expect(result).toStrictEqual({
                    metric6: 0,
                    revenue: 100,
                    productPrice: 100,
                    fees: undefined,
                    amendmentCharges: 100,
                });
            });

            it('should return refund prices with fees', () => {
                expect(store.getPrices(mockAmendPaymentRefundInfo, true)).toStrictEqual({
                    metric6: 80,
                    revenue: 0,
                    productPrice: 0,
                    fees: { feesCount: 1, feesPerPersonAmount: 10 },
                    amendmentCharges: -80,
                });
            });

            it('should return refund prices without fees', () => {
                expect(store.getPrices(mockAmendPaymentRefundInfo)).toStrictEqual({
                    metric6: 80,
                    revenue: 0,
                    productPrice: 0,
                    fees: undefined,
                    amendmentCharges: -80,
                });
            });

            it('should return 0 prices in case of paymentInfo is undefined', () => {
                expect(store.getPrices()).toStrictEqual({
                    metric6: 0,
                    revenue: 0,
                    productPrice: 0,
                    fees: undefined,
                    amendmentCharges: 0,
                });
            });

            it('should return refund prices and product price is 0, when amendment price is positive, but amendment price without fees is negative', () => {
                const result = store.getPrices(
                    {
                        ...mockAmendPaymentRefundInfo,
                        amendmentCharges: 10,
                        amendmentChargesWithoutFees: -10,
                    },
                    true,
                );

                expect(result).toStrictEqual({
                    metric6: 0,
                    revenue: 10,
                    productPrice: 0,
                    fees: { feesCount: 1, feesPerPersonAmount: 10 },
                    amendmentCharges: 10,
                });
            });
        });

        describe('gatherBookingTrackingMeta', () => {
            it('should return generic values', () => {
                expect(store.gatherBookingTrackingMeta(mockBooking)).toEqual({
                    genericValue2: 'LGW-ACE',
                    genericValue3: mockBooking.bookingReference,
                    genericValue4: mockOutboundFlight.extRefId,
                });
            });
        });

        describe('buildSearchDetailObject', () => {
            it('should return search detail object for OffersPriceViewChange event when isOffersPriceViewTotal is false', () => {
                expect(store['buildSearchDetailObject']([], EventTypes.OffersPriceViewChange)).toEqual(
                    expect.objectContaining({
                        currencyCode: CurrencyCode.GBP,
                        dimension108: EventTypes.OffersPriceViewChange,
                        dimension74: 'Per Person',
                    }),
                );
            });

            it('should return search detail object for OffersPriceViewChange event when isOffersPriceViewTotal is true', () => {
                store.rootStore.layoutStore.isOffersPriceViewTotal = true;

                expect(store['buildSearchDetailObject']([], EventTypes.OffersPriceViewChange)).toEqual(
                    expect.objectContaining({
                        dimension74: 'Total',
                    }),
                );
            });
        });

        describe('holidayConfigChangeTrigger', () => {
            it('should add correct data to dataLayer for CTAClick event', () => {
                store.rootStore.bookingStore.selectedOffer = {
                    ...mockedOffer,
                    accom: { ...mockedOffer.accom, isExt: true },
                };

                store.holidayConfigChangeTrigger(EventTypes.CTAClick, 1);

                expect(offerUtils.getHotelContractType).toHaveBeenCalledWith(true, mockedOffer.accom.id);
                expect(store.addToDataLayer).toHaveBeenCalledWith({
                    dimension136: '',
                    ecommerce: {
                        detail: {
                            products: [
                                {
                                    dimension109: 0,
                                    dimension13: '2020-20-02',
                                    dimension137: 'Dynamic',
                                    dimension15: undefined,
                                    dimension16: 4,
                                    dimension17: 'Dynamic',
                                    dimension18: 'London Gatwick',
                                    dimension19: 'LGW',
                                    dimension20: 'Tenerife Airport',
                                    dimension21: 'TFS',
                                    dimension35: '2020-09-12',
                                    dimension36: '2020-09',
                                    dimension37: 'S20',
                                    dimension38: '07:25',
                                    dimension40: 1,
                                    dimension41: ProductDimensions.DateLevel,
                                    dimension42: '2020-09-19',
                                    dimension43: '2020-09',
                                    dimension44: 'S20',
                                    dimension45: '19:10',
                                    dimension47: undefined,
                                    dimension54: 1,
                                    dimension55: '',
                                    dimension56: 'Bed and Breakfast',
                                    dimension77: true,
                                    dimension83: 'flight-1',
                                    dimension96: 0,
                                    event: EventTypes.CTAClick,
                                    price: undefined,
                                },
                            ],
                        },
                    },
                    event: EventTypes.CTAClick,
                });
            });

            it('should add correct data to dataLayer for FlightChangePriceGraph event', () => {
                rootStore.bookingStore.selectedOffer = {
                    ...mockedOffer,
                    accom: { ...mockedOffer.accom, isExt: true },
                };
                store.comparePriceButtonID = 253;
                store.pageLoadObject = {
                    dimension12: 'dimension12',
                } as IPageLoadObject;

                store.holidayConfigChangeTrigger(EventTypes.FlightChangePriceGraph, 1);

                expect(offerUtils.getHotelContractType).toHaveBeenCalledWith(true, mockedOffer.accom.id);
                expect(store.addToDataLayer).toHaveBeenCalledWith({
                    customParams: {
                        genericValue1: 'location 253',
                    },
                    dimension12: 'dimension12',
                    dimension136: '',
                    ecommerce: {
                        detail: {
                            products: [
                                {
                                    dimension109: 0,
                                    dimension13: '2020-20-02',
                                    dimension137: 'Dynamic',
                                    dimension15: undefined,
                                    dimension16: 4,
                                    dimension17: 'Dynamic',
                                    dimension18: 'London Gatwick',
                                    dimension19: 'LGW',
                                    dimension20: 'Tenerife Airport',
                                    dimension21: 'TFS',
                                    dimension35: '2020-09-12',
                                    dimension36: '2020-09',
                                    dimension37: 'S20',
                                    dimension38: '07:25',
                                    dimension40: 1,
                                    dimension41: ProductDimensions.DateLevel,
                                    dimension42: '2020-09-19',
                                    dimension43: '2020-09',
                                    dimension44: 'S20',
                                    dimension45: '19:10',
                                    dimension47: undefined,
                                    dimension54: 1,
                                    dimension55: '',
                                    dimension56: 'Bed and Breakfast',
                                    dimension77: true,
                                    dimension83: 'flight-1',
                                    dimension96: 0,
                                    event: EventTypes.FlightChangePriceGraph,
                                    price: undefined,
                                },
                            ],
                        },
                    },
                    event: EventTypes.FlightChangePriceGraph,
                });
            });
        });

        describe('trackAlternativeFlightFiltersUpdate', () => {
            it('should add correct data to dataLayer for FlightFiltersUpdate event', () => {
                store.getFilterActionDimensions = jest.fn();
                const filterMock = {
                    groupCode: FilterGroupCodes.StarRating,
                    name: 'tripAdvisorRating name',
                };

                store.pageName = 'store page name';
                store.comparePriceButtonID = 253;
                store.pageLoadObject = {
                    dimension12: 'dimension12',
                } as IPageLoadObject;

                store.trackAlternativeFlightFiltersUpdate(true, filterMock);

                expect(store.rootStore.alternativeFlightsStore.sortAndFilterFlights).toHaveBeenCalledWith([]);
                expect(store.getFilterActionDimensions).toHaveBeenCalledWith(true, filterMock);
                expect(store.addToDataLayer).toHaveBeenCalledWith({
                    event: EventTypes.FlightFiltersUpdate,
                    dimension136: 'store page name',
                    dimension12: 'dimension12',
                    customParams: {
                        genericValue1: 'location 253',
                    },
                    ecommerce: {
                        detail: {
                            products: [
                                {
                                    currencyCode: CurrencyCode.GBP,
                                    dimension108: EventTypes.FlightFiltersUpdate,
                                    dimension13: '2020-20-02',
                                    dimension18: '',
                                    dimension19: '',
                                    dimension20: '',
                                    dimension21: '',
                                    dimension22: '',
                                    dimension23: '',
                                    dimension24: '',
                                    dimension25: '',
                                    dimension26: '',
                                    dimension27: '',
                                    dimension28: '',
                                    dimension29: 'No',
                                    dimension30: 0,
                                    dimension31: 'No',
                                    dimension32: 0,
                                    dimension33: 'Exact',
                                    dimension34: NO_FLEXIBILITY,
                                    dimension35: '',
                                    dimension36: '',
                                    dimension37: '',
                                    dimension40: '',
                                    dimension41: ProductDimensions.DateLevel,
                                    dimension42: '',
                                    dimension43: '',
                                    dimension44: '',
                                    dimension47: '',
                                    dimension49: 3,
                                    dimension50: 'A: 2, C: 1, I: 1',
                                    dimension51: 2,
                                    dimension52: 1,
                                    dimension53: 1,
                                    dimension54: '1',
                                    dimension61: undefined,
                                    dimension62: 0,
                                    dimension75: 'Our Favourites',
                                    dimension79: '',
                                },
                            ],
                        },
                    },
                });
            });
        });

        describe('trackTransferAmendment', () => {
            it('should call addToDataLayer with correct parameters for AmendTransferUpdate event', () => {
                store.rootStore.viewBookingStore.booking = mockBooking;
                store.rootStore.amendTransfersStore.selectedTransfer = mockTransferWithAmendmentCharges;
                store.pageCategory = 'pageCategory';
                store.pageName = 'pageName';
                store.buildAmendTransferProduct = jest.fn().mockReturnValue({});

                store.trackTransferAmendment(EventTypes.AmendTransferUpdate);

                expect(store.buildAmendTransferProduct).toHaveBeenCalledWith(
                    mockBooking,
                    EventTypes.AmendTransferUpdate,
                    mockTransferWithAmendmentCharges,
                );
                expect(store.addToDataLayer).toHaveBeenCalledWith({
                    event: EventTypes.AmendTransferUpdate,
                    dimension136: 'pageCategory: pageName',
                    dimension173: 'bookingReference',
                    ecommerce: {
                        currencyCode: CurrencyCode.GBP,
                        detail: {
                            actionField: { list: 'pageCategory: pageName' },
                            products: [{}],
                        },
                    },
                    dimension66: 'Other',
                    paymentMethod: 'Visa',
                });
            });
        });

        describe('trackSuccessfulAmendment', () => {
            it('should call trackRoomAndBoardConfirmClick when amend type is room and board', () => {
                store.roomAndBoard.trackRoomAndBoardConfirmClick = jest.fn();
                store.rootStore.viewBookingStore.successfulAmendmentStatus = AmendmentType.RoomAndBoard;

                store.trackSuccessfulAmendment();

                expect(store.roomAndBoard.trackRoomAndBoardConfirmClick).toHaveBeenCalledWith(
                    EventTypes.PostBookingConfirmationBasket,
                );
            });

            it('should call flight tracking', () => {
                store.rootStore.viewBookingStore.successfulAmendmentStatus = AmendmentType.Flight;
                jest.spyOn(store, 'trackSuccessfulFlightAmendment');

                store.trackSuccessfulAmendment();

                expect(store.trackSuccessfulFlightAmendment).toHaveBeenCalled();
            });

            it('should call transfer tracking', () => {
                store.rootStore.viewBookingStore.successfulAmendmentStatus = AmendmentType.Transfer;
                jest.spyOn(store, 'trackTransferAmendment');

                store.trackSuccessfulAmendment();

                expect(store.trackTransferAmendment).toHaveBeenCalledWith(EventTypes.PostBookingConfirmationBasket);
            });

            it('should call seats tracking', () => {
                store.rootStore.viewBookingStore.successfulAmendmentStatus = AmendmentType.Seats;
                jest.spyOn(store, 'trackSeatsAmendment');

                store.trackSuccessfulAmendment();

                expect(store.trackSeatsAmendment).toHaveBeenCalled();
            });

            it('should call date change confirmation', () => {
                store.rootStore.viewBookingStore.successfulAmendmentStatus = AmendmentType.Dates;
                jest.spyOn(store, 'trackDateChangeConfirmAction');

                store.trackSuccessfulAmendment();

                expect(store.trackDateChangeConfirmAction).toHaveBeenCalledWith(
                    EventTypes.PostBookingConfirmationBasket,
                );
            });
        });

        describe('trackComparePriceTrigger', () => {
            it('should add correct data to dataLayer for PriceGraphExpanded event', () => {
                store.pageName = 'store page name';
                store.comparePriceButtonID = 253;
                store.pageLoadObject = {
                    dimension12: 'dimension12',
                } as IPageLoadObject;

                store.trackComparePriceTrigger(EventTypes.PriceGraphExpanded);

                expect(store.addToDataLayer).toHaveBeenCalledWith({
                    event: EventTypes.PriceGraphExpanded,
                    dimension13: '2020-20-02',
                    dimension136: 'store page name',
                    dimension12: 'dimension12',
                    customParams: {
                        genericValue1: 'location 253',
                    },
                });
            });
        });

        describe('generateGenericValuesWithGuests', () => {
            it('should return generic values', () => {
                store.rootStore.viewBookingStore.booking = mockBooking;

                expect(store.generateGenericValuesWithGuests({ extraValue: 'extraValue' } as ICustomParams)).toEqual({
                    genericValue1: null,
                    genericValue2: null,
                    genericValue3: 'A: 2, C: 0, I: 0',
                    genericValue4: 'bookingReference',
                    extraValue: 'extraValue',
                });
            });
        });

        describe('Sustainability', () => {
            it('should return true when ecoFacility name exist', () => {
                const products = store['buildBaseHolidayProduct'](mockedOffer, EventTypes.SearchCriteria);

                expect(products?.dimension183).toBe(true);
            });

            it('should return false when ecoFacility name does NOT exist', () => {
                mockHotel.ecoFacility.name = '';

                const products = store['buildBaseHolidayProduct'](mockedOffer, EventTypes.SearchCriteria);

                expect(products?.dimension183).toBe(false);
            });
        });

        describe('trackGenericAmendmentAction', () => {
            it('should call trackEventWithParams with correct parameters', () => {
                store.rootStore.viewBookingStore.booking = mockBooking;
                jest.spyOn(store, 'trackEventWithParams');

                store.trackGenericAmendmentAction(AmendEventActions.ChangeTransfer, 'Price Change: Decline');

                expect(store.trackEventWithParams).toHaveBeenCalledWith(
                    EventTypes.GenericEvent,
                    {
                        eventCategory: EventCategories.Holidays,
                        eventType: EventTypes.Interaction,
                        eventAction: AmendEventActions.ChangeTransfer,
                        eventLabel: 'Price Change: Decline',
                    },
                    {
                        genericValue1: null,
                        genericValue3: null,
                        genericValue2: null,
                        genericValue4: 'bookingReference',
                    },
                );
            });
        });

        describe('trackCustomError', () => {
            it('should add correct data to dataLayer', async () => {
                await store.trackCustomError('404', 'test error message');

                expect(store.addToDataLayer).toHaveBeenCalledWith({
                    event: EventTypes.ErrorMessage,
                    dimension13: mockedTimestamp,
                    dimension86: '404',
                    dimension87: 'test error message',
                    dimension136: 'PageTitle|EN',
                });
            });
        });

        describe('searchEditTrigger', () => {
            beforeEach(() => {
                store.initializePageLoadObject = jest.fn();
            });

            it('should call addToDataLayer 3 times for search results page', async () => {
                rootStore.layoutStore.isSearchResultsPage = true;

                await store.searchEditTrigger();

                expect(store.addToDataLayer).toHaveBeenCalledTimes(3);
                expect(store.addToDataLayer).toHaveBeenNthCalledWith(
                    2,
                    expect.objectContaining({
                        event: EventTypes.SearchCriteriaUpdate,
                    }),
                );
                expect(store.addToDataLayer).toHaveBeenNthCalledWith(3, { event: EventTypes.Bd4tProductList });
                expect(store.trackSearchCriteria).toHaveBeenCalledWith(
                    {
                        detail: {
                            products: [expect.any(Object)],
                        },
                        impressions: [],
                    },
                    EventTypes.SearchEdit,
                );
            });

            it('should call addToDataLayer 3 times for promo page', async () => {
                rootStore.layoutStore.isSearchResultsPage = false;
                rootStore.layoutStore.isPromoPage = true;

                await store.searchEditTrigger();

                expect(store.addToDataLayer).toHaveBeenCalledTimes(3);
                expect(store.addToDataLayer).toHaveBeenNthCalledWith(
                    2,
                    expect.objectContaining({
                        event: EventTypes.PromoPageCriteriaUpdate,
                    }),
                );
                expect(store.addToDataLayer).toHaveBeenNthCalledWith(3, { event: EventTypes.Bd4tProductList });
            });
        });

        describe('callTagManager', () => {
            it('should NOT add anything when GA is disabled globally', async () => {
                (isAnalyticsDisabled as any).mockReturnValueOnce(true);

                await store.callTagManager();

                expect(store.addToDataLayer).not.toHaveBeenCalled();
            });

            it('should add pageLoadObject', async () => {
                jest.spyOn(store, 'defaultGalleryMedia', 'get').mockReturnValue('test');

                await store.callTagManager();

                expect(store.addToDataLayer).toHaveBeenCalledWith({
                    event: EventTypes.PageLoad,
                    pageName: 'PageTitle|EN',
                    pageTitle: 'PageTitle',
                    pageCategory: 'PageCategory',
                    pageReferral: '',
                    channel: SitecoreChannel.Desktop,
                    currencyCode: CurrencyCode.GBP,
                    dimension3: 'Package',
                    dimension2: 'Website',
                    dimension6: 'EN',
                    dimension7: 'URL',
                    dimension8: 'Landscape',
                    dimension9: 'Screen',
                    dimension10: '',
                    dimension11: '',
                    dimension13: mockedTimestamp,
                    dimension5: 'v1.0.0',
                    dimension92: 'No',
                    dimension4: 'ENV',
                    dimension12: '',
                    dimension1: '',
                    dimension95: '',
                    dimension88: 'test',
                    atcomGrouping: null,
                    atcomPromoCode: null,
                    placeholders: null,
                });
            });

            it('should NOT add pageLoadObject for Holiday Inspiration page', async () => {
                rootStore.layoutStore.isHolidayInspirationPage = true;

                await store.callTagManager();

                expect(store.addToDataLayer).not.toHaveBeenCalled();
            });

            it('should set pageLoadObject dimension for previous page', async () => {
                rootStore.layoutStore.pageFields.TrackingPageTitle.value = 'Page-1';
                rootStore.layoutStore.pageFields.PageCategory.value = 'Category-1';

                await store.callTagManager();

                expect(store.addToDataLayer).toHaveBeenNthCalledWith(
                    3,
                    expect.objectContaining({
                        pageName: 'Page-1|EN',
                        pageCategory: 'Category-1',
                        pageReferral: '',
                        dimension10: '',
                        dimension11: '',
                    }),
                );

                store.rootStore.layoutStore.pageFields!.TrackingPageTitle.value = 'Page-2';
                store.rootStore.layoutStore.pageFields!.PageCategory.value = 'Category-2';

                await store.callTagManager();

                expect(store.addToDataLayer).toHaveBeenNthCalledWith(
                    6,
                    expect.objectContaining({
                        pageName: 'Page-2|EN',
                        pageCategory: 'Category-2',
                        pageReferral: 'URL',
                        dimension10: 'Page-1|EN',
                        dimension11: 'Category-1',
                    }),
                );
            });

            it('should set pageLoadObject dimension that user is logged in', async () => {
                rootStore.userStore.isLoggedIn = true;

                await store.callTagManager();

                expect(store.addToDataLayer).toHaveBeenCalledWith(
                    expect.objectContaining({
                        event: EventTypes.PageLoad,
                        pageName: 'PageTitle|EN',
                        pageTitle: 'PageTitle',
                        pageCategory: 'PageCategory',
                        channel: SitecoreChannel.Desktop,
                        currencyCode: CurrencyCode.GBP,
                        dimension3: 'Package',
                        dimension2: 'Website',
                        dimension6: 'EN',
                        dimension7: 'URL',
                        dimension8: 'Landscape',
                        dimension9: 'Screen',
                        dimension13: mockedTimestamp,
                        dimension5: 'v1.0.0',
                        dimension92: 'Yes',
                    }),
                );
            });

            it('should send engage event when isHotelDetailsBookPage is true', async () => {
                rootStore.layoutStore.isHotelDetailsBookPage = true;
                rootStore.bookingStore.selectedOffer = mockedOffer;

                await store.callTagManager();

                expect(rootStore.engageStore.sendPromoCodeEvent).toHaveBeenCalledWith(mockedOffer.accom.prom);
            });

            describe('DestinationPage', () => {
                it('Should add DestinationGuide and unique GlobalObject for not Hotel Destination Page)', async () => {
                    (getLocationHierarchy as any).mockReturnValueOnce({
                        country: { code: 'ES', name: 'Vereinigte Staaten', itemName: 'United States' },
                    });

                    rootStore.layoutStore.isDestinationPage = true;
                    rootStore.layoutStore.pageFields.TrackingPageTitle.value = 'Destination Guide: Test';
                    const store = new TrackingStore(rootStore);

                    await store.callTagManager();
                    expect(dataLayer).toHaveLength(2);
                    expect(dataLayer[0]).toEqual(
                        expect.objectContaining({
                            event: EventTypes.PageLoad,
                            pageName: 'Destination Guide: Test|EN',
                            pageCategory: 'Destination Guide: PageCategory',
                        }),
                    );
                    expect(dataLayer[1]).toEqual({
                        event: EventTypes.DestinationGuide,
                        dimension136: 'Destination Guide: Test|EN',
                        dimension13: mockedTimestamp,
                        currencyCode: 'GBP',
                        dimension22: 'PageCategory',
                        dimension23: 'United States',
                        dimension24: 'ES',
                        dimension25: '',
                        dimension26: '',
                        dimension27: '',
                        dimension28: '',
                    });
                });

                it('Should add only GlobalObject for HotelBrowsePage', async () => {
                    rootStore.layoutStore.isDestinationPage = true;
                    rootStore.layoutStore.isHotelDetailsBrowsePage = true;
                    const store = new TrackingStore(rootStore);

                    await store.callTagManager();
                    expect(dataLayer).toHaveLength(1);
                    expect(dataLayer[0]).toEqual(
                        expect.objectContaining({
                            event: EventTypes.PageLoad,
                            pageName: 'PageTitle|EN',
                            pageCategory: 'PageCategory',
                        }),
                    );
                });
            });

            describe('ExtrasPage', () => {
                beforeEach(() => {
                    rootStore.layoutStore.isExtrasPage = true;
                    rootStore.bookingStore.selectedOffer = mockedOffer;
                });

                it('Should add Global and Ecommerce Objects', async () => {
                    const store = new TrackingStore(rootStore);

                    await store.callTagManager();

                    expect(dataLayer).toHaveLength(3);
                    expect(dataLayer[2]).toHaveProperty('event', EventTypes.PageLoad);
                    expect(dataLayer[1]).toEqual(
                        expect.objectContaining({
                            event: EventTypes.Extras,
                            dimension136: 'PageTitle|EN',
                            dimension101: 'OK',
                            pageTitle: 'PageTitle',
                            ecommerce: expect.objectContaining({
                                detail: expect.objectContaining({
                                    products: expect.any(Array),
                                }),
                                impressions: [],
                            }),
                            greenPromo: 'LCB:N|HB:N',
                        }),
                    );
                    expect(dataLayer[0]).toEqual({
                        event: EventTypes.BookingFlow,
                        bookingType: BookingType.HolidaysBooking,
                    });
                });

                it('Should set No Available status', async () => {
                    rootStore.bookingStore.isPackageValid = false;
                    const store = new TrackingStore(rootStore);

                    await store.callTagManager();

                    expect(dataLayer[1]).toHaveProperty('dimension101', 'Not Available');
                });

                it('Should set Available status', async () => {
                    rootStore.bookingStore.isPackageValid = true;
                    const store = new TrackingStore(rootStore);

                    await store.callTagManager();

                    expect(dataLayer[1]).toHaveProperty('dimension101', 'OK');
                });

                it('Should set price change status', async () => {
                    rootStore.bookingStore.isPackageValid = true;
                    rootStore.bookingStore.previousPrice = 50;
                    rootStore.bookingStore.packageInfo = { paymentInfo: { totalPrice: 150 } };
                    const store = new TrackingStore(rootStore);

                    await store.callTagManager();

                    expect(dataLayer[1]).toHaveProperty('dimension101', 'Price change: +100');
                });

                describe('Seat Map test variant', () => {
                    it('Should track Seat Map dynamic seats', async () => {
                        rootStore.seatMapStore.isSeatMapFlowEnabled = true;
                        rootStore.seatMapStore.outboundFlight = { isExt: true };
                        (createABTestsPipedList as any).mockReturnValueOnce('104B');

                        const store = new TrackingStore(rootStore);

                        await store.callTagManager();

                        expect(createABTestsPipedList).toHaveBeenCalledWith([{ testId: '104', testVariant: 'B' }]);
                        expect(dataLayer[2]).toHaveProperty('dimension12', '104B');
                    });

                    it('Should track Seat Map series seats', async () => {
                        rootStore.seatMapStore.isSeatMapFlowEnabled = true;
                        rootStore.seatMapStore.outboundFlight = { isExt: false };
                        (createABTestsPipedList as any).mockReturnValueOnce('104C');

                        const store = new TrackingStore(rootStore);

                        await store.callTagManager();

                        expect(createABTestsPipedList).toHaveBeenCalledWith([{ testId: '104', testVariant: 'C' }]);
                        expect(dataLayer[2]).toHaveProperty('dimension12', '104C');
                    });

                    it('Should not track Seat Map test variant if seats disabled', async () => {
                        rootStore.seatMapStore.isSeatMapFlowEnabled = false;
                        (createABTestsPipedList as any).mockReturnValueOnce('');

                        const store = new TrackingStore(rootStore);

                        await store.callTagManager();

                        expect(createABTestsPipedList).toHaveBeenCalledWith([]);
                        expect(dataLayer[2]).toHaveProperty('dimension12', '');
                    });
                });
            });

            describe('GuestDetailsPage', () => {
                it('Should add Global and Ecommerce Objects', async () => {
                    rootStore.layoutStore.isGuestDetailsPage = true;
                    rootStore.bookingStore.isLoadingBookingConfirmationInfo = false;
                    const store = new TrackingStore(rootStore);

                    await store.callTagManager();

                    expect(dataLayer).toHaveLength(3);
                    expect(dataLayer[1]).toEqual({
                        event: EventTypes.Guest,
                        dimension136: 'PageTitle|EN',
                        dimension188: 'unchecked',
                        pageTitle: 'PageTitle',
                        ecommerce: { detail: { products: [] } },
                    });
                });
            });

            describe('ConfirmationPage', () => {
                beforeEach(() => {
                    jest.spyOn(trackingUtils, 'shouldTrackPurchase').mockReturnValue(true);
                });

                it('Should add only GlobalObject when should NOT track purchase', async () => {
                    jest.spyOn(trackingUtils, 'shouldTrackPurchase').mockReturnValue(false);
                    rootStore.layoutStore.isConfirmationPage = true;
                    rootStore.bookingStore.isLoadingBookingConfirmationInfo = false;
                    const store = new TrackingStore(rootStore);

                    await store.callTagManager();

                    expect(dataLayer).toHaveLength(1);
                    expect(paymentUtils.setTransactionTracked).not.toHaveBeenCalled();
                });

                it('Should add only GlobalObject when there is NO booking', async () => {
                    rootStore.layoutStore.isConfirmationPage = true;
                    rootStore.bookingStore.isLoadingBookingConfirmationInfo = false;
                    rootStore.bookingStore.booking = null;
                    const store = new TrackingStore(rootStore);

                    await store.callTagManager();

                    expect(dataLayer).toHaveLength(2);
                    expect(paymentUtils.setTransactionTracked).not.toHaveBeenCalled();
                });

                describe('when ecommerce exists', () => {
                    beforeEach(() => {
                        jest.spyOn(trackingUtils, 'shouldTrackPurchase').mockReturnValue(true);
                        rootStore.layoutStore.isConfirmationPage = true;
                        rootStore.bookingStore.accommodationId = 'SWEDFR362';
                        rootStore.bookingStore.isLoadingBookingConfirmationInfo = false;
                        rootStore.bookingStore.bookingInfoPayload = { promocode: null };
                        rootStore.bookingStore.booking = {
                            bookingReference: '123',
                            guests: [
                                { type: GuestType.Adult },
                                { type: GuestType.Child, age: 5 },
                                { type: GuestType.Child, age: 6 },
                            ],
                            package: {
                                accom: {
                                    endDate: '2020-09-12',
                                    startDate: '2020-09-19',
                                    code: 'accom_code',
                                    hotel: mockHotel,
                                    rooms: [{ code: 'Room-1' }],
                                },
                                transport: mockedTransport,
                            },
                            paymentInfo: mockedPaymentInfo,
                            prom: 'EUBF',
                            hotel: mockHotel,
                        };
                        rootStore.bookingStore.selectedOffer = { ...mockedTransfer, ...mockedOffer };
                        rootStore.bookingStore.lateRoomCheckout = { ...mockedLateRoomCheckout };
                    });

                    it('Should add Global and Ecommerce Objects', async () => {
                        const store = new TrackingStore(rootStore);

                        await store.callTagManager();

                        expect(dataLayer).toHaveLength(3);

                        const ecommerce = dataLayer[1].ecommerce;
                        expect(ecommerce.purchase.actionField).toEqual({
                            event: EventTypes.Booking,
                            id: '123',
                            timestamp: mockedTimestamp,
                            revenue: 1000,
                            coupon: '',
                            metric3: 0,
                        });
                        expect(ecommerce.purchase.products).toHaveLength(5);
                        expect(paymentUtils.setTransactionTracked).toHaveBeenCalled();
                        expect(AxiosRequest.post).toHaveBeenCalledWith('http://test/cms-api/tracking/booking-data', {
                            AccommodationId: 'H123',
                            Image: 'large_image_url.jpg',
                        });
                    });

                    it('should send medium image when large is empty', async () => {
                        rootStore.bookingStore.booking.hotel = {
                            ...mockHotel,
                            images: [{ ...mockHotel.images[0], large: '' }],
                        };

                        const store = new TrackingStore(rootStore);
                        await store.callTagManager();

                        expect(AxiosRequest.post).toHaveBeenCalledWith('http://test/cms-api/tracking/booking-data', {
                            AccommodationId: 'H123',
                            Image: 'medium_image_url.jpg',
                        });
                    });

                    it('should send small image when large and medium are empty', async () => {
                        rootStore.bookingStore.booking.hotel = {
                            ...mockHotel,
                            images: [{ ...mockHotel.images[0], large: '', medium: '' }],
                        };

                        const store = new TrackingStore(rootStore);
                        await store.callTagManager();

                        expect(AxiosRequest.post).toHaveBeenCalledWith('http://test/cms-api/tracking/booking-data', {
                            AccommodationId: 'H123',
                            Image: 'small_image_url.jpg',
                        });
                    });

                    it('should track flight reference during booking event', async () => {
                        jest.spyOn(routeUtils, 'getFlightsReferences').mockReturnValue(['test-flight']);

                        const store = new TrackingStore(rootStore);
                        await store.callTagManager();

                        expect(dataLayer).toHaveLength(3);
                        const bookingTracking = dataLayer[1];
                        expect(bookingTracking.flightReference).toEqual('test-flight');
                    });

                    it('should populate track flight reference with "Series" when flight reference is NOT provided', async () => {
                        jest.spyOn(routeUtils, 'getFlightsReferences').mockReturnValue([]);

                        const store = new TrackingStore(rootStore);
                        await store.callTagManager();

                        expect(dataLayer).toHaveLength(3);
                        const bookingTracking = dataLayer[1];
                        expect(bookingTracking.flightReference).toEqual('Series');
                    });
                });
            });

            it('Should add specialRequestPurchase event on ConfirmationPage when booking.specialRequests exists', async () => {
                rootStore.layoutStore.isConfirmationPage = true;
                rootStore.bookingStore.isLoadingBookingConfirmationInfo = false;
                rootStore.bookingStore.bookingInfoPayload = { promocode: null };
                rootStore.bookingStore.booking = {
                    bookingReference: '123',
                    specialRequests: [
                        { code: '1', displayName: 'displayName1', name: 'name1', groupCode: 'testGroupCode' },
                        { code: '2', displayName: 'displayName2', name: 'name2', groupCode: 'testGroupCode' },
                        { code: '3', displayName: 'displayName3', name: 'name3', groupCode: 'testGroupCode' },
                    ],
                    guests: [
                        { type: GuestType.Adult },
                        { type: GuestType.Child, age: 5 },
                        { type: GuestType.Child, age: 6 },
                    ],
                    package: {
                        accom: {
                            endDate: '2020-09-12',
                            startDate: '2020-09-19',
                            code: 'accom_code',
                            hotel: mockHotel,
                            rooms: [{ code: 'Room-1' }],
                        },
                        transport: mockedTransport,
                    },
                    paymentInfo: mockedPaymentInfo,
                    prom: 'EUBF',
                };
                rootStore.bookingStore.selectedOffer = mockedOffer;
                const store = new TrackingStore(rootStore);

                await store.callTagManager();

                expect(dataLayer.find(el => el.event === EventTypes.SpecialRequestPurchase)).toEqual({
                    event: EventTypes.SpecialRequestPurchase,
                    eventParams: {
                        bookingId: '123',
                        numOfRequests: 3,
                        reqsSelected: '1|2|3',
                        type: 'testGroupCode',
                    },
                });
            });

            describe('ViewBookingPage', () => {
                it('Should add GlobalObject with unique dimensions', async () => {
                    rootStore.layoutStore.isViewBookingPage = true;
                    jest.spyOn(trackingUtils, 'shouldTrackPurchase').mockReturnValue(false);
                    rootStore.viewBookingStore = {
                        booking: { bookingReference: '123', paymentInfo: mockedPaymentInfo },
                    };
                    const store = new TrackingStore(rootStore);

                    await store.callTagManager();

                    expect(dataLayer).toHaveLength(1);
                    expect(dataLayer[0]).toEqual(
                        expect.objectContaining({
                            id: '123',
                            revenue: 1000,
                            dimension98: 200,
                            dimension99: 20,
                        }),
                    );
                });
            });

            describe('ShortlistPage', () => {
                it('Should set number of shortlists', async () => {
                    rootStore.layoutStore.isShortlistPage = true;
                    const store = new TrackingStore(rootStore);

                    await store.callTagManager();

                    expect(dataLayer[0]).toHaveProperty('dimension95', 1);
                });
            });

            describe('PromoPage', () => {
                it('Should add Global, Ecommerce and bd4ProductList Objects', async () => {
                    rootStore.layoutStore.isPromoPage = true;
                    rootStore.layoutStore.pageFields.TrackingPageTitle.value = 'Promo: Test';

                    const store = new TrackingStore(rootStore);
                    store.bd4SortTracking = null;
                    await store.callTagManager();

                    const pageLoadEvent = dataLayer[1];

                    expect(dataLayer).toHaveLength(3);
                    expect(pageLoadEvent).toHaveProperty('event', EventTypes.PageLoad);
                    expect(dataLayer[0]).toHaveProperty('event', EventTypes.PromoPageDefaultFilters);
                    expect(dataLayer[2]).toHaveProperty('event', EventTypes.Bd4tProductList);

                    expect(pageLoadEvent).toHaveProperty('pageName', 'Promo: Test|EN');
                    expect(pageLoadEvent).not.toHaveProperty('dimension143');
                    expect(pageLoadEvent).not.toHaveProperty('dimension144');
                    expect(pageLoadEvent).not.toHaveProperty('dimension145');
                    expect(pageLoadEvent).not.toHaveProperty('dimension146');
                });

                it('Should add GlobalObject with bd4 dimensions', async () => {
                    rootStore.layoutStore.isPromoPage = true;
                    const store = new TrackingStore(rootStore);
                    store.bd4SortTracking = {
                        pToken: 'pToken',
                        apiUrl: 'apiUrl',
                        apiMessage: 'apiMessage',
                        tracking: null,
                    };
                    await store.callTagManager();

                    expect(dataLayer[1]).toEqual(
                        expect.objectContaining({
                            dimension143: 'pToken',
                            dimension144: 'apiUrl',
                            dimension145: 'apiMessage',
                            dimension146: null,
                        }),
                    );
                });
            });

            describe('PromoPage Board Basis Tracking', () => {
                it('should send BOARD_PROMO_PAGE_VIEWED event with canonical board basis when user views promo page', async () => {
                    rootStore.layoutStore.isPromoPage = true;
                    rootStore.searchFiltersStore.selectedFilters = [
                        { groupCode: FilterGroupCodes.BoardType, code: 'AI' },
                    ];
                    rootStore.searchFiltersStore.filters = [
                        {
                            code: FilterGroupCodes.BoardType,
                            options: [
                                { code: 'AI', children: [] },
                                { code: 'HB', children: [] },
                            ],
                        },
                    ];
                    const rsPromo = rootStore as unknown as any;
                    rsPromo.promoPageStore = {
                        boardTypeToParentMap: { AI: 'AI', HB: 'HB' },
                    };

                    const store = new TrackingStore(rootStore);
                    store.addToDataLayer = jest.fn();

                    await store.callTagManager();

                    expect(rootStore.engageStore.sendCustomEvent).toHaveBeenCalledWith('BOARD_PROMO_PAGE_VIEWED', {
                        boardBasis: 'allInclusive',
                    });
                });

                it('should deduplicate board basis when multiple variants resolve to same parent', async () => {
                    rootStore.layoutStore.isPromoPage = true;
                    rootStore.searchFiltersStore.selectedFilters = [
                        { groupCode: FilterGroupCodes.BoardType, code: 'AI' },
                        { groupCode: FilterGroupCodes.BoardType, code: 'AI+' },
                        { groupCode: FilterGroupCodes.BoardType, code: 'AS' },
                    ];
                    rootStore.searchFiltersStore.filters = [
                        {
                            code: FilterGroupCodes.BoardType,
                            options: [
                                {
                                    code: 'AI',
                                    children: [
                                        { code: 'AI+', children: [] },
                                        { code: 'AS', children: [] },
                                    ],
                                },
                            ],
                        },
                    ];
                    const rsPromo = rootStore as unknown as any;
                    rsPromo.promoPageStore = {
                        boardTypeToParentMap: {
                            AI: 'AI',
                            'AI+': 'AI',
                            AS: 'AI',
                        },
                    };

                    const store = new TrackingStore(rootStore);
                    store.addToDataLayer = jest.fn();

                    await store.callTagManager();

                    expect(rootStore.engageStore.sendCustomEvent).toHaveBeenCalledTimes(1);
                    expect(rootStore.engageStore.sendCustomEvent).toHaveBeenCalledWith('BOARD_PROMO_PAGE_VIEWED', {
                        boardBasis: 'allInclusive',
                    });
                });

                it('should send separate events for different board basis types', async () => {
                    rootStore.layoutStore.isPromoPage = true;
                    rootStore.searchFiltersStore.selectedFilters = [
                        { groupCode: FilterGroupCodes.BoardType, code: 'AI' },
                        { groupCode: FilterGroupCodes.BoardType, code: 'HB' },
                    ];
                    rootStore.searchFiltersStore.filters = [
                        {
                            code: FilterGroupCodes.BoardType,
                            options: [
                                { code: 'AI', children: [] },
                                { code: 'HB', children: [] },
                            ],
                        },
                    ];
                    const rsPromo = rootStore as unknown as any;
                    rsPromo.promoPageStore = {
                        boardTypeToParentMap: { AI: 'AI', HB: 'HB' },
                    };

                    const store = new TrackingStore(rootStore);
                    store.addToDataLayer = jest.fn();

                    await store.callTagManager();

                    expect(rootStore.engageStore.sendCustomEvent).toHaveBeenCalledTimes(2);
                    expect(rootStore.engageStore.sendCustomEvent).toHaveBeenNthCalledWith(
                        1,
                        'BOARD_PROMO_PAGE_VIEWED',
                        {
                            boardBasis: 'allInclusive',
                        },
                    );
                    expect(rootStore.engageStore.sendCustomEvent).toHaveBeenNthCalledWith(
                        2,
                        'BOARD_PROMO_PAGE_VIEWED',
                        {
                            boardBasis: 'halfBoard',
                        },
                    );
                });

                it('should use parent map when available to resolve board type variants', async () => {
                    rootStore.layoutStore.isPromoPage = true;
                    rootStore.searchFiltersStore.selectedFilters = [
                        { groupCode: FilterGroupCodes.BoardType, code: 'AI+' },
                    ];
                    rootStore.searchFiltersStore.filters = [
                        {
                            code: FilterGroupCodes.BoardType,
                            options: [
                                { code: 'AI', children: [] },
                                { code: 'HB', children: [] },
                            ],
                        },
                    ];
                    const rsPromo = rootStore as unknown as any;
                    rsPromo.promoPageStore = {
                        boardTypeToParentMap: { 'AI+': 'AI', AI: 'AI' },
                    };

                    const store = new TrackingStore(rootStore);
                    store.addToDataLayer = jest.fn();

                    await store.callTagManager();

                    expect(rootStore.engageStore.sendCustomEvent).toHaveBeenCalledWith('BOARD_PROMO_PAGE_VIEWED', {
                        boardBasis: 'allInclusive',
                    });
                });

                it('should not send event when no board type filters selected', async () => {
                    rootStore.layoutStore.isPromoPage = true;
                    rootStore.searchFiltersStore.selectedFilters = [];
                    rootStore.searchFiltersStore.filters = [
                        {
                            code: FilterGroupCodes.BoardType,
                            options: [],
                        },
                    ];
                    const rsPromo = rootStore as unknown as any;
                    rsPromo.promoPageStore = {
                        boardTypeToParentMap: {},
                    };

                    const store = new TrackingStore(rootStore);
                    store.addToDataLayer = jest.fn();

                    await store.callTagManager();

                    const engageCallsWithBoardPromoEvent = (
                        rootStore.engageStore.sendCustomEvent as jest.Mock
                    ).mock.calls.filter(call => call[0] === 'BOARD_PROMO_PAGE_VIEWED');
                    expect(engageCallsWithBoardPromoEvent).toHaveLength(0);
                });
            });

            describe('Search Result Page', () => {
                it('should show correct region data when user has searched for a holiday', async () => {
                    rootStore.layoutStore.isSearchResultsPage = true;
                    rootStore.searchStore.searchTo.selectedDestinations = [
                        {
                            name: 'Majorca',
                            itemName: 'Majorca',
                            code: 'ESMJ',
                            type: DestinationType.Region,
                        },
                    ];
                    const store = new TrackingStore(rootStore);
                    store.trackSearchCriteria = jest.fn();
                    await store.callTagManager();

                    const searchData = dataLayer[0].ecommerce.detail.products[0];
                    expect(searchData.dimension22).toEqual('Region');
                    expect(searchData.dimension25).toEqual('Majorca');
                    expect(searchData.dimension26).toEqual('ESMJ');
                    expect(store.trackSearchCriteria).toHaveBeenCalledWith(dataLayer[0].ecommerce, EventTypes.Search);
                });

                it('should show correct region data when search includes a virtual region', async () => {
                    rootStore.layoutStore.isSearchResultsPage = true;
                    rootStore.searchStore.searchTo.selectedDestinations = [
                        {
                            name: 'Canary Islands',
                            itemName: 'Canary Islands',
                            code: 'CIV',
                            type: DestinationType.VirtualRegion,
                            relatedRegions: ['ESMJ'],
                        },
                        {
                            name: 'Majorca',
                            itemName: 'Majorca',
                            code: 'ESMJ',
                            type: DestinationType.Region,
                        },
                    ];
                    rootStore.searchStore.filteredDestinations = removeRelatedRegions(
                        rootStore.searchStore.searchTo.selectedDestinations,
                    );
                    const store = new TrackingStore(rootStore);
                    store.trackSearchCriteria = jest.fn();
                    await store.callTagManager();

                    const searchData = dataLayer[0].ecommerce.detail.products[0];
                    expect(searchData.dimension22).toEqual('VirtualRegion');
                    expect(searchData.dimension25).toEqual('Canary Islands');
                    expect(searchData.dimension26).toEqual('CIV');
                });
            });
        });
    });

    describe('Given a promo code', () => {
        describe('when making a booking', () => {
            it('should store case sensitive code', async () => {
                jest.spyOn(trackingUtils, 'shouldTrackPurchase').mockReturnValue(true);
                rootStore.layoutStore.isConfirmationPage = true;
                rootStore.bookingStore.isLoadingBookingConfirmationInfo = false;
                rootStore.bookingStore.bookingInfoPayload = { promoCode: 'testCode' };
                rootStore.bookingStore.booking = {
                    bookingReference: '123',
                    guests: [
                        { type: GuestType.Adult },
                        { type: GuestType.Child, age: 5 },
                        { type: GuestType.Child, age: 6 },
                    ],
                    package: {
                        accom: {
                            endDate: '2020-09-12',
                            startDate: '2020-09-19',
                            code: 'accom_code',
                            hotel: mockHotel,
                            rooms: [{ code: 'Room-1' }],
                        },
                        transport: mockedTransport,
                    },
                    paymentInfo: mockedPaymentInfo,
                    prom: 'EUBF',
                };
                rootStore.bookingStore.selectedOffer = mockedOffer;
                const store = new TrackingStore(rootStore);

                await store.callTagManager();

                const { ecommerce } = dataLayer[1];

                expect(ecommerce.purchase.actionField.coupon).toEqual('testCode');
            });
        });
    });

    describe('trackTransferAmendment', () => {
        const bookingAmend = {
            bookingReference: '123',
            guests: [{ type: GuestType.Adult }, { type: GuestType.Child, age: 5 }, { type: GuestType.Child, age: 6 }],
            paymentInfo: mockedPaymentInfo,
            package: {
                accom: {
                    endDate: '2020-09-12',
                    startDate: '2020-09-19',
                    code: 'accom_code',
                    hotel: mockHotel,
                    rooms: [{ code: 'Room-1' }],
                },
                transport: mockedTransport,
            },
        };

        it('should call addToDataLayer with correct parameters on select', () => {
            const transfer = {
                selectedTransfer: {
                    amendmentCharges: 47.85,
                    transfer: {
                        type: 'PRIVATE',
                        code: 'JUMB010065PP',
                        name: 'Private taxi',
                        autoInclude: false,
                        startDate: '2023-05-20T00:00:00',
                        setType: 'EXTRA',
                        typeCode: 'TF',
                        prom: 'AUCI',
                        quantity: 1,
                        serviceStates: ['FIX', 'OPTION', 'QUOTE'],
                        rateRule: 'DAY',
                        method: 'PI',
                        mcMethod: 'MANY',
                        price: 60.64,
                        minPax: 1,
                        maxPax: 3,
                        isHidden: false,
                    },
                },
            };
            rootStore.viewBookingStore.booking = bookingAmend;
            rootStore.amendTransfersStore = transfer;
            const store = new TrackingStore(rootStore);
            const name = trackingUtils.getTrackingTransferName(TransferType.Private);
            const spy = jest.spyOn(store, 'addToDataLayer');

            store.trackTransferAmendment(EventTypes.AmendTransferSelect);

            expect(spy.mock.calls[0][0]).toMatchObject({
                event: EventTypes.AmendTransferSelect,
                dimension173: '123',
                ecommerce: {
                    click: {
                        actionField: {
                            action: 'click',
                        },
                        products: [
                            {
                                category: 'Transfers: upgrade_PB',
                                price: 47.85,
                                dimension15: 47.85,
                                name,
                                id: name,
                                metric6: 0,
                            },
                        ],
                    },
                },
            });
        });

        it('should call addToDataLayer with correct parameters on update', () => {
            const transfer = {
                selectedTransfer: {
                    amendmentCharges: -47.85,
                    transfer: {
                        type: TransferType.NoTransfer,
                        code: 'JUMB010065PP',
                        name: 'no transfer',
                        autoInclude: false,
                        startDate: '2023-05-20T00:00:00',
                        setType: 'EXTRA',
                        typeCode: 'TF',
                        prom: 'AUCI',
                        quantity: 1,
                        serviceStates: ['FIX', 'OPTION', 'QUOTE'],
                        rateRule: 'DAY',
                        method: 'PI',
                        mcMethod: 'MANY',
                        price: 0,
                        minPax: 1,
                        maxPax: 3,
                        isHidden: false,
                    },
                },
            };

            rootStore.viewBookingStore.booking = bookingAmend;
            rootStore.amendTransfersStore = transfer;

            const store = new TrackingStore(rootStore);
            const spy = jest.spyOn(store, 'addToDataLayer');
            const name = trackingUtils.getTrackingTransferName(TransferType.NoTransfer);
            const date = new Date('2023-01-01');
            jest.useFakeTimers().setSystemTime(date);

            store.trackTransferAmendment(EventTypes.PostBookingConfirmationBasket);

            expect(spy.mock.calls[0][0]).toMatchObject({
                event: EventTypes.PostBookingConfirmationBasket,
                dimension173: '123',
                ecommerce: {
                    purchase: {
                        actionField: {
                            event: EventTypes.PostBookingConfirmationBasket,
                            action: 'purchase',
                            revenue: 0,
                            id: `123_${date.getTime()}_PB_CT`,
                        },
                        products: [
                            {
                                category: 'Transfers: downgrade_PB',
                                price: 0,
                                dimension15: 0,
                                name,
                                id: name,
                                metric6: 47.85,
                            },
                        ],
                    },
                },
            });
        });

        it('should call addToDataLayer with correct parameters on change', () => {
            const transfer = {
                selectedTransfer: {
                    amendmentCharges: 0,
                    transfer: {
                        type: TransferType.Shared,
                        code: 'JUMB010065PP',
                        name: 'shared',
                        autoInclude: false,
                        startDate: '2023-05-20T00:00:00',
                        setType: 'EXTRA',
                        typeCode: 'TF',
                        prom: 'AUCI',
                        quantity: 1,
                        serviceStates: ['FIX', 'OPTION', 'QUOTE'],
                        rateRule: 'DAY',
                        method: 'PI',
                        mcMethod: 'MANY',
                        price: 0,
                        minPax: 1,
                        maxPax: 3,
                        isHidden: false,
                    },
                },
            };

            rootStore.viewBookingStore.booking = bookingAmend;
            rootStore.amendTransfersStore = transfer;

            const store = new TrackingStore(rootStore);
            const spy = jest.spyOn(store, 'addToDataLayer');
            const name = trackingUtils.getTrackingTransferName(TransferType.Shared);
            const date = new Date('2023-01-01');
            jest.useFakeTimers().setSystemTime(date);

            store.trackTransferAmendment(EventTypes.PostBookingConfirmationBasket);

            expect(spy.mock.calls[0][0]).toMatchObject({
                event: EventTypes.PostBookingConfirmationBasket,
                dimension173: '123',
                ecommerce: {
                    purchase: {
                        actionField: {
                            event: EventTypes.PostBookingConfirmationBasket,
                            action: 'purchase',
                            revenue: 0,
                            id: `123_${date.getTime()}_PB_CT`,
                        },
                        products: [
                            {
                                category: 'Transfers: change_PB',
                                price: 0,
                                name,
                                id: name,
                                metric6: 0,
                            },
                        ],
                    },
                },
            });
        });
    });

    describe('trackFlightAmendment', () => {
        const booking = {
            hotel: {
                code: 'MAAG0002',
            },
            bookingReference: '123',
            package: {
                transport: mockedTransport,
                accom: {
                    isExt: false,
                    endDate: '2023-03-24',
                    startDate: '2023-03-17',
                    code: '1234',
                    hotel: {
                        name: 'Iberostar Founty Beach',
                        theme: {
                            name: 'Beach',
                        },
                        type: {
                            name: 'Handpicked',
                            itemName: 'Handpicked',
                        },
                    },
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
                // Note - infants are not included in price calculation as they don't need a seat
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
            prom: 'EUBO',
        } as any;

        const outboundFlightProduct = {
            brand: 'Handpicked',
            category: 'Flights: Outbound_PB',
            currencyCode: 'GBP',
            dimension108: 'post_booking_change_flights_select',
            dimension13: '2020-20-02',
            dimension137: 'Dynamic',
            dimension15: 1000,
            dimension18: 'London Gatwick',
            dimension19: 'LGW',
            dimension20: 'Tenerife Airport',
            dimension21: 'TFS',
            dimension29: 'No',
            dimension30: 0,
            dimension31: 'No',
            dimension32: 0,
            dimension33: ProductDimensions.DateLevel,
            dimension35: '2020-09-12',
            dimension36: '2020-09',
            dimension37: 'S20',
            dimension38: '07:25',
            dimension40: 1,
            dimension71: 'No',
            dimension83: 'flight-1',
            id: 'flight-1_PB',
            metric6: 0,
            name: 'LGW-TFS_PB',
            price: 20,
            quantity: 2,
            variant: 'Beach',
        };

        const inboundFlightProduct = {
            brand: 'Handpicked',
            category: 'Flights: Inbound_PB',
            currencyCode: 'GBP',
            dimension108: 'post_booking_change_flights_select',
            dimension13: '2020-20-02',
            dimension137: 'Dynamic',
            dimension15: 1000,
            dimension18: 'Tenerife Airport',
            dimension19: 'TFS',
            dimension20: 'London Gatwick',
            dimension21: 'LGW',
            dimension29: 'No',
            dimension30: 0,
            dimension31: 'No',
            dimension32: 0,
            dimension33: ProductDimensions.DateLevel,
            dimension35: '2020-09-19',
            dimension36: '2020-09',
            dimension37: 'S20',
            dimension38: '19:10',
            dimension40: 1,
            dimension71: 'No',
            dimension83: 'flight-2',
            id: 'flight-2_PB',
            metric6: 0,
            name: 'TFS-LGW_PB',
            price: 20,
            quantity: 2,
            variant: 'Beach',
        };

        const createDeafultModel = (extensionData = {}, additionalProducts: any[] = []) => ({
            dimension173: '123',
            dimension182: `${mockedTransport.routes[0].fltNo}|${mockedTransport.routes[1].fltNo}`,
            ecommerce: {
                detail: {
                    actionField: {
                        action: 'click',
                    },
                    products: [
                        {
                            ...outboundFlightProduct,
                            price: 25,
                        },
                        { ...inboundFlightProduct, price: 25 },
                        ...additionalProducts,
                    ],
                },
            },
            ...extensionData,
        });

        it('should call addToDataLayer with fees', () => {
            rootStore.viewBookingStore.booking = booking;

            const store = new TrackingStore(rootStore);
            jest.spyOn(store, 'addToDataLayer');

            store.trackFlightAmendment(
                EventTypes.PostBookingConfirmationBasket,
                mockedTransport.routes,
                mockedTransport.routes,
                mockAmendPaymentInfo,
            );

            expect(store.addToDataLayer).toHaveBeenCalledWith(
                expect.objectContaining({
                    ecommerce: {
                        purchase: expect.objectContaining({
                            products: [
                                {
                                    ...outboundFlightProduct,
                                    dimension108: EventTypes.PostBookingConfirmationBasket,
                                },
                                {
                                    ...inboundFlightProduct,
                                    dimension108: EventTypes.PostBookingConfirmationBasket,
                                },
                                {
                                    dimension108: 'purchase',
                                    category: 'Fees',
                                    name: 'Change Fee',
                                    id: 'Fees',
                                    price: 10,
                                    quantity: 1,
                                },
                            ],
                        }),
                    },
                }),
            );
        });

        it('should track flight click', () => {
            rootStore.viewBookingStore.booking = booking;

            const store = new TrackingStore(rootStore);
            const spy = jest.spyOn(store, 'addToDataLayer');

            // More expensive flight
            store.trackFlightAmendment(
                EventTypes.PostBookingChangeFlightsSelect,
                mockedTransport.routes,
                mockedTransport.routes,
                mockAmendPaymentInfo,
            );

            expect(spy.mock.calls[0][0]).toMatchObject(
                createDeafultModel({
                    event: EventTypes.PostBookingChangeFlightsSelect,
                }),
            );

            // Cheaper flight
            store.trackFlightAmendment(
                EventTypes.PostBookingChangeFlightsSelect,
                mockedTransport.routes,
                mockedTransport.routes,
                {
                    ...mockAmendPaymentInfo,
                    amendmentCharges: -200,
                },
            );

            expect(spy.mock.calls[1][0]).toMatchObject(
                createDeafultModel({
                    event: EventTypes.PostBookingChangeFlightsSelect,
                    ecommerce: {
                        detail: {
                            actionField: {
                                action: 'click',
                            },
                            products: [
                                {
                                    ...outboundFlightProduct,
                                    price: 0,
                                    metric6: 200,
                                },
                                {
                                    ...inboundFlightProduct,
                                    price: 0,
                                    metric6: 200,
                                },
                            ],
                        },
                    },
                }),
            );
        });

        it('should track flight update', () => {
            rootStore.viewBookingStore.booking = booking;

            const store = new TrackingStore(rootStore);
            const spy = jest.spyOn(store, 'addToDataLayer');

            // More expensive flight
            store.trackFlightAmendment(
                EventTypes.PostBookingChangeFlightsUpdate,
                mockedTransport.routes,
                mockedTransport.routes,
                {
                    ...mockAmendPaymentInfo,
                },
            );

            expect(spy.mock.calls[0][0]).toMatchObject(
                createDeafultModel({
                    event: EventTypes.PostBookingChangeFlightsUpdate,
                    ecommerce: {
                        detail: {
                            actionField: {
                                action: 'detail',
                            },
                            products: [
                                {
                                    ...outboundFlightProduct,
                                    price: 25,
                                    dimension108: 'post_booking_change_flights_update',
                                },
                                {
                                    ...inboundFlightProduct,
                                    price: 25,
                                    dimension108: 'post_booking_change_flights_update',
                                },
                            ],
                        },
                    },
                }),
            );

            // Cheaper flight
            store.trackFlightAmendment(
                EventTypes.PostBookingChangeFlightsUpdate,
                mockedTransport.routes,
                mockedTransport.routes,
                {
                    ...mockAmendPaymentInfo,
                    amendmentCharges: -200,
                },
            );

            expect(spy.mock.calls[1][0]).toMatchObject(
                createDeafultModel({
                    event: EventTypes.PostBookingChangeFlightsUpdate,
                    ecommerce: {
                        detail: {
                            actionField: {
                                action: 'detail',
                            },
                            products: [
                                {
                                    ...outboundFlightProduct,
                                    dimension108: 'post_booking_change_flights_update',
                                    price: 0,
                                    metric6: 200,
                                },
                                {
                                    ...inboundFlightProduct,
                                    dimension108: 'post_booking_change_flights_update',
                                    price: 0,
                                    metric6: 200,
                                },
                            ],
                        },
                    },
                }),
            );
        });

        it('should track flight succesfull amendment', () => {
            rootStore.viewBookingStore.booking = booking;
            const coupon = 'promo';
            rootStore.viewBookingStore.viewBookingPayload.amendPaymentPayload.selectedFlight.promoCodeBreakDown.promoCode =
                coupon;

            const store = new TrackingStore(rootStore);
            const spy = jest.spyOn(store, 'addToDataLayer');

            const date = new Date('2023-01-01');
            jest.useFakeTimers().setSystemTime(date);

            // More expensive flight
            store.trackFlightAmendment(
                EventTypes.PostBookingConfirmationBasket,
                mockedTransport.routes,
                mockedTransport.routes,
                mockAmendPaymentInfo,
            );

            expect(spy.mock.calls[0][0]).toMatchObject(
                createDeafultModel({
                    ecommerce: {
                        purchase: {
                            actionField: {
                                event: EventTypes.PostBookingConfirmationBasket,
                                id: `123_${Date.now()}_PB_CF`,
                                timestamp: mockedTimestamp,
                                revenue: 100,
                                coupon,
                                action: 'purchase',
                            },
                            products: [
                                {
                                    ...outboundFlightProduct,
                                    dimension108: 'post_booking_confirmation_basket',
                                },
                                {
                                    ...inboundFlightProduct,
                                    dimension108: 'post_booking_confirmation_basket',
                                },
                                {
                                    category: 'Fees',
                                    dimension108: 'purchase',
                                    id: 'Fees',
                                    name: 'Change Fee',
                                    price: 10,
                                    quantity: 1,
                                },
                            ],
                        },
                    },
                }),
            );

            // Cheaper flight
            store.trackFlightAmendment(
                EventTypes.PostBookingConfirmationBasket,
                mockedTransport.routes,
                mockedTransport.routes,
                {
                    ...mockAmendPaymentInfo,
                    amendmentCharges: -200,
                    amendmentChargesWithoutFees: -200,
                    feesPerPersons: [],
                },
            );

            expect(spy.mock.calls[1][0]).toMatchObject(
                createDeafultModel({
                    ecommerce: {
                        purchase: {
                            actionField: {
                                event: EventTypes.PostBookingConfirmationBasket,
                                id: `123_${Date.now()}_PB_CF`,
                                timestamp: mockedTimestamp,
                                revenue: 0,
                                coupon,
                                action: 'purchase',
                            },
                            products: [
                                {
                                    ...outboundFlightProduct,
                                    dimension108: 'post_booking_confirmation_basket',
                                    price: 0,
                                    metric6: 200,
                                },
                                {
                                    ...inboundFlightProduct,
                                    dimension108: 'post_booking_confirmation_basket',
                                    price: 0,
                                    metric6: 200,
                                },
                            ],
                        },
                    },
                }),
            );
        });
    });

    describe('fireViewBookingEvent', () => {
        it("should fire 'fireViewBookingEvent' with appropriate params", async () => {
            const store = new TrackingStore(rootStore);
            store.addToDataLayer = jest.fn();
            // @ts-ignore
            store.rootStore.layoutStore.pageFields = {
                EnableGoogleTagManager: {
                    value: true,
                },
            };
            await store.initializePageLoadObject({
                title: 'title',
                url: 'url',
                category: 'category',
                currencyCode: CurrencyCode.GBP,
            });
            store.fireViewBookingEvent(ViewBookingTrackingEvents.TravelDocs, 'Travel Docs');

            expect(store.addToDataLayer).toHaveBeenCalledWith({
                event: EventTypes.GenericEvent,
                coreParams: {
                    pageName: 'title|EN',
                    pageCategory: 'category',
                    pageReferral: '',
                    currencyCode: 'GBP',
                    businessType: 'Package',
                    businessChannel: 'Website',
                    pageLanguage: 'EN',
                    pageUrl: 'url',
                    screenOrientation: 'Landscape',
                    responsivePagebreakView: 'Screen',
                    referralPageName: '',
                    referralPageCategory: '',
                    timestamp: '2020-20-02',
                    siteVersion: 'v1.0.0',
                    loggedInStatus: 'No',
                    environment: 'ENV',
                    testVariant: '',
                    userId: '',
                    ShortlistsPerUser: '',
                },
                customParams: {
                    genericValue1: 'Travel Docs',
                    genericValue2: 'LGW-ACE',
                    genericValue3: 'bookingReference',
                    genericValue4: '6453',
                },
                eventParams: {
                    eventCategory: EventCategories.Holidays,
                    eventAction: EventActions.ViewBooking,
                    eventType: EventTypes.Interaction,
                    eventLabel: 'Travel Docs',
                },
            });
        });
    });

    describe('trackSuccessfulFlightAmendment', () => {
        it('should call trackFlightAmendment if no bookingRoutes', () => {
            const store = new TrackingStore(rootStore);
            store.rootStore.viewBookingStore.successfulAmendmentStatus = AmendmentType.Flight;
            jest.spyOn(store, 'trackFlightAmendment');

            store.trackSuccessfulAmendment();

            expect(store.trackFlightAmendment).not.toHaveBeenCalled();
        });

        it('should not call trackFlightAmendment if no booking', () => {
            const store = new TrackingStore(rootStore);
            store.rootStore.viewBookingStore.booking = null;
            store.rootStore.viewBookingStore.viewBookingPayload!.amendPaymentPayload!.package = mockBooking.package;
            store.rootStore.viewBookingStore.successfulAmendmentStatus = AmendmentType.Flight;
            jest.spyOn(store, 'trackFlightAmendment');

            store.trackSuccessfulAmendment();

            expect(store.trackFlightAmendment).not.toHaveBeenCalled();
        });

        it('should call trackFlightAmendment', () => {
            const store = new TrackingStore(rootStore);
            store.rootStore.viewBookingStore.successfulAmendmentStatus = AmendmentType.Flight;
            store.rootStore.viewBookingStore.booking = mockBooking;
            store.rootStore.viewBookingStore.viewBookingPayload!.amendPaymentPayload!.package = mockBooking.package;

            const routes = store.rootStore.viewBookingStore.booking?.package.transport.routes;
            const bookingRoutes =
                store.rootStore.viewBookingStore.viewBookingPayload?.amendPaymentPayload?.package?.transport?.routes;
            const selectedFlightPaymentInfo =
                store.rootStore.viewBookingStore.viewBookingPayload?.amendPaymentPayload?.selectedFlight
                    ?.amendmentPaymentInfo;

            jest.spyOn(store, 'trackFlightAmendment');

            store.trackSuccessfulAmendment();

            expect(store.trackFlightAmendment).toHaveBeenCalledWith(
                EventTypes.PostBookingConfirmationBasket,
                routes,
                bookingRoutes,
                selectedFlightPaymentInfo,
            );
        });

        it('should call trackFlightAmendment with fees', () => {
            const store = new TrackingStore(rootStore);
            store.rootStore.viewBookingStore.successfulAmendmentStatus = AmendmentType.Flight;
            store.rootStore.viewBookingStore.booking = mockBooking;
            store.rootStore.viewBookingStore.viewBookingPayload!.amendPaymentPayload = {
                ...mockAmendPaymentPayload,
                selectedFlight: mockValidatedFlights.transports[0],
            };

            const routes = store.rootStore.viewBookingStore.booking?.package.transport.routes;
            const bookingRoutes =
                store.rootStore.viewBookingStore.viewBookingPayload?.amendPaymentPayload?.package?.transport?.routes;
            const selectedFlightAmendPaymentInfo =
                store.rootStore.viewBookingStore.viewBookingPayload?.amendPaymentPayload?.selectedFlight
                    ?.amendmentPaymentInfo;

            jest.spyOn(store, 'trackFlightAmendment');

            store.trackSuccessfulAmendment();

            expect(store.trackFlightAmendment).toHaveBeenCalledWith(
                EventTypes.PostBookingConfirmationBasket,
                routes,
                bookingRoutes,
                selectedFlightAmendPaymentInfo,
            );
        });
    });

    describe('trackGenericAmendmentActionWithGuests', () => {
        let store;

        beforeEach(() => {
            store = new TrackingStore(rootStore);
            store.rootStore.viewBookingStore.booking = mockBooking;
            store.rootStore.layoutStore.pageFields = {
                PageCategory: {
                    value: PageLoadCategory.PostBooking,
                },
            };
            store.addToDataLayer = jest.fn();
            store.callTagManager();
        });

        it('should call addToDataLayer with correct parameters', async () => {
            await store.trackGenericAmendmentActionWithGuests(
                AmendEventActions.ChangeDates,
                AmendEventLabels.NewDateSelection,
            );
            expect(store.addToDataLayer).toHaveBeenCalledWith({
                event: EventTypes.GenericEvent,
                eventParams: {
                    eventCategory: EventCategories.Holidays,
                    eventType: EventTypes.Interaction,
                    eventAction: AmendEventActions.ChangeDates,
                    eventLabel: AmendEventLabels.NewDateSelection,
                },
                customParams: {
                    genericValue1: null,
                    genericValue2: null,
                    genericValue3: 'A: 2, C: 0, I: 0',
                    genericValue4: 'bookingReference',
                },
                coreParams: {
                    pageName: `${PageLoadCategory.PostBooking}: PageTitle|EN`,
                    pageCategory: PageLoadCategory.PostBooking,
                    pageReferral: '',
                    currencyCode: 'GBP',
                    businessType: 'Package',
                    businessChannel: 'Website',
                    pageLanguage: 'EN',
                    pageUrl: 'URL',
                    screenOrientation: 'Landscape',
                    responsivePagebreakView: 'Screen',
                    referralPageName: '',
                    referralPageCategory: '',
                    timestamp: '2020-20-02',
                    siteVersion: 'v1.0.0',
                    loggedInStatus: 'No',
                    environment: 'ENV',
                    testVariant: '',
                    userId: '',
                    ShortlistsPerUser: '',
                },
            });
        });

        it('should correctly include custom params', async () => {
            await store.trackGenericAmendmentActionWithGuests(
                AmendEventActions.ChangeDates,
                AmendEventLabels.NewDateSelection,
                {
                    genericValue1: 'test1',
                    genericValue2: 'test2',
                    genericValue3: 'test3',
                    genericValue4: 'test4',
                },
            );
            expect(store.addToDataLayer).toHaveBeenCalledWith(
                expect.objectContaining({
                    customParams: {
                        genericValue1: 'test1',
                        genericValue2: 'test2',
                        genericValue3: 'test3',
                        genericValue4: 'test4',
                    },
                }),
            );
        });

        it('should correctly prepend category to page name', async () => {
            await store.trackGenericAmendmentActionWithGuests(
                AmendEventActions.ChangeDates,
                AmendEventLabels.NewDateSelection,
                {},
                true,
            );

            expect(store.addToDataLayer).toHaveBeenCalledWith(
                expect.objectContaining({
                    coreParams: expect.objectContaining({
                        pageName: `${PageLoadCategory.PostBooking}: PageTitle|EN`,
                    }),
                }),
            );
        });
    });

    describe('trackNewDateSelectionEvent', () => {
        it('should call trackGenericAmendmentActionWithGuests with correct parameters', () => {
            const store = new TrackingStore(rootStore);
            store.trackGenericAmendmentActionWithGuests = jest.fn();
            store.trackNewDateSelectionEvent({
                genericValue1: GenericValues.NoMatchingDates,
                genericValue2: GenericValues.BackToCalendar,
            });
            expect(store.trackGenericAmendmentActionWithGuests).toHaveBeenCalledWith(
                AmendEventActions.ViewBooking,
                AmendEventLabels.NewDateSelection,
                {
                    genericValue1: GenericValues.NoMatchingDates,
                    genericValue2: GenericValues.BackToCalendar,
                },
            );
        });
    });

    describe('trackDateChangeConfirmAction', () => {
        let store;
        const baseHolidayProduct = {
            dimension108: EventTypes.PostBookingChangeDatesUpdate,
            category: ProductCategories.ChangeDatePB,
            name: ProductCategories.ChangeDatePB,
            id: 'H123_PB',
            quantity: 1,
            price: 20,
            variant: 'name',
            brand: 'Handpicked',
            currencyCode: 'GBP',
            coupon: '',
            dimension63: '',
            dimension64: 0,
            dimension65: '',
            dimension13: '2020-20-02',
            dimension15: 110,
            dimension19: 'BRS',
            dimension21: 'PMI',
            dimension23: 'Spain',
            dimension24: 'ES',
            dimension25: 'Tenerife',
            dimension26: 'ESTF',
            dimension27: 'Playa Paraiso',
            dimension28: 'ESTFPP',
            dimension35: '2023-08-26',
            dimension42: '2023-08-31',
            dimension47: 5,
            dimension49: 3,
            dimension51: 1,
            dimension52: 2,
            dimension53: 1,
            dimension54: 1,
            dimension56: 'boardType_title',
            dimension57: 5,
            dimension58: 4.5,
            dimension71: 'No',
            dimension73: 'Refundable',
            dimension78: 0,
            dimension79: '',
            dimension172: 0,
            dimension183: true,
            position: 1,
            dimension34: NO_FLEXIBILITY,
            dimension61: undefined,
            dimension75: 'Our Favourites',
            dimension76: 'Default',
            dimension16: '',
            dimension17: 'Series',
            dimension137: 'Series',
            dimension18: 'Bristol',
            dimension20: 'Palma',
            dimension36: '2023-08',
            dimension37: 'S23',
            dimension38: '12:45',
            dimension40: 1,
            dimension43: '2023-08',
            dimension44: 'S23',
            dimension45: '14:35',
            dimension50: 'A: 1, C: 2, I: 1',
            dimension55: 'roomType_title',
            dimension59: 0,
            dimension60: 0,
            dimension77: false,
            dimension83: 'EZY2711',
            dimension84: 'EZY2712',
            dimension22: '',
            dimension29: 'No',
            dimension30: 0,
            dimension31: 'No',
            dimension32: 0,
            dimension33: ProductDimensions.DateLevel,
            dimension41: ProductDimensions.DateLevel,
        };

        beforeEach(() => {
            jest.useFakeTimers({
                now: new Date('2020-12-20'),
            });
            store = new TrackingStore(rootStore);
            store.rootStore.viewBookingStore.booking = mockBooking;
            store.rootStore.amendDatesStore.offerWithPrices = mockAmendDatesOfferWithPrice;
            store.addToDataLayer = jest.fn();
            store.buildFeesAnalyticProduct = jest.fn(() => mockFeesTrackingProduct);
            store.getPrices = jest.fn(() => ({
                metric6: 0,
                revenue: 20,
                productPrice: 20,
                fees: undefined,
                amendmentCharges: 20,
            }));
            store.callTagManager();
        });

        it('should call addToDataLayer with correct parameters for change dates update event', () => {
            store.trackDateChangeConfirmAction(EventTypes.PostBookingChangeDatesUpdate);

            expect(store.addToDataLayer).toHaveBeenCalledWith({
                event: EventTypes.PostBookingChangeDatesUpdate,
                dimension136: 'PageCategory: PageTitle|EN',
                metric6: 0,
                dimension182: 'EZY6453|EZY6572',
                dimension173: 'bookingReference',
                ecommerce: {
                    detail: {
                        actionField: { list: 'PageCategory: PageTitle|EN' },
                        products: [baseHolidayProduct],
                    },
                },
                dimension66: 'Other',
                paymentMethod: 'Visa',
            });
        });

        it('should call addToDataLayer with correct parameters for post booking confirmation event', () => {
            store.trackDateChangeConfirmAction(EventTypes.PostBookingConfirmationBasket);

            expect(store.addToDataLayer).toHaveBeenCalledWith({
                event: EventTypes.PostBookingConfirmationBasket,
                dimension136: 'PageCategory: Change Dates Confirmation|EN',
                metric6: 0,
                dimension182: 'EZY6453|EZY6572',
                dimension173: 'bookingReference',
                pageTitle: 'PageCategory: PageTitle|EN',
                flightReference: 'Series',
                ecommerce: {
                    purchase: {
                        actionField: {
                            event: EventTypes.Booking,
                            id: 'bookingReference_1608422400000_PB_CD',
                            timestamp: '2020-20-02',
                            revenue: 20,
                            coupon: '',
                            metric3: 0,
                        },
                        products: [{ ...baseHolidayProduct, dimension108: EventTypes.PostBookingConfirmationBasket }],
                    },
                },
                dimension66: 'Other',
                paymentMethod: 'Visa',
            });
        });

        it('should get price from viewBookingStore if no amendDatesStore offerWithPrices', () => {
            store.rootStore.amendDatesStore.offerWithPrices = null;
            store.rootStore.viewBookingStore.viewBookingPayload.amendPaymentPayload.amendDatesOffer = {
                ...mockAmendDatesOfferWithPrice,
            };

            store.trackDateChangeConfirmAction(EventTypes.PostBookingConfirmationBasket);

            expect(store.addToDataLayer).toHaveBeenCalledWith({
                event: EventTypes.PostBookingConfirmationBasket,
                dimension136: 'PageCategory: Change Dates Confirmation|EN',
                metric6: 0,
                dimension182: 'EZY6453|EZY6572',
                dimension173: 'bookingReference',
                pageTitle: 'PageCategory: PageTitle|EN',
                flightReference: 'Series',
                ecommerce: {
                    purchase: {
                        actionField: {
                            event: EventTypes.Booking,
                            id: 'bookingReference_1608422400000_PB_CD',
                            timestamp: '2020-20-02',
                            revenue: 20,
                            coupon: '',
                            metric3: 0,
                        },
                        products: [{ ...baseHolidayProduct, dimension108: EventTypes.PostBookingConfirmationBasket }],
                    },
                },
                dimension66: 'Other',
                paymentMethod: 'Visa',
            });
        });

        it('should correctly track refund', () => {
            jest.mocked(store.getPrices).mockReturnValueOnce({
                metric6: 20,
                revenue: 0,
                productPrice: 0,
                fees: undefined,
                amendmentCharges: -20,
            });

            store.trackDateChangeConfirmAction(EventTypes.PostBookingChangeDatesUpdate);

            expect(store.addToDataLayer).toHaveBeenCalledWith(
                expect.objectContaining({
                    metric6: 20,
                }),
            );
        });

        it('should provide variant in English when itemName exist', () => {
            store.rootStore.viewBookingStore.booking.package.accom.hotel.theme.itemName = 'name En';
            store.trackDateChangeConfirmAction(EventTypes.PostBookingChangeDatesUpdate);

            expect(store.addToDataLayer).toHaveBeenCalledWith({
                event: EventTypes.PostBookingChangeDatesUpdate,
                dimension136: 'PageCategory: PageTitle|EN',
                metric6: 0,
                dimension182: 'EZY6453|EZY6572',
                dimension173: 'bookingReference',
                ecommerce: {
                    detail: {
                        actionField: { list: 'PageCategory: PageTitle|EN' },
                        products: [
                            {
                                ...baseHolidayProduct,
                                variant: 'name En',
                            },
                        ],
                    },
                },
                dimension66: 'Other',
                paymentMethod: 'Visa',
            });
        });

        it('should add fee product when fee is exists and isConfirmationEvent', async () => {
            jest.mocked(store.getPrices).mockReturnValue({
                metric6: 0,
                revenue: 20,
                productPrice: 20,
                fees: mockFeesPerPersons[0],
                amendmentCharges: 20,
            });

            store.rootStore.viewBookingStore.viewBookingPayload = {
                amendPaymentPayload: {
                    amendDatesOffer: {
                        ...mockAmendDatesOfferWithPrice,
                        amendmentPaymentInfo: mockAmendPaymentInfo,
                    },
                },
            };
            store.rootStore.amendDatesStore.offerWithPrices = null;

            store.trackDateChangeConfirmAction(EventTypes.PostBookingConfirmationBasket);

            expect(store.getPrices).toHaveBeenCalledWith(mockAmendPaymentInfo, true);
            expect(store.addToDataLayer).toHaveBeenCalledWith(
                expect.objectContaining({
                    ecommerce: {
                        purchase: expect.objectContaining({
                            actionField: {
                                coupon: '',
                                event: 'booking',
                                id: 'bookingReference_1608422400000_PB_CD',
                                metric3: 0,
                                revenue: 20,
                                timestamp: '2020-20-02',
                            },
                            products: expect.arrayContaining([
                                {
                                    category: 'Fee category',
                                    dimension108: 'purchase',
                                    id: 'Fee product ID',
                                    name: 'Fee product Name',
                                    price: 25,
                                    quantity: 2,
                                },
                            ]),
                        }),
                    },
                }),
            );
        });
    });

    describe('fireChatbotViewBookingEvent', () => {
        it('should add to dataLayer the object containing view booking data', () => {
            const mockViewBookingPayload = {
                bookingDepDate: '10',
                bookingGuestLastName: 'test',
                bookingReference: '123',
            };

            const store = new TrackingStore(rootStore);

            store.addToDataLayer = jest.fn();
            store.fireChatbotViewBookingEvent(mockViewBookingPayload);

            expect(store.addToDataLayer).toHaveBeenCalledWith({
                event: EventTypes.ChatbotViewBooking,
                ...mockViewBookingPayload,
            });
        });
    });

    describe('removeFromDataLayer', () => {
        beforeEach(() => {
            dataLayer = [
                {},
                { event: EventTypes.AddToBasket },
                { event: EventTypes.CTAClick },
                { event: EventTypes.ProductAdd },
            ];
        });

        it('should remove the desired object from the dataLayer by specified event type', () => {
            (isAnalyticsDisabled as jest.Mock).mockReturnValueOnce(false);

            const store = new TrackingStore(rootStore);

            store.removeFromDataLayer(EventTypes.AddToBasket);

            expect(dataLayer).toEqual([{}, { event: EventTypes.CTAClick }, { event: EventTypes.ProductAdd }]);
        });

        it('should not modify dataLayer when analytics is disabled', () => {
            (isAnalyticsDisabled as jest.Mock).mockReturnValueOnce(true);

            const store = new TrackingStore(rootStore);

            store.removeFromDataLayer(EventTypes.CTAClick);

            expect(dataLayer).toEqual([
                {},
                { event: EventTypes.AddToBasket },
                { event: EventTypes.CTAClick },
                { event: EventTypes.ProductAdd },
            ]);
        });

        it('should not remove elements without the event name from the dataLayer', () => {
            (isAnalyticsDisabled as jest.Mock).mockReturnValueOnce(false);

            const store = new TrackingStore(rootStore);

            store.removeFromDataLayer(EventTypes.ChatbotViewBooking);

            expect(dataLayer).toEqual([
                {},
                { event: EventTypes.AddToBasket },
                { event: EventTypes.CTAClick },
                { event: EventTypes.ProductAdd },
            ]);
        });

        it('should not throw an error if an exception occurs', () => {
            (isAnalyticsDisabled as jest.Mock).mockImplementationOnce(() => {
                throw new Error('Test error');
            });

            const store = new TrackingStore(rootStore);

            expect(() => store.removeFromDataLayer(EventTypes.CTAClick)).not.toThrow();
        });
    });

    describe('Analytics for Payment Page', () => {
        it('should generate data correctly', async () => {
            const store = new TrackingStore(rootStore);
            (sessionStorage.getItem as jest.Mock).mockReturnValueOnce(
                JSON.stringify({ prevPageName: 'Name', prevPageCategory: 'Category' }),
            );
            const res = await store.getTrackPaymentData();
            expect(res).toEqual({
                business_channel: 'Website',
                business_type: 'Package',
                content_group: 'PageCategory',
                currency: 'EUR',
                environment: 'ENV',
                logged_in_status: 'No',
                page_category: 'PageCategory',
                page_title: 'MP_PageTitle|EN',
                platform_language: 'EN',
                referral_page_category: 'Category',
                referral_page_name: 'Name',
                responsive_page_break_view: 'Screen',
                screen_orientation: 'Landscape',
                site_version: 'v1.0.0',
                test_variant: '',
            });
        });

        it('should generate data correctly when no data in sessionStorage', async () => {
            const store = new TrackingStore(rootStore);
            rootStore.bookingStore.isFlightAndHotelPackage = true;
            rootStore.payStore.currency = undefined;
            (sessionStorage.getItem as jest.Mock).mockReturnValueOnce(undefined);
            const res = await store.getTrackPaymentData();
            expect(res).toEqual({
                business_channel: 'Flight And Hotel',
                business_type: 'Package',
                content_group: 'PageCategory',
                environment: 'ENV',
                logged_in_status: 'No',
                page_category: 'PageCategory',
                page_title: 'MP_PageTitle|EN',
                platform_language: 'EN',
                referral_page_category: '',
                referral_page_name: '',
                responsive_page_break_view: 'Screen',
                screen_orientation: 'Landscape',
                site_version: 'v1.0.0',
                test_variant: '',
            });
        });

        it('should set data to session storage correctly', () => {
            const store = new TrackingStore(rootStore);

            store.setPreviousPage();

            expect(sessionStorage.setItem as jest.Mock).toHaveBeenCalledWith(
                'PrevPage',
                JSON.stringify({ prevPageName: '', prevPageCategory: '' }),
            );
        });
    });

    describe('buildSearchDetailObject', () => {
        it('should call buildSearchDetailObjectBase', () => {
            rootStore.searchStore.searchTo.selectedDestinations = [
                {
                    itemName: 'Majorca',
                    code: 'ESMJ',
                    type: DestinationType.Region,
                },
            ];
            const store = new TrackingStore(rootStore);
            store.buildSearchDetailObjectBase = jest.fn();

            store['buildSearchDetailObject']([], EventTypes.Booking);

            expect(store.buildSearchDetailObjectBase).toHaveBeenCalledWith([], EventTypes.Booking, {
                dimension22: 'Region',
                dimension25: 'Majorca',
                dimension26: 'ESMJ',
            });
        });
    });

    describe('trackInspireMePageLoad', () => {
        beforeEach(() => {
            jest.mocked(getQuizTabIdentifyingUrl).mockReturnValue('');
        });

        const trackingItemName = 'trackingItemName';

        it('should track Inspire Me slide loading when load Entry Quiz Tab', async () => {
            const store = new TrackingStore(rootStore);
            const mockIdentifyingUrl = 'mockIdentifyingUrl';
            jest.mocked(getQuizTabIdentifyingUrl).mockReturnValueOnce(mockIdentifyingUrl);

            store.initializePageLoadObject = jest.fn();
            store.addToDataLayer = jest.fn();

            await store.trackInspireMePageLoad(StaticQuestionTitle.StartScreen, trackingItemName);

            expect(getQuizTabIdentifyingUrl).toHaveBeenCalledWith({ value: trackingItemName });
            expect(store.initializePageLoadObject).toHaveBeenCalledWith({
                title: `Inspire Me:${StaticQuestionTitle.StartScreen}`,
                category: PageLoadCategory.InspireMe,
                url: mockIdentifyingUrl,
            });

            expect(store.addToDataLayer).toHaveBeenCalled();
        });

        it('should track Inspire Me slide loading when load Departure Airport Tab', async () => {
            const store = new TrackingStore(rootStore);
            const mockIdentifyingUrl = 'mockIdentifyingUrl';
            jest.mocked(getQuizTabIdentifyingUrl).mockReturnValueOnce(mockIdentifyingUrl);

            store.initializePageLoadObject = jest.fn();
            store.addToDataLayer = jest.fn();

            await store.trackInspireMePageLoad(DynamicQuestionTitle.DepartureAirport, trackingItemName);

            expect(getQuizTabIdentifyingUrl).toHaveBeenCalledWith({ value: trackingItemName });
            expect(store.initializePageLoadObject).toHaveBeenCalledWith({
                title: `Inspire Me:${DynamicQuestionTitle.DepartureAirport}`,
                category: PageLoadCategory.InspireMe,
                url: mockIdentifyingUrl,
            });

            expect(store.addToDataLayer).toHaveBeenCalled();
        });
    });

    describe('trackSmartseerQuizResults', () => {
        it('should add proper data to dataLayer when isAccountExists === true', () => {
            const store = new TrackingStore(rootStore);

            store.addToDataLayer = jest.fn();
            store.trackSmartseerQuizResults(mockGetQuizResultParams);

            expect(store.addToDataLayer).toHaveBeenCalledWith({
                eventParams: mockGetQuizResultParams,
                event: EventTypes.SmartseerQuizAnswers,
            });
        });
    });

    describe('smartseetTrackResult', () => {
        it('should push data to analytic when there are founded destinations', () => {
            jest.spyOn(global.navigator, 'userAgent', 'get').mockReturnValue('safari');
            const store = new TrackingStore(rootStore);

            store.addToDataLayer = jest.fn();
            store.smartseetTrackResult(mockGetQuizResultParams, inspireRecommendationResponse);
            expect(store.addToDataLayer).toHaveBeenCalledWith({
                action: 'recoview',
                context: {
                    label: 'quiz:answers',
                    section: 'inspireme',
                    smartseer_quiz_answers: mockGetQuizResultParams,
                    type: 'inspireme',
                },
                documentLocation: 'URL',
                documentReferrer: '',
                elements: inspireRecommendationResponse.destinations,
                listId: 'ejh-inspire-me',
                listOffset: 0,
                pageSize: 1,
                ptoken: inspireRecommendationResponse.trackingInfo.pToken,
                recoInfo: inspireRecommendationResponse.trackingInfo.recoInfo,
                timestamp: '2020-20-02',
                trackingId: '',
                userAgent: 'safari',
                userId: '',
            });
        });

        it('should push data to analytic when there are no founded destinations', () => {
            jest.spyOn(global.navigator, 'userAgent', 'get').mockReturnValue('safari');
            const store = new TrackingStore(rootStore);

            store.addToDataLayer = jest.fn();
            store.smartseetTrackResult(mockGetQuizResultParams, {
                destinations: [],
                trackingInfo: inspireRecommendationResponse.trackingInfo,
            });
            expect(store.addToDataLayer).toHaveBeenCalledWith({
                action: 'recoview',
                context: {
                    label: 'quiz:answers',
                    section: 'inspireme',
                    smartseer_quiz_answers: mockGetQuizResultParams,
                    type: 'inspireme',
                },
                documentLocation: 'URL',
                documentReferrer: '',
                issues: [{ type: 'notAvailable' }],
                listId: 'ejh-inspire-me',
                listOffset: 0,
                pageSize: 1,
                ptoken: inspireRecommendationResponse.trackingInfo.pToken,
                recoInfo: inspireRecommendationResponse.trackingInfo.recoInfo,
                timestamp: '2020-20-02',
                trackingId: '',
                userAgent: 'safari',
                userId: '',
            });
        });
    });

    describe('searchInteractionTrigger ', () => {
        let store;

        beforeEach(() => {
            store = new TrackingStore(rootStore);
            store.addToDataLayer = jest.fn();
            store.rootStore.queryParamsStore.isMap = true;
            store.rootStore.layoutStore.isSearchResultsPage = true;
            store.setPrices = jest.fn();
            store.buildBaseHolidayProduct = jest.fn();
            store.buildUrgencyMessagingDimensions = jest.fn();
            store.buildPageName = jest.fn();
        });

        const expectedProduct = {
            currencyCode: 'GBP',
            dimension13: '2020-20-02',
            dimension162: 'No',
            dimension18: '',
            dimension19: '',
            dimension20: '',
            dimension21: '',
            dimension22: '',
            dimension23: '',
            dimension24: '',
            dimension25: '',
            dimension26: '',
            dimension27: '',
            dimension28: '',
            dimension29: 'No',
            dimension30: 0,
            dimension31: 'No',
            dimension32: 0,
            dimension33: 'Exact',
            dimension34: 'No Flexibility',
            dimension35: '',
            dimension36: '',
            dimension37: '',
            dimension40: '',
            dimension41: 'Exact',
            dimension42: '',
            dimension43: '',
            dimension44: '',
            dimension47: '',
            dimension49: 3,
            dimension50: 'A: 2, C: 1, I: 1',
            dimension51: 2,
            dimension52: 1,
            dimension53: 1,
            dimension54: '1',
            dimension61: undefined,
            dimension62: 0,
            dimension75: 'Our Favourites',
            dimension79: '',
        };

        it('should call addToDataLayer with correct props', async () => {
            await store.searchInteractionTrigger(EventTypes.SearchFilterUpdate, EventTypes.PromoPageFilterUpdate);

            expect(store.addToDataLayer).toHaveBeenNthCalledWith(1, {
                dimension136: '',
                ecommerce: {
                    detail: {
                        products: [{ ...expectedProduct, dimension108: 'search_filter_update_map' }],
                    },
                    impressions: [],
                },
                event: 'search_filter_update',
            });
        });

        it('should call addToDataLayer with correct props on other serach results event', async () => {
            await store.searchInteractionTrigger(EventTypes.AddToBasket, EventTypes.PromoPageFilterUpdate);

            expect(store.addToDataLayer).toHaveBeenNthCalledWith(1, {
                dimension136: '',
                ecommerce: {
                    detail: {
                        products: [{ ...expectedProduct, dimension108: 'addToBasket' }],
                    },
                    impressions: [],
                },
                event: 'addToBasket',
            });
        });

        it('should call addToDataLayer with correct props when isMap is false', async () => {
            store.rootStore.queryParamsStore.isMap = false;

            await store.searchInteractionTrigger(EventTypes.SearchFilterUpdate, EventTypes.PromoPageFilterUpdate);

            expect(store.addToDataLayer).toHaveBeenNthCalledWith(1, {
                dimension136: '',
                ecommerce: {
                    detail: {
                        products: [{ ...expectedProduct, dimension108: EventTypes.SearchFilterUpdate }],
                    },
                    impressions: [],
                },
                event: EventTypes.SearchFilterUpdate,
            });
        });
    });

    describe('addBookingFlowTypeTracking', () => {
        let store: TrackingStore;

        beforeEach(() => {
            rootStore = createRootStore();
            store = new TrackingStore(rootStore);
        });

        it('should return null when not on extras, guest details, or confirmation page', () => {
            expect(store['addBookingFlowTypeTracking']()).toBeNull();
        });

        it('should return HolidaysBooking type when on extras page and isFlightAndHotelPackage is false', () => {
            rootStore.layoutStore.isExtrasPage = true;
            rootStore.bookingStore.isFlightAndHotelPackage = false;

            expect(store['addBookingFlowTypeTracking']()).toEqual({
                event: EventTypes.BookingFlow,
                bookingType: BookingType.HolidaysBooking,
            });
        });

        it('should return FlightAndHotel type when on extras page and isFlightAndHotelPackage is true', () => {
            rootStore.layoutStore.isExtrasPage = true;
            rootStore.bookingStore.isFlightAndHotelPackage = true;

            expect(store['addBookingFlowTypeTracking']()).toEqual({
                event: EventTypes.BookingFlow,
                bookingType: BookingType.FlightAndHotel,
            });
        });

        it('should return booking flow object when on guest details page', () => {
            rootStore.layoutStore.isGuestDetailsPage = true;
            rootStore.bookingStore.isFlightAndHotelPackage = false;

            expect(store['addBookingFlowTypeTracking']()).toEqual({
                event: EventTypes.BookingFlow,
                bookingType: BookingType.HolidaysBooking,
            });
        });

        it('should return booking flow object when on confirmation page and shouldTrackPurchase is true', () => {
            rootStore.layoutStore.isConfirmationPage = true;
            rootStore.bookingStore.isFlightAndHotelPackage = false;
            jest.spyOn(trackingUtils, 'shouldTrackPurchase').mockReturnValue(true);

            expect(store['addBookingFlowTypeTracking']()).toEqual({
                event: EventTypes.BookingFlow,
                bookingType: BookingType.HolidaysBooking,
            });
        });

        it('should return null when on confirmation page and shouldTrackPurchase is false', () => {
            rootStore.layoutStore.isConfirmationPage = true;
            (trackingUtils.shouldTrackPurchase as jest.Mock).mockReturnValueOnce(false);

            expect(store['addBookingFlowTypeTracking']()).toBeNull();
        });
    });

    describe('trackSearchFiltersUpdate', () => {
        const filterMock = {
            groupCode: FilterGroupCodes.StarRating,
            name: '4 stars',
            code: 'A',
        };

        it('should call getFilterActionDimensions with correct arguments and then call searchInteractionTrigger', async () => {
            rootStore.hotelsStore.status = DataStatus.Loading;
            rootStore.searchFiltersStore = { filters: [] };
            const store = new TrackingStore(rootStore);

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
            rootStore.hotelsStore.status = DataStatus.Loading;
            const store = new TrackingStore(rootStore);

            jest.spyOn(store, 'getFilterActionDimensions');
            jest.spyOn(store, 'searchInteractionTrigger').mockResolvedValue(undefined);

            await store.trackSearchFiltersUpdate(false, filterMock, FilterGroupCodes.Recommended);

            expect(store.getFilterActionDimensions).toHaveBeenCalledWith(
                false,
                filterMock,
                FilterGroupCodes.Recommended,
            );
        });
    });
});
