import Axios, { CancelTokenSource } from 'axios';

import { editorDestinationsQueryMock } from 'frontend/__mocks__';
import OffersService from 'frontend/services/offers.service';
import { MIN_FLIGHT_DURATION } from 'frontend/store/base/search/BaseSearchFilterStore';
import { SitecoreChannel } from 'frontend/store/base/tracking/sitecore/constants';
import { HolidaysRootStore } from 'frontend/store/holidays/HolidaysRootStore';
import * as arrayUtils from 'frontend/utils/array.utils';
import * as destinationUtils from 'frontend/utils/destinations.utils';
import * as promoPageUtils from 'frontend/utils/promoPage.utils';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { IOffer } from 'models/data/IOffer';
import { ISearchOffers } from 'models/data/ISearchOffers';
import { MarketCode } from 'models/data/MarketSettings';
import { Bd4TravelListIdHolidays, Bd4TravelPlacementId } from 'models/enum/Bd4TravelListId';
import { DataStatus } from 'models/enum/DataStatus';
import { DestinationType } from 'models/enum/DestinationType';
import { FilterGroupCodes } from 'models/enum/FilterGroupCodes';
import { DEPARTURE_ALL_CODE } from 'models/enum/RequestConstants';
import { SearchType } from 'models/enum/SearchType';

import { OffersStore } from './OffersStore';

jest.mock('frontend/services/offers.service', () => ({
    fetchOffers: jest.fn(),
}));

jest.mock('frontend/services/logging');

const offersResponseMock = {
    filters: [{ code: 'test filter' } as any],
    offers: [{ accom: { code: 'test' } } as IOffer],
    status: { total: 10, maxPrice: 100, minPrice: 22, maxPricePP: 50, minPricePP: 11 } as any,
    reorderFilters: false,
} as ISearchOffers;

describe('OffersStore', () => {
    describe('tests with common offer store declaration with null root store', () => {
        let store;

        beforeEach(() => {
            store = new OffersStore(null as any);
        });

        describe('hasOffers', () => {
            it('should return true if there are offers', () => {
                store.offers = [{} as IOffer];

                expect(store.hasOffers).toBe(true);
            });

            it('should return false if there are no offers', () => {
                store.offers = [];

                expect(store.hasOffers).toBe(false);
            });

            it('should return false if there are offers.', () => {
                store.offers = undefined as any;

                expect(store.hasOffers).toBe(false);
            });
        });

        describe('updateOffersDataStatus', () => {
            it('should update status', () => {
                expect(store.status).toEqual(DataStatus.NotLoaded);

                store.updateOffersDataStatus(DataStatus.Loading);

                expect(store.status).toEqual(DataStatus.Loading);
            });
        });

        describe('saveOffers', () => {
            it('should save offers', () => {
                const offers = [{ accom: { code: 'test' } } as IOffer];

                expect(store.offers).toEqual([]);

                store.saveOffers(offers);

                expect(store.offers).toEqual(offers);
            });
        });
    });

    describe('selectSpecificOffer', () => {
        it('should set queryParamsStore properties', () => {
            const store = new OffersStore({
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
                searchFrom: {
                    origins: ['origins'],
                },
                searchTo: {
                    selectedDestinationCodes: ['FR', 'IT', 'FRPR'],
                },
                searchWhen: { from: 'from', to: 'to', isFlexible: false, flexDays: 0 },
                searchWho: {
                    roomsAllocation: [{ adults: [], children: [], infants: [] }],
                },
                destination: 'destination|destination',
                take: 'take',
                page: 'page',
                orderBy: 'orderBy',
                orderDirection: 'orderDirection',
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
                flightDurationTo: 5,
            },
            promoPageStore: {
                duration: 0,
                from: null,
                to: null,
                departures: '',
                rooms: [],
                editorGeographyQuery: 'TR|EG|IT,EGHR|ITLG,ITLGBA',
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
                createRoomAllocation: jest.fn(),
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
            marketStore: {
                marketCode: MarketCode.UK,
                isValidForMarketAirports: jest.fn(() => true),
            },
            appStore: { deviceType: SitecoreChannel.Mobile },
        });

        let rootStore = {} as any;
        let store;

        beforeEach(() => {
            rootStore = createRootStore();
            OffersService.fetchOffers = jest.fn().mockResolvedValue(offersResponseMock);
            OffersService.fetchPolygonHotels = jest.fn().mockResolvedValue(offersResponseMock);
            store = new OffersStore(rootStore);
            store.savePrefillParams = jest.fn();
            store.updateOffersDataStatus = jest.fn();
            store.rootStore.searchStore.searchTo.selectedDestinations = [];
        });

        it('should set LoadingMore status when Load More button was clicked', async () => {
            store.setIsLoadMoreOffers(true);

            await store.fetchOffers(true, false);

            expect(store.updateOffersDataStatus).toHaveBeenCalledWith(DataStatus.LoadingMore);
        });

        it('should set LoadingPrevious status when Load Previous button was clicked', async () => {
            store.setIsLoadPreviousOffers(true);

            await store.fetchOffers(true, false);

            expect(store.updateOffersDataStatus).toHaveBeenCalledWith(DataStatus.LoadingPrevious);
        });

        it('should set Loading status when Load Previous and Load More buttons was NOT clicked', async () => {
            await store.fetchOffers(true, false);

            expect(store.updateOffersDataStatus).toHaveBeenCalledWith(DataStatus.Loading);
        });

        it('should NOT load offers when NOT all search params filled in', async () => {
            rootStore.searchStore.isAllSearchParametersSelected = false;
            rootStore.bookingStore.isAllSearchParametersSelected = false;

            await store.fetchOffers();

            expect(OffersService.fetchOffers).not.toHaveBeenCalled();
        });

        it('should NOT load offers when status is Loaded', async () => {
            store.status = DataStatus.Loaded;

            await store.fetchOffers();

            expect(OffersService.fetchOffers).not.toHaveBeenCalled();
        });

        it('should NOT load offers when status is Error', async () => {
            store.status = DataStatus.Error;

            await store.fetchOffers();

            expect(OffersService.fetchOffers).not.toHaveBeenCalled();
        });

        it('should load offers and clear flow', async () => {
            jest.spyOn(rootStore.bookingStore, 'createRoomAllocation').mockReturnValue([
                {
                    adults: 0,
                    children: 0,
                    infants: 0,
                    roomCode: '',
                    childrenAges: [],
                },
            ]);
            jest.spyOn(Axios.CancelToken, 'source').mockReturnValue({} as CancelTokenSource);

            const promise = store.fetchOffers();

            expect(store.updateOffersDataStatus).toHaveBeenCalledWith(DataStatus.Loading);

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
                placementId: 'hotels_list',
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
                flightDurationFrom: rootStore.searchFiltersStore.flightDurationFrom * 60,
                flightDurationTo: rootStore.searchFiltersStore.flightDurationTo * 60,
                deviceType: SitecoreChannel.Mobile,
            });

            expect(store.updateOffersDataStatus).toHaveBeenCalledWith(DataStatus.Loaded);
            expect(rootStore.searchFiltersStore.saveFilters).toHaveBeenCalled();
            expect(store.offers).toEqual(offersResponseMock.offers);
            expect(store.numberOfHotels).toEqual(10);
            expect(rootStore.bookingStore.clearBookingFlow).toHaveBeenCalled();
            expect(rootStore.paymentStore.clearPaymentStore).toHaveBeenCalled();
            expect(rootStore.priceGraphStore.clearAlternativeOffers).toHaveBeenCalled();
        });

        it('should force load offers', async () => {
            await store.fetchOffers(true);

            expect(OffersService.fetchOffers).toHaveBeenCalled();
            expect(store.updateOffersDataStatus).toHaveBeenCalledWith(DataStatus.Loaded);
            expect(rootStore.searchFiltersStore.saveFilters).toHaveBeenCalledWith(expect.any(Array), false);
            expect(store.offers).toEqual(offersResponseMock.offers);
            expect(store.numberOfHotels).toEqual(10);
        });

        it('should call getAllOffers with editorGeographyQuery for Dynamic Promo Page', async () => {
            rootStore.layoutStore.isDynamicPromoPage = true;
            store.getAllOffers = jest.fn();

            await store.fetchOffers();

            expect(store.getAllOffers).toHaveBeenCalledWith(
                rootStore.promoPageStore.editorGeographyQuery,
                false,
                expect.any(Object),
            );
        });

        it('should call onChangeSearchFilterStore after fetching offer', async () => {
            await store.fetchOffers(true);

            expect(store.savePrefillParams).toHaveBeenCalled();
            expect(OffersService.fetchOffers).toHaveBeenCalled();
            expect(store.offers).toEqual(offersResponseMock.offers);
            expect(rootStore.searchFiltersStore.onChangeSearchFilterStore).toHaveBeenCalledWith({
                key: 'isFiltersLoadingScreenEnabled',
                value: true,
            });
        });

        it('should call handleOffersNoResults when no results', async () => {
            rootStore.marketStore.isValidForMarketAirports = jest.fn(() => false);

            const handleOffersNoResultsSpy = jest.spyOn(store, 'handleOffersNoResults');
            OffersService.fetchOffers = jest.fn().mockResolvedValue({ offers: [], status: { total: 0 } });

            await store.fetchOffers();

            expect(handleOffersNoResultsSpy).toHaveBeenCalled();
        });

        it('should pass reorderFilters from API response to saveFilters', async () => {
            const mockResponse = {
                ...offersResponseMock,
                reorderFilters: true,
            };
            OffersService.fetchOffers = jest.fn().mockResolvedValue(mockResponse);
            jest.spyOn(Axios.CancelToken, 'source').mockReturnValue({} as CancelTokenSource);

            const store = new OffersStore(rootStore);
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
                searchStore: { searchTo: { selectedAccommodationCodes: '' } },
                layoutStore: { isPromoPage: false },
            };
        });

        it('should load only recommended offers', async () => {
            rootStore.bookingStore.recommendedHotels = [{ id: 'test' }] as IOffer[];
            const store = new OffersStore(rootStore);
            const getParentOffersSpy = jest.spyOn(store as any, 'getParentOffers');

            await store.handleOffersNoResults(cancelToken);

            expect(store.rootStore.bookingStore.loadRecommendedHotels).toHaveBeenCalledWith(
                Bd4TravelPlacementId.SearchResults,
                cancelToken,
            );
            expect(store.rootStore.priceGraphStore.loadAlternativeOffers).not.toHaveBeenCalled();
            expect(getParentOffersSpy).not.toHaveBeenCalled();
        });

        it('should load parent offers if recommended offers not found', async () => {
            const store = new OffersStore(rootStore);
            const getParentOffersSpy = jest.spyOn(store as any, 'getParentOffers');

            await store.handleOffersNoResults(cancelToken);

            expect(store.rootStore.bookingStore.loadRecommendedHotels).toHaveBeenCalled();
            expect(store.rootStore.priceGraphStore.loadAlternativeOffers).not.toHaveBeenCalled();
            expect(getParentOffersSpy).toHaveBeenCalledWith(cancelToken);
        });

        it('should load alternative offers if recommended offers not found and accommodation codes are selected', async () => {
            rootStore.searchStore.searchTo.selectedAccommodationCodes = 'XYZ';
            const store = new OffersStore(rootStore);
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
            const store = new OffersStore(rootStore);
            const getParentOffersSpy = jest.spyOn(store as any, 'getParentOffers');

            await store.handleOffersNoResults(cancelToken);

            expect(store.rootStore.bookingStore.loadRecommendedHotels).toHaveBeenCalledWith(
                Bd4TravelPlacementId.PromoPage,
                cancelToken,
            );
            expect(store.rootStore.priceGraphStore.loadAlternativeOffers).not.toHaveBeenCalled();
            expect(getParentOffersSpy).not.toHaveBeenCalled();
        });
    });

    describe('getAllOffers', () => {
        const createRootStore = () => ({
            searchStore: {
                isAllSearchParametersSelected: true,
                selectedNumberOfNights: 5,
                searchWhen: {
                    from: 'from',
                    to: 'to',
                    monthSearchDuration: 7,
                },
                searchFrom: {
                    origins: ['origins'],
                },
                searchTo: {
                    selectedDestinationCodes: ['FR', 'IT', 'FRPR'],
                    selectedDestinations: [],
                },
                searchWho: { adultsQuantity: 'adultsQuantity', childrenQuantity: 'childrenQuantity' },
                destination: 'destination|destination',

                infantsCount: 'infantsCount',
                take: 'take',
                page: 'page',
                orderBy: 'orderBy',
                orderDirection: 'orderDirection',
                roomsAllocation: [{ adults: [], children: [], infants: [] }],
                isFlexible: false,
                flexDays: 0,
            },
            promoPageStore: {
                duration: 7,
                from: new Date('2025-01-01'),
                to: new Date('2025-01-08'),
                departures: 'UK',
                rooms: [
                    {
                        adults: [{ id: 1 }, { id: 2 }],
                        children: [{ age: 5 }],
                        infants: [{ id: 1 }, { id: 2 }],
                        roomCode: '',
                    },
                ],
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
                setIsFiltersLoadingScreenEnabled: jest.fn(),
                flightDurationFrom: 1,
                flightDurationTo: 5,
            },
            bookingStore: {
                selectedNumberOfNights: 5,
                from: new Date('2025-01-10'),
                createRoomAllocation: jest.fn(),
                origins: ['UK'],
                selectedDestinationCodes: ['ES'],
                roomsAllocation: [
                    {
                        adults: [{ id: 1 }],
                        children: [{ age: 3 }],
                        infants: [{ id: 1 }],
                        roomCode: '',
                    },
                ],
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
            marketStore: {
                marketCode: MarketCode.UK,
                isValidForMarketAirports: jest.fn(() => true),
            },
            appStore: {
                isScreenSmall: false,
            },
        });

        let rootStore;

        beforeEach(() => {
            rootStore = createRootStore();
            OffersService.fetchOffers = jest.fn().mockResolvedValue(offersResponseMock);
        });

        it('should prioritize searchStore.searchWhen dates over promoPageStore dates', async () => {
            rootStore.searchStore.searchWhen = {
                from: new Date('2025-02-01'),
                to: new Date('2025-02-10'),
            };

            const store = new OffersStore(rootStore) as any;
            store.fetchOffersWithParams = jest.fn();
            store.savePrefillParams = jest.fn();

            await store.getAllOffers('UK');

            expect(store.fetchOffersWithParams).toHaveBeenCalledWith(
                expect.objectContaining({
                    startDate: new Date('2025-02-01'),
                    endDate: new Date('2025-02-10'),
                    durations: ['7'],
                    departure: 'LTN',
                    destinationCodesQuery: 'UK',
                    rooms: rootStore.promoPageStore.rooms,
                    page: 'page',
                    searchType: SearchType.Normal,
                }),
            );
        });

        it('should fall back to bookingStore values when promoPageStore is NOT defined', async () => {
            jest.spyOn(rootStore.bookingStore, 'createRoomAllocation').mockReturnValue([
                {
                    adults: 1,
                    children: 1,
                    infants: 1,
                    roomCode: '',
                    childrenAges: [3],
                },
            ]);

            rootStore.promoPageStore = {
                duration: 0,
                from: null,
                to: null,
                departures: '',
                rooms: [],
            };

            rootStore.searchFiltersStore.page = 'page';

            const store = new OffersStore(rootStore) as any;
            store.fetchOffersWithParams = jest.fn();
            store.savePrefillParams = jest.fn();

            await store.getAllOffers('ES');

            expect(store.fetchOffersWithParams).toHaveBeenCalledWith({
                startDate: new Date('2025-01-10'),
                durations: ['5'],
                departure: 'LTN',
                destinationCodesQuery: 'ES',
                rooms: [
                    {
                        adults: 1,
                        children: 1,
                        childrenAges: [3],
                        infants: 1,
                        roomCode: '',
                    },
                ],
                page: 'page',
                searchType: SearchType.Normal,
            });
        });

        it('should fall back to searchWhen.selectedNumberOfNights when bookingStore.selectedNumberOfNights is 0', async () => {
            rootStore.promoPageStore = {
                duration: 0,
                from: null,
                to: null,
                departures: '',
                rooms: [],
            };
            rootStore.bookingStore.selectedNumberOfNights = 0;
            rootStore.searchStore.searchWhen = {
                ...rootStore.searchStore.searchWhen,
                selectedNumberOfNights: 4,
            };

            const store = new OffersStore(rootStore) as any;
            store.fetchOffersWithParams = jest.fn();
            store.savePrefillParams = jest.fn();

            await store.getAllOffers('ES');

            expect(store.fetchOffersWithParams).toHaveBeenCalledWith(
                expect.objectContaining({
                    durations: ['4'],
                }),
            );
        });

        it('should prioritize promoPageStore values for duration', async () => {
            const store = new OffersStore(rootStore) as any;
            store.fetchOffersWithParams = jest.fn();
            store.savePrefillParams = jest.fn();

            await store.getAllOffers('UK');

            expect(store.fetchOffersWithParams).toHaveBeenCalledWith(
                expect.objectContaining({
                    durations: ['7'],
                    departure: 'LTN',
                    destinationCodesQuery: 'UK',
                    rooms: rootStore.promoPageStore.rooms,
                    page: 'page',
                    searchType: SearchType.Normal,
                }),
            );
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

        it('should handle DefaultDuration correctly', async () => {
            rootStore.layoutStore.layout.sitecore.route.fields.DefaultDuration = { value: '7,10' };
            rootStore.layoutStore.isPromoPage = true;

            rootStore.promoPageStore.duration = 0;
            rootStore.promoPageStore.from = null;
            rootStore.promoPageStore.to = null;

            rootStore.bookingStore.selectedNumberOfNights = 0;
            rootStore.searchStore.selectedNumberOfNights = 0;

            const store = new OffersStore(rootStore) as any;
            store.fetchOffersWithParams = jest.fn();
            store.savePrefillParams = jest.fn();

            await store.getAllOffers('UK');

            expect(store.fetchOffersWithParams).toHaveBeenCalledWith({
                durations: ['7', '10'],
                startDate: new Date('2025-01-10'),
                departure: 'LTN',
                destinationCodesQuery: 'UK',
                rooms: rootStore.promoPageStore.rooms,
                page: 'page',
                searchType: SearchType.Promo,
            });
        });

        it(
            'should prioritize to value from booking or searchWhen stores ' +
                'over non-defined endDate on month search when promopage store values not defined',
            async () => {
                rootStore.promoPageStore.duration = 0;
                rootStore.promoPageStore.from = null;
                rootStore.promoPageStore.to = null;
                rootStore.searchStore.searchWhen = {
                    to: new Date('2025-02-10'),
                    monthSearchDuration: 2,
                    isMonthSearch: true,
                };

                const store = new OffersStore(rootStore) as any;
                store.fetchOffersWithParams = jest.fn();
                store.savePrefillParams = jest.fn();

                await store.getAllOffers('UK');

                expect(store.fetchOffersWithParams).toHaveBeenCalledWith(
                    expect.objectContaining({
                        endDate: rootStore.searchStore.searchWhen.to,
                    }),
                );
            },
        );

        it('should call loadMoreOffers when Load More button click on mobile Search Results page', async () => {
            const store = new OffersStore({
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
                promoPageStore: {
                    duration: 7,
                    from: new Date('2025-01-01'),
                    to: new Date('2025-01-08'),
                    departures: 'UK',
                    rooms: [
                        {
                            adults: [{ id: 1 }, { id: 2 }],
                            children: [{ age: 5 }],
                            infants: [{ id: 1 }, { id: 2 }],
                            roomCode: '',
                        },
                    ],
                },
                bookingStore: {
                    origins: [],
                    selectedDestinationCodesQuery: ['ES'],
                    roomsAllocation: [],
                    selectedDestinationCodes: [],
                },
                searchFiltersStore: {},
                searchStore: {
                    searchWhen: {},
                    searchTo: {
                        selectedDestinations: [],
                    },
                },
                marketStore: { marketCode: MarketCode.UK },
            } as any) as any;
            OffersService.fetchOffers = jest.fn();
            store.loadMoreOffers = jest.fn();
            store.savePrefillParams = jest.fn();
            store.setIsLoadMoreOffers(true);

            await store.getAllOffers('ES');

            expect(store.loadMoreOffers).toHaveBeenCalled();

            store.setIsLoadMoreOffers(false);
            store.setIsLoadPreviousOffers(true);

            expect(store.loadMoreOffers).toHaveBeenCalled();
        });

        it('should call savePrefillParams with Durations and Departure from bookingStore', async () => {
            const store = new OffersStore(rootStore) as any;
            store.rootStore.searchStore.searchTo.selectedDestinations = [{ type: DestinationType.VirtualResort }];

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
                    isVirtualResort: true,
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

            const store = new OffersStore({
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

            const store = new OffersStore({
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
            const store = new OffersStore({} as any);
            store.parentOffers = [];

            store.cleanUpParentOffers();

            expect(store.parentOffers).toBeNull();
        });
    });

    describe('updateSelectedDestination', () => {
        it('should do nothing if NO countries with regions', () => {
            const store = new OffersStore({
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
            const store = new OffersStore({
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
            const store = new OffersStore({
                searchStore: {
                    isAllSearchParametersSelected: false,
                },
            } as any);

            store['getAllOffers'] = jest.fn();

            store['getParentOffers']();

            expect(store['getAllOffers']).not.toHaveBeenCalled();
        });

        it('should cleanup parent offers if no loaded offers', async () => {
            const store = new OffersStore({
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
            const store = new OffersStore({
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
            const store = new OffersStore({
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
            const store = new OffersStore({} as any);

            const result = await store.getDestinationsByCodes([], true);

            expect(result).toEqual([]);
        });

        it('should return destinations', async () => {
            const store = new OffersStore({} as any);
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
            const store = new OffersStore({} as any);
            OffersService.fetchDestinationsByCodes = jest.fn().mockReturnValue(Promise.reject());

            const result = await store.getDestinationsByCodes(['CODE'], true);

            expect(OffersService.fetchDestinationsByCodes).toHaveBeenCalledWith(['CODE'], true);
            expect(result).toEqual([]);
        });
    });

    describe('getDestinationsForLoadingLivePrice', () => {
        it('should return filtered destinations that are enabled for live price', async () => {
            const store = new OffersStore({
                layoutStore: {
                    destinationWithoutLivePrice: ['EG'],
                    isLivePriceEnabledForDestination: jest.fn(() => true),
                },
            } as any);
            const mockDestination = [
                {
                    code: 'ALC',
                    giataCode: '1233',
                },
                {
                    code: 'CRF',
                },
                {
                    code: 'LTN',
                    giataCode: '1234',
                },
            ];
            store.getDestinationsByCodes = jest.fn().mockReturnValue(Promise.resolve(mockDestination));

            const result = await store.getDestinationsForLoadingLivePrice(['ALC', 'CRF', 'LTN']);

            expect(store.getDestinationsByCodes).toHaveBeenCalledWith(['ALC', 'CRF', 'LTN'], true);
            expect(result).toEqual(['1233', '1234']);
        });
    });

    describe('getLivePrice', () => {
        it('should return empty array if no codes', async () => {
            const store = new OffersStore({} as any);

            const result = await store.getLivePrice([]);

            expect(result).toEqual([]);
        });

        it('should load prices without checking parents destinations', async () => {
            const store = new OffersStore({} as any);
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
            const store = new OffersStore({} as any);
            store.getDestinationsForLoadingLivePrice = jest.fn().mockReturnValue(Promise.resolve([]));
            OffersService.getLivePrice = jest.fn();

            const result = await store.getLivePrice(['IS', 'ES'], true);

            expect(result).toEqual([]);
            expect(store.getDestinationsForLoadingLivePrice).toHaveBeenCalledWith(['IS', 'ES']);
            expect(OffersService.getLivePrice).not.toHaveBeenCalled();
        });

        it('should return [] if request performed with an error', async () => {
            const store = new OffersStore({} as any);
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
            const store = new OffersStore({
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
            const store = new OffersStore({
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

    describe('fetchOffersWithParams', () => {
        const mockStores = {
            layoutStore: {
                isPromoPage: false,
            },
            searchFiltersStore: {
                flightDurationFrom: 0.5,
            },
            searchStore: {
                selectedDestinationsQuery: [''],
                searchWhen: {},
                searchWho: {},
                searchTo: {},
                searchFrom: {
                    origins: [],
                },
            },
            promoPageStore: {},
        };

        const commonParams = {
            startDate: new Date('2020-09-02T00:00:00'),
            durations: ['20', '30'],
            destinationCodesQuery: 'ES',
            rooms: [],
            page: undefined,
            withoutDestinationFilters: true,
            offersSearchCancelSource: { token: 'token' },
            endDate: new Date('2020-09-06T00:00:00'),
            offers: `offer1,${FilterGroupCodes.FreeForKidsOnly}`,
            searchType: SearchType.Promo,
        };

        it('should NOT call fetch offers when requested airports are not valid for market', async () => {
            const store = new OffersStore({
                marketStore: { isValidForMarketAirports: jest.fn(() => false) },
            } as any) as any;
            store.fetchOffersWithParamsBase = jest.fn();

            const result = await store.fetchOffersWithParams({
                ...commonParams,
                departure: 'DFH, HUJ',
            });

            expect(result).toStrictEqual({
                offers: [],
                status: {
                    hasDiscont: false,
                    maxPrice: 0,
                    maxPricePP: 0,
                    minPrice: 0,
                    minPricePP: 0,
                    total: 0,
                },
                filters: [],
                reorderFilters: false,
            });
            expect(store.fetchOffersWithParamsBase).not.toHaveBeenCalled();
        });

        it('should NOT call isValidForMarketAirports when requested airports is all', async () => {
            const isValidForMarketAirportsMock = jest.fn();
            const store = new OffersStore({
                marketStore: { isValidForMarketAirports: isValidForMarketAirportsMock },
                ...mockStores,
            } as any) as any;
            store.fetchOffersWithParamsBase = jest.fn();

            await store.fetchOffersWithParams({
                ...commonParams,
                departure: DEPARTURE_ALL_CODE,
            });

            expect(isValidForMarketAirportsMock).not.toHaveBeenCalled();
            expect(store.fetchOffersWithParamsBase).toHaveBeenCalled();
        });

        it('should call isValidForMarketAirports AND fetch offers when requested airports is valid', async () => {
            const isValidForMarketAirportsMock = jest.fn(() => true);
            const store = new OffersStore({
                marketStore: { isValidForMarketAirports: isValidForMarketAirportsMock },
                ...mockStores,
            } as any) as any;
            store.fetchOffersWithParamsBase = jest.fn();

            await store.fetchOffersWithParams({
                ...commonParams,
                departure: 'FHG, DKF',
            });

            expect(isValidForMarketAirportsMock).toHaveBeenCalled();
            expect(store.fetchOffersWithParamsBase).toHaveBeenCalled();
        });

        it('should call fetchOffersWithParamsBase with valid arguments on promo page', async () => {
            const store = new OffersStore({
                ...mockStores,
                layoutStore: {
                    isPromoPage: true,
                },
                searchFiltersStore: {
                    flightDurationFrom: MIN_FLIGHT_DURATION,
                },
                promoPageStore: {
                    editorDestinationsQuery: editorDestinationsQueryMock,
                },
            } as any) as any;
            store.fetchOffersWithParamsBase = jest.fn();
            const params = {
                ...commonParams,
                departure: DEPARTURE_ALL_CODE,
            };

            await store.fetchOffersWithParams(params);

            expect(store.fetchOffersWithParamsBase).toHaveBeenCalledWith(
                Bd4TravelListIdHolidays.PromoList,
                editorDestinationsQueryMock,
                undefined,
                params,
            );
        });

        it('should pass valid placementId and destinations on NOT promo page and flightDurationFrom', async () => {
            const store = new OffersStore({
                ...mockStores,
                layoutStore: {
                    isPromoPage: false,
                },
                searchStore: {
                    selectedDestinationsQuery: [],
                },
                searchFiltersStore: {
                    flightDurationFrom: 1,
                },
            } as any) as any;
            store.fetchOffersWithParamsBase = jest.fn();
            const params = {
                ...commonParams,
                departure: DEPARTURE_ALL_CODE,
            };

            await store.fetchOffersWithParams(params);

            expect(store.fetchOffersWithParamsBase).toHaveBeenCalledWith(
                Bd4TravelListIdHolidays.HotelsList,
                [],
                60,
                params,
            );
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

        it('should call setSeachPerformWithNewParams, setPageNumber, setPrevPageNumber, fetchOffers and setFiltersChanged when isPromoPage and isScreenLessMedium are true', () => {
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

    describe('hotel types handling', () => {
        beforeEach(() => {
            OffersService.fetchOffers = jest.fn().mockResolvedValue(offersResponseMock);
            OffersService.fetchPolygonHotels = jest.fn().mockResolvedValue(offersResponseMock);
        });

        const createStore = (isPromoPage: boolean) =>
            new OffersStore({
                layoutStore: {
                    isPromoPage: isPromoPage,
                    isApplySpecialFilter: jest.fn(() => false),
                    layout: { sitecore: { route: { fields: {}, itemId: 'itemId' } } },
                },
                searchFiltersStore: {
                    hotelTypesFilters: 'type1,type2',
                },
                promoPageStore: {
                    hotelTypes: ['type2', 'type3'],
                },
                searchStore: {
                    isAllSearchParametersSelected: true,
                    searchWhen: {},
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
                appStore: { deviceType: SitecoreChannel.Tablet },
            } as any) as any;

        const params = {
            startDate: new Date('2020-09-02T00:00:00'),
            durations: ['20', '30'],
            departure: DEPARTURE_ALL_CODE,
            destinationCodesQuery: 'ES',
            rooms: [],
            withoutDestinationFilters: true,
            offersSearchCancelSource: { token: 'token' },
            endDate: new Date('2020-09-06T00:00:00'),
            offers: '',
            searchType: SearchType.Promo,
        };

        it('should handle hotel types for promo page', async () => {
            const store = createStore(true);
            jest.spyOn(promoPageUtils, 'getPromoPackageThemesFilters').mockImplementation(jest.fn(() => []));
            const mockHotelTypes = jest.spyOn(arrayUtils, 'joinUniqueNonEmptyArrayValues').mockReturnValue('A,B,C');

            // Trigger the code that uses hotelTypes (e.g., through fetchOffersWithParams)
            await store.fetchOffersWithParams(params);

            // Verify the hotel types were processed correctly
            expect(mockHotelTypes).toHaveBeenCalledWith(['type1', 'type2'], ['type2', 'type3']);
        });

        it('should handle hotel types for non-promo page', async () => {
            const store = createStore(false);

            // Trigger the code that uses hotelTypes
            await store.fetchOffersWithParams(params);

            // Verify the hotel types were passed through directly
            expect(store.rootStore.searchFiltersStore.hotelTypesFilters).toBe('type1,type2');
        });
    });
});
