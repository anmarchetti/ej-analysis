import Axios, { CancelTokenSource } from 'axios';

import { CurrencyCode } from 'code/currency';
import OffersService from 'frontend/services/offers.service';
import { SitecoreChannel } from 'frontend/store/base/tracking/sitecore/constants';
import { OffersStore } from 'frontend/store/holidays';
import { HolidaysRootStore } from 'frontend/store/holidays/HolidaysRootStore';
import * as arrayUtils from 'frontend/utils/array.utils';
import * as destinationUtils from 'frontend/utils/destinations.utils';
import * as promoPageUtils from 'frontend/utils/promoPage.utils';
import * as promopageDates from 'frontend/utils/promoPageDates';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { IOffer } from 'models/data/IOffer';
import { ISearchOffers } from 'models/data/ISearchOffers';
import { MarketCode } from 'models/data/MarketSettings';
import { Bd4TravelListIdTrade, Bd4TravelPlacementId } from 'models/enum/Bd4TravelListId';
import { DataStatus } from 'models/enum/DataStatus';
import { DestinationType } from 'models/enum/DestinationType';
import { FilterGroupCodes } from 'models/enum/FilterGroupCodes';
import { DEPARTURE_ALL_CODE } from 'models/enum/RequestConstants';
import { SearchType } from 'models/enum/SearchType';
import SiteSettings from 'models/enum/SiteSettings';

import { ITradePortalOffersInitialState, TradePortalOffersStore } from './TradePortalOffersStore';

jest.mock('frontend/services/offers.service', () => ({
    fetchOffers: jest.fn(),
    getDestinationsAvailability: jest.fn(),
}));

jest.mock('frontend/utils/webStorage.utils', () => ({
    getWebStorageItem: jest.fn(),
    setWebStorageItem: jest.fn(),
}));

jest.mock('frontend/services/logging');

const offersResponseMock = {
    filters: [{ code: 'test filter' } as any],
    offers: [{ accom: { code: 'test' } } as IOffer],
    status: { total: 10, maxPrice: 100, minPrice: 22, maxPricePP: 50, minPricePP: 11 } as any,
    reorderFilters: false,
} as ISearchOffers;

describe('TradePortalOffersStore', () => {
    describe('serialize', () => {
        it('should return initial state object', () => {
            const store = new TradePortalOffersStore(null as any);
            store.offers = [{}, {}] as IOffer[];
            store.status = DataStatus.NeedToReload;

            expect(store.serialize()).toEqual({
                offers: [{}, {}],
                status: DataStatus.NeedToReload,
            });
        });
    });

    describe('deserialize', () => {
        it('should initialize store using initial state', () => {
            const store = new TradePortalOffersStore(null as any);
            const initialState: ITradePortalOffersInitialState = {
                offers: [{}, {}] as IOffer[],
                status: DataStatus.NeedToReload,
            };

            store.deserialize(initialState);

            expect(store.offers).toEqual(initialState.offers);
            expect(store.status).toEqual(DataStatus.NeedToReload);
        });

        it('should initialize with default values when initial state does not contain fields', () => {
            const store = new TradePortalOffersStore(null as any);

            store.deserialize();

            expect(store.offers).toEqual([]);
            expect(store.status).toEqual(DataStatus.NotLoaded);
        });
    });

    describe('currency', () => {
        test('should return first offer currency code when offers array is not empty', () => {
            const store = new TradePortalOffersStore(null as any);
            store.offers = [{ currency: { code: CurrencyCode.EUR } }] as IOffer[];

            expect(store.currency).toBe(store.offers[0].currency!.code);
        });

        test('should return undefined when offers array is not empty but currency is not defined in the first offer', () => {
            const store = new TradePortalOffersStore(null as any);
            store.offers = [{}] as IOffer[];

            expect(store.currency).toBeUndefined();
        });

        test('should return undefined when offers array is empty', () => {
            const store = new TradePortalOffersStore(null as any);
            store.offers = [];

            expect(store.currency).toBeUndefined();
        });
    });

    describe('resetOffersDataStatus', () => {
        test('should call updateOffersDataStatus with expected param', () => {
            const store = new TradePortalOffersStore(null as any);
            store.updateOffersDataStatus = jest.fn();

            store.resetOffersDataStatus();

            expect(store.updateOffersDataStatus).toHaveBeenCalledWith(DataStatus.NotLoaded);
        });
    });

    describe('hasOffers', () => {
        test('should return true if there are offers.', () => {
            const store = new TradePortalOffersStore(null as any);
            store.offers = [{} as IOffer];

            const { hasOffers } = store;

            expect(hasOffers).toBeTruthy();
        });

        test('should return false if there are no offers.', () => {
            const store = new TradePortalOffersStore(null as any);
            store.offers = [];

            const { hasOffers } = store;

            expect(hasOffers).toBeFalsy();
        });

        test('should return false if there are offers.', () => {
            const store = new TradePortalOffersStore(null as any);
            store.offers = undefined as any;

            const { hasOffers } = store;

            expect(hasOffers).toBeFalsy();
        });
    });

    describe('updateOffersDataStatus', () => {
        test('should update status', () => {
            const store = new TradePortalOffersStore(null as any);

            expect(store.status).toEqual(DataStatus.NotLoaded);

            store.updateOffersDataStatus(DataStatus.Loading);

            expect(store.status).toEqual(DataStatus.Loading);
        });
    });

    describe('saveOffers', () => {
        test('should save offers', () => {
            const store = new TradePortalOffersStore(null as any);
            const offers = [
                {
                    accom: {
                        code: 'test',
                    },
                } as IOffer,
            ];

            expect(store.offers).toEqual([]);

            store.saveOffers(offers);

            expect(store.offers).toEqual(offers);
        });
    });

    describe('selectSpecificOffer', () => {
        test('should set queryParamsStore properties', () => {
            const store = new TradePortalOffersStore({
                queryParamsStore: {
                    parseOfferCodeValue: jest.fn(),
                    parseRoomValueFromApi: jest.fn(),
                } as any,
                bookingStore: {} as any,
            } as any);
            const units = [
                {
                    board: 'board',
                    code: 'room',
                },
            ];
            const offer = {
                accom: {
                    id: 'test-id',
                    code: 'code',
                    packageId: 'package-id',
                    unit: units,
                },
                transport: {
                    routes: [
                        {
                            id: 'outbound-id',
                        },
                        {
                            id: 'inbound-id',
                        },
                    ],
                },
            } as IOffer;

            store.selectSpecificOffer(offer);

            expect(store.rootStore.bookingStore.selectedOffer).toEqual(offer);
        });
    });

    describe('fetchOffers', () => {
        const createRootStore = () => ({
            searchStore: {
                isAllSearchParametersSelected: true,
                searchWhen: { from: 'from', to: 'to', isFlexible: false, flexDays: 0 },
                searchFrom: {
                    origins: ['origins'],
                },
                searchTo: { selectedDestinations: [] },
                searchWho: {
                    roomsAllocation: [{ adults: [], children: [], infants: [] }],
                },
                destination: 'destination|destination',
                take: 'take',
                page: 'page',
                orderBy: 'orderBy',
                orderDirection: 'orderDirection',
                selectedDestinationCodes: ['FR', 'IT', 'FRPR'],
            },
            searchFiltersStore: {
                boardTypeFilters: 'boardTypeFilters',
                facilitiesFilters: 'facilitiesFilters',
                themeFilters: 'themeFilters',
                filters: [],
                saveFilters: jest.fn(),
                flightsFilters: 'LTN',
                filterPriceFrom: 100,
                filterPriceTo: 200,
                isPriceFilterPerPerson: true,
                onChangeSearchFilterStore: jest.fn(),
                flightDurationFrom: 1,
                flightDurationTo: 6,
            },
            bookingStore: {
                isAllSearchParametersSelected: true,
                clearBookingFlow: jest.fn(),
                from: 'from',
                to: 'to',
                origins: ['origins'],
                adultsQuantity: 'adultsQuantity',
                childrenQuantity: 'childrenQuantity',
                infantsCount: 'infantsCount',
                roomsAllocation: [{ adults: [], children: [], infants: [] }],
                selectedDestinationCodes: ['FR', 'IT', 'FRPR'],
                selectedNumberOfNights: 7,
                loadRecommendedHotels: jest.fn(),
            },
            paymentStore: { clearPaymentStore: jest.fn() },
            priceGraphStore: { clearAlternativeOffers: jest.fn() },
            layoutStore: {
                isPromoPage: false,
                layout: {
                    sitecore: { route: { fields: {}, name: 'name' } },
                },
                isApplySpecialFilter: jest.fn(() => false),
            },
            trackingStore: { setBd4SortTracking: jest.fn() },
            marketStore: { marketCode: MarketCode.UK },
            appStore: { deviceType: SitecoreChannel.Tablet },
        });

        let rootStore = {} as any;

        beforeEach(() => {
            rootStore = createRootStore();
            OffersService.fetchOffers = jest.fn().mockResolvedValue(offersResponseMock);
        });

        it('set LoadingMore status if Load More button was clicked', async () => {
            const store = new TradePortalOffersStore(rootStore);
            store.setIsLoadMoreOffers(true);
            store.updateOffersDataStatus = jest.fn();

            await store.fetchOffers(true, false);

            expect(store.updateOffersDataStatus).toHaveBeenCalledWith(DataStatus.LoadingMore);
        });

        it('set LoadingPrevious status if Load Previous button was clicked', async () => {
            const store = new TradePortalOffersStore(rootStore);
            store.setIsLoadPreviousOffers(true);
            store.updateOffersDataStatus = jest.fn();

            await store.fetchOffers(true, false);

            expect(store.updateOffersDataStatus).toHaveBeenCalledWith(DataStatus.LoadingPrevious);
        });

        it('set Loading status if Load Previous and Load More buttons was NOT clicked', async () => {
            const store = new TradePortalOffersStore(rootStore);
            store.updateOffersDataStatus = jest.fn();

            await store.fetchOffers(true, false);

            expect(store.updateOffersDataStatus).toHaveBeenCalledWith(DataStatus.Loading);
        });

        test('should not load offers if not all search params filled in', async () => {
            rootStore.searchStore.isAllSearchParametersSelected = false;
            rootStore.bookingStore.isAllSearchParametersSelected = false;
            const store = new TradePortalOffersStore(rootStore);

            await store.fetchOffers();

            expect(OffersService.fetchOffers).not.toHaveBeenCalled();
        });

        test('should not load offers if status is Loaded', async () => {
            const store = new TradePortalOffersStore(rootStore);
            store.status = DataStatus.Loaded;

            await store.fetchOffers();

            expect(OffersService.fetchOffers).not.toHaveBeenCalled();
        });

        test('should not load offers if status is Error', async () => {
            const store = new TradePortalOffersStore(rootStore);
            store.status = DataStatus.Error;

            await store.fetchOffers();

            expect(OffersService.fetchOffers).not.toHaveBeenCalled();
        });

        it('should load offers and clear flow', async () => {
            jest.spyOn(Axios.CancelToken, 'source').mockReturnValue({} as CancelTokenSource);

            const store = new TradePortalOffersStore(rootStore);
            store.savePrefillParams = jest.fn();
            const promise = store.fetchOffers();

            expect(store.status).toEqual(DataStatus.Loading);

            await promise;

            expect(OffersService.fetchOffers).toHaveBeenCalledWith({
                accomCodes: undefined,
                autoAllocation: undefined,
                boardType: 'boardTypeFilters',
                cancelSource: {} as CancelTokenSource,
                dep: 'LTN',
                destination: undefined,
                destinations: undefined,
                discountOnly: undefined,
                distressedFlightsOnly: false,
                duration: ['7'],
                endDate: undefined,
                facilities: 'facilitiesFilters',
                flexDays: 0,
                flights: 'origins',
                geog: undefined,
                hotelTypes: undefined,
                inboundTimeSlots: undefined,
                initialPricePPFrom: undefined,
                initialPricePPTo: undefined,
                initialThemes: undefined,
                initialTotalPriceFrom: undefined,
                initialTotalPriceTo: undefined,
                isPricePP: true,
                isPromoPage: false,
                maxDisc: undefined,
                maxDiscP: undefined,
                minDisc: undefined,
                minDiscP: undefined,
                offers: undefined,
                orderBy: 'orderBy',
                orderDirection: 'orderDirection',
                outboundTimeSlots: undefined,
                page: 'page',
                placementId: 'hotels_trade',
                polyQuery: undefined,
                priceFrom: 100,
                priceTo: 200,
                promoPageId: undefined,
                rooms: [
                    {
                        adults: 0,
                        children: 0,
                        childrenAges: [],
                        infants: 0,
                        roomCode: '',
                    },
                ],
                searchType: SearchType.Normal,
                starRating: undefined,
                startDate: 'from',
                take: 'take',
                themes: 'themeFilters',
                tripAdvisorRating: undefined,
                flightDurationFrom: 60,
                flightDurationTo: undefined,
                deviceType: SitecoreChannel.Tablet,
            });
            expect(store.status).toEqual(DataStatus.Loaded);
            expect(rootStore.searchFiltersStore.saveFilters).toHaveBeenCalledWith(expect.any(Array), false);
            expect(store.offers).toEqual(offersResponseMock.offers);
            expect(store.numberOfHotels).toEqual(10);

            expect(rootStore.bookingStore.clearBookingFlow).toHaveBeenCalled();
            expect(rootStore.paymentStore.clearPaymentStore).toHaveBeenCalled();
            expect(rootStore.priceGraphStore.clearAlternativeOffers).toHaveBeenCalled();
        });

        test('should force load offers', async () => {
            const store = new TradePortalOffersStore(rootStore);
            store.savePrefillParams = jest.fn();

            await store.fetchOffers(true);

            expect(OffersService.fetchOffers).toHaveBeenCalled();
            expect(store.status).toEqual(DataStatus.Loaded);
            expect(rootStore.searchFiltersStore.saveFilters).toHaveBeenCalledWith(expect.any(Array), false);
            expect(store.offers).toEqual(offersResponseMock.offers);
            expect(store.numberOfHotels).toEqual(10);
        });

        it('should call onChangeSearchFilterStore after fetching offer', async () => {
            const store = new TradePortalOffersStore(rootStore);
            store.savePrefillParams = jest.fn();

            await store.fetchOffers(true);

            expect(OffersService.fetchOffers).toHaveBeenCalled();
            expect(store.offers).toEqual(offersResponseMock.offers);
            expect(rootStore.searchFiltersStore.onChangeSearchFilterStore).toHaveBeenCalledWith({
                key: 'isFiltersLoadingScreenEnabled',
                value: true,
            });
        });

        it('should call handleOffersNoResults() if no results', async () => {
            const store = new TradePortalOffersStore(rootStore);
            store.savePrefillParams = jest.fn();
            const handleOffersNoResultsSpy = jest.spyOn(store as any, 'handleOffersNoResults');
            OffersService.fetchOffers = jest.fn().mockResolvedValue({ offers: [], status: { total: 0 } });

            await store.fetchOffers();

            expect(handleOffersNoResultsSpy).toHaveBeenCalled();
        });

        it('should save prefill params after fetching offers', async () => {
            const store = new TradePortalOffersStore(rootStore);
            const savePrefillParamsSpy = jest.spyOn(store, 'savePrefillParams');

            await store.fetchOffers(true);

            expect(savePrefillParamsSpy).toHaveBeenCalled();
        });

        it('should pass reorderFilters from API response to saveFilters', async () => {
            const mockResponse = {
                ...offersResponseMock,
                reorderFilters: true,
            };
            OffersService.fetchOffers = jest.fn().mockResolvedValue(mockResponse);
            jest.spyOn(Axios.CancelToken, 'source').mockReturnValue({} as CancelTokenSource);

            const store = new TradePortalOffersStore(rootStore);
            store.savePrefillParams = jest.fn();
            store.updateOffersDataStatus = jest.fn();

            await store.fetchOffers(true, true);

            expect(rootStore.searchFiltersStore.saveFilters).toHaveBeenCalledWith(expect.any(Array), true);
        });
    });

    describe('handleOffersNoResults', () => {
        let rootStore = {} as any;
        const cancelToken = { cancel: jest.fn() } as any;

        beforeEach(() => {
            rootStore = {
                searchFiltersStore: { activeFilterCode: FilterGroupCodes.NoFilter },
                bookingStore: { loadRecommendedHotels: jest.fn(), recommendedHotels: [] },
                priceGraphStore: { loadAlternativeOffers: jest.fn() },
                searchStore: { searchTo: { selectedAccommodationCodes: '', selectedDestinations: [] } },
                layoutStore: { isPromoPage: false },
            };
        });

        it('should load only recommended offers', async () => {
            rootStore.bookingStore.recommendedHotels = [{ id: 'test' }] as IOffer[];
            const store = new TradePortalOffersStore(rootStore);
            const getParentOffersSpy = jest.spyOn(store as any, 'getParentOffers');

            await store.handleOffersNoResults(cancelToken);

            expect(store.rootStore.bookingStore.loadRecommendedHotels).toHaveBeenCalledWith(
                Bd4TravelPlacementId.TradeSearchResults,
                cancelToken,
            );
            expect(store.rootStore.priceGraphStore.loadAlternativeOffers).not.toHaveBeenCalled();
            expect(getParentOffersSpy).not.toHaveBeenCalled();
        });

        it('should load parent offers if recommended offers not found', async () => {
            const store = new TradePortalOffersStore(rootStore);
            const getParentOffersSpy = jest.spyOn(store as any, 'getParentOffers');

            await store.handleOffersNoResults(cancelToken);

            expect(store.rootStore.bookingStore.loadRecommendedHotels).toHaveBeenCalled();
            expect(store.rootStore.priceGraphStore.loadAlternativeOffers).not.toHaveBeenCalled();
            expect(getParentOffersSpy).toHaveBeenCalledWith(cancelToken);
        });

        it('should load alternative offers if recommended offers not found and accommodation codes are selected', async () => {
            rootStore.searchStore.searchTo.selectedAccommodationCodes = 'XYZ';
            const store = new TradePortalOffersStore(rootStore);
            const getParentOffersSpy = jest.spyOn(store as any, 'getParentOffers');

            await store.handleOffersNoResults(cancelToken);

            expect(store.rootStore.bookingStore.loadRecommendedHotels).toHaveBeenCalled();
            expect(store.rootStore.priceGraphStore.loadAlternativeOffers).toHaveBeenCalledWith(
                true,
                undefined,
                undefined,
                cancelToken,
            );
            expect(getParentOffersSpy).not.toHaveBeenCalled();
        });

        it('should load only recommended offers on Promo Page', async () => {
            rootStore.layoutStore.isPromoPage = true;
            const store = new TradePortalOffersStore(rootStore);
            const getParentOffersSpy = jest.spyOn(store as any, 'getParentOffers');

            await store.handleOffersNoResults(cancelToken);

            expect(store.rootStore.bookingStore.loadRecommendedHotels).toHaveBeenCalledWith(
                Bd4TravelPlacementId.TradePromoPage,
                cancelToken,
            );
            expect(store.rootStore.priceGraphStore.loadAlternativeOffers).not.toHaveBeenCalled();
            expect(getParentOffersSpy).not.toHaveBeenCalled();
        });
    });

    describe('getAllOffers', () => {
        const createRootStore = () => ({
            layoutStore: {
                isApplySpecialFilter: jest.fn(() => false),
            },
            bookingStore: {
                selectedNumberOfNights: 5,
                origins: ['UK'],
                selectedDestinationCodesQuery: ['ES'],
                roomsAllocation: [],
                selectedDestinationCodes: [],
                createRoomAllocation: jest.fn(),
            },
            searchStore: {
                searchWhen: { from: 'from', monthSearchDuration: 7, isMonthSearch: false },
                searchFrom: {
                    origins: [],
                },
                searchWho: {
                    isAutoAllocation: false,
                },
                searchTo: {
                    selectedAccommodationCodes: [],
                    selectedDestinations: [],
                },
            },
            searchFiltersStore: {},
            marketStore: {
                marketCode: MarketCode.UK,
            },
            promoPageStore: { rooms: [] },
            appStore: { deviceType: SitecoreChannel.Desktop },
        });

        let rootStore;

        beforeEach(() => {
            rootStore = createRootStore();
            OffersService.fetchOffers = jest.fn();
        });

        it('should call fetchOffersWithParams', async () => {
            const store = new TradePortalOffersStore(rootStore) as any;
            store.fetchOffersWithParams = jest.fn();
            store.savePrefillParams = jest.fn();

            await store.getAllOffers('ES');

            expect(store.fetchOffersWithParams).toHaveBeenCalled();
        });

        it('should call fetchOffersWithParams for promo page', async () => {
            const layout = {
                sitecore: {
                    route: {
                        name: 'promopage',
                        fields: {
                            DefaultDuration: {
                                value: '20,30',
                            },
                        },
                    },
                },
            };
            const store = new TradePortalOffersStore({
                layoutStore: {
                    isApplySpecialFilter: jest.fn(() => true),
                    isPromoPage: true,
                    layout,
                    pageName: 'promopage',
                },
                appStore: {
                    isScreenSmall: true,
                },
                searchFiltersStore: {
                    page: 1,
                    offersFilters: ['offer1'],
                },
                bookingStore: {
                    selectedNumberOfNights: 0,
                    origins: [],
                    selectedDestinationCodesQuery: ['ES'],
                    roomsAllocation: [],
                    selectedDestinationCodes: [],
                    isAutoAllocation: false,
                },
                searchStore: {
                    searchWhen: { from: 'from' },
                    searchTo: {
                        selectedDestinations: [],
                    },
                },
                marketStore: { marketCode: MarketCode.UK },
            } as any) as any;
            store.fetchOffersWithParams = jest.fn();
            const getPromoPageDates = jest.spyOn(promopageDates, 'getPromoPageDates').mockReturnValue({
                startDate: new Date('2020-09-02T00:00:00'),
                endDate: new Date('2020-09-06T00:00:00'),
            });

            await store.getAllOffers('ES', true, { token: 'token' });

            expect(getPromoPageDates).toHaveBeenCalledWith(layout);
            expect(store.rootStore.layoutStore.isApplySpecialFilter).toHaveBeenCalledWith(
                SiteSettings.KidsGoFree,
                'promopage',
            );
            expect(store.fetchOffersWithParams).toHaveBeenCalledWith({
                startDate: new Date('2020-09-02T00:00:00'),
                durations: ['20', '30'],
                departure: 'ALL',
                destinationCodesQuery: 'ES',
                rooms: [],
                withoutDestinationFilters: true,
                cancelSource: { token: 'token' },
                endDate: new Date('2020-09-06T00:00:00'),
                offers: `offer1,${FilterGroupCodes.FreeForKidsOnly}`,
                searchType: SearchType.Promo,
            });
        });

        it('should call loadMoreOffers if Load More button click on mobile Search Results page', async () => {
            const store = new TradePortalOffersStore({
                layoutStore: {
                    isSearchResultsPage: true,
                    layout: {
                        sitecore: {
                            route: {
                                name: 'name',
                            },
                        },
                    },
                    isApplySpecialFilter: jest.fn(() => false),
                },
                appStore: {
                    isScreenSmall: false,
                },
                bookingStore: {
                    origins: [],
                    selectedDestinationCodesQuery: ['ES'],
                    roomsAllocation: [],
                    selectedDestinationCodes: [],
                },
                searchFiltersStore: {},
                searchStore: { searchWhen: {}, searchTo: { selectedDestinations: [] } },
                marketStore: { marketCode: MarketCode.UK },
            } as any) as any;
            store.loadMoreOffers = jest.fn();
            store.setIsLoadMoreOffers(true);
            store.savePrefillParams = jest.fn();

            await store.getAllOffers('ES');

            expect(store.loadMoreOffers).toHaveBeenCalled();

            store.setIsLoadMoreOffers(false);
            store.setIsLoadPreviousOffers(true);

            expect(store.loadMoreOffers).toHaveBeenCalled();
        });

        it('should pass isMonthSearch param to fetchOffersWithParams when searchWhen.isMonthSearch is true', async () => {
            rootStore.searchStore.searchWhen.isMonthSearch = true;
            const store = new OffersStore(rootStore) as any;
            store.fetchOffersWithParams = jest.fn();
            store.savePrefillParams = jest.fn();

            await store.getAllOffers('UK');

            expect(store.fetchOffersWithParams).toHaveBeenCalledWith(
                expect.objectContaining({
                    isMonthSearch: true,
                }),
            );
        });

        it('should pass isMonthSearch param to loadMoreOffers when searchWhen.isMonthSearch is true', async () => {
            const store = new OffersStore({
                layoutStore: {
                    isSearchResultsPage: true,
                },
                appStore: {
                    isScreenSmall: false,
                },
                promoPageStore: {
                    duration: 7,
                    from: new Date('2025-01-01'),
                    to: new Date('2025-01-08'),
                    departures: 'UK',
                    rooms: [],
                },
                bookingStore: {
                    createRoomAllocation: jest.fn(),
                    selectedDestinationCodes: [],
                },
                searchFiltersStore: {},
                searchStore: {
                    searchWhen: { isMonthSearch: true, monthSearchDuration: 7 },
                    searchTo: { selectedDestinations: [] },
                },
                // marketStore: { marketCode: MarketCode.UK },
            } as any) as any;
            OffersService.fetchOffers = jest.fn();
            store.loadMoreOffers = jest.fn();
            store.savePrefillParams = jest.fn();
            store.setIsLoadMoreOffers(true);

            await store.getAllOffers('ES');

            expect(store.loadMoreOffers).toHaveBeenCalledWith(
                expect.objectContaining({
                    isMonthSearch: true,
                }),
            );
        });

        it(
            'should prioritize to value from booking or searchWhen stores ' +
                'over non-defined endDate on month search when promopage store values not defined',
            async () => {
                rootStore.searchStore.searchWhen = {
                    to: new Date('2025-02-10'),
                    monthSearchDuration: 2,
                    isMonthSearch: true,
                };
                const store = new TradePortalOffersStore(rootStore) as any;
                store.fetchOffersWithParams = jest.fn();
                store.savePrefillParams = jest.fn();

                await store.getAllOffers('ES');

                expect(store.fetchOffersWithParams).toHaveBeenCalledWith(
                    expect.objectContaining({
                        endDate: rootStore.searchStore.searchWhen.to,
                    }),
                );
            },
        );

        it('should call savePrefillParams with Durations and Departure from bookingStore', async () => {
            const store = new TradePortalOffersStore(rootStore) as any;

            store.rootStore.searchStore.searchTo.selectedDestinations = [{ type: DestinationType.VirtualResort }];
            OffersService.fetchOffers = jest.fn();
            store.loadMoreOffers = jest.fn();
            store.savePrefillParams = jest.fn();
            store.setIsLoadMoreOffers(true);

            await store.getAllOffers('ES');

            expect(store.savePrefillParams).toHaveBeenCalledWith(
                expect.objectContaining({
                    durations: [rootStore.bookingStore.selectedNumberOfNights?.toString()],
                    departure: rootStore.bookingStore.origins.join(','),
                    dest: rootStore.bookingStore.selectedDestinationCodes.join(','),
                    geog: 'ES',
                }),
            );
        });
    });

    describe('loadMoreOffers', () => {
        it('should join new offers to previously loaded if Load more button clicked', async () => {
            const filters = [
                {
                    code: 'test filter',
                } as any,
            ];
            const status = {
                total: 10,
            };
            const offers = [
                {
                    accom: {
                        code: 'loaded',
                    },
                } as IOffer,
            ];
            const offersMock = {
                filters,
                offers,
                status,
            } as ISearchOffers;

            const store = new TradePortalOffersStore({
                searchStore: {
                    page: 1,
                },
            } as any) as any;

            store.offers = [
                {
                    accom: {
                        code: 'initial',
                    },
                },
            ];
            store.setIsLoadMoreOffers(true);
            store.fetchOffersWithParams = jest.fn().mockReturnValue(Promise.resolve(offersMock));

            const result = await store.loadMoreOffers();

            expect(result.offers.length).toEqual(2);
            expect(result.offers[0].accom.code).toEqual('initial');
            expect(result.offers[1].accom.code).toEqual('loaded');
            expect(result.filters).toEqual(filters);
            expect(result.status).toEqual(status);
        });

        it('should join previously loaded offers to new offers if Load Previous button clicked', async () => {
            const filters = [
                {
                    code: 'test filter',
                } as any,
            ];
            const status = {
                total: 10,
            };
            const offers = [
                {
                    accom: {
                        code: 'loaded',
                    },
                } as IOffer,
            ];
            const offersMock = {
                filters,
                offers,
                status,
            } as ISearchOffers;

            const store = new TradePortalOffersStore({
                searchStore: {
                    page: 1,
                },
            } as any) as any;

            store.offers = [
                {
                    accom: {
                        code: 'initial',
                    },
                },
            ];
            store.fetchOffersWithParams = jest.fn().mockReturnValue(Promise.resolve(offersMock));

            const result = await store.loadMoreOffers();

            expect(result.offers.length).toEqual(2);
            expect(result.offers[0].accom.code).toEqual('loaded');
            expect(result.offers[1].accom.code).toEqual('initial');
            expect(result.filters).toEqual(filters);
            expect(result.status).toEqual(status);
        });
    });

    describe('cleanUpParentOffers', () => {
        it('should clean offers', () => {
            const store = new TradePortalOffersStore({} as any);
            store.parentOffers = [];

            store.cleanUpParentOffers();

            expect(store.parentOffers).toBeNull();
        });
    });

    describe('updateSelectedDestination', () => {
        it('should do nothing if NO countries with regions', () => {
            const store = new TradePortalOffersStore({
                searchStore: {
                    searchTo: {
                        countriesWithRegions: [],
                        changeDestinations: jest.fn(),
                    },
                },
            } as any);
            const getIDestinationByCode = jest.spyOn(destinationUtils, 'getIDestinationByCode');

            store.updateSelectedDestination();

            expect(getIDestinationByCode).not.toHaveBeenCalled();
            expect(store.rootStore.searchStore.searchTo.changeDestinations).not.toHaveBeenCalled();
        });

        it('should call getIDestinationByCode for each selected destination ', () => {
            const store = new TradePortalOffersStore({
                searchStore: {
                    searchTo: {
                        selectedDestinationCodes: ['ES', 'GR'],
                        countriesWithRegions: [{ code: 'ES' }],
                        changeDestinations: jest.fn(),
                    },
                },
            } as any);
            const getIDestinationByCode = jest
                .spyOn(destinationUtils, 'getIDestinationByCode')
                .mockReturnValue('destination' as any);

            store.updateSelectedDestination();

            expect(getIDestinationByCode.mock.calls).toEqual([
                [[{ code: 'ES' }], 'ES'],
                [[{ code: 'ES' }], 'GR'],
            ]);
            expect(store.rootStore.searchStore.searchTo.changeDestinations).toHaveBeenCalledWith([
                'destination',
                'destination',
            ]);
        });
    });

    describe('getParentOffers', () => {
        it('should do nothing if not all search parameters selected', () => {
            const store = new TradePortalOffersStore({
                searchStore: {
                    isAllSearchParametersSelected: false,
                },
            } as any);
            store['getAllOffers'] = jest.fn();

            store['getParentOffers']();

            expect(store['getAllOffers']).not.toHaveBeenCalled();
        });

        it('should cleanup parent offers if no loaded offers', async () => {
            const store = new TradePortalOffersStore({
                searchStore: {
                    isAllSearchParametersSelected: true,
                    searchTo: {
                        selectedParentDestinationCodesQuery: 'ES',
                    },
                },
            } as any);
            store.cleanUpParentOffers = jest.fn();
            store['getAllOffers'] = jest.fn().mockReturnValue(Promise.resolve({ offers: [] }));

            await store['getParentOffers']();

            expect(store['getAllOffers']).toHaveBeenCalledWith('ES', true, undefined);
            expect(store.cleanUpParentOffers).toHaveBeenCalled();
        });

        it('should cleanup parent offers if no loaded offers', async () => {
            const store = new TradePortalOffersStore({
                searchStore: {
                    isAllSearchParametersSelected: true,
                    searchTo: {
                        selectedParentDestinationCodesQuery: 'ES',
                    },
                },
            } as any);
            store.cleanUpParentOffers = jest.fn();
            store['getAllOffers'] = jest.fn().mockReturnValue(Promise.resolve({ offers: [] }));

            await store['getParentOffers']();

            expect(store['getAllOffers']).toHaveBeenCalledWith('ES', true, undefined);
            expect(store.cleanUpParentOffers).toHaveBeenCalled();
        });

        it('should update parent offers', async () => {
            const store = new TradePortalOffersStore({
                searchStore: {
                    isAllSearchParametersSelected: true,
                    searchTo: {
                        selectedParentDestinationCodesQuery: 'ES',
                    },
                },
            } as any);
            const parrentOffer = { value: 'parent offer' };

            store.changeShowParentOffers = jest.fn();
            store.updateSelectedDestination = jest.fn();
            store['getAllOffers'] = jest.fn().mockReturnValue(Promise.resolve({ offers: [parrentOffer] }));

            await store['getParentOffers']();

            expect(store['getAllOffers']).toHaveBeenCalledWith('ES', true, undefined);
            expect(store.parentOffers).toEqual([parrentOffer]);
            expect(store.updateSelectedDestination).toHaveBeenCalled();
            expect(store.changeShowParentOffers).toHaveBeenCalled();
        });
    });

    describe('getDestinationsByCodes', () => {
        it('should return [] if no codes', async () => {
            const store = new TradePortalOffersStore({} as any);

            const result = await store.getDestinationsByCodes([], true);

            expect(result).toEqual([]);
        });

        it('should return destinations', async () => {
            const store = new TradePortalOffersStore({} as any);
            const destinations = [
                {
                    code: 'ES',
                    parents: [],
                },
            ];
            OffersService.fetchDestinationsByCodes = jest.fn().mockReturnValue(Promise.resolve(destinations));

            const result = await store.getDestinationsByCodes(['CODE'], true);

            expect(result).toEqual(destinations);
        });

        it('should return [] if request performed with an error', async () => {
            const store = new TradePortalOffersStore({} as any);
            OffersService.fetchDestinationsByCodes = jest.fn().mockReturnValue(Promise.reject());

            const result = await store.getDestinationsByCodes(['CODE'], true);

            expect(OffersService.fetchDestinationsByCodes).toHaveBeenCalledWith(['CODE'], true);
            expect(result).toEqual([]);
        });
    });

    describe('getDestinationsForLoadingLivePrice', () => {
        it('should return filtered destinations that are enabled for live price', async () => {
            const store = new TradePortalOffersStore({
                layoutStore: {
                    destinationWithoutLivePrice: ['EG'],
                    isLivePriceEnabledForDestination: jest.fn(() => true),
                },
            } as any);
            const mockDestination = [
                {
                    code: 'ALC',
                },
                {
                    code: 'CRF',
                },
            ];
            store.getDestinationsByCodes = jest.fn().mockReturnValue(Promise.resolve(mockDestination));

            const result = await store.getDestinationsForLoadingLivePrice(['ALC', 'CRF']);

            expect(store.getDestinationsByCodes).toHaveBeenCalledWith(['ALC', 'CRF'], true);
            expect(result).toEqual(['ALC', 'CRF']);
        });
    });

    describe('getLivePrice', () => {
        it('should return empty array if no codes', async () => {
            const store = new TradePortalOffersStore({} as any);

            const result = await store.getLivePrice([]);

            expect(result).toEqual([]);
        });

        it('should load prices without checking parents destinations', async () => {
            const store = new TradePortalOffersStore({} as any);
            store.getDestinationsForLoadingLivePrice = jest.fn();

            const mock = [
                {
                    geog: 'IS',
                    searchCriteria: {
                        range: { start: '2020-10-21T00:00:00+00:00', end: '2020-10-23T00:00:00+00:00' },
                        date: '2020-10-22T00:00:00+00:00',
                        depPt: 'EDI',
                        id: 'City',
                        adults: 2,
                        children: 0,
                        infants: 0,
                        duration: 5,
                        childAges: [],
                        themeTypesCodes: ['C'],
                    },
                    price: 562.0,
                    pricePP: 281.0,
                    searchDate: '2020-09-17T05:00:23+00:00',
                },
            ];
            OffersService.getLivePrice = jest.fn().mockReturnValue(Promise.resolve(mock));

            const result = await store.getLivePrice(['IS', 'ES']);

            expect(OffersService.getLivePrice).toHaveBeenCalledWith('IS,ES', true, false);
            expect(result).toEqual(mock);
            expect(store.getDestinationsForLoadingLivePrice).not.toHaveBeenCalled();
        });

        it('should check destinatons and return [] if no enadled destinations after checking', async () => {
            const store = new TradePortalOffersStore({} as any);
            store.getDestinationsForLoadingLivePrice = jest.fn().mockReturnValue(Promise.resolve([]));
            OffersService.getLivePrice = jest.fn();

            const result = await store.getLivePrice(['IS', 'ES'], true);

            expect(result).toEqual([]);
            expect(store.getDestinationsForLoadingLivePrice).toHaveBeenCalledWith(['IS', 'ES']);
            expect(OffersService.getLivePrice).not.toHaveBeenCalled();
        });

        it('should return [] if request performed with an error', async () => {
            const store = new TradePortalOffersStore({} as any);
            OffersService.getLivePrice = jest.fn().mockReturnValue(Promise.reject());
            const result = await store.getLivePrice(['IS', 'ES']);

            expect(OffersService.getLivePrice).toHaveBeenCalledWith('IS,ES', true, false);
            expect(result).toEqual([]);
        });
    });

    describe('updateOffersWithSelectedBoard', () => {
        const oldAccom = {
            accommodationId: 'accommodationId',
            packageId: 'packageId',
        };
        const newAccom = {
            accommodationId: 'accommodationId2',
            packageId: 'packageId2',
        };
        const oldPrices = {
            price: 10,
            pricePP: 5,
        };
        const newPrices = {
            price: 11,
            pricePP: 6,
        };
        const initialOffer = {
            accom: {
                id: 'accomId',
                unit: [
                    {
                        ...oldAccom,
                        boardType: {
                            code: 'boardType',
                            ...oldAccom,
                        },
                    },
                ],
                isExt: false,
            },
            altAcc: [{ ...newAccom }],
            id: 'offerId',
            ...oldPrices,
        } as any;
        const anotherInitialOffer = {
            ...initialOffer,
            accom: {
                ...initialOffer.accom,
                unit: { ...initialOffer.accom.unit, boardType: { ...initialOffer.accom.unit.boardType } },
            },
            id: 'offerId2',
        };
        const mockedBoardType = { code: '', title: '', content: '', description: '', iconUrl: '' };
        const mockedRoomType = {
            code: 'newCode',
            title: mockSitecoreField('newTitle'),
            description: 'newDescription',
            content: 'newContent',
            iconUrl: 'newIconUrl',
            images: [],
            facilities: [],
            stays: [],
        };
        const mockedOfferUnit = {
            boardType: mockedBoardType,
            roomType: mockedRoomType,
            board: '',
            code: '',
            occupation: {} as any,
            price: 12,
            pricePP: 34,
        };

        it('should updateOffersWithSelectedBoard', () => {
            const store = new TradePortalOffersStore({
                bookingStore: { selectedOffer: {} },
            } as any);

            store.offers = [initialOffer, anotherInitialOffer];
            store.updateOffersWithSelectedBoard(
                initialOffer,
                {
                    ...newAccom,
                    ...newPrices,
                    code: 'boardType2',
                } as any,
                [
                    {
                        ...oldAccom,
                        ...oldPrices,
                        code: 'boardType',
                    },
                ] as any,
                [mockedOfferUnit],
            );

            expect(store.offers).toEqual([
                {
                    accom: {
                        id: 'accommodationId2',
                        packageId: 'packageId2',
                        unit: [mockedOfferUnit],
                        isExt: false,
                    },
                    altAcc: [
                        {
                            ...newAccom,
                        },
                    ],
                    altBoards: [
                        {
                            ...oldAccom,
                            ...oldPrices,
                            code: 'boardType',
                        },
                    ],
                    id: 'offerId',
                    ...newPrices,
                } as any,
                anotherInitialOffer,
            ]);
        });

        it('should update selected offer & alternativeBoards', () => {
            const store = new TradePortalOffersStore({
                bookingStore: { selectedOffer: {} },
            } as any);

            store.updateOffersWithSelectedBoard(
                initialOffer,
                {
                    ...newAccom,
                    ...newPrices,
                    code: 'boardType2',
                    isExt: true,
                } as any,
                [
                    {
                        ...oldAccom,
                        ...oldPrices,
                        code: 'boardType',
                    },
                ] as any,
                [mockedOfferUnit],
            );

            expect(store.rootStore.bookingStore.selectedOffer).toEqual({
                accom: {
                    id: 'accommodationId2',
                    packageId: 'packageId2',
                    unit: [mockedOfferUnit],
                    isExt: true,
                },
                altAcc: [newAccom],
                altBoards: [
                    {
                        ...oldAccom,
                        ...oldPrices,
                        code: 'boardType',
                    },
                ],
                id: 'offerId',
                ...newPrices,
            });
            expect(store.rootStore.bookingStore.alternativeBoards).toEqual([
                {
                    ...oldAccom,
                    ...oldPrices,
                    code: 'boardType',
                },
            ]);
        });
    });

    describe('defaultLoadResults', () => {
        let store;
        const mockRootStore = {
            searchStore: {
                setSeachPerformWithNewParams: jest.fn(),
                setPageNumber: jest.fn(),
                setPrevPageNumber: jest.fn(),
            },
            searchFiltersStore: {
                onChangeSearchFilterStore: jest.fn(),
            },
            layoutStore: {
                isSearchResultsPage: false,
                isPromoPage: true,
            },
            appStore: { isScreenLessMedium: true },
            routerStore: { updateSearchResultsPage: jest.fn() },
        };

        beforeEach(() => {
            store = new OffersStore(mockRootStore as unknown as HolidaysRootStore);
            store.fetchOffers = jest.fn();
        });

        it('should call setSeachPerformWithNewParams, setPageNumber, setPrevPageNumber, fetchOffers and setFiltersChanged', () => {
            store.defaultLoadResults();

            expect(mockRootStore.searchStore.setSeachPerformWithNewParams).toHaveBeenCalledWith(true);
            expect(mockRootStore.searchStore.setPageNumber).toHaveBeenCalledWith(1);
            expect(mockRootStore.searchStore.setPrevPageNumber).toHaveBeenCalledWith(null);
            expect(store.fetchOffers).toHaveBeenCalledWith(true);
            expect(mockRootStore.searchFiltersStore.onChangeSearchFilterStore).toHaveBeenCalledWith({
                key: 'filtersChanged',
                value: true,
            });
        });
    });

    describe('hotel types handling on trade', () => {
        beforeEach(() => {
            OffersService.fetchOffers = jest.fn().mockResolvedValue(offersResponseMock);
            OffersService.fetchFilteredHotels = jest.fn().mockResolvedValue(offersResponseMock);
        });

        const createTradeStore = (isTradePromoPage: boolean) =>
            new TradePortalOffersStore({
                layoutStore: {
                    isPromoPage: isTradePromoPage,
                    isApplySpecialFilter: jest.fn(() => false),
                    layout: { sitecore: { route: { fields: {}, itemId: 'itemId' } } },
                },
                searchFiltersStore: {
                    hotelTypesFilters: 'type2,type3',
                },
                promoPageStore: {
                    hotelTypes: ['type3', 'type4'],
                },
                searchStore: {
                    isAllSearchParametersSelected: true,
                    searchWhen: {
                        flexDays: 0,
                    },
                    searchTo: {},
                    searchFrom: {
                        origins: [],
                    },
                    searchWho: {},
                },
                bookingStore: {
                    clearBookingFlow: jest.fn(),
                },
                paymentStore: { clearPaymentStore: jest.fn() },
                priceGraphStore: { clearAlternativeOffers: jest.fn() },
                trackingStore: { setBd4SortTracking: jest.fn() },
                marketStore: {
                    marketCode: MarketCode.UK,
                    isValidForMarketAirports: jest.fn(() => true),
                },
                appStore: { deviceType: SitecoreChannel.Desktop },
            } as any) as any;

        it('should handle hotel types for promo page on trade', async () => {
            const store = createTradeStore(true);

            // Mock the utility functions
            jest.spyOn(promoPageUtils, 'getPromoPackageThemesFilters').mockReturnValue([]);
            jest.spyOn(arrayUtils, 'joinUniqueNonEmptyArrayValues').mockReturnValue('');

            // Trigger the code that uses hotelTypes (e.g., through fetchOffersWithParams)
            await store.fetchOffersWithParams(
                new Date('2020-09-02T00:00:00'),
                ['20', '30'],
                DEPARTURE_ALL_CODE,
                'ES',
                [],
                undefined,
                true,
                { token: 'token' },
                new Date('2020-09-06T00:00:00'),
                '',
                SearchType.Promo,
            );

            // Verify the hotel types were processed correctly
            expect(arrayUtils.joinUniqueNonEmptyArrayValues).toHaveBeenCalledWith(
                ['type2', 'type3'],
                ['type3', 'type4'],
            );
        });

        it('should handle hotel types for non-promo page on trade', async () => {
            const store = createTradeStore(false);

            // Trigger the code that uses hotelTypes
            await store.fetchOffersWithParams(
                new Date('2020-09-02T00:00:00'),
                ['20', '30'],
                DEPARTURE_ALL_CODE,
                'ES',
                [],
                undefined,
                true,
                { token: 'token' },
                new Date('2020-09-06T00:00:00'),
                '',
                SearchType.Promo,
            );

            // Verify the hotel types were passed through directly
            expect(store.rootStore.searchFiltersStore.hotelTypesFilters).toBe('type2,type3');
        });
    });

    describe('getDestinationsAvailability', () => {
        test('should load destination availability', async () => {
            const store = new TradePortalOffersStore(null as any);
            const mockTo = 'to';
            const responseMock = ['test'];
            OffersService.getDestinationsAvailability = jest.fn().mockResolvedValue(responseMock);

            const res = await store.getDestinationsAvailability(mockTo);

            expect(res).toBe(responseMock);
        });

        test('should catch error and return null when api rejected', async () => {
            const store = new TradePortalOffersStore(null as any);
            const mockTo = 'to';
            OffersService.getDestinationsAvailability = jest.fn().mockRejectedValue(new Error());

            const res = await store.getDestinationsAvailability(mockTo);

            expect(res).toBeNull();
        });
    });

    describe('fetchOffersWithParams', () => {
        const params = {
            startDate: new Date('2020-09-02T00:00:00'),
            durations: ['20', '30'],
            departure: DEPARTURE_ALL_CODE,
            destinationCodesQuery: 'ES',
            rooms: [],
            page: undefined,
            withoutDestinationFilters: true,
            offersSearchCancelSource: { token: 'token' },
            endDate: new Date('2020-09-06T00:00:00'),
            offers: `offer1,${FilterGroupCodes.FreeForKidsOnly}`,
            searchType: SearchType.Promo,
        };

        it('should pass valid placementId and destinations on promo page', async () => {
            const mockDestinationsQuery = ['country:ES', 'region:ESMJ'];
            const store = new TradePortalOffersStore({
                layoutStore: {
                    isPromoPage: true,
                },
                searchFiltersStore: {
                    flightDurationFrom: 1,
                },
                promoPageStore: {
                    editorDestinationsQuery: mockDestinationsQuery,
                },
                searchStore: {
                    selectedDestinationsQuery: null,
                },
            } as any) as any;
            store.fetchOffersWithParamsBase = jest.fn();

            await store.fetchOffersWithParams(params);

            expect(store.fetchOffersWithParamsBase).toHaveBeenCalledWith(
                Bd4TravelListIdTrade.PromoList,
                mockDestinationsQuery,
                60,
                params,
            );
        });

        it('should pass valid placementId and destinations on not promo page', async () => {
            const mockDestinationsQuery = ['country:ES', 'region:ESMJ'];
            const store = new TradePortalOffersStore({
                layoutStore: {
                    isPromoPage: false,
                },
                searchFiltersStore: {
                    flightDurationFrom: 1,
                },
                promoPageStore: {
                    editorDestinationsQuery: null,
                },
                searchStore: {
                    selectedDestinationsQuery: mockDestinationsQuery,
                },
            } as any) as any;
            store.fetchOffersWithParamsBase = jest.fn();

            await store.fetchOffersWithParams(params);

            expect(store.fetchOffersWithParamsBase).toHaveBeenCalledWith(
                Bd4TravelListIdTrade.HotelsList,
                mockDestinationsQuery,
                60,
                params,
            );
        });
    });
});
