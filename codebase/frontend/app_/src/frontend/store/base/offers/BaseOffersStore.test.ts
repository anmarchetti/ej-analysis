import { waitFor } from '@testing-library/dom';
import Axios, { CancelTokenSource } from 'axios';

import { SIXTY } from 'code/commonNumbers';
import { createMockStores } from 'frontend/__mocks__';
import loggerService from 'frontend/services/logging/logger.service';
import OffersService from 'frontend/services/offers.service';
import { SitecoreChannel } from 'frontend/store/base/tracking/sitecore/constants';
import { OffersStore } from 'frontend/store/holidays';
import { TRootStore } from 'frontend/store/IStores';
import { TradePortalOffersStore } from 'frontend/store/tradePortal';
import * as arrayUtils from 'frontend/utils/array.utils';
import { isDateInCurrentMonth, isExpired } from 'frontend/utils/date.utils';
import * as promoPageUtils from 'frontend/utils/promoPage.utils';
import { getWebStorageItem, setWebStorageItem } from 'frontend/utils/webStorage.utils';
import { ApiError } from 'models/data/ApiError';
import { IPrefilledSearchParams } from 'models/data/IPrefilledSearchParams';
import { IFilteredPoints } from 'models/data/ISearchOffers';
import { IGeoPoint } from 'models/data/map/IMap';
import { Bd4TravelListIdHolidays } from 'models/enum/Bd4TravelListId';
import { DataStatus } from 'models/enum/DataStatus';
import { FilterGroupCodes } from 'models/enum/FilterGroupCodes';
import { DEPARTURE_ALL_CODE, GEOGRAPHY_ALL_CODE } from 'models/enum/RequestConstants';
import { SearchType } from 'models/enum/SearchType';

import BaseOffersStore from './BaseOffersStore';

jest.mock('frontend/utils/date.utils', () => ({
    ...jest.requireActual('frontend/utils/date.utils'),
    isDateInCurrentMonth: jest.fn().mockReturnValue(false),
    isExpired: jest.fn().mockReturnValue(false),
}));

const geoOffersResponseMock = {
    filters: [{ code: 'test filter' } as any],
    geoOffers: { features: [{ geometry: { coordinates: [1, 2] } } as IGeoPoint] },
    status: { total: 10, maxPrice: 100, minPrice: 22, maxPricePP: 50, minPricePP: 11 } as any,
} as IFilteredPoints;

const searchParams: IPrefilledSearchParams = {
    startDate: '17-04-2023',
    durations: ['12', '30'],
    departure: 'BSL,GVA,ZRH',
    geog: 'geog',
    dest: 'dest',
    rooms: [
        {
            adults: 1,
            children: 1,
            infants: 1,
            roomCode: '23',
            childrenAges: [12, 10],
        },
    ],
    autoAllocation: false,
    flexDays: 3,
    isMonthSearch: false,
    isVirtualResort: false,
};

jest.mock('frontend/utils/webStorage.utils', () => ({
    getWebStorageItem: jest.fn(),
    setWebStorageItem: jest.fn(),
}));

jest.mock('frontend/utils/search/search.utils', () => ({
    isRecentSearchItemExpired: jest.fn(),
    shallowCompareSearches: jest.fn(),
}));

let rootStore;

describe('BaseOffersStore', () => {
    let store: BaseOffersStore;

    beforeEach(() => {
        rootStore = createMockStores({
            marketStore: {
                marketCode: 'en',
                isValidForMarketAirports: jest.fn(() => true),
            },
            layoutStore: {
                isPromoPage: false,
                isDestinationPage: false,
                isApplySpecialFilter: jest.fn(() => false),
                pageFields: {
                    DefaultDuration: {
                        value: '20,30',
                    },
                },
                layoutId: 'c0ad5293-3d52-4eb0-95f6-375229168d54',
                isMonthSearchEnabled: true,
            },
            searchFiltersStore: {
                themeFilters: 'themeFilters',
                flightDurationFrom: 1,
                flightDurationTo: 4,
                flightsFilters: 'LGW',
                hotelTypesFilters: 'hotel-type-filters',
                destinationFiltersWithParents: 'duration-filters',
                weatherFrom: 10,
                weatherTo: 20,
                promoCollectionFilters: 'lux',
                boardTypeFilters: 'filter1,filter2',
                isPriceFilterPerPerson: true,
                tripAdvisorRatingFilters: 4,
                starRatingFilters: 4,
                facilitiesFilters: 'facilities',
                filterPriceFrom: 1000,
                filterPriceTo: 2000,
                inboundDepartureTimeFilters: 'morning',
                outboundDepartureTimeFilters: 'evening',
            },
            searchStore: {
                isAllSearchParametersSelected: true,
                selectedDestinationsQuery: ['ES'],
                searchWhen: { from: new Date('2023-01-01'), flexDays: 3, isMonthSearch: false },
                searchFrom: {
                    origins: ['LGW'],
                },
                searchTo: {
                    selectedAccommodationCodes: 'selectedAccommodationCodes',
                    selectedDestinationCodesQuery: 'IT',
                },
                searchWho: {
                    isAutoAllocation: false,
                    roomsAllocation: [{ adults: [1], children: [1], infants: [1], childrenAges: [{ age: 5 }] }],
                },
            },
            promoPageStore: {
                pageThemeTypeCodes: ['A', 'B'],
                maxPricePP: 700,
                geographyFromUrl: 'geographyFromUrl',
            },
            bookingStore: {
                from: new Date('2023-01-02'),
                flexDays: 3,
                isAutoAllocation: true,
                origins: ['LGW', 'LHR'],
                selectedDestinationCodesQuery: 'IT',
                selectedNumberOfNights: 7,
                createRoomAllocation: jest.fn(() => [{ adults: 2, children: 0 }]),
                numberOfNightsFromOffer: 7,
                selectedOffer: {
                    date: '2023-02-01',
                },
            },
            appStore: { deviceType: SitecoreChannel.Desktop },
        });
        store = new BaseOffersStore(rootStore);
    });

    describe('getSearchParamsFromLocalStorage', () => {
        beforeEach(() => {
            jest.useFakeTimers({ now: new Date(2022, 4, 17) });
            (getWebStorageItem as jest.Mock).mockReturnValue(searchParams);
        });

        it('should return valid prefill params', () => {
            expect(store.getSearchParamsFromLocalStorage()).toMatchObject(searchParams);
        });

        it('should return null when date isExpired and it is not isMonthSearch', () => {
            (isExpired as any).mockReturnValueOnce(true);
            expect(store.getSearchParamsFromLocalStorage()).toBeNull();
        });

        it('should return null when isMonthSearch, date isExpired and date is not from Current Month', () => {
            searchParams.isMonthSearch = true;
            (isExpired as jest.Mock).mockReturnValueOnce(true);
            expect(store.getSearchParamsFromLocalStorage()).toBeNull();
        });

        it('should return null when isMonthSearch, date isExpired, but isMonthSearchEnabled is false', () => {
            searchParams.isMonthSearch = true;
            rootStore.layoutStore.isMonthSearchEnabled = false;
            (isExpired as jest.Mock).mockReturnValueOnce(true);

            expect(store.getSearchParamsFromLocalStorage()).toBeNull();
        });

        it('should return prefill params when isMonthSearch, date isExpired, but date is from Current Month', () => {
            searchParams.isMonthSearch = true;
            (isExpired as jest.Mock).mockReturnValueOnce(true);
            (isDateInCurrentMonth as jest.Mock).mockReturnValueOnce(true);
            expect(store.getSearchParamsFromLocalStorage()).toMatchObject(searchParams);
        });

        it('should return null when isValidForMarketAirports returns false', () => {
            rootStore.marketStore.isValidForMarketAirports = jest.fn(() => false);
            expect(store.getSearchParamsFromLocalStorage()).toBeNull();
        });
    });

    describe('setActiveOfferId', () => {
        it('should set activeOfferId', () => {
            store.setActiveOfferId('2'), expect(store.activeOfferId).toEqual('2');
        });
    });

    describe('originalGeography', () => {
        const store = new BaseOffersStore(
            createMockStores({
                searchStore: {
                    searchTo: {
                        selectedDestinationCodesQuery: '',
                    },
                },
                queryParamsStore: {
                    get selectedDestinationCodesQueryFromUrl() {
                        return '';
                    },
                },
            }),
        );

        it('should return selectedDestinationCodesQuery', () => {
            const value = 'ES';

            store.rootStore.searchStore.searchTo.selectedDestinationCodesQuery = value;

            expect(store.originalGeography).toBe(value);
        });

        it('should return selectedDestinationCodesQueryFromUrl when selectedDestinationCodesQuery is empty', () => {
            const value = 'IT';
            store.rootStore.searchStore.searchTo.selectedDestinationCodesQuery = '';

            jest.spyOn(
                store.rootStore.queryParamsStore,
                'selectedDestinationCodesQueryFromUrl',
                'get',
            ).mockReturnValueOnce(value);

            expect(store.originalGeography).toBe(value);
        });

        it('should return anywhere when rest is undefined', () => {
            expect(store.originalGeography).toBe(GEOGRAPHY_ALL_CODE);
        });
    });

    describe('geography', () => {
        it('should return destinationFiltersWithParents', () => {
            const value = 'IT';
            const store = new BaseOffersStore(
                createMockStores({
                    searchFiltersStore: {
                        destinationFiltersWithParents: value,
                    },
                }),
            );

            expect(store.geography).toBe(value);
        });

        it('should return originalGeography when destinationFiltersWithParents is empty', () => {
            const value = 'IT,ITSP';
            const store = new BaseOffersStore(
                createMockStores({
                    searchFiltersStore: {
                        destinationFiltersWithParents: '',
                    },
                }),
            );

            jest.spyOn(store, 'originalGeography', 'get').mockReturnValueOnce(value);

            expect(store.geography).toBe(value);
        });
    });

    describe('getFetchOfferParamsForPromoPage', () => {
        beforeEach(() => {
            jest.spyOn(arrayUtils, 'joinUniqueNonEmptyArrayValues').mockReturnValue('A,B,C');
            jest.spyOn(promoPageUtils, 'getPromoPackageThemesFilters').mockReturnValue(['AB', '', 'CD', 'D']);
        });

        it('should build right params', () => {
            expect(store.getFetchOfferParamsForPromoPage()).toEqual({
                destination: rootStore.searchFiltersStore.destinationFiltersWithParents,
                hotelTypes: 'A,B,C',
                initialPricePPFrom: undefined,
                initialPricePPTo: rootStore.promoPageStore.maxPricePP,
                initialThemes: 'A,B',
                initialTotalPriceFrom: undefined,
                initialTotalPriceTo: undefined,
                isPromoPage: true,
                promc: 'A,B,C',
                promoPageId: rootStore.layoutStore.layoutId,
                themes: 'AB,,CD,D',
                isDynamicPromoPage: undefined,
            });
            expect(arrayUtils.joinUniqueNonEmptyArrayValues).toHaveBeenCalledTimes(2);
            expect(arrayUtils.joinUniqueNonEmptyArrayValues).toHaveBeenNthCalledWith(2, ['lux'], undefined);
        });

        it('should return right params for Dynamic Promo Page', () => {
            const store = new BaseOffersStore(
                createMockStores({
                    ...rootStore,
                    layoutStore: {
                        isDynamicPromoPage: true,
                    },
                    searchFiltersStore: {},
                    promoPageStore: {
                        editorGeographyQuery: 'TR|EG|IT,EGHR|ITLG,ITLGBA',
                    },
                }),
            );

            const params = store.getFetchOfferParamsForPromoPage();

            expect(params.promoPageId).toBeUndefined();
            expect(params.destination).toBe('TR|EG|IT,EGHR|ITLG,ITLGBA');
        });

        it('should use promoPageStore.geographyFromUrl when destinationFiltersWithParents is an empty string', () => {
            const store = new BaseOffersStore(
                createMockStores({
                    ...rootStore,
                    searchFiltersStore: {
                        ...rootStore.searchFiltersStore,
                        get destinationFiltersWithParents() {
                            return '';
                        },
                    },
                    promoPageStore: {
                        ...rootStore.promoPageStore,
                        geographyFromUrl: 'geographyFromUrl',
                    },
                }),
            );

            expect(store.getFetchOfferParamsForPromoPage()).toMatchObject(
                expect.objectContaining({
                    destination: 'geographyFromUrl',
                }),
            );
        });

        it('should return right params when withoutDestinationFilters is true', () => {
            expect(store.getFetchOfferParamsForPromoPage(true)).toMatchObject(
                expect.objectContaining({
                    destination: rootStore.promoPageStore.geographyFromUrl,
                }),
            );
        });

        it('should return right params when withoutDestinationFilters is true AND geographyFromUrl is undefined', () => {
            rootStore.promoPageStore.geographyFromUrl = undefined;

            expect(store.getFetchOfferParamsForPromoPage(true)).toMatchObject(
                expect.objectContaining({
                    destination: '',
                }),
            );
        });

        it('should set promoPageId when isDynamicPromoPage is true but editorDestinations is empty', () => {
            const store = new BaseOffersStore(
                createMockStores({
                    ...rootStore,
                    layoutStore: {
                        ...rootStore.layoutStore,
                        isDynamicPromoPage: true,
                    },
                    promoPageStore: {
                        ...rootStore.promoPageStore,
                        editorGeographyQuery: '',
                    },
                }),
            );

            const params = store.getFetchOfferParamsForPromoPage();
            expect(params.promoPageId).toBe(rootStore.layoutStore.layoutId);
        });
    });

    describe('getFetchOfferParams', () => {
        it('should return right params', () => {
            const result = store.getFetchOfferParams();

            expect(result).toEqual({
                destination: rootStore.searchFiltersStore.destinationFiltersWithParents,
                hotelTypes: rootStore.searchFiltersStore.hotelTypesFilters,
                isPromoPage: false,
                promc: 'lux',
                themes: rootStore.searchFiltersStore.themeFilters,
            });
        });

        it('withoutDestinationFilters', () => {
            const result = store.getFetchOfferParams(true);

            expect(result).toMatchObject(
                expect.objectContaining({
                    destination: '',
                }),
            );
        });
    });

    describe('fetchOffersWithParamsBase', () => {
        beforeEach(() => {
            OffersService.fetchOffers = jest.fn();
        });

        const params = {
            startDate: new Date('2020-09-02T00:00:00'),
            durations: ['20', '30'],
            departure: 'FHG, DKF',
            destinationCodesQuery: 'ES',
            rooms: [],
            withoutDestinationFilters: true,
            cancelSource: { token: 'token' } as any,
            endDate: new Date('2020-09-06T00:00:00'),
            offers: `offer1,${FilterGroupCodes.FreeForKidsOnly}`,
            searchType: SearchType.Promo,
        };

        it('should call getFetchOfferParams and fetchOffers when isPromoPage is false', () => {
            store.getFetchOfferParams = jest.fn();
            store.getFetchOfferParamsForPromoPage = jest.fn();

            store.fetchOffersWithParamsBase(Bd4TravelListIdHolidays.HotelsList, ['ES'], undefined, params);

            expect(store.getFetchOfferParams).toHaveBeenCalled();
            expect(store.getFetchOfferParamsForPromoPage).not.toHaveBeenCalled();
            expect(OffersService.fetchOffers).toHaveBeenCalledWith({
                destinations: ['ES'],
                accomCodes: 'selectedAccommodationCodes',
                autoAllocation: false,
                boardType: 'filter1,filter2',
                cancelSource: {
                    token: 'token',
                },
                dep: 'FHG, DKF',
                discountOnly: undefined,
                distressedFlightsOnly: false,
                duration: ['20', '30'],
                endDate: new Date('2020-09-06T00:00:00.000'),
                facilities: 'facilities',
                flexDays: 3,
                flights: 'LGW',
                geog: 'ES',
                inboundTimeSlots: 'morning',
                isPricePP: true,
                maxDisc: undefined,
                maxDiscP: undefined,
                minDisc: undefined,
                minDiscP: undefined,
                offers: 'offer1,ffk',
                orderBy: undefined,
                orderDirection: undefined,
                outboundTimeSlots: 'evening',
                page: undefined,
                polyQuery: undefined,
                priceFrom: 1000,
                priceTo: 2000,
                rooms: [],
                searchType: SearchType.Promo,
                starRating: 4,
                startDate: new Date('2020-09-02T00:00:00.000'),
                take: undefined,
                tripAdvisorRating: 4,
                flightDurationFrom: undefined,
                flightDurationTo: 240,
                placementId: 'hotels_list',
                mintemp: 10,
                maxtemp: 20,
                inboundFlightNumber: undefined,
                outboundFlightNumber: undefined,
                promc: undefined,
                deviceType: SitecoreChannel.Desktop,
            });
        });

        it('should call getFetchOfferParamsForPromoPage when isPromoPage is true', () => {
            (rootStore.layoutStore.isPromoPage as any) = true;
            store.getFetchOfferParams = jest.fn();
            store.getFetchOfferParamsForPromoPage = jest.fn();

            store.fetchOffersWithParamsBase(Bd4TravelListIdHolidays.PromoList, ['ES'], undefined, params);

            expect(store.getFetchOfferParams).not.toHaveBeenCalled();
            expect(store.getFetchOfferParamsForPromoPage).toHaveBeenCalled();
        });

        it('should pass isMonthSearch to fetchOffers when it is passed to fetchOffersWithParamsBase', () => {
            store.getFetchOfferParams = jest.fn();
            store.getFetchOfferParamsForPromoPage = jest.fn();

            store.fetchOffersWithParamsBase(Bd4TravelListIdHolidays.HotelsList, ['ES'], undefined, {
                ...params,
                isMonthSearch: true,
            });

            expect(OffersService.fetchOffers).toHaveBeenCalledWith(
                expect.objectContaining({
                    isMonthSearch: true,
                }),
            );
        });
    });

    describe('savePrefillParams', () => {
        const params: IPrefilledSearchParams = {
            startDate: '01-08-2025',
            durations: ['7'],
            departure: 'LTN',
            dest: 'IT',
            geog: 'ES',
            rooms: [],
            autoAllocation: false,
            flexDays: 0,
            isMonthSearch: undefined,
            isVirtualResort: false,
        };

        let rootStore: TRootStore;
        let baseOffersStore: BaseOffersStore;

        beforeEach(() => {
            rootStore = {
                marketStore: {
                    marketCode: 'UK',
                },
                layoutStore: {
                    getSettingAsNumber: jest.fn(),
                },
            } as unknown as TRootStore;

            baseOffersStore = new BaseOffersStore(rootStore);
        });

        it('should save prefill params in LocalStorage', () => {
            (getWebStorageItem as jest.Mock).mockReturnValueOnce([]);

            baseOffersStore.savePrefillParams(params);

            expect(getWebStorageItem).toHaveBeenCalledWith(expect.anything(), true);
            expect(setWebStorageItem).toHaveBeenCalledTimes(2);
        });
    });

    describe('setTotalHotels', () => {
        it('should set number of hotels', () => {
            const COUNT_OF_HOTELS_RESULT = 10;

            expect(store.numberOfHotels).toEqual(0);

            store.setTotalHotels(COUNT_OF_HOTELS_RESULT);

            expect(store.numberOfHotels).toEqual(COUNT_OF_HOTELS_RESULT);
        });
    });

    describe('hasHotels', () => {
        it('should be true when numberOfHotels is > 0', () => {
            store.numberOfHotels = 10;

            expect(store.hasHotels).toBe(true);
        });

        it('should be false when numberOfHotels is 0', () => {
            store.numberOfHotels = 0;

            expect(store.hasHotels).toBe(false);
        });
    });

    describe('getFilteredHotels', () => {
        let mockStores;

        beforeEach(() => {
            mockStores = createMockStores({
                searchStore: {
                    isAllSearchParametersSelected: true,
                    searchTo: {
                        selectedDestinationCodesQuery: 'IT,ITSO|ITLC|ITLG|ITML',
                        selectedAccommodationCodes: '',
                    },
                    searchWhen: {
                        from: '01-01-2024',
                        flexDays: 3,
                        isMonthSearch: false,
                    },
                    searchWho: { roomsAllocation: [{ adults: [], children: [], infants: [] }], isAutoAllocation: true },
                },
                searchFiltersStore: {
                    flightsFilters: 'flights-filters',
                    durationFilters: 'duration-filters',
                    destinationFiltersWithParents: 'duration-filters',
                    starRatingFilters: 5,
                    flightDurationFrom: 1,
                    flightDurationTo: 5,
                    filterPriceFrom: 100,
                    filterPriceTo: 1000,
                    boardTypeFilters: 'board-type-filters',
                    facilitiesFilters: 'facilities-filters',
                    offersFilters: ['offer-1', 'offer-2'],
                    hotelTypesFilters: 'hotel-type-filters',
                    outboundDepartureTimeFilters: 'outbound-filters',
                    inboundDepartureTimeFilters: 'inbound-filters',
                    isPriceFilterPerPerson: true,
                    tripAdvisorRating: 4,
                    saveFilters: jest.fn(),
                    weatherFrom: 10,
                    weatherTo: 20,
                    promoCollectionFilters: 'lux',
                },
                bookingStore: {
                    numberOfNightsFromOffer: 5,
                    origins: ['LGW', 'LGN'],
                    to: '31-01-2024',
                },
                queryParamsStore: {
                    selectedDestinationCodesQueryFromUrl: '',
                },
            });
        });

        it('should be called with all params', async () => {
            OffersService.fetchFilteredHotels = jest.fn().mockResolvedValue(geoOffersResponseMock);
            jest.spyOn(Axios.CancelToken, 'source').mockReturnValue({} as CancelTokenSource);

            const store = new OffersStore(mockStores);

            store.updateOffersDataStatus = jest.fn();

            await store.getFilteredHotels();

            expect(store.updateOffersDataStatus).toHaveBeenCalledWith(DataStatus.Loading);

            expect(OffersService.fetchFilteredHotels).toHaveBeenCalledWith(
                {
                    PriceFrom: 100,
                    PriceTo: 1000,
                    accomCodes: '',
                    boardType: 'board-type-filters',
                    departure: 'flights-filters',
                    departureAirport: 'LGW,LGN',
                    duration: 'duration-filters',
                    facilities: 'facilities-filters',
                    flexibleDays: 3,
                    flightDurationFrom: SIXTY,
                    flightDurationTo: 300,
                    geography: 'duration-filters',
                    hotelTypes: 'hotel-type-filters',
                    inboundTimeSlots: 'inbound-filters',
                    offers: 'offer-1,offer-2',
                    originalGeography: 'IT,ITSO|ITLC|ITLG|ITML',
                    outboundTimeSlots: 'outbound-filters',
                    rooms: [
                        {
                            adults: 0,
                            children: 0,
                            childrenAges: [],
                            infants: 0,
                            roomCode: '',
                        },
                    ],
                    starRating: 5,
                    startDate: '2024-01-01',
                    endDate: undefined,
                    isMonthSearch: false,
                    automaticAllocation: true,
                    isPricePP: true,
                    mintemp: 10,
                    maxtemp: 20,
                    promc: 'lux',
                },
                {},
            );

            expect(store.updateOffersDataStatus).toHaveBeenNthCalledWith(2, DataStatus.Loaded);
            expect(store.numberOfHotels).toBe(geoOffersResponseMock.status.total);
            expect(store.maxPrice).toBe(geoOffersResponseMock.status.maxPrice);
            expect(store.minPrice).toBe(geoOffersResponseMock.status.minPrice);
            expect(store.maxPricePp).toBe(geoOffersResponseMock.status.maxPricePP);
            expect(store.minPricePp).toBe(11);

            expect(mockStores.searchFiltersStore.saveFilters).toHaveBeenCalledWith(geoOffersResponseMock.filters);
            expect(store.hotels).toStrictEqual(geoOffersResponseMock.geoOffers.features);
        });

        it('should cleanUpHotels when geoOffers is null', async () => {
            mockStores.searchStore.searchWhen.isMonthSearch = true;

            OffersService.fetchFilteredHotels = jest.fn().mockResolvedValue(null);
            jest.spyOn(Axios.CancelToken, 'source').mockReturnValue({} as CancelTokenSource);

            const store = new OffersStore(mockStores);

            const cleanUpHotels = jest.spyOn(store, 'cleanUpHotels');

            await store.getFilteredHotels();

            await waitFor(() => {
                expect(OffersService.fetchFilteredHotels).toHaveBeenCalledWith(
                    {
                        PriceFrom: 100,
                        PriceTo: 1000,
                        accomCodes: '',
                        boardType: 'board-type-filters',
                        departure: 'flights-filters',
                        departureAirport: 'LGW,LGN',
                        duration: 'duration-filters',
                        facilities: 'facilities-filters',
                        flexibleDays: 0,
                        flightDurationFrom: SIXTY,
                        flightDurationTo: 300,
                        geography: 'duration-filters',
                        hotelTypes: 'hotel-type-filters',
                        inboundTimeSlots: 'inbound-filters',
                        offers: 'offer-1,offer-2',
                        originalGeography: 'IT,ITSO|ITLC|ITLG|ITML',
                        outboundTimeSlots: 'outbound-filters',
                        rooms: [
                            {
                                adults: 0,
                                children: 0,
                                childrenAges: [],
                                infants: 0,
                                roomCode: '',
                            },
                        ],
                        starRating: 5,
                        startDate: '2024-01-01',
                        endDate: '2024-01-31',
                        isMonthSearch: true,
                        automaticAllocation: true,
                        isPricePP: true,
                        mintemp: 10,
                        maxtemp: 20,
                        promc: 'lux',
                    },
                    {},
                );

                expect(cleanUpHotels).toHaveBeenCalledTimes(1);
            });
        });

        it('should catch Error when getFilteredHotels throws error', async () => {
            OffersService.fetchFilteredHotels = jest.fn().mockImplementation(() => {
                throw new Error('Test error');
            });

            jest.spyOn(Axios.CancelToken, 'source').mockReturnValue({} as CancelTokenSource);

            const store = new OffersStore(mockStores);

            store.updateOffersDataStatus = jest.fn();

            try {
                await store.getFilteredHotels();
            } catch (e) {
                expect(e instanceof ApiError).toBe(true);
            }
        });
    });

    describe('fetchMapItem', () => {
        it('should fetch hotel info when layout is destination page', async () => {
            rootStore.layoutStore.isDestinationPage = true;
            OffersService.loadHotelInfo = jest.fn().mockResolvedValue({ id: 'hotel1' });

            const result = await store.fetchMapItem('hotel1');

            expect(OffersService.loadHotelInfo).toHaveBeenCalledWith('hotel1');
            expect(result).toEqual({ id: 'hotel1' });
        });

        it('should fetch offers with correct parameters when layout is hd book page', async () => {
            rootStore.layoutStore.isHotelDetailsBookPage = true;
            rootStore.bookingStore.selectedOffer.date = new Date('2023-04-11');

            OffersService.fetchOffers = jest.fn().mockResolvedValue({ offers: [] });

            const result = await store.fetchMapItem('offer1');

            expect(OffersService.fetchOffers).toHaveBeenCalledWith({
                accomCodes: 'offer1',
                startDate: new Date('2023-04-11'),
                flexDays: 3,
                autoAllocation: true,
                dep: 'LGW,LHR',
                geog: 'ALL',
                duration: ['7'],
                searchType: SearchType.Normal,
                take: 1,
                rooms: [{ adults: 2, children: 0 }],
                endDate: undefined,
                isMonthSearch: false,
                deviceType: SitecoreChannel.Desktop,
            });
            expect(result).toEqual({ offers: [] });
        });

        it('should fetch offers with correct parameters when layout is hd book page and isMonthSearch is true', async () => {
            rootStore.layoutStore.isHotelDetailsBookPage = true;
            rootStore.searchStore.searchWhen.isMonthSearch = true;
            rootStore.bookingStore.selectedOffer.date = new Date('2023-03-01');

            OffersService.fetchOffers = jest.fn().mockResolvedValue({ offers: [] });

            const result = await store.fetchMapItem('offer1');

            expect(OffersService.fetchOffers).toHaveBeenCalledWith({
                accomCodes: 'offer1',
                startDate: new Date('2023-03-01'),
                flexDays: 0,
                autoAllocation: true,
                dep: 'LGW,LHR',
                geog: 'ALL',
                duration: ['7'],
                searchType: SearchType.Normal,
                take: 1,
                rooms: [{ adults: 2, children: 0 }],
                endDate: undefined,
                isMonthSearch: true,
                deviceType: SitecoreChannel.Desktop,
            });
            expect(result).toEqual({ offers: [] });
        });

        it('should fetch offers with search filters when layout is search results page', async () => {
            rootStore.bookingStore.from = new Date('2023-01-02');

            OffersService.fetchOffers = jest.fn().mockResolvedValue({ offers: [] });

            const result = await store.fetchMapItem('offer1');

            expect(OffersService.fetchOffers).toHaveBeenCalledWith({
                accomCodes: 'offer1',
                startDate: new Date('2023-01-02'),
                endDate: undefined,
                flexDays: 3,
                autoAllocation: true,
                dep: 'LGW',
                geog: 'ALL',
                duration: ['7'],
                searchType: SearchType.Normal,
                take: 1,
                rooms: [{ adults: 2, children: 0 }],
                distressedFlightsOnly: false,
                promc: 'lux',
                hotelTypes: 'hotel-type-filters',
                boardType: 'filter1,filter2',
                tripAdvisorRating: 4,
                starRating: 4,
                facilities: 'facilities',
                priceFrom: 1000,
                priceTo: 2000,
                inboundTimeSlots: 'morning',
                outboundTimeSlots: 'evening',
                flightDurationFrom: SIXTY,
                flightDurationTo: 240,
                isPricePP: true,
                maxtemp: 20,
                mintemp: 10,
                offers: undefined,
                isMonthSearch: false,
                deviceType: SitecoreChannel.Desktop,
            });
            expect(result).toEqual({ offers: [] });
        });

        it('should fetch offers with search filters when layout is search results page and isMonthSearch is true', async () => {
            rootStore.searchStore.searchWhen.isMonthSearch = true;
            rootStore.bookingStore.from = new Date('2023-02-01');
            rootStore.bookingStore.to = new Date('2023-02-28');

            OffersService.fetchOffers = jest.fn().mockResolvedValue({ offers: [] });

            const result = await store.fetchMapItem('offer1');

            expect(OffersService.fetchOffers).toHaveBeenCalledWith({
                accomCodes: 'offer1',
                startDate: new Date('2023-02-01'),
                endDate: new Date('2023-02-28'),
                flexDays: 0,
                autoAllocation: true,
                dep: 'LGW',
                geog: 'ALL',
                duration: ['7'],
                searchType: SearchType.Normal,
                take: 1,
                rooms: [{ adults: 2, children: 0 }],
                distressedFlightsOnly: false,
                promc: 'lux',
                hotelTypes: 'hotel-type-filters',
                boardType: 'filter1,filter2',
                tripAdvisorRating: 4,
                starRating: 4,
                facilities: 'facilities',
                priceFrom: 1000,
                priceTo: 2000,
                inboundTimeSlots: 'morning',
                outboundTimeSlots: 'evening',
                flightDurationFrom: SIXTY,
                flightDurationTo: 240,
                isPricePP: true,
                maxtemp: 20,
                mintemp: 10,
                offers: undefined,
                isMonthSearch: true,
                deviceType: SitecoreChannel.Desktop,
            });
            expect(result).toEqual({ offers: [] });
        });

        it('should use default departure code when flightsFilters and origins are empty', async () => {
            rootStore.searchFiltersStore.flightsFilters = null;
            rootStore.bookingStore.origins = [];
            OffersService.fetchOffers = jest.fn().mockResolvedValue({ offers: [] });

            const result = await store.fetchMapItem('offer2');

            expect(OffersService.fetchOffers).toHaveBeenCalledWith(
                expect.objectContaining({
                    dep: DEPARTURE_ALL_CODE,
                }),
            );
            expect(result).toEqual({ offers: [] });
        });
    });

    describe('onCameraChanged', () => {
        beforeEach(() => {
            jest.spyOn(store, 'getPolygonHotels').mockImplementation();
        });

        it('should call getPolygonHotels with correct polygon bounds', () => {
            const detail = {
                bounds: {
                    north: 50,
                    east: 40,
                    south: 30,
                    west: 20,
                },
            };

            jest.useFakeTimers();

            store.onCameraChanged({ detail });

            jest.runAllTimers();

            expect(store.getPolygonHotels).toHaveBeenCalledWith({
                lt1: 50,
                ln1: 40,
                lt2: 30,
                ln2: 20,
            });
        });

        it('should debounce calls to getPolygonHotels', () => {
            const detail = {
                bounds: {
                    north: 60,
                    east: 50,
                    south: 40,
                    west: 30,
                },
            };

            jest.useFakeTimers();
            store.onCameraChanged({ detail });
            store.onCameraChanged({ detail });

            jest.runAllTimers();

            expect(store.getPolygonHotels).toHaveBeenCalledTimes(1);
        });
    });

    describe('getPolygonHotels', () => {
        beforeEach(() => {
            jest.spyOn(Axios.CancelToken, 'source').mockReturnValue({
                cancel: jest.fn(),
            } as unknown as CancelTokenSource);
            jest.spyOn(store, 'cleanUpHotels').mockImplementation();
        });

        it('should fetch polygon hotels with correct parameters', async () => {
            OffersService.fetchPolygonHotels = jest.fn().mockResolvedValue({ features: [{ id: 'hotel1' }] });

            await store.getPolygonHotels({
                lt1: '50',
                ln1: '40',
                lt2: '30',
                ln2: '20',
            });

            expect(OffersService.fetchPolygonHotels).toHaveBeenCalledWith(
                {
                    startDate: '2023-02-01',
                    flexibleDays: 3,
                    duration: 7,
                    departure: 'LGW,LHR',
                    departureAirport: 'LGW',
                    geography: 'ALL',
                    rooms: [
                        {
                            adults: 2,
                            children: 0,
                        },
                    ],
                    polygon: '50,40|50,20|30,20|30,40',
                },
                expect.any(Object),
            );
            expect(store.hotels).toEqual([{ id: 'hotel1' }]);
        });

        it('should clean up hotels when no data is returned', async () => {
            OffersService.fetchPolygonHotels = jest.fn().mockResolvedValue(null);

            await store.getPolygonHotels({
                lt1: '50',
                ln1: '40',
                lt2: '30',
                ln2: '20',
            });

            expect(store.cleanUpHotels).toHaveBeenCalled();
        });

        it('should handle errors gracefully and log them', async () => {
            const error = new Error('Test error');
            OffersService.fetchPolygonHotels = jest.fn().mockRejectedValue(error);
            const loggerSpy = jest.spyOn(loggerService, 'error');

            await store.getPolygonHotels({
                lt1: '50',
                ln1: '40',
                lt2: '30',
                ln2: '20',
            });

            expect(loggerSpy).toHaveBeenCalledWith({ e: error });
        });

        it('should cancel the previous request if one exists', async () => {
            const cancelSpy = jest.fn();
            store['fetchHotelsCancelSource'] = { cancel: cancelSpy } as unknown as CancelTokenSource;

            OffersService.fetchPolygonHotels = jest.fn().mockResolvedValue({ features: [] });

            await store.getPolygonHotels({
                lt1: '50',
                ln1: '40',
                lt2: '30',
                ln2: '20',
            });

            expect(cancelSpy).toHaveBeenCalled();
            expect(store['fetchHotelsCancelSource']).not.toBeNull();
        });

        it('should return early if all search parameters are not selected', async () => {
            rootStore.searchStore.isAllSearchParametersSelected = false;

            await store.getPolygonHotels({
                lt1: '50',
                ln1: '40',
                lt2: '30',
                ln2: '20',
            });

            expect(OffersService.fetchPolygonHotels).not.toHaveBeenCalled();
        });
    });

    describe('cleanUpHotels', () => {
        test('should set null to hotels field', () => {
            const store = new TradePortalOffersStore(null as any);
            store.hotels = [] as IGeoPoint[];

            store.cleanUpHotels();

            expect(store.hotels).toBeNull();
        });
    });
});
