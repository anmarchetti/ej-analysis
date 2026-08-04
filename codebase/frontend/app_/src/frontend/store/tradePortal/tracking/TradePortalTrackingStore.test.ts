import { CurrencyCode } from 'code/currency';
import { createMockStores } from 'frontend/__mocks__';
import { mockHotel } from 'frontend/__mocks__/hotel';
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
import * as routeUtils from 'frontend/utils/route.utils';
import { createABTestsPipedList } from 'frontend/utils/tracking/abTests.utils';
import { isAnalyticsDisabled } from 'frontend/utils/tracking/isAnalyticsDisabled';
import * as trackingUtils from 'frontend/utils/tracking/tracking.utils';
import { AmendmentType } from 'models/data/IBookingInfo';
import { DataStatus } from 'models/enum/DataStatus';
import { DestinationType } from 'models/enum/DestinationType';
import { FilterGroupCodes } from 'models/enum/FilterGroupCodes';
import { GuestType } from 'models/enum/GuestType';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { ProductDimensions } from 'models/enum/tracking/ProductCategories';
import { RoomAllocation } from 'models/RoomAllocation';

import TradePortalTrackingStore from './TradePortalTrackingStore';

jest.mock('frontend/utils/paymentTransaction');

jest.mock('frontend/utils/tracking/isAnalyticsDisabled', () => ({
    isAnalyticsDisabled: jest.fn(() => false),
}));
jest.mock('frontend/utils/getLocationHierarchy');

jest.mock('frontend/utils/tracking/tracking.utils', () => ({
    ...jest.requireActual('frontend/utils/tracking/tracking.utils'),
    getScreenSize: jest.fn(() => 'Screen'),
    getTimestamp: jest.fn(() => mockedTimestamp),
    shouldTrackPurchase: jest.fn(() => true),
}));

jest.mock('frontend/utils/offer.utils', () => ({
    ...jest.requireActual('frontend/utils/offer.utils'),
    getHotelContractType: jest.fn(args => args),
}));

jest.mock('frontend/utils/date.utils', () => ({
    ...jest.requireActual('frontend/utils/date.utils'),
    getDaysDifferenceRoundedFloor: jest.fn(() => 1),
}));

Object.defineProperties(window, {
    dataLayer: { value: [], writable: true },
    location: { value: { href: 'URL', origin: 'ENV' } },
});

jest.mock('frontend/utils/tracking/abTests.utils', () => ({
    getLayoutABTests: jest.fn().mockReturnValue([]),
    getStorageABTests: jest.fn().mockReturnValue([]),
    createABTestsPipedList: jest.fn().mockReturnValue(''),
}));

jest.mock('frontend/utils/layout.utils', () => ({
    findComponentByName: jest.fn().mockReturnValue({}),
}));

jest.mock('frontend/utils/urgencyMessage.utils', () => ({
    getRoomsUrgencyMessage: () => jest.fn(() => 'rooms urgency message'),
    getSeatsUrgencyMessage: () => jest.fn(() => 'seats urgency message'),
    getCabinBagsUrgencyMessage: () => jest.fn(() => 'cabin bags message'),
}));

describe('<TradePortalTrackingStore />', () => {
    let rootStore;

    beforeEach(() => {
        dataLayer = [];
        rootStore = createMockStores({
            bookingStore: {
                isValidatingPackage: false,
                isPackageValid: true,
                isLoadingOffer: false,
                fetchOffer: jest.fn(),
                bookingInfoPayload: {},
                extraLuggage: {
                    getExtraLuggageProductsForTracking: jest.fn(() => []),
                    getLargeCabinBagsPriceByRoute: jest.fn(() => 15),
                },
            },
            appStore: { isScreenExtraSmall: false },
            hotelsStore: { status: DataStatus.Loaded, offers: [] },
            layoutStore: {
                isTradePortal: true,
                lang: 'en',
                layout: {},
                layoutName: 'Test',
                pageTitle: 'Book Hotel Details',
                pageFields: {
                    PageCategory: { value: 'PageCategory' },
                    TrackingPageTitle: { value: 'PageTitle' },
                },
            },
            metadataStore: { metaPageTitle: 'PageTitle' },
            userStore: { isLoggedIn: false },
            searchStore: {
                searchFrom: {
                    origins: [],
                },
                searchTo: {
                    isLoadingDestinations: false,
                    selectedDestinations: [],
                    selectedDestinationCodes: [],
                },
                searchWhen: { flexDays: 0, isFlexible: true, to: new Date('2024-10-13'), from: new Date('2024-10-12') },
                searchWho: { roomsAllocation: [new RoomAllocation()], roomsAllocationLength: 1 },
                originsWithName: [],
                take: 10,
                page: 1,
            },
            marketStore: { currency: CurrencyCode.GBP },
            seatMapStore: { isEnabledToBookSeats: false, getFlightAircraftType: jest.fn(() => 'plane') },
            viewBookingStore: {
                viewBookingPayload: {
                    amendPaymentPayload: {
                        selectedFlight: {
                            promoCodeBreakDown: {},
                        },
                    },
                },
            },
            amendPaymentStore: {},
            amendTransfersStore: {},
            flightsPassengersStore: { LCBCount: 4 },
        });
    });

    describe('Page Load Tracking', () => {
        it('Should NOT add anything if GA is disabled globally', async () => {
            (isAnalyticsDisabled as any).mockReturnValueOnce(true);
            const store = new TradePortalTrackingStore(rootStore);
            await store.callTagManager();
            expect(dataLayer).toEqual([]);
        });

        it('Should add GlobalObject', async () => {
            const store = new TradePortalTrackingStore(rootStore);

            jest.spyOn(store, 'defaultGalleryMedia', 'get').mockReturnValue('test');

            await store.callTagManager();

            expect(dataLayer).toHaveLength(1);
            expect(dataLayer[0]).toEqual({
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

        it('Should set GlobalObject dimension for previous page', async () => {
            rootStore.layoutStore.pageFields.TrackingPageTitle.value = 'Page-1';
            rootStore.layoutStore.pageFields.PageCategory.value = 'Category-1';
            const store = new TradePortalTrackingStore(rootStore);

            await store.callTagManager();

            (store.rootStore.layoutStore.pageFields as any).TrackingPageTitle.value = 'Page-2';
            (store.rootStore.layoutStore.pageFields as any).PageCategory.value = 'Category-2';
            await store.callTagManager();

            expect(dataLayer).toHaveLength(2);
            expect(dataLayer[0]).toEqual(
                expect.objectContaining({
                    pageName: 'Page-1|EN',
                    pageCategory: 'Category-1',
                    pageReferral: '',
                    dimension10: '',
                    dimension11: '',
                }),
            );
            expect(dataLayer[1]).toEqual(
                expect.objectContaining({
                    pageName: 'Page-2|EN',
                    pageCategory: 'Category-2',
                    pageReferral: 'URL',
                    dimension10: 'Page-1|EN',
                    dimension11: 'Category-1',
                }),
            );
        });

        it('Should set GlobalObject dimension that user is logged in', async () => {
            rootStore.userStore.isLoggedIn = true;
            const store = new TradePortalTrackingStore(rootStore);

            await store.callTagManager();
            expect(dataLayer[0]).toHaveProperty('dimension92', 'Yes');
        });

        describe('DestinationPage', () => {
            it('Should add DestinationGuide and unique GlobalObject for not Hotel Destination Page)', async () => {
                (getLocationHierarchy as any).mockReturnValueOnce({
                    country: { code: 'ES', name: 'United States', itemName: 'United States' },
                });

                rootStore.layoutStore.isDestinationPage = true;
                rootStore.layoutStore.pageFields.TrackingPageTitle.value = 'Destination Guide: Test';
                const store = new TradePortalTrackingStore(rootStore);

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
                const store = new TradePortalTrackingStore(rootStore);

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
            });

            it('Should add Global and Ecommerce Objects', async () => {
                const store = new TradePortalTrackingStore(rootStore);

                await store.callTagManager();

                expect(dataLayer).toHaveLength(2);
                expect(dataLayer[1]).toHaveProperty('event', EventTypes.PageLoad);
                expect(dataLayer[0]).toEqual({
                    event: EventTypes.Extras,
                    dimension136: 'PageTitle|EN',
                    dimension101: 'OK',
                    pageTitle: 'PageTitle',
                    ecommerce: { detail: { products: [] }, impressions: [] },
                    greenPromo: 'LCB:N|HB:N',
                });
            });

            it('Should set No Available status', async () => {
                rootStore.bookingStore.isPackageValid = false;
                const store = new TradePortalTrackingStore(rootStore);

                await store.callTagManager();

                expect(dataLayer[1]).toHaveProperty('dimension101', 'Not Available');
            });

            it('Should set Available status', async () => {
                rootStore.bookingStore.isPackageValid = true;
                const store = new TradePortalTrackingStore(rootStore);

                await store.callTagManager();

                expect(dataLayer[1]).toHaveProperty('dimension101', 'OK');
            });

            it('Should set price change status', async () => {
                rootStore.bookingStore.isPackageValid = true;
                rootStore.bookingStore.previousPrice = 50;
                rootStore.bookingStore.packageInfo = { paymentInfo: { totalPrice: 150 } };
                const store = new TradePortalTrackingStore(rootStore);

                await store.callTagManager();

                expect(dataLayer[1]).toHaveProperty('dimension101', 'Price change: +100');
            });

            describe('Seat Map test variant', () => {
                it('Should track Seat Map dynamic seats', async () => {
                    rootStore.seatMapStore.isSeatMapFlowEnabled = true;
                    rootStore.seatMapStore.outboundFlight = { isExt: true };
                    (createABTestsPipedList as any).mockReturnValueOnce('104B');

                    const store = new TradePortalTrackingStore(rootStore);

                    await store.callTagManager();

                    expect(createABTestsPipedList).toHaveBeenCalledWith([{ testId: '104', testVariant: 'B' }]);
                    expect(dataLayer[1]).toHaveProperty('dimension12', '104B');
                });

                it('Should track Seat Map series seats', async () => {
                    rootStore.seatMapStore.isSeatMapFlowEnabled = true;
                    rootStore.seatMapStore.outboundFlight = { isExt: false };
                    (createABTestsPipedList as any).mockReturnValueOnce('104C');

                    const store = new TradePortalTrackingStore(rootStore);

                    await store.callTagManager();

                    expect(createABTestsPipedList).toHaveBeenCalledWith([{ testId: '104', testVariant: 'C' }]);
                    expect(dataLayer[1]).toHaveProperty('dimension12', '104C');
                });

                it('Should not track Seat Map test variant if seats disabled', async () => {
                    rootStore.seatMapStore.isSeatMapFlowEnabled = false;
                    (createABTestsPipedList as any).mockReturnValueOnce('104B');

                    const store = new TradePortalTrackingStore(rootStore);

                    await store.callTagManager();

                    expect(createABTestsPipedList).toHaveBeenCalledWith([]);
                    expect(dataLayer[1]).toHaveProperty('dimension12', '104B');
                });
            });
        });

        describe('GuestDetailsPage', () => {
            it('Should add Global and Ecommerce Objects', async () => {
                rootStore.layoutStore.isGuestDetailsPage = true;
                const store = new TradePortalTrackingStore(rootStore);

                await store.callTagManager();

                expect(dataLayer).toHaveLength(2);
                expect(dataLayer[0]).toEqual({
                    event: EventTypes.Guest,
                    dimension136: 'PageTitle|EN',
                    dimension188: 'unchecked',
                    pageTitle: 'PageTitle',
                    ecommerce: { detail: { products: [] } },
                });
            });
        });

        describe('ConfirmationPage', () => {
            it('Should add only GlobalObject if should not track purchase', async () => {
                jest.spyOn(trackingUtils, 'shouldTrackPurchase').mockReturnValueOnce(false);
                rootStore.layoutStore.isConfirmationPage = true;
                rootStore.bookingStore.isLoadingBookingConfirmationInfo = false;
                const store = new TradePortalTrackingStore(rootStore);

                await store.callTagManager();

                expect(dataLayer).toHaveLength(1);
                expect(paymentUtils.setTransactionTracked).not.toBeCalled();
            });

            it('Should add only GlobalObject if there is no booking', async () => {
                rootStore.layoutStore.isConfirmationPage = true;
                rootStore.bookingStore.isLoadingBookingConfirmationInfo = false;
                rootStore.bookingStore.booking = null;
                const store = new TradePortalTrackingStore(rootStore);

                await store.callTagManager();

                expect(dataLayer).toHaveLength(1);
                expect(paymentUtils.setTransactionTracked).not.toBeCalled();
            });

            describe('Global and Ecommerce Objects', () => {
                beforeEach(() => {
                    rootStore.layoutStore.isConfirmationPage = true;
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
                    };
                    rootStore.bookingStore.selectedOffer = { ...mockedTransfer };
                    rootStore.bookingStore.lateRoomCheckout = { ...mockedLateRoomCheckout };
                    rootStore.bookingStore.selectedOffer = {
                        accom: {
                            unit: [{ avail: 1 }],
                        },
                    };
                });

                it('Should add Global and Ecommerce Objects', async () => {
                    const store = new TradePortalTrackingStore(rootStore);

                    await store.callTagManager();

                    expect(dataLayer).toHaveLength(2);

                    const ecommerce = dataLayer[0].ecommerce;
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
                });

                it('should track flight reference during booking event', async () => {
                    jest.spyOn(routeUtils, 'getFlightsReferences').mockReturnValue(['test-flight']);

                    const store = new TradePortalTrackingStore(rootStore);
                    await store.callTagManager();

                    expect(dataLayer).toHaveLength(2);
                    const bookingTracking = dataLayer[0];
                    expect(bookingTracking.flightReference).toEqual('test-flight');
                });

                it('should populate track flight reference with "Series" when flight reference is NOT provided', async () => {
                    jest.spyOn(routeUtils, 'getFlightsReferences').mockReturnValue([]);

                    const store = new TradePortalTrackingStore(rootStore);
                    await store.callTagManager();

                    expect(dataLayer).toHaveLength(2);
                    const bookingTracking = dataLayer[0];
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
            rootStore.bookingStore.selectedOffer = {
                accom: {
                    unit: [{ avail: 1 }],
                },
            };

            const store = new TradePortalTrackingStore(rootStore);

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
                rootStore.viewBookingStore = { booking: { bookingReference: '123', paymentInfo: mockedPaymentInfo } };
                const store = new TradePortalTrackingStore(rootStore);

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
                const store = new TradePortalTrackingStore(rootStore);

                await store.callTagManager();

                expect(dataLayer[0]).toHaveProperty('dimension95', 1);
            });
        });

        describe('Search Results Page', () => {
            it('should show correct region data when user has searched for a holiday', async () => {
                rootStore.layoutStore.isSearchResultsPage = true;
                rootStore.searchStore.searchTo.selectedDestinations = [
                    {
                        itemName: 'Majorca',
                        code: 'ESMJ',
                        type: DestinationType.Region,
                    },
                ];

                const store = new TradePortalTrackingStore(rootStore);
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
                        code: 'CIV',
                        type: DestinationType.VirtualRegion,
                        relatedRegions: ['ESMJ'],
                    },
                    {
                        itemName: 'Majorca',
                        code: 'ESMJ',
                        type: DestinationType.Region,
                    },
                ];

                rootStore.searchStore.filteredDestinations = removeRelatedRegions(
                    rootStore.searchStore.searchTo.selectedDestinations,
                );

                const store = new TradePortalTrackingStore(rootStore);
                store.trackSearchCriteria = jest.fn();

                await store.callTagManager();

                const searchData = dataLayer[0].ecommerce.detail.products[0];

                expect(searchData.dimension22).toEqual('VirtualRegion|Region');
                expect(searchData.dimension25).toEqual('Majorca');
                expect(searchData.dimension26).toEqual('ESMJ');
            });
        });

        describe('PromoPage', () => {
            it('Should add Global, Ecommerce and bd4ProductList Objects', async () => {
                rootStore.layoutStore.isPromoPage = true;
                rootStore.layoutStore.pageFields.TrackingPageTitle.value = 'Promo: Test';

                const store = new TradePortalTrackingStore(rootStore);
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
                const store = new TradePortalTrackingStore(rootStore);
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
    });

    describe('Given a promo code', () => {
        describe('when making a booking', () => {
            it('should store case sensitive code', async () => {
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
                const store = new TradePortalTrackingStore(rootStore);

                await store.callTagManager();

                const { ecommerce } = dataLayer[0];
                expect(ecommerce.purchase.actionField.coupon).toEqual('testCode');
            });
        });
    });

    describe('holidayConfigChangeTrigger', () => {
        it('should add correct data to dataLayer', () => {
            const store = new TradePortalTrackingStore(rootStore);
            store.addToDataLayer = jest.fn();
            rootStore.bookingStore.selectedOffer = { ...mockedOffer, accom: { ...mockedOffer.accom, isExt: true } };

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
                                event: 'cta_click_type_page',
                                price: undefined,
                            },
                        ],
                    },
                },
                event: 'cta_click_type_page',
            });
        });

        it('should add urgency message to dataLayer when room update event triggered', () => {
            const urgencyMessageMock = { urgencyMessage: 'test' };
            const store = new TradePortalTrackingStore(rootStore);

            rootStore.bookingStore.selectedOffer = { ...mockedOffer, accom: { ...mockedOffer.accom, isExt: true } };

            store.addToDataLayer = jest.fn();
            store.buildUrgencyMessagingDimensions = jest.fn().mockReturnValue(urgencyMessageMock);
            store.holidayConfigChangeTrigger(EventTypes.RoomUpdate, 1);

            expect(store.addToDataLayer).toHaveBeenCalledWith(
                expect.objectContaining({
                    ecommerce: {
                        detail: {
                            products: [expect.objectContaining(urgencyMessageMock)],
                        },
                    },
                }),
            );
        });

        it('should NOT to add data to dataLayer when the offer accom data is not defined', () => {
            const store = new TradePortalTrackingStore(rootStore);

            rootStore.bookingStore.selectedOffer = { ...mockedOffer, accom: {} };

            store.addToDataLayer = jest.fn();
            store.holidayConfigChangeTrigger(EventTypes.CTAClick, 1);

            expect(offerUtils.getHotelContractType).not.toHaveBeenCalled();
            expect(store.addToDataLayer).not.toHaveBeenCalled();
        });
    });

    describe('call trackSuccessfulAmendment method', () => {
        it('should call seats tracking', () => {
            {
                const store = new TradePortalTrackingStore(rootStore);
                store.rootStore.viewBookingStore.successfulAmendmentStatus = AmendmentType.Seats;
                jest.spyOn(store, 'trackSeatsAmendment');

                store.trackSuccessfulAmendment();

                expect(store.trackSeatsAmendment).toHaveBeenCalled();
            }
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
            const store = new TradePortalTrackingStore(rootStore);
            store.buildSearchDetailObjectBase = jest.fn();

            store['buildSearchDetailObject']([], EventTypes.Booking);

            expect(store.buildSearchDetailObjectBase).toHaveBeenCalledWith([], EventTypes.Booking, {
                dimension22: 'Region',
                dimension25: 'Majorca',
                dimension26: 'ESMJ',
            });
        });
    });

    describe('searchInteractionTrigger', () => {
        let store;

        beforeEach(() => {
            rootStore.layoutStore.isSearchResultsPage = true;
            rootStore.searchStore.searchWhen.from = null;
            rootStore.searchStore.searchWhen.to = null;
            rootStore.searchStore.searchWhen.isFlexible = false;
            rootStore.searchStore.searchWho.adultsQuantity = 2;
            rootStore.searchStore.searchWho.childrenQuantity = 1;
            rootStore.searchStore.searchWho.infantsQuantity = 1;
            rootStore.searchStore.searchWho.isAutoAllocation = false;

            store = new TradePortalTrackingStore(rootStore);
            store.addToDataLayer = jest.fn();
            store.rootStore.queryParamsStore = { isMap: true };
            store.rootStore.hotelsStore.hasHotels = true;
            store.bd4SortTracking = null;
            store.setPrices = jest.fn();
            store.buildBaseHolidayProduct = jest.fn();
            store.buildUrgencyMessagingDimensions = jest.fn().mockReturnValue({});
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

        it('should call addToDataLayer with correct props when isMap is true', async () => {
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

        it('should call addToDataLayer with correct props on other search results event', async () => {
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

    describe('trackSearchFiltersUpdate', () => {
        const filterMock = {
            groupCode: FilterGroupCodes.StarRating,
            name: '4 stars',
            code: 'A',
        };

        it('should call getFilterActionDimensions with correct arguments and then call searchInteractionTrigger', async () => {
            rootStore.hotelsStore.status = DataStatus.Loading;
            rootStore.searchFiltersStore = { filters: [] };
            const store = new TradePortalTrackingStore(rootStore);

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
            const store = new TradePortalTrackingStore(rootStore);

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
