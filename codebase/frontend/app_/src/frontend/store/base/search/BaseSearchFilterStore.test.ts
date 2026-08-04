import { createMockStores } from 'frontend/__mocks__';
import {
    availableFilters,
    mockDestinationFilters,
    mockDestinationVirtualCountryFilters,
    mockDestinationVirtualRegionFilters,
    mockFlightSelectedFilter,
    selectedDestinationFilters,
    selectedFilterWithDestinationInfo,
} from 'frontend/__mocks__/filters';
import { mockReplaceTokens } from 'frontend/__mocks__/utils/tokenizer';
import {
    BaseSearchFilterStore,
    MAX_FLIGHT_DURATION,
    MIN_FLIGHT_DURATION,
} from 'frontend/store/base/search/BaseSearchFilterStore';
import { createHolidaysAppStores } from 'frontend/store/holidays';
import { TRootStore } from 'frontend/store/IStores';
import * as filterUtils from 'frontend/utils/filter.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { IFilterDestinationInfo, IFilterOption, IFilters, ISelectedFilter } from 'models/data/IFilters';
import { MarketCode } from 'models/data/MarketSettings';
import { ISitecoreLayoutRoute } from 'models/data/SitecoreLayout';
import { ExperimentVariants } from 'models/enum/cro/Experiment';
import { DestinationType } from 'models/enum/DestinationType';
import {
    DEFAULT_FILTER_ORDER,
    FilterGroupCodes,
    FLIGHT_DURATION_FILTER_CODE,
    PRICE_RANGE_FILTER_CODE,
    WEATHER_FILTER_CODE,
} from 'models/enum/FilterGroupCodes';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { RangeFilterTrackingUnits } from 'models/enum/tracking/RangeFilterTrackingUnits';

class SearchFilterStore extends BaseSearchFilterStore {}

jest.mock('frontend/utils/tokenizer');
Tokenizer.replaceTokens = mockReplaceTokens;
const mockIsExclusiveFilterDisabled = jest.spyOn(filterUtils, 'isExclusiveFilterDisabled').mockReturnValue(false);

let mockGetWebStorageItem: IFilterOption[] = [];
const mockSetWebStorageItem = jest.fn();
jest.mock('frontend/utils/webStorage.utils', () => ({
    __esModule: true,
    getWebStorageItem: jest.fn(() => mockGetWebStorageItem),
    removeWebStorageItem: jest.fn(),
    setWebStorageItem: (key, value) => mockSetWebStorageItem(key, value),
}));

const mockGetRangeFilterTrackingValue = jest.fn();
jest.mock('frontend/utils/tracking/filters.utils', () => ({
    __esModule: true,
    getRangeFilterTrackingValue: (...args) => mockGetRangeFilterTrackingValue(...args),
}));

describe('BaseSearchFilterStore', () => {
    let rootStore;

    beforeEach(() => {
        rootStore = createMockStores({
            layoutStore: {
                isPromoPage: false,
                isDynamicPromoPage: false,
                isSearchResultsPage: true,
                layout: {
                    sitecore: {
                        route: {
                            fields: {},
                        },
                    },
                },
            },
            searchStore: {
                searchTo: {
                    selectedDestinationCodesQuery: 'code1,code2,code3',
                },
            },
            hotelsStore: {
                getFilteredHotels: jest.fn(),
                defaultLoadResults: jest.fn(),
            },
            routerStore: {
                clearIsClickBackToSearch: jest.fn(),
            },
            promoPageStore: {
                updateSearchParamsAndExecuteSearch: jest.fn(),
            },
            marketStore: {
                marketCode: MarketCode.UK,
            },
        });
    });

    describe('Get filters', () => {
        it('should not return filters', () => {
            const store = new SearchFilterStore(rootStore);

            expect(store.boardTypeFilters).toBe(undefined);
            expect(store.facilitiesFilters).toBe(undefined);
            expect(store.flightsFilters).toBe(undefined);
            expect(store.starRatingFilters).toBe(undefined);
            expect(store.tripAdvisorRatingFilters).toBe(undefined);
            expect(store.themeFilters).toBe(undefined);
            expect(store.offersFilters).toStrictEqual([]);
            expect(store.hotelTypesFilters).toBe(undefined);
        });

        it('should boardTypeFilters return string with filter when we have selectedFilters', () => {
            const store = new SearchFilterStore(rootStore);
            store.selectedFilters = [
                {
                    code: 'code',
                    groupCode: FilterGroupCodes.BoardType,
                    name: 'name',
                },
            ];

            expect(store.boardTypeFilters).toEqual('code');
        });

        it('should facilitiesFilters return string with filter when we have selectedFilters', () => {
            const store = new SearchFilterStore(rootStore);
            store.selectedFilters = [
                {
                    code: 'code',
                    groupCode: FilterGroupCodes.Facilities,
                    name: 'name',
                },
            ];

            expect(store.facilitiesFilters).toEqual('code');
        });

        it('should flightsFilters return string with filter when we have selectedFilters', () => {
            const store = new SearchFilterStore(rootStore);
            store.selectedFilters = [
                {
                    code: 'code',
                    groupCode: FilterGroupCodes.Flights,
                    name: 'name',
                },
            ];

            expect(store.flightsFilters).toEqual('code');
        });

        it('should offersFilters return string with filter when we have selectedFilters', () => {
            const store = new SearchFilterStore(rootStore);
            store.selectedFilters = [
                {
                    code: 'code',
                    groupCode: FilterGroupCodes.Offers,
                    name: 'name',
                },
            ];

            expect(store.offersFilters).toEqual(['code']);
        });

        it('should starRatingFilters return string with filter when we have selectedFilters', () => {
            const store = new SearchFilterStore(rootStore);
            store.selectedFilters = [
                {
                    code: 'code',
                    groupCode: FilterGroupCodes.StarRating,
                    name: 'name',
                },
            ];

            expect(store.starRatingFilters).toEqual('code');
        });

        it('should tripAdvisorRatingFilters return string with filter when we have selectedFilters', () => {
            const store = new SearchFilterStore(rootStore);
            store.selectedFilters = [
                {
                    code: 'code',
                    groupCode: FilterGroupCodes.TripAdvisorRating,
                    name: 'name',
                },
            ];

            expect(store.tripAdvisorRatingFilters).toEqual('code');
        });

        it('should themeFilters return string with filter when we have selectedFilters', () => {
            const store = new SearchFilterStore({ layoutStore: { isPromoPage: false } } as any);
            store.selectedFilters = [
                {
                    code: 'code',
                    groupCode: FilterGroupCodes.PackageTheme,
                    name: 'name',
                },
            ];

            expect(store.themeFilters).toEqual('code');
        });

        it('should return themeFilters form url if selectedFilters is null', () => {
            const store = new SearchFilterStore({ queryParamsStore: { themesCodesFromUrl: ['C', 'B'] } } as any);
            store.selectedFilters = [];
            store.getFiltersParamsFromQueryParamsStore();

            expect(store.themeFilters).toEqual('C,B');
        });

        it('should hotelTypesFilters return string with filter when we have selectedFilters', () => {
            const store = new SearchFilterStore(rootStore);
            store.selectedFilters = [
                {
                    code: 'code',
                    groupCode: FilterGroupCodes.HotelTypes,
                    name: 'name',
                },
            ];

            expect(store.hotelTypesFilters).toEqual('code');
        });

        it('should promoCollectionFilters return string with filter when we have selectedFilters', () => {
            const store = new SearchFilterStore(rootStore);
            store.selectedFilters = [
                {
                    code: 'code',
                    groupCode: FilterGroupCodes.PromoCollection,
                    name: 'name',
                },
            ];

            expect(store.promoCollectionFilters).toEqual('code');
        });

        it('should return all destination filters', () => {
            const destinationFilter = {
                code: FilterGroupCodes.Destination,
                options: [
                    {
                        code: 'PTMD',
                        name: 'Madeira',
                        count: 1,
                        children: [
                            {
                                code: 'PTMDCA',
                                name: 'Calheta',
                                count: 1,
                                destinationInfo: {
                                    type: DestinationType.Resort,
                                } as IFilterDestinationInfo,
                                groupCode: FilterGroupCodes.Destination,
                            },
                        ],
                        destinationInfo: {
                            parent: 'PT',
                            type: DestinationType.Region,
                        } as IFilterDestinationInfo,
                        groupCode: FilterGroupCodes.Destination,
                    },
                ],
                name: FilterGroupCodes.Destination,
            };
            const store = new SearchFilterStore(rootStore);
            store.filters = [
                {
                    code: FilterGroupCodes.HotelTypes,
                    options: [
                        {
                            code: 'code',
                            name: 'name',
                            count: 1,
                            destinationInfo: {
                                type: DestinationType.Hotel,
                            } as IFilterDestinationInfo,
                            groupCode: FilterGroupCodes.HotelTypes,
                        },
                    ],
                    name: FilterGroupCodes.HotelTypes,
                },
                destinationFilter,
            ];

            expect(store.allDestinationFilters).toMatchObject([
                {
                    code: 'PTMD',
                    name: 'Madeira',
                    groupCode: FilterGroupCodes.Destination,
                },
            ]);
        });

        it('should return empty array when there is no destination filters', () => {
            const store = new SearchFilterStore(rootStore);

            expect(store.allDestinationFilters).toMatchObject([]);
        });

        it('should return selected destination filters', () => {
            const selectedDestinationFilter = {
                code: 'PTMDCA',
                name: 'Calheta',
                groupCode: FilterGroupCodes.Destination,
                destinationInfo: {
                    type: DestinationType.Resort,
                } as IFilterDestinationInfo,
            };
            const store = new SearchFilterStore(rootStore);
            store.selectedFilters = [
                selectedDestinationFilter,
                {
                    code: 'code',
                    name: 'name',
                    groupCode: FilterGroupCodes.HotelTypes,
                    destinationInfo: {
                        type: DestinationType.Hotel,
                    } as IFilterDestinationInfo,
                },
            ];

            expect(store.selectedDestinationFilters).toMatchObject([selectedDestinationFilter]);
        });
    });

    describe('Active Filter Group', () => {
        it('should set activeFilterCode correct', () => {
            const store = new SearchFilterStore(rootStore);

            expect(store.activeFilterCode).toEqual(FilterGroupCodes.NoFilter);

            store.onSelectFilterGroup(FilterGroupCodes.BoardType);

            expect(store.activeFilterCode).toEqual(FilterGroupCodes.BoardType);
        });

        it('should set activeFilterCode noFilter when we select same group', () => {
            const store = new SearchFilterStore(rootStore);
            store.activeFilterCode = FilterGroupCodes.BoardType;

            expect(store.activeFilterCode).toEqual(FilterGroupCodes.BoardType);

            store.onSelectFilterGroup(FilterGroupCodes.BoardType);

            expect(store.activeFilterCode).toEqual(FilterGroupCodes.NoFilter);
        });

        it('should set activeFilterCode noFilter when we call onCloseFilters', () => {
            const store = new SearchFilterStore(rootStore);
            store.activeFilterCode = FilterGroupCodes.BoardType;

            expect(store.activeFilterCode).toEqual(FilterGroupCodes.BoardType);

            store.onCloseFilters();

            expect(store.activeFilterCode).toEqual(FilterGroupCodes.NoFilter);
        });
    });

    describe('onClearAllSelectedFilters', () => {
        it('should set [] selectedFilters when we call onClearAllSelectedFilters', () => {
            const store = new SearchFilterStore(rootStore);
            store.clearWeatherValue = jest.fn();

            store.selectedFilters = [
                {
                    code: 'code',
                    name: 'name',
                    groupCode: FilterGroupCodes.Facilities,
                },
            ];

            store.onClearAllSelectedFilters();

            expect(store.selectedFilters).toEqual([]);
            expect(store.clearWeatherValue).toHaveBeenCalled();
        });
    });

    describe('onRemoveSelectedFilter', () => {
        it('should call clearPriceFiltersValue when filterGroupCode is FilterGroupCodes.PriceRange', () => {
            const store = new SearchFilterStore(rootStore);

            store.clearPriceFiltersValue = jest.fn();

            store.onRemoveSelectedFilter(FilterGroupCodes.PriceRange, 'code', true);

            expect(store.clearPriceFiltersValue).toHaveBeenCalledWith(true);
        });

        it('should call clearFlightDurationValue when filterGroupCode is FlightDuration', () => {
            const store = new SearchFilterStore(rootStore);
            store.clearFlightDurationValue = jest.fn();

            store.onRemoveSelectedFilter(FilterGroupCodes.FlightDuration, 'code');

            expect(store.clearFlightDurationValue).toHaveBeenCalled();
        });

        it('should call clearWeatherValue when filterGroupCode is FilterGroupCodes.Weather', () => {
            const store = new SearchFilterStore(rootStore);

            store.clearWeatherValue = jest.fn();

            store.onRemoveSelectedFilter(FilterGroupCodes.Weather, 'code', true);

            expect(store.clearWeatherValue).toHaveBeenCalledWith(true);
        });

        it('should update selectedFilters when we call onRemoveSelectedFilter', () => {
            const store = new SearchFilterStore(rootStore);

            store.selectedFilters = [
                {
                    code: 'code',
                    name: 'name',
                    groupCode: FilterGroupCodes.BoardType,
                },
            ];

            store.onRemoveSelectedFilter(FilterGroupCodes.BoardType, 'code');

            expect(store.selectedFilters).toEqual([]);
        });
    });

    describe('onSelectFilters', () => {
        let store;

        beforeEach(() => {
            rootStore = {
                trackingStore: { trackSearchFiltersUpdate: jest.fn() },
                layoutStore: { isSearchResultsPage: true },
                marketStore: { marketCode: MarketCode.UK },
            };
            store = new SearchFilterStore(rootStore);
        });

        it('should call trackSearchFiltersUpdate when needToTrack is true', () => {
            const mockFilter = {
                code: 'code',
                count: 2,
                name: 'name',
                groupCode: FilterGroupCodes.StarRating,
            };

            store.onSelectFilters(mockFilter, true);

            expect(store.rootStore.trackingStore.trackSearchFiltersUpdate).toHaveBeenCalledWith(
                true,
                mockFilter,
                undefined,
            );
        });

        it('should NOT call trackSearchFiltersUpdate when needToTrack is false', () => {
            store.onSelectFilters(
                {
                    code: 'code',
                    count: 2,
                    name: 'name',
                    groupCode: FilterGroupCodes.StarRating,
                },
                false,
            );
            expect(store.rootStore.trackingStore.trackSearchFiltersUpdate).not.toHaveBeenCalled();
        });

        it('should set selectedFilters when we call onSelectFilters', () => {
            store.selectedFilters = [];

            store.onSelectFilters({
                code: 'code',
                count: 2,
                name: 'name',
                groupCode: FilterGroupCodes.StarRating,
            });

            expect(store.selectedFilters).toEqual([
                {
                    code: 'code',
                    name: 'name',
                    groupCode: FilterGroupCodes.StarRating,
                },
            ]);
        });

        it('should select parent theme filter when all children are selected and parent count equals children counts sum', () => {
            rootStore = {
                layoutStore: {
                    isPromoPage: false,
                },
            };
            store = new SearchFilterStore(rootStore);
            store.filters = [
                {
                    code: FilterGroupCodes.PackageTheme,
                    options: [
                        {
                            code: 'P',
                            count: 2,
                            name: 'name',
                            groupCode: FilterGroupCodes.PackageTheme,
                            children: [
                                {
                                    code: 'PA',
                                    count: 1,
                                    name: 'PA',
                                    groupCode: FilterGroupCodes.PackageTheme,
                                },
                                {
                                    code: 'PB',
                                    count: 1,
                                    name: 'PB',
                                    groupCode: FilterGroupCodes.PackageTheme,
                                },
                            ],
                        },
                    ],
                    name: FilterGroupCodes.PackageTheme,
                },
            ];
            store.selectedFilters = [];

            store.onSelectFilters(store.filters[0].options[0]!.children![0]);
            store.onSelectFilters(store.filters[0].options[0]!.children![1]);

            expect(store.selectedFilters).toHaveLength(1);
            expect(store.selectedFilters[0].code).toEqual('P');
        });

        it('should clear inbound and outbound flight number filters when we call onSelectFilters', () => {
            const spy = jest.spyOn(store, 'clearFlightNumberValues');

            store.inboundFlightNumberFromUrl = 'EZY0001';
            store.outboundFlightNumberFromUrl = 'EZY0002';

            store.onSelectFilters({
                code: 'code',
                count: 2,
                name: 'name',
                groupCode: FilterGroupCodes.StarRating,
            });

            expect(store.inboundFlightNumberFromUrl).toEqual(null);
            expect(store.outboundFlightNumberFromUrl).toEqual(null);
            expect(spy).toHaveBeenCalledTimes(1);

            store.inboundFlightNumberFromUrl = 'EZY0001';
            store.outboundFlightNumberFromUrl = 'EZY0002';

            store.onSelectFilters();

            expect(store.inboundFlightNumberFromUrl).toEqual(null);
            expect(store.outboundFlightNumberFromUrl).toEqual(null);
            expect(spy).toHaveBeenCalledTimes(2);
        });

        it('should remove filter from selectedFilters when filter is already selected (default case deselect)', () => {
            store.selectedFilters = [
                {
                    code: 'code',
                    name: 'name',
                    groupCode: FilterGroupCodes.StarRating,
                },
            ];

            store.onSelectFilters({
                code: 'code',
                count: 2,
                name: 'name',
                groupCode: FilterGroupCodes.StarRating,
            });

            expect(store.selectedFilters).toEqual([]);
        });

        it('should call trackSearchFiltersUpdate with false when filter is deselected and needToTrack is true', () => {
            const mockFilter = {
                code: 'code',
                count: 2,
                name: 'name',
                groupCode: FilterGroupCodes.StarRating,
            };
            store.selectedFilters = [{ code: 'code', name: 'name', groupCode: FilterGroupCodes.StarRating }];

            store.onSelectFilters(mockFilter, true);

            expect(store.rootStore.trackingStore.trackSearchFiltersUpdate).toHaveBeenCalledWith(
                false,
                mockFilter,
                undefined,
            );
        });

        it('should route to onSelectBoardsFilter when groupCode is BoardType', () => {
            store.filters = [{ code: FilterGroupCodes.BoardType, name: FilterGroupCodes.BoardType, options: [] }];
            store.onSelectBoardsFilter = jest.fn();

            store.onSelectFilters({
                code: 'HB',
                count: 1,
                name: 'Half Board',
                groupCode: FilterGroupCodes.BoardType,
            });

            expect(store.onSelectBoardsFilter).toHaveBeenCalledTimes(1);
        });

        it('should route to onSelectDestinationFilter when groupCode is Destination', () => {
            store.onSelectDestinationFilter = jest.fn();

            store.onSelectFilters({
                code: 'HRDB',
                count: 1,
                name: 'Dubrovnik',
                groupCode: FilterGroupCodes.Destination,
            });

            expect(store.onSelectDestinationFilter).toHaveBeenCalledTimes(1);
        });

        it('should route to onSelectRadioFilter when groupCode is Duration', () => {
            store.onSelectRadioFilter = jest.fn();

            store.onSelectFilters({
                code: '7',
                count: 1,
                name: '7 nights',
                groupCode: FilterGroupCodes.Duration,
            });

            expect(store.onSelectRadioFilter).toHaveBeenCalledTimes(1);
        });
    });

    describe('Check selected filters', () => {
        it('should return true if filter is selected', () => {
            const store = new SearchFilterStore(rootStore);
            const filter = {
                code: 'code',
                count: 1,
                name: 'name',
                groupCode: FilterGroupCodes.StarRating,
            };
            store.selectedFilters.push(filter);
            expect(store.isFilterGroupSelected(filter)).toBeTruthy();
        });

        it('should return true if parent theme is selected', () => {
            const store = new SearchFilterStore({ layoutStore: { isPromoPage: false } } as any);
            const filter = {
                code: 'P',
                count: 1,
                name: 'name',
                groupCode: FilterGroupCodes.PackageTheme,
                children: [
                    {
                        code: 'PA',
                        count: 1,
                        name: 'PA',
                        groupCode: FilterGroupCodes.PackageTheme,
                    },
                ],
            };
            store.selectedFilters.push(filter);
            expect(store.isFilterGroupSelected(filter.children[0])).toBeTruthy();
        });

        it('should return false if parent filter count is zero', () => {
            const store = new SearchFilterStore({ layoutStore: { isPromoPage: false } } as any);
            const filter = {
                code: 'code',
                count: 0,
                name: 'name',
                groupCode: FilterGroupCodes.PackageTheme,
                children: [
                    {
                        code: 'childCode',
                        count: 0,
                        name: 'childName',
                        groupCode: FilterGroupCodes.PackageTheme,
                    },
                ],
            };
            store.selectedFilters.push(filter.children[0]);
            expect(store.isFilterGroupSelected(filter)).toBeFalsy();
        });
    });

    describe('Initialize filters', () => {
        const createStore = () =>
            new SearchFilterStore({
                hotelsStore: {
                    numberOfHotels: 100,
                    hasHotels: true,
                },
                layoutStore: {
                    getPhrase: jest.fn(),
                    filtersOrder: [
                        ...DEFAULT_FILTER_ORDER,
                        FilterGroupCodes.PriceRange,
                        FilterGroupCodes.FlightDuration,
                        FilterGroupCodes.RecentlyUsed,
                        FilterGroupCodes.Recommended,
                    ],
                    isPromoPage: false,
                },
                promoPageStore: {
                    pageThemeTypeCodes: [],
                    isPackageThemeEnabledOnPromoPage: jest.fn(),
                },
                searchStore: {
                    searchTo: { selectedDestinationCodes: ['LULU', 'AS'] },
                    searchWhen: {
                        selectedNumberOfNights: 1,
                    },
                },
            } as any);
        let store = createStore();

        beforeEach(() => {
            store = createStore();
        });

        it('should save empty filters', () => {
            const filters = [];
            store.saveFilters(filters);
            expect(store.isFiltersLoaded).toBeTruthy();
            expect(store.filters).toHaveLength(0);
        });

        it('should set boards filters', () => {
            const filters = [
                {
                    code: FilterGroupCodes.BoardType,
                    options: [{ code: 'test', name: 'test', count: 1, groupCode: FilterGroupCodes.Flights }],
                    name: FilterGroupCodes.BoardType,
                },
            ];
            store.saveFilters(filters);
            expect(store.filters.find(f => f.code === FilterGroupCodes.BoardType)).not.toBeUndefined();
        });

        it('should set facilities filters in that order that api return', () => {
            const filters = [
                {
                    code: FilterGroupCodes.Facilities,
                    options: [
                        { code: 'test', name: 'bTest', count: 1, groupCode: FilterGroupCodes.Flights },
                        { code: 'test', name: 'aTest', count: 1, groupCode: FilterGroupCodes.Flights },
                    ],
                    name: FilterGroupCodes.Facilities,
                },
            ];
            store.saveFilters(filters);
            const facilities = store.filters.find(f => f.code === FilterGroupCodes.Facilities);
            expect(facilities).not.toBeUndefined();
            expect(facilities!.options[0].name).toBe('bTest');
            expect(facilities!.options[1].name).toBe('aTest');
        });

        it('should set flights filters', () => {
            const filters = [
                {
                    code: FilterGroupCodes.Flights,
                    options: [{ code: 'test', name: 'test', count: 1, groupCode: FilterGroupCodes.Flights }],
                    name: FilterGroupCodes.Flights,
                },
            ];
            store.saveFilters(filters);
            expect(store.filters.find(f => f.code === FilterGroupCodes.Flights)).not.toBeUndefined();
        });

        it('should set weather filter', () => {
            const filters = [
                {
                    code: FilterGroupCodes.Weather,
                    options: [
                        {
                            code: 'test',
                            name: 'test',
                            count: 1,
                            groupCode: FilterGroupCodes.Weather,
                            maxTemp: 10,
                            minTemp: 1,
                        },
                    ],
                    name: FilterGroupCodes.Weather,
                },
            ];

            store.saveFilters(filters);

            expect(store.filters.find(f => f.code === FilterGroupCodes.Weather)).not.toBeUndefined();
        });

        it('should set themes filters', () => {
            const filters = [
                {
                    code: FilterGroupCodes.PackageTheme,
                    options: [{ code: 'test', name: 'test', count: 1, groupCode: FilterGroupCodes.PackageTheme }],
                    name: FilterGroupCodes.PackageTheme,
                },
            ];
            store.saveFilters(filters);
            expect(store.filters.find(f => f.code === FilterGroupCodes.PackageTheme)).not.toBeUndefined();
        });

        it('should preset saved theme url codes', () => {
            store.rootStore.queryParamsStore = { themesCodesFromUrl: ['C', 'BF'] } as any;
            store.getFiltersParamsFromQueryParamsStore();

            const filters = [
                {
                    code: FilterGroupCodes.PackageTheme,
                    options: [
                        { code: 'C', name: 'City', count: 1, groupCode: FilterGroupCodes.PackageTheme },
                        {
                            code: 'B',
                            name: 'Beach',
                            count: 2,
                            children: [
                                { code: 'BF', name: 'Family', count: 1, groupCode: FilterGroupCodes.PackageTheme },
                                { code: 'BL', name: 'Luxury', count: 1, groupCode: FilterGroupCodes.PackageTheme },
                            ],
                        },
                    ],
                },
            ] as IFilters[];
            store.saveFilters(filters);
            expect(store.selectedFilters).toEqual([
                expect.objectContaining({ code: 'C', name: 'City' }),
                expect.objectContaining({ code: 'BF', name: 'Family' }),
            ]);
        });

        it('should set hotelTypes filters', () => {
            const filters = [
                {
                    code: FilterGroupCodes.HotelTypes,
                    options: [],
                    name: FilterGroupCodes.HotelTypes,
                },
            ];
            store.saveFilters(filters);
            expect(store.filters.find(f => f.code === FilterGroupCodes.HotelTypes)).toEqual(filters[0]);
        });

        it('should set flightDuration filters', () => {
            store.saveFilters([{} as IFilters]);
            expect(store.filters.find(f => f.code === FilterGroupCodes.FlightDuration)).toEqual({
                code: FilterGroupCodes.FlightDuration,
                options: [
                    {
                        code: FLIGHT_DURATION_FILTER_CODE,
                        count: 0,
                        groupCode: FilterGroupCodes.FlightDuration,
                        name: `${FilterGroupCodes.FlightDuration}_FilterName`,
                    },
                ],
                name: FilterGroupCodes.FlightDuration,
            });
        });

        it('should set priceFilter filters', () => {
            store.saveFilters([{} as IFilters]);
            expect(store.filters.find(f => f.code === FilterGroupCodes.PriceRange)).toEqual({
                code: FilterGroupCodes.PriceRange,
                options: [
                    {
                        code: PRICE_RANGE_FILTER_CODE,
                        count: 0,
                        groupCode: FilterGroupCodes.PriceRange,
                        name: `${FilterGroupCodes.PriceRange}_FilterName`,
                    },
                ],
                name: FilterGroupCodes.PriceRange,
            });
        });

        it('should set promoCollection filters', () => {
            const filters = [
                {
                    code: FilterGroupCodes.PromoCollection,
                    options: [],
                    name: FilterGroupCodes.PromoCollection,
                },
            ];
            store.saveFilters(filters);

            expect(store.filters.find(f => f.code === FilterGroupCodes.PromoCollection)).not.toBeUndefined();
        });
    });

    describe('setIsPriceFilterPerPerson', () => {
        it('should set isPriceFilterPerPerson on setIsPriceFilterPerPerson call', () => {
            const store = new SearchFilterStore(null as any);

            expect(store.isPriceFilterPerPerson).toBe(true);

            store.setIsPriceFilterPerPerson(false);

            expect(store.isPriceFilterPerPerson).toBe(false);
        });
    });

    describe('isSelectedRegionsBelongToOneRegionCountry', () => {
        const createStore = () =>
            new SearchFilterStore({
                hotelsStore: {
                    numberOfHotels: 100,
                },
                layoutStore: {
                    getPhrase: jest.fn(),
                    filtersOrder: DEFAULT_FILTER_ORDER,
                },
                searchStore: {
                    searchTo: {
                        selectedDestinationCodes: ['LULU', 'AS'],
                        selectedDestinationCodesQuery: 'LULU|AS',
                    },
                    searchWhen: {},
                    resortsInVirtual: [],
                },
            } as any);
        let store = createStore();

        beforeEach(() => {
            store = createStore();
        });

        it('should return true if select country with one region', () => {
            const filters = [
                {
                    code: FilterGroupCodes.Destination,
                    name: FilterGroupCodes.Destination,
                    options: [{ code: 'LU', name: 'Luxemburg', count: 1, children: [{ code: 'LULU' }] }],
                },
            ];
            store.saveFilters(filters as any);

            expect(store.isSelectedRegionsBelongToOneRegionCountry()).toBeTruthy();
        });

        it('should return false if select country with multi region', () => {
            const filters = [
                {
                    code: FilterGroupCodes.Destination,
                    name: FilterGroupCodes.Destination,
                    options: [
                        { code: 'LU', name: 'Luxemburg', count: 1, children: [{ code: 'LULU' }, { code: 'PUPU' }] },
                    ],
                },
            ];
            store.saveFilters(filters as any);

            expect(store.isSelectedRegionsBelongToOneRegionCountry()).toBeFalsy();
        });
    });

    describe('priceFilterLabel', () => {
        it('should return price range label when price from and to are selected', () => {
            const createStore = () => new SearchFilterStore(createMockStores());
            const store = createStore();
            store.filterPriceFrom = 100;
            store.filterPriceTo = 200;
            store.isPriceFilterPerPerson = false;

            store.priceFilterLabel;

            expect(mockReplaceTokens).toHaveBeenCalledWith(
                SitecoreDictionary.SearchPodFiltersSelectedPriceTotalFromTo,
                {
                    '{maxPrice}': '£200',
                    '{minPrice}': '£100',
                },
            );
        });

        it('should return price from label when price to is not selected', () => {
            const createStore = () => new SearchFilterStore(createMockStores());
            const store = createStore();
            store.filterPriceFrom = 100;
            store.filterPriceTo = null;
            store.isPriceFilterPerPerson = false;

            store.priceFilterLabel;

            expect(mockReplaceTokens).toHaveBeenCalledWith(SitecoreDictionary.SearchPodFiltersSelectedPriceTotalFrom, {
                '{maxPrice}': '£0',
                '{minPrice}': '£100',
            });
        });

        it('should return price to label when price from is not selected', () => {
            const createStore = () => new SearchFilterStore(createMockStores());
            const store = createStore();
            store.filterPriceFrom = null;
            store.filterPriceTo = 100;
            store.isPriceFilterPerPerson = false;

            store.priceFilterLabel;

            expect(mockReplaceTokens).toHaveBeenCalledWith(SitecoreDictionary.SearchPodFiltersSelectedPriceTotalUnder, {
                '{maxPrice}': '£100',
                '{minPrice}': '£0',
            });
        });
    });

    describe('priceFilterLabelForTracking', () => {
        describe('isPricePerPerson is false', () => {
            it('should call getRangeFilterTrackingValue when price from and to are selected', () => {
                const createStore = () => new SearchFilterStore(createMockStores());
                const store = createStore();
                store.filterPriceFrom = 100;
                store.filterPriceTo = 200;
                store.isPriceFilterPerPerson = false;

                store.priceFilterLabelForTracking;

                expect(mockGetRangeFilterTrackingValue).toHaveBeenCalledWith('£100', '£200');
            });

            it('should call getRangeFilterTrackingValue with maxPrice when to price is not selected', () => {
                const createStore = () => new SearchFilterStore(createMockStores());
                const store = createStore();
                store.filterPriceFrom = 100;
                store.filterPriceTo = null;
                store.rootStore.hotelsStore.maxPrice = 150;
                store.isPriceFilterPerPerson = false;

                store.priceFilterLabelForTracking;

                expect(mockGetRangeFilterTrackingValue).toHaveBeenCalledWith('£100', '£150');
            });

            it('should call getRangeFilterTrackingValue with minPrice when from price is not selected', () => {
                const createStore = () => new SearchFilterStore(createMockStores());
                const store = createStore();
                store.filterPriceFrom = null;
                store.rootStore.hotelsStore.minPrice = 50;
                store.filterPriceTo = 100;
                store.isPriceFilterPerPerson = false;

                store.priceFilterLabelForTracking;

                expect(mockGetRangeFilterTrackingValue).toHaveBeenCalledWith('£50', '£100');
            });
        });

        describe('isPricePerPerson is true', () => {
            it('should call getRangeFilterTrackingValue with minPricePP when from price is not selected', () => {
                const createStore = () => new SearchFilterStore(createMockStores());
                const store = createStore();
                store.filterPriceFrom = null;
                store.rootStore.hotelsStore.minPricePp = 50;
                store.filterPriceTo = 100;
                store.isPriceFilterPerPerson = true;

                store.priceFilterLabelForTracking;

                expect(mockGetRangeFilterTrackingValue).toHaveBeenCalledWith('£50', '£100');
            });

            it('should call getRangeFilterTrackingValue with maxPricePP when to price is not selected', () => {
                const createStore = () => new SearchFilterStore(createMockStores());
                const store = createStore();
                store.filterPriceFrom = 100;
                store.filterPriceTo = null;
                store.rootStore.hotelsStore.maxPricePp = 150;
                store.isPriceFilterPerPerson = true;

                store.priceFilterLabelForTracking;

                expect(mockGetRangeFilterTrackingValue).toHaveBeenCalledWith('£100', '£150');
            });
        });
    });

    describe('serialize method', () => {
        it('should return data', () => {
            const store = new SearchFilterStore(createMockStores());

            expect(store.serialize()).toEqual({
                filters: store.filters,
                selectedFilters: store.selectedFilters,
                filterPriceFrom: store.filterPriceFrom,
                filterPriceTo: store.filterPriceTo,
                flightDurationFrom: store.flightDurationFrom,
                flightDurationTo: store.flightDurationTo,
                isPriceFilterPerPerson: store.isPriceFilterPerPerson,
                isPresetDestinationFilter: store.isPresetDestinationFilter,
                weatherFrom: store.weatherFrom,
                weatherTo: store.weatherTo,
            });
        });
    });

    describe('deserialize method', () => {
        it('should set data', () => {
            const initialState = {
                filters: [{} as IFilters],
                selectedFilters: [],
                filterPriceFrom: 100,
                filterPriceTo: 1000,
                flightDurationFrom: 2,
                flightDurationTo: 5,
                isPriceFilterPerPerson: true,
                isPresetDestinationFilter: false,
                weatherFrom: 10,
                weatherTo: 20,
            };
            const store = new SearchFilterStore(createMockStores());

            store.deserialize(initialState);

            expect(store.filters).toEqual(initialState.filters);
            expect(store.selectedFilters).toEqual(initialState.selectedFilters);
            expect(store.filterPriceFrom).toEqual(initialState.filterPriceFrom);
            expect(store.filterPriceTo).toEqual(initialState.filterPriceTo);
            expect(store.flightDurationFrom).toEqual(initialState.flightDurationFrom);
            expect(store.flightDurationTo).toEqual(initialState.flightDurationTo);
            expect(store.isPriceFilterPerPerson).toEqual(initialState.isPriceFilterPerPerson);
            expect(store.isPresetDestinationFilter).toEqual(initialState.isPresetDestinationFilter);
            expect(store.weatherFrom).toEqual(initialState.weatherFrom);
            expect(store.weatherTo).toEqual(initialState.weatherTo);
        });

        it('should set default data', () => {
            const store = new SearchFilterStore(createMockStores());

            store.deserialize({});

            expect(store.filters).toEqual([]);
            expect(store.selectedFilters).toEqual([]);
            expect(store.filterPriceFrom).toEqual(null);
            expect(store.filterPriceTo).toEqual(null);
            expect(store.flightDurationFrom).toEqual(MIN_FLIGHT_DURATION);
            expect(store.flightDurationTo).toEqual(MAX_FLIGHT_DURATION);
            expect(store.isPriceFilterPerPerson).toEqual(true);
            expect(store.isPresetDestinationFilter).toEqual(false);
            expect(store.weatherFrom).toEqual(null);
            expect(store.weatherTo).toEqual(null);
        });
    });

    describe('destinationFiltersWithParents', () => {
        let store: SearchFilterStore;

        beforeEach(() => {
            store = new SearchFilterStore(rootStore);
        });

        it('should return empty string when destination filters are not selected', () => {
            jest.spyOn(store, 'selectedDestinationFilters', 'get').mockReturnValue([]);

            expect(store.destinationFiltersWithParents).toBe('');
        });

        it('should join few regions correctly', () => {
            jest.spyOn(store, 'selectedDestinationFilters', 'get').mockReturnValue(selectedDestinationFilters);
            jest.spyOn(store, 'allDestinationFilters', 'get').mockReturnValue(mockDestinationFilters);

            expect(store.destinationFiltersWithParents).toBe('HR|CY,HRDB|CYLN|CYPF');
        });

        it('should return country, region and resort when selected filter is resort', () => {
            jest.spyOn(store, 'selectedDestinationFilters', 'get').mockReturnValue(selectedFilterWithDestinationInfo);
            jest.spyOn(store, 'allDestinationFilters', 'get').mockReturnValue(mockDestinationFilters);

            expect(store.destinationFiltersWithParents).toBe('PT,PTMD,PTMDCA');
        });

        it('should return country and region when selected filter is region', () => {
            jest.spyOn(store, 'selectedDestinationFilters', 'get').mockReturnValue([
                {
                    code: 'HRDB',
                    name: 'Dubrovnik',
                    groupCode: FilterGroupCodes.Destination,
                    destinationInfo: {
                        type: DestinationType.Region,
                    } as IFilterDestinationInfo,
                },
            ]);
            jest.spyOn(store, 'allDestinationFilters', 'get').mockReturnValue(mockDestinationFilters);

            expect(store.destinationFiltersWithParents).toBe('HR,HRDB');
        });

        it('should return country and region when selected filter is top-level region with no parent in filters', () => {
            jest.spyOn(store, 'selectedDestinationFilters', 'get').mockReturnValue([
                {
                    code: 'HRDB',
                    name: 'Dubrovnik',
                    groupCode: FilterGroupCodes.Destination,
                    destinationInfo: {
                        type: DestinationType.Region,
                        parent: 'HR',
                    } as IFilterDestinationInfo,
                },
            ]);
            // allDestinationFilters has HRDB at the top level with no country parent
            jest.spyOn(store, 'allDestinationFilters', 'get').mockReturnValue([
                {
                    code: 'HRDB',
                    name: 'Dubrovnik',
                    count: 0,
                    groupCode: FilterGroupCodes.Destination,
                    destinationInfo: {
                        type: DestinationType.Region,
                        parent: 'HR',
                    } as IFilterDestinationInfo,
                    children: [],
                },
            ]);

            expect(store.destinationFiltersWithParents).toBe('HR,HRDB');
        });

        it('should return empty string when selected filter is country', () => {
            jest.spyOn(store, 'selectedDestinationFilters', 'get').mockReturnValue([
                {
                    code: 'CY',
                    name: 'Cyprus',
                    groupCode: FilterGroupCodes.Destination,
                    destinationInfo: {
                        type: DestinationType.Country,
                    } as IFilterDestinationInfo,
                },
            ]);
            jest.spyOn(store, 'allDestinationFilters', 'get').mockReturnValue(mockDestinationFilters);

            expect(store.destinationFiltersWithParents).toBe('');
        });

        it('should not duplicate parent country when country and region from the same country are selected', () => {
            jest.spyOn(store, 'selectedDestinationFilters', 'get').mockReturnValue([
                {
                    code: 'CY',
                    name: 'Cyprus',
                    groupCode: FilterGroupCodes.Destination,
                    destinationInfo: {
                        type: DestinationType.Country,
                    } as IFilterDestinationInfo,
                },
                {
                    code: 'CYLN',
                    name: 'Larnaca',
                    groupCode: FilterGroupCodes.Destination,
                    destinationInfo: {
                        type: DestinationType.Region,
                    } as IFilterDestinationInfo,
                },
            ]);
            jest.spyOn(store, 'allDestinationFilters', 'get').mockReturnValue(mockDestinationFilters);

            expect(store.destinationFiltersWithParents).toBe('CY,CYLN');
        });

        it('should join resorts from the same region correctly', () => {
            jest.spyOn(store, 'selectedDestinationFilters', 'get').mockReturnValue([
                {
                    code: 'PTMDCA',
                    name: 'Calheta',
                    groupCode: FilterGroupCodes.Destination,
                    destinationInfo: {
                        type: DestinationType.Resort,
                    } as IFilterDestinationInfo,
                },
                {
                    code: 'PTMDCL',
                    name: 'Canical',
                    groupCode: FilterGroupCodes.Destination,
                    destinationInfo: {
                        type: DestinationType.Resort,
                    } as IFilterDestinationInfo,
                },
            ]);
            jest.spyOn(store, 'allDestinationFilters', 'get').mockReturnValue(mockDestinationFilters);

            expect(store.destinationFiltersWithParents).toBe('PT,PTMD,PTMDCA|PTMDCL');
        });

        it('should use relatedRegions[0] instead of parent code when parent is VirtualCountry', () => {
            jest.spyOn(store, 'selectedDestinationFilters', 'get').mockReturnValue([
                {
                    code: 'GBSCGL',
                    name: 'Glasgow City',
                    groupCode: FilterGroupCodes.Destination,
                    destinationInfo: {
                        type: DestinationType.Resort,
                    } as IFilterDestinationInfo,
                },
            ]);
            jest.spyOn(store, 'allDestinationFilters', 'get').mockReturnValue(mockDestinationVirtualCountryFilters);

            expect(store.destinationFiltersWithParents).toBe('GB,GBSC,GBSCGL');
        });

        it('should return empty string when selected filter is VirtualCountry', () => {
            jest.spyOn(store, 'selectedDestinationFilters', 'get').mockReturnValue([
                {
                    code: 'VGBSC',
                    name: 'Scotland',
                    groupCode: FilterGroupCodes.Destination,
                    destinationInfo: {
                        parent: 'GB',
                        relatedRegions: ['GBSC'],
                        type: DestinationType.VirtualCountry,
                    } as IFilterDestinationInfo,
                },
            ]);
            jest.spyOn(store, 'allDestinationFilters', 'get').mockReturnValue(mockDestinationVirtualCountryFilters);

            expect(store.destinationFiltersWithParents).toBe('');
        });

        it('should return country, related region and resort when selected filter is resort inside VirtualCountry', () => {
            jest.spyOn(store, 'selectedDestinationFilters', 'get').mockReturnValue([
                {
                    code: 'GBSCED',
                    name: 'Edinburgh City',
                    groupCode: FilterGroupCodes.Destination,
                    destinationInfo: {
                        type: DestinationType.Resort,
                    } as IFilterDestinationInfo,
                },
            ]);
            jest.spyOn(store, 'allDestinationFilters', 'get').mockReturnValue(mockDestinationVirtualCountryFilters);

            expect(store.destinationFiltersWithParents).toBe('GB,GBSC,GBSCED');
        });

        it('should return country, region and resort when selected filter is resort inside VirtualRegion filters', () => {
            jest.spyOn(store, 'selectedDestinationFilters', 'get').mockReturnValue([
                {
                    code: 'ESALMO',
                    name: 'Mojacar',
                    groupCode: FilterGroupCodes.Destination,
                    destinationInfo: {
                        type: DestinationType.Resort,
                    } as IFilterDestinationInfo,
                },
            ]);
            jest.spyOn(store, 'allDestinationFilters', 'get').mockReturnValue(mockDestinationVirtualRegionFilters);

            expect(store.destinationFiltersWithParents).toBe('ES,ESAL,ESALMO');
        });

        it('should return empty string when no parent is found for selected filter', () => {
            jest.spyOn(store, 'selectedDestinationFilters', 'get').mockReturnValue([
                {
                    code: 'UNKNOWN',
                    name: 'Unknown',
                    groupCode: FilterGroupCodes.Destination,
                    destinationInfo: {
                        type: DestinationType.Resort,
                    } as IFilterDestinationInfo,
                },
            ]);
            jest.spyOn(store, 'allDestinationFilters', 'get').mockReturnValue(mockDestinationFilters);

            expect(store.destinationFiltersWithParents).toBe('');
        });

        it('should return region codes without countries when allDestinationFilters is empty and selected filters are regions', () => {
            jest.spyOn(store, 'selectedDestinationFilters', 'get').mockReturnValue(selectedDestinationFilters);
            jest.spyOn(store, 'allDestinationFilters', 'get').mockReturnValue([]);

            expect(store.destinationFiltersWithParents).toBe('HRDB|CYLN|CYPF');
        });
    });

    describe('presetDestinationFilter', () => {
        let stores;

        beforeEach(() => {
            stores = createHolidaysAppStores();
            stores.searchFiltersStore.onSelectDestinationFilter = jest.fn();
        });

        it('should preset Destination Filters if selected Region', () => {
            stores.searchStore.searchTo.selectedDestinationCodesQuery = 'HR,HRIR';
            stores.searchStore.searchTo.selectedDestinationCodes = ['HRIR'];
            stores.searchFiltersStore.filters = [
                {
                    code: FilterGroupCodes.Destination,
                    name: FilterGroupCodes.Destination,
                    options: mockDestinationFilters,
                },
            ];

            stores.searchFiltersStore.presetDestinationFilter();

            expect(stores.searchFiltersStore.onSelectDestinationFilter).toHaveBeenCalled();
        });

        it('should preset Destination Filter if selected Virtual Country', () => {
            stores.searchStore.searchTo.selectedDestinationCodesQuery = 'GB,GBSC';
            stores.searchStore.searchTo.selectedDestinationCodes = ['VGBSC'];
            stores.searchFiltersStore.filters = [
                {
                    code: FilterGroupCodes.Destination,
                    name: FilterGroupCodes.Destination,
                    options: mockDestinationVirtualCountryFilters,
                },
            ];

            stores.searchFiltersStore.presetDestinationFilter();

            expect(stores.searchFiltersStore.onSelectDestinationFilter).toHaveBeenCalled();
        });

        it('should preset Destination Filter if selected resort', () => {
            stores.searchStore.searchTo.selectedDestinationCodesQuery = 'PT,PTMD,PTMDPC|GB';
            stores.searchStore.searchTo.selectedDestinationCodes = ['PTMDPC'];
            stores.searchFiltersStore.filters = [
                {
                    code: FilterGroupCodes.Destination,
                    name: FilterGroupCodes.Regions,
                    options: mockDestinationFilters,
                },
            ];

            stores.searchFiltersStore.presetDestinationFilter();

            expect(stores.searchFiltersStore.onSelectDestinationFilter).toHaveBeenCalled();
        });

        it('should NOT preset any destinations when on promo page and destinations include virtual regions and same region at two different levels', () => {
            rootStore.searchStore.searchTo.selectedDestinationCodesQuery =
                'ES,ESCB|ESBV|ESAL|ESCD|ESDO|ESFU|ESGC|ESIB|ESLZ|ESMJ|ESMN|ESMU|ESTF|ESBA|ESMA|ESSV|ESVA|ESCT';
            rootStore.searchStore.searchTo.selectedDestinationCodes = [
                'VAND',
                'BIV',
                'CIV',
                'ESCB',
                'ESBV',
                'ESAL',
                'ESCD',
                'ESDO',
                'ESFU',
                'ESGC',
                'ESIB',
                'ESLZ',
                'ESMJ',
                'ESMN',
                'ESMU',
                'ESTF',
                'ESBA',
                'ESMA',
                'ESSV',
                'ESVA',
                'ESCT',
            ];
            rootStore.layoutStore.isPromoPage = true;
            const store = new SearchFilterStore(rootStore);
            store.filters = [
                {
                    code: FilterGroupCodes.Destination,
                    name: FilterGroupCodes.Regions,
                    options: mockDestinationVirtualRegionFilters,
                },
            ];
            store.onSelectDestinationFilter = jest.fn();

            store.presetDestinationFilter();

            expect(store.onSelectDestinationFilter).not.toHaveBeenCalled();
        });
    });

    describe('onSelectDestinationFilter', () => {
        let stores;

        beforeEach(() => {
            stores = createHolidaysAppStores();

            stores.searchFiltersStore.selectedFilters = [];
        });

        describe('country', () => {
            const virtualResortParent: IFilterOption = {
                code: 'ES',
                name: 'Spain',
                count: 5,
                groupCode: FilterGroupCodes.Destination,
                destinationInfo: { type: DestinationType.Country } as IFilterDestinationInfo,
                children: [
                    {
                        code: 'ESMA',
                        name: 'Mallorca',
                        count: 3,
                        groupCode: FilterGroupCodes.Destination,
                        destinationInfo: { type: DestinationType.Resort } as IFilterDestinationInfo,
                    },
                    {
                        code: 'ESIB',
                        name: 'Ibiza',
                        count: 2,
                        groupCode: FilterGroupCodes.Destination,
                        destinationInfo: { type: DestinationType.Resort } as IFilterDestinationInfo,
                    },
                    {
                        code: 'VRES',
                        name: 'Balearic Islands',
                        count: 5,
                        groupCode: FilterGroupCodes.Destination,
                        destinationInfo: {
                            type: DestinationType.VirtualResort,
                            relatedResorts: ['ESMA', 'ESIB'],
                        } as IFilterDestinationInfo,
                    },
                ],
            };

            beforeEach(() => {
                stores.searchFiltersStore.filters = [
                    {
                        code: FilterGroupCodes.Destination,
                        name: FilterGroupCodes.Destination,
                        options: [virtualResortParent],
                    },
                ];
            });

            it('should add related resorts when selecting a VirtualResort filter', () => {
                stores.searchFiltersStore.onSelectDestinationFilter({
                    code: 'VRES',
                    name: 'Balearic Islands',
                    count: 5,
                    groupCode: FilterGroupCodes.Destination,
                    destinationInfo: {
                        type: DestinationType.VirtualResort,
                        relatedResorts: ['ESMA', 'ESIB'],
                    } as IFilterDestinationInfo,
                });

                const codes = stores.searchFiltersStore.selectedFilters.map(f => f.code);

                expect(codes).toContain('ESMA');
                expect(codes).toContain('ESIB');
            });

            it('should remove related resorts when deselecting a VirtualResort filter', () => {
                stores.searchFiltersStore.selectedFilters = [
                    {
                        code: 'VRES',
                        name: 'Balearic Islands',
                        groupCode: FilterGroupCodes.Destination,
                        destinationInfo: {
                            type: DestinationType.VirtualResort,
                            relatedResorts: ['ESMA', 'ESIB'],
                        } as IFilterDestinationInfo,
                    },
                    {
                        code: 'ESMA',
                        name: 'Mallorca',
                        groupCode: FilterGroupCodes.Destination,
                        destinationInfo: { type: DestinationType.Resort } as IFilterDestinationInfo,
                    },
                    {
                        code: 'ESIB',
                        name: 'Ibiza',
                        groupCode: FilterGroupCodes.Destination,
                        destinationInfo: { type: DestinationType.Resort } as IFilterDestinationInfo,
                    },
                ];
                stores.searchFiltersStore.presetDestinationFilter = jest.fn();

                stores.searchFiltersStore.onSelectDestinationFilter({
                    code: 'VRES',
                    name: 'Balearic Islands',
                    count: 5,
                    groupCode: FilterGroupCodes.Destination,
                    destinationInfo: {
                        type: DestinationType.VirtualResort,
                        relatedResorts: ['ESMA', 'ESIB'],
                    } as IFilterDestinationInfo,
                });

                const codes = stores.searchFiltersStore.selectedFilters.map(f => f.code);

                expect(codes).not.toContain('ESMA');
                expect(codes).not.toContain('ESIB');
            });

            it('should not modify related resorts when VirtualResort parent is not found', () => {
                // resort code not present in any parent's children — parent lookup returns undefined
                stores.searchFiltersStore.onSelectDestinationFilter({
                    code: 'UNKNOWN_RESORT',
                    name: 'Unknown',
                    count: 1,
                    groupCode: FilterGroupCodes.Destination,
                    destinationInfo: {
                        type: DestinationType.VirtualResort,
                        relatedResorts: ['ESMA', 'ESIB'],
                    } as IFilterDestinationInfo,
                });

                const codes = stores.searchFiltersStore.selectedFilters.map(f => f.code);

                expect(codes).not.toContain('ESMA');
                expect(codes).not.toContain('ESIB');
            });
        });

        describe('country', () => {
            const countryFilter: IFilterOption = {
                code: 'HR',
                name: 'Croatia',
                count: 2,
                groupCode: FilterGroupCodes.Destination,
                destinationInfo: { type: DestinationType.Country } as IFilterDestinationInfo,
                children: [
                    {
                        code: 'HRDB',
                        name: 'Dubrovnik',
                        count: 1,
                        groupCode: FilterGroupCodes.Destination,
                        destinationInfo: { type: DestinationType.Region } as IFilterDestinationInfo,
                    },
                    {
                        code: 'HRIR',
                        name: 'Istrian Riviera',
                        count: 1,
                        groupCode: FilterGroupCodes.Destination,
                        destinationInfo: { type: DestinationType.Region } as IFilterDestinationInfo,
                    },
                ],
            };

            beforeEach(() => {
                stores.searchFiltersStore.filters = [
                    {
                        code: FilterGroupCodes.Destination,
                        name: FilterGroupCodes.Destination,
                        options: [countryFilter],
                    },
                ];
            });

            it('should add all children when selecting a country filter and return true', () => {
                const result = stores.searchFiltersStore.onSelectDestinationFilter(countryFilter);
                const codes = stores.searchFiltersStore.selectedFilters.map(f => f.code);

                expect(codes).toContain('HRDB');
                expect(codes).toContain('HRIR');
                expect(result).toBe(true);
            });

            it('should remove all children when deselecting a country filter and return false', () => {
                stores.searchFiltersStore.selectedFilters = [
                    {
                        code: 'HR',
                        name: 'Croatia',
                        groupCode: FilterGroupCodes.Destination,
                        destinationInfo: { type: DestinationType.Country } as IFilterDestinationInfo,
                    },
                    {
                        code: 'HRDB',
                        name: 'Dubrovnik',
                        groupCode: FilterGroupCodes.Destination,
                        destinationInfo: { type: DestinationType.Region } as IFilterDestinationInfo,
                    },
                    {
                        code: 'HRIR',
                        name: 'Istrian Riviera',
                        groupCode: FilterGroupCodes.Destination,
                        destinationInfo: { type: DestinationType.Region } as IFilterDestinationInfo,
                    },
                ];
                stores.searchFiltersStore.presetDestinationFilter = jest.fn();

                const result = stores.searchFiltersStore.onSelectDestinationFilter(countryFilter);

                expect(stores.searchFiltersStore.selectedFilters).toHaveLength(0);
                expect(result).toBe(false);
            });
        });

        describe('region', () => {
            const regionFilter: IFilterOption = {
                code: 'HRDB',
                name: 'Dubrovnik',
                count: 1,
                groupCode: FilterGroupCodes.Destination,
                destinationInfo: { type: DestinationType.Region } as IFilterDestinationInfo,
            };

            beforeEach(() => {
                stores.searchFiltersStore.filters = [
                    { code: FilterGroupCodes.Destination, name: FilterGroupCodes.Destination, options: [regionFilter] },
                ];
            });

            it('should add a leaf region filter and return true', () => {
                const result = stores.searchFiltersStore.onSelectDestinationFilter(regionFilter);

                expect(stores.searchFiltersStore.selectedFilters.map(f => f.code)).toContain('HRDB');
                expect(result).toBe(true);
            });

            it('should remove a leaf region filter and return false', () => {
                stores.searchFiltersStore.selectedFilters = [
                    {
                        code: 'HRDB',
                        name: 'Dubrovnik',
                        groupCode: FilterGroupCodes.Destination,
                        destinationInfo: { type: DestinationType.Region } as IFilterDestinationInfo,
                    },
                ];
                stores.searchFiltersStore.presetDestinationFilter = jest.fn();

                const result = stores.searchFiltersStore.onSelectDestinationFilter(regionFilter);

                expect(stores.searchFiltersStore.selectedFilters.find(f => f.code === 'HRDB')).toBeUndefined();
                expect(result).toBe(false);
            });

            it('should call presetDestinationFilter when no destinations remain after deselect', () => {
                stores.searchFiltersStore.selectedFilters = [
                    { code: 'HRDB', name: 'Dubrovnik', groupCode: FilterGroupCodes.Destination },
                ];
                stores.searchFiltersStore.presetDestinationFilter = jest.fn();

                stores.searchFiltersStore.onSelectDestinationFilter(regionFilter);

                expect(stores.searchFiltersStore.presetDestinationFilter).toHaveBeenCalled();
            });
        });

        describe('virtual region', () => {
            const virtualRegionFilter: IFilterOption = {
                code: 'VAND',
                name: 'Andalucia',
                count: 2,
                groupCode: FilterGroupCodes.Destination,
                destinationInfo: {
                    type: DestinationType.VirtualRegion,
                    relatedRegions: ['ESAL', 'ESCD'],
                } as IFilterDestinationInfo,
            };
            const parentCountry: IFilterOption = {
                code: 'ES',
                name: 'Spain',
                count: 3,
                groupCode: FilterGroupCodes.Destination,
                destinationInfo: { type: DestinationType.Country } as IFilterDestinationInfo,
                children: [
                    {
                        code: 'ESAL',
                        name: 'Almeria',
                        count: 1,
                        groupCode: FilterGroupCodes.Destination,
                        destinationInfo: { type: DestinationType.Region } as IFilterDestinationInfo,
                    },
                    {
                        code: 'ESCD',
                        name: 'Cadiz',
                        count: 1,
                        groupCode: FilterGroupCodes.Destination,
                        destinationInfo: { type: DestinationType.Region } as IFilterDestinationInfo,
                    },
                    virtualRegionFilter,
                ],
            };

            beforeEach(() => {
                stores.searchFiltersStore.filters = [
                    {
                        code: FilterGroupCodes.Destination,
                        name: FilterGroupCodes.Destination,
                        options: [parentCountry],
                    },
                ];
            });

            it('should add related regions when selecting a VirtualRegion filter', () => {
                stores.searchFiltersStore.onSelectDestinationFilter(virtualRegionFilter);

                const codes = stores.searchFiltersStore.selectedFilters.map(f => f.code);
                expect(codes).toContain('ESAL');
                expect(codes).toContain('ESCD');
            });

            it('should remove related regions when deselecting a VirtualRegion filter', () => {
                stores.searchFiltersStore.selectedFilters = [
                    {
                        code: 'VAND',
                        name: 'Andalucia',
                        groupCode: FilterGroupCodes.Destination,
                        destinationInfo: {
                            type: DestinationType.VirtualRegion,
                            relatedRegions: ['ESAL', 'ESCD'],
                        } as IFilterDestinationInfo,
                    },
                    {
                        code: 'ESAL',
                        name: 'Almeria',
                        groupCode: FilterGroupCodes.Destination,
                        destinationInfo: { type: DestinationType.Region } as IFilterDestinationInfo,
                    },
                    {
                        code: 'ESCD',
                        name: 'Cadiz',
                        groupCode: FilterGroupCodes.Destination,
                        destinationInfo: { type: DestinationType.Region } as IFilterDestinationInfo,
                    },
                ];
                stores.searchFiltersStore.presetDestinationFilter = jest.fn();

                stores.searchFiltersStore.onSelectDestinationFilter(virtualRegionFilter);

                const codes = stores.searchFiltersStore.selectedFilters.map(f => f.code);
                expect(codes).not.toContain('ESAL');
                expect(codes).not.toContain('ESCD');
            });
        });
    });

    describe('onSelectRadioFilter', () => {
        const mockTripAdvisorFilter: IFilterOption = {
            code: '4',
            name: '4 and up',
            groupCode: FilterGroupCodes.TripAdvisorRating,
            count: 10,
        };

        it('should add filter when no TripAdvisorRating filter is currently selected', () => {
            const store = new SearchFilterStore(rootStore);
            store.selectedFilters = [];

            store.onSelectRadioFilter(mockTripAdvisorFilter);

            expect(store.selectedFilters).toHaveLength(1);
            expect(store.selectedFilters[0]).toEqual({
                code: mockTripAdvisorFilter.code,
                name: mockTripAdvisorFilter.name,
                groupCode: mockTripAdvisorFilter.groupCode,
                preChecked: undefined,
                destinationInfo: undefined,
                isExclusive: undefined,
            });
        });

        it('should replace the existing TripAdvisorRating filter when a filter is already selected', () => {
            const store = new SearchFilterStore(rootStore);
            store.selectedFilters = [
                {
                    code: '3',
                    name: '3 and up',
                    groupCode: FilterGroupCodes.TripAdvisorRating,
                },
            ];

            store.onSelectRadioFilter(mockTripAdvisorFilter);

            expect(store.selectedFilters).toHaveLength(1);
            expect(store.selectedFilters[0]).toEqual({
                code: mockTripAdvisorFilter.code,
                name: mockTripAdvisorFilter.name,
                groupCode: mockTripAdvisorFilter.groupCode,
                preChecked: undefined,
                destinationInfo: undefined,
                isExclusive: undefined,
            });
        });
    });

    describe('onSelectThemeFilter', () => {
        const parentFilter: IFilterOption = {
            code: 'P',
            name: 'Parent',
            count: 2,
            groupCode: FilterGroupCodes.PackageTheme,
            children: [
                { code: 'PA', name: 'Child A', count: 1, groupCode: FilterGroupCodes.PackageTheme },
                { code: 'PB', name: 'Child B', count: 1, groupCode: FilterGroupCodes.PackageTheme },
            ],
        };

        let store;

        beforeEach(() => {
            rootStore = { layoutStore: { isPromoPage: false } };
            store = new SearchFilterStore(rootStore);
            store.filters = [
                {
                    code: FilterGroupCodes.PackageTheme,
                    name: FilterGroupCodes.PackageTheme,
                    options: [parentFilter],
                },
            ];
            store.selectedFilters = [];
        });

        it('should deselect filter and return false when filter is already selected', () => {
            store.selectedFilters = [{ code: 'PA', name: 'Child A', groupCode: FilterGroupCodes.PackageTheme }];

            const result = store.onSelectThemeFilter(parentFilter.children![0]);

            expect(result).toBe(false);
            expect(store.selectedFilters).toHaveLength(0);
        });

        it('should select filter and return true when filter is not selected and parent is not selected', () => {
            const result = store.onSelectThemeFilter(parentFilter.children![0]);

            expect(result).toBe(true);
            expect(store.selectedFilters).toHaveLength(1);
            expect(store.selectedFilters[0].code).toBe('PA');
        });

        it('should deselect parent, select siblings when parent is selected and return false', () => {
            store.selectedFilters = [{ code: 'P', name: 'Parent', groupCode: FilterGroupCodes.PackageTheme }];

            const result = store.onSelectThemeFilter(parentFilter.children![0]);

            expect(result).toBe(false);
            expect(store.selectedFilters.find(f => f.code === 'P')).toBeUndefined();
            expect(store.selectedFilters.find(f => f.code === 'PB')).toBeDefined();
            expect(store.selectedFilters.find(f => f.code === 'PA')).toBeUndefined();
        });

        it('should select parent filter when selecting last child completes parent count and return true', () => {
            store.selectedFilters = [{ code: 'PA', name: 'Child A', groupCode: FilterGroupCodes.PackageTheme }];

            const result = store.onSelectThemeFilter(parentFilter.children![1]);

            expect(result).toBe(true);
            expect(store.selectedFilters).toHaveLength(1);
            expect(store.selectedFilters[0].code).toBe('P');
        });

        it('should deselect children when selecting parent directly and return true', () => {
            store.filters = [
                {
                    code: FilterGroupCodes.PackageTheme,
                    name: FilterGroupCodes.PackageTheme,
                    options: [
                        {
                            code: 'Q',
                            name: 'Parent Q',
                            count: 3,
                            groupCode: FilterGroupCodes.PackageTheme,
                            children: [
                                { code: 'QA', name: 'Child QA', count: 1, groupCode: FilterGroupCodes.PackageTheme },
                            ],
                        },
                    ],
                },
            ];
            store.selectedFilters = [{ code: 'QA', name: 'Child QA', groupCode: FilterGroupCodes.PackageTheme }];

            const parent = store.filters[0].options[0];
            const result = store.onSelectThemeFilter(parent);

            expect(result).toBe(true);
            expect(store.selectedFilters.find(f => f.code === 'Q')).toBeDefined();
            expect(store.selectedFilters.find(f => f.code === 'QA')).toBeUndefined();
        });

        it('should not add sibling when isPromoPage is true and sibling is not enabled on promo page', () => {
            rootStore = {
                layoutStore: { isPromoPage: true },
                promoPageStore: {
                    isPackageThemeEnabledOnPromoPage: jest.fn((code: string) => code === 'PB'),
                },
            };
            store = new SearchFilterStore(rootStore);
            store.filters = [
                {
                    code: FilterGroupCodes.PackageTheme,
                    name: FilterGroupCodes.PackageTheme,
                    options: [
                        {
                            ...parentFilter,
                            children: [
                                { code: 'PA', name: 'Child A', count: 1, groupCode: FilterGroupCodes.PackageTheme },
                                { code: 'PB', name: 'Child B', count: 1, groupCode: FilterGroupCodes.PackageTheme },
                                { code: 'PC', name: 'Child C', count: 1, groupCode: FilterGroupCodes.PackageTheme },
                            ],
                        },
                    ],
                },
            ];
            store.selectedFilters = [{ code: 'P', name: 'Parent', groupCode: FilterGroupCodes.PackageTheme }];

            store.onSelectThemeFilter({
                code: 'PA',
                name: 'Child A',
                count: 1,
                groupCode: FilterGroupCodes.PackageTheme,
            });

            expect(store.selectedFilters.find(f => f.code === 'PB')).toBeDefined();
            expect(store.selectedFilters.find(f => f.code === 'PC')).toBeUndefined();
        });
    });

    describe('onSelectBoardsFilter', () => {
        const halfBoardFilter: IFilterOption = {
            code: 'HB',
            name: 'Half Board',
            count: 3,
            groupCode: FilterGroupCodes.BoardType,
        };

        const setupStore = (boardOptions: IFilterOption[] = []) => {
            const store = new SearchFilterStore({ layoutStore: { isPromoPage: false } } as any);
            store.filters = [
                {
                    code: FilterGroupCodes.BoardType,
                    name: FilterGroupCodes.BoardType,
                    options: boardOptions,
                },
            ];
            store.selectedFilters = [];

            return store;
        };

        it('should add filter and return true when filter is not selected', () => {
            const store = setupStore([halfBoardFilter]);

            const result = store.onSelectBoardsFilter(halfBoardFilter);

            expect(result).toBe(true);
            expect(store.selectedFilters).toHaveLength(1);
            expect(store.selectedFilters[0].code).toBe('HB');
        });

        it('should remove filter and return false when filter is already selected', () => {
            const store = setupStore([halfBoardFilter]);
            store.selectedFilters = [{ code: 'HB', name: 'Half Board', groupCode: FilterGroupCodes.BoardType }];

            const result = store.onSelectBoardsFilter(halfBoardFilter);

            expect(result).toBe(false);
            expect(store.selectedFilters).toHaveLength(0);
        });

        it('should add filters from the same boardGroup when selecting', () => {
            const groupMember: IFilterOption = {
                code: 'HBP',
                name: 'Half Board Plus',
                count: 1,
                groupCode: FilterGroupCodes.BoardType,
                boardGroup: { code: 'HB', name: 'Half Board' } as any,
            };
            const store = setupStore([halfBoardFilter, groupMember]);

            store.onSelectBoardsFilter(halfBoardFilter);

            const codes = store.selectedFilters.map(f => f.code);
            expect(codes).toContain('HB');
            expect(codes).toContain('HBP');
        });

        it('should remove filters from the same boardGroup when deselecting', () => {
            const groupMember: IFilterOption = {
                code: 'HBP',
                name: 'Half Board Plus',
                count: 1,
                groupCode: FilterGroupCodes.BoardType,
                boardGroup: { code: 'HB', name: 'Half Board' } as any,
            };
            const store = setupStore([halfBoardFilter, groupMember]);
            store.selectedFilters = [
                { code: 'HB', name: 'Half Board', groupCode: FilterGroupCodes.BoardType },
                { code: 'HBP', name: 'Half Board Plus', groupCode: FilterGroupCodes.BoardType },
            ];

            store.onSelectBoardsFilter(halfBoardFilter);

            expect(store.selectedFilters).toHaveLength(0);
        });

        it('should add children of selected filter when selecting', () => {
            const parentBoard: IFilterOption = {
                code: 'BB',
                name: 'Bed & Breakfast',
                count: 2,
                groupCode: FilterGroupCodes.BoardType,
                children: [
                    { code: 'BB1', name: 'BB Variant 1', count: 1, groupCode: FilterGroupCodes.BoardType },
                    { code: 'BB2', name: 'BB Variant 2', count: 1, groupCode: FilterGroupCodes.BoardType },
                ],
            };
            const store = setupStore([parentBoard, ...(parentBoard.children || [])]);

            store.onSelectBoardsFilter(parentBoard);

            const codes = store.selectedFilters.map(f => f.code);
            expect(codes).toContain('BB');
            expect(codes).toContain('BB1');
            expect(codes).toContain('BB2');
        });

        it('should remove children when deselecting filter with children', () => {
            const parentBoard: IFilterOption = {
                code: 'BB',
                name: 'Bed & Breakfast',
                count: 2,
                groupCode: FilterGroupCodes.BoardType,
                children: [
                    { code: 'BB1', name: 'BB Variant 1', count: 1, groupCode: FilterGroupCodes.BoardType },
                    { code: 'BB2', name: 'BB Variant 2', count: 1, groupCode: FilterGroupCodes.BoardType },
                ],
            };
            const store = setupStore([parentBoard, ...(parentBoard.children || [])]);
            store.selectedFilters = [
                { code: 'BB', name: 'Bed & Breakfast', groupCode: FilterGroupCodes.BoardType },
                { code: 'BB1', name: 'BB Variant 1', groupCode: FilterGroupCodes.BoardType },
                { code: 'BB2', name: 'BB Variant 2', groupCode: FilterGroupCodes.BoardType },
            ];

            store.onSelectBoardsFilter(parentBoard);

            expect(store.selectedFilters).toHaveLength(0);
        });
    });

    describe('hideAllFilter', () => {
        it('should select selectedFilterGroups when hide is true', () => {
            const stores = createHolidaysAppStores();

            stores.searchFiltersStore.selectedFilterGroups = new Set([
                FilterGroupCodes.Duration,
                FilterGroupCodes.Flights,
            ]);
            stores.searchFiltersStore.onSelectGroup = jest.fn();

            stores.searchFiltersStore.hideAllFilter(true, []);

            expect(stores.searchFiltersStore.onSelectGroup).toHaveBeenCalledTimes(
                stores.searchFiltersStore.selectedFilterGroups.size,
            );
        });

        it('should select availableFilters when hide is false', () => {
            const stores = createHolidaysAppStores();

            stores.searchFiltersStore.selectedFilterGroups = new Set([
                FilterGroupCodes.Duration,
                FilterGroupCodes.Flights,
            ]);
            stores.searchFiltersStore.onSelectGroup = jest.fn();

            const availableFilters = [
                { code: FilterGroupCodes.Facilities },
                { code: FilterGroupCodes.FlightDuration },
            ] as IFilters[];

            stores.searchFiltersStore.hideAllFilter(false, availableFilters);

            expect(stores.searchFiltersStore.onSelectGroup).toHaveBeenCalledTimes(
                stores.searchFiltersStore.selectedFilterGroups.size,
            );
        });
    });

    describe('onSelectGroup', () => {
        it('should delete item when selectedFilterGroups has code', () => {
            const stores = createHolidaysAppStores();

            stores.searchFiltersStore.selectedFilterGroups = new Set([FilterGroupCodes.Duration]);

            stores.searchFiltersStore.onSelectGroup(FilterGroupCodes.Duration);

            expect(stores.searchFiltersStore.selectedFilterGroups.size).toBe(0);
        });

        it('should add item when selectedFilterGroups has NOT code', () => {
            const stores = createHolidaysAppStores();

            stores.searchFiltersStore.selectedFilterGroups = new Set();

            stores.searchFiltersStore.onSelectGroup(FilterGroupCodes.Duration);

            expect(stores.searchFiltersStore.selectedFilterGroups.size).toBe(1);
            expect(stores.searchFiltersStore.selectedFilterGroups.has(FilterGroupCodes.Duration)).toBe(true);
        });
    });

    describe('areFiltersCollapsed', () => {
        const stores = createHolidaysAppStores();

        it('should be true when numberOfHotels <= MIN_TOTAL_ITEMS', () => {
            stores.rootStore.hotelsStore.numberOfHotels = 1;

            expect(stores.searchFiltersStore.areFiltersCollapsed).toBe(true);
        });

        it('should be false when numberOfHotels > MIN_TOTAL_ITEMS', () => {
            stores.rootStore.hotelsStore.numberOfHotels = 10;

            expect(stores.searchFiltersStore.areFiltersCollapsed).toBe(false);
        });
    });

    describe('isFilterActive', () => {
        it('should return true when countableFilters is NOT empty', () => {
            const store = new SearchFilterStore(rootStore);

            jest.spyOn(store, 'countableFilters', 'get').mockReturnValue([{} as ISelectedFilter]);

            expect(store.isFilterActive).toBe(true);
        });

        it('should return false when countableFilters is empty', () => {
            const store = new SearchFilterStore(rootStore);

            jest.spyOn(store, 'countableFilters', 'get').mockReturnValue([]);

            expect(store.isFilterActive).toBe(false);
        });
    });

    describe('setFlightDurationValue', () => {
        let store;

        beforeEach(() => {
            rootStore = {
                trackingStore: { trackSearchFiltersUpdate: jest.fn() },
                layoutStore: { getPhrase: jest.fn(p => p) },
            };
            store = new SearchFilterStore(rootStore);
        });

        it('should change flightDuration values and NOT call trackSearchFiltersUpdate when needToTrack is false', () => {
            expect(store.flightDurationFrom).toBe(MIN_FLIGHT_DURATION);
            expect(store.flightDurationTo).toBe(MAX_FLIGHT_DURATION);

            store.setFlightDurationValue([2, 3]);

            expect(store.flightDurationFrom).toBe(2);
            expect(store.flightDurationTo).toBe(3);
            expect(store.rootStore.trackingStore.trackSearchFiltersUpdate).not.toHaveBeenCalled();
        });

        it('should call trackSearchFiltersUpdate when needToTrack is true', () => {
            jest.spyOn(store, 'flightDurationFilterLabelForTracking', 'get').mockReturnValue(
                'From {from} hour(s) to {to} hours 3,5',
            );
            store.setFlightDurationValue([3, 5], true);

            expect(store.rootStore.trackingStore.trackSearchFiltersUpdate).toHaveBeenCalledWith(true, {
                groupCode: FilterGroupCodes.FlightDuration,
                name: 'From {from} hour(s) to {to} hours 3,5',
            });
        });

        it('should call trackSearchFiltersUpdate when needToTrack is true with empty name when flightDurationFilterLabelForTracking is NOT provided', () => {
            store.setFlightDurationValue([MIN_FLIGHT_DURATION, MAX_FLIGHT_DURATION], true);

            expect(store.rootStore.trackingStore.trackSearchFiltersUpdate).toHaveBeenCalledWith(true, {
                groupCode: FilterGroupCodes.FlightDuration,
                name: '',
            });
        });
    });

    describe('clearFlightDurationValue', () => {
        let store;

        beforeEach(() => {
            rootStore = {
                trackingStore: { trackSearchFiltersUpdate: jest.fn() },
                layoutStore: { getPhrase: jest.fn(p => p) },
            };
            store = new SearchFilterStore(rootStore);
            jest.spyOn(store, 'flightDurationFilterLabelForTracking', 'get').mockReturnValue(
                'From {from} hour(s) to {to} hours 2,3',
            );
        });

        it('should set flightDuration values to default and NOT call trackSearchFiltersUpdate when needToTrack is false', () => {
            store.flightDurationFrom = 2;
            store.flightDurationTo = 3;

            expect(store.flightDurationFrom).toBe(2);
            expect(store.flightDurationTo).toBe(3);

            store.clearFlightDurationValue();

            expect(store.flightDurationFrom).toBe(MIN_FLIGHT_DURATION);
            expect(store.flightDurationTo).toBe(MAX_FLIGHT_DURATION);
            expect(store.rootStore.trackingStore.trackSearchFiltersUpdate).not.toHaveBeenCalled();
        });

        it('should call trackSearchFiltersUpdate when needToTrack is true', () => {
            store.flightDurationFrom = 2;
            store.flightDurationTo = 3;

            store.clearFlightDurationValue(true);

            expect(store.rootStore.trackingStore.trackSearchFiltersUpdate).toHaveBeenCalledWith(false, {
                groupCode: FilterGroupCodes.FlightDuration,
                name: 'From {from} hour(s) to {to} hours 2,3',
            });
        });

        it('should call trackSearchFiltersUpdate with empty string when flightDurationFilterLabelForTracking is empty', () => {
            jest.spyOn(store, 'flightDurationFilterLabelForTracking', 'get').mockReturnValue('');
            store.clearFlightDurationValue(true);

            expect(store.rootStore.trackingStore.trackSearchFiltersUpdate).toHaveBeenCalledWith(false, {
                groupCode: FilterGroupCodes.FlightDuration,
                name: '',
            });
        });
    });

    describe('flightDurationFilterLabelForTracking', () => {
        it('should return label with flightDurationFrom and flightDurationTo when they are not default values', () => {
            const store = new SearchFilterStore(rootStore);
            store.flightDurationFrom = 2;
            store.flightDurationTo = 3;

            store.flightDurationFilterLabelForTracking;

            expect(mockGetRangeFilterTrackingValue).toHaveBeenCalledWith(
                '2',
                '3',
                RangeFilterTrackingUnits.Hour,
                RangeFilterTrackingUnits.Hours,
                true,
            );
        });

        it('should return null when flightDurationFrom and flightDurationTo are min and max values', () => {
            const store = new SearchFilterStore(rootStore);
            store.flightDurationFrom = MIN_FLIGHT_DURATION;
            store.flightDurationTo = MAX_FLIGHT_DURATION;

            expect(store.flightDurationFilterLabelForTracking).toBeNull();
        });
    });

    describe('filterGroups', () => {
        it('should exclude PromoCollection in all cases', () => {
            const groups = [{ code: FilterGroupCodes.Flights }, { code: FilterGroupCodes.Destination }];

            const store = new SearchFilterStore(rootStore);

            store.filters = [...groups, { code: FilterGroupCodes.PromoCollection }] as IFilters[];

            expect(store.filterGroups).toStrictEqual(groups);
        });

        it('should include TripAdvisorRating when it is the only rating filter present', () => {
            const store = new SearchFilterStore(rootStore);

            store.filters = [{ code: FilterGroupCodes.TripAdvisorRating }] as IFilters[];

            expect(store.filterGroups).toStrictEqual([{ code: FilterGroupCodes.TripAdvisorRating }]);
        });

        it('should include StarRating when it is the only rating filter present', () => {
            const store = new SearchFilterStore(rootStore);

            store.filters = [{ code: FilterGroupCodes.StarRating }] as IFilters[];

            expect(store.filterGroups).toStrictEqual([{ code: FilterGroupCodes.StarRating }]);
        });

        it('should keep StarRating and exclude TripAdvisorRating when StarRating appears first', () => {
            const store = new SearchFilterStore(rootStore);

            store.filters = [
                { code: FilterGroupCodes.StarRating },
                { code: FilterGroupCodes.TripAdvisorRating },
            ] as IFilters[];

            expect(store.filterGroups).toStrictEqual([{ code: FilterGroupCodes.StarRating }]);
        });

        it('should keep TripAdvisorRating and exclude StarRating when TripAdvisorRating appears first', () => {
            const store = new SearchFilterStore(rootStore);

            store.filters = [
                { code: FilterGroupCodes.TripAdvisorRating },
                { code: FilterGroupCodes.StarRating },
            ] as IFilters[];

            expect(store.filterGroups).toStrictEqual([{ code: FilterGroupCodes.TripAdvisorRating }]);
        });
    });

    describe('filterData', () => {
        it('should return data based on filters', () => {
            const groups = [{ code: FilterGroupCodes.Flights }, { code: FilterGroupCodes.Destination }];

            const store = new SearchFilterStore(rootStore);

            store.filters = groups as IFilters[];

            expect(store.filterData).toStrictEqual(new Map(groups.map(item => [item.code, item])));
        });
    });

    describe('loadContent', () => {
        it('should call getOffers when isMapModalDisplayed is true', () => {
            const store = new SearchFilterStore(rootStore);

            store.isMapModalDisplayed = true;

            store.loadContent();

            expect(store.rootStore.hotelsStore.getFilteredHotels).toHaveBeenCalledTimes(1);
        });

        it('should call defaultLoadResults when isMapModalDisplayed is false', () => {
            const store = new SearchFilterStore(rootStore);

            store.loadContent();

            expect(store.rootStore.hotelsStore.defaultLoadResults).toHaveBeenCalledTimes(1);
        });

        it('should call updateSearchParamsAndExecuteSearch(false) when isDynamicPromoPage is true', () => {
            rootStore.layoutStore.isDynamicPromoPage = true;

            const store = new SearchFilterStore(rootStore);

            store.loadContent();

            expect(store.rootStore.promoPageStore.updateSearchParamsAndExecuteSearch).toHaveBeenCalledWith(false);
            expect(store.rootStore.hotelsStore.defaultLoadResults).not.toHaveBeenCalled();
        });
    });

    describe('onApply', () => {
        it('should call clearIsClickBackToSearch and defaultLoadResults', () => {
            const store = new SearchFilterStore(rootStore);

            store.loadContent = jest.fn();

            store.onApply();

            expect(store.rootStore.routerStore.clearIsClickBackToSearch).toHaveBeenCalledTimes(1);
            expect(store.loadContent).toHaveBeenCalledTimes(1);
        });
    });

    describe('onClearAll', () => {
        it('should call some actions when isMapModalDisplayed is true', () => {
            const store = new SearchFilterStore(rootStore);

            store.isMapModalDisplayed = true;

            store.onClearAllSelectedFilters = jest.fn();
            store.rootStore.hotelsStore.getFilteredHotels = jest.fn();

            store.onClearAll();

            expect(store.onClearAllSelectedFilters).toHaveBeenCalledWith(true);
            expect(store.rootStore.hotelsStore.getFilteredHotels).toHaveBeenCalledTimes(1);
        });

        it('should call updateSearchParamsAndExecuteSearch(false) and exit early when isDynamicPromoPage is true', () => {
            rootStore.layoutStore.isDynamicPromoPage = true;
            const store = new SearchFilterStore(rootStore);

            store.onClearAllSelectedFilters = jest.fn();
            store.rootStore.searchStore.setPageNumber = jest.fn();

            store.onClearAll();

            expect(store.rootStore.promoPageStore.updateSearchParamsAndExecuteSearch).toHaveBeenCalledWith(false);
            expect(store.onClearAllSelectedFilters).toHaveBeenCalled();
            expect(store.rootStore.searchStore.setPageNumber).toHaveBeenCalledWith(1);
            expect(store.rootStore.hotelsStore.getFilteredHotels).not.toHaveBeenCalled();
            expect(store.rootStore.hotelsStore.defaultLoadResults).not.toHaveBeenCalled();
        });

        it('should call some actions when isMapModalDisplayed is false', () => {
            const store = new SearchFilterStore(rootStore);

            store.onClearAllSelectedFilters = jest.fn();
            store.changeIsPresetDestinationFilter = jest.fn();
            store.rootStore.routerStore.clearIsClickBackToSearch = jest.fn();
            store.rootStore.hotelsStore.defaultLoadResults = jest.fn();

            store.onClearAll();

            expect(store.onClearAllSelectedFilters).toHaveBeenCalledWith(true);
            expect(store.rootStore.routerStore.clearIsClickBackToSearch).toHaveBeenCalledTimes(1);
            expect(store.changeIsPresetDestinationFilter).toHaveBeenCalledWith(false);
            expect(store.rootStore.hotelsStore.defaultLoadResults).toHaveBeenCalledTimes(1);
        });
    });

    describe('onClear', () => {
        it('should call onRemoveFilterGroup and loadResults', () => {
            const store = new SearchFilterStore(rootStore);

            store.onRemoveFilterGroup = jest.fn();
            store.loadContent = jest.fn();

            store.onClear(FilterGroupCodes.Offers);

            expect(store.onRemoveFilterGroup).toHaveBeenCalledWith(FilterGroupCodes.Offers);
            expect(store.loadContent).toHaveBeenCalledTimes(1);
        });
    });

    describe('onChange', () => {
        it('should call onSelectFilters and onApply', () => {
            const store = new SearchFilterStore(rootStore);

            store.onSelectFilters = jest.fn();
            store.onApply = jest.fn();

            store.onChange(availableFilters[0].options[0]);

            expect(store.onSelectFilters).toHaveBeenCalledWith(availableFilters[0].options[0], true, undefined);
            expect(store.onApply).toHaveBeenCalledTimes(1);
        });

        it("should call onSelectFilters with quickFilterType when it's passed", () => {
            const store = new SearchFilterStore(rootStore);
            const mockQuickFilterType = FilterGroupCodes.Recommended;

            store.onSelectFilters = jest.fn();
            store.onApply = jest.fn();

            store.onChange(availableFilters[0].options[0], mockQuickFilterType);

            expect(store.onSelectFilters).toHaveBeenCalledWith(
                availableFilters[0].options[0],
                true,
                mockQuickFilterType,
            );
        });

        it('should call resetDestinationsFromUrl when user unselect destination from url on promo page', () => {
            const store = new SearchFilterStore({
                layoutStore: { isPromoPage: true, isPreviewMode: false },
                promoPageStore: { destinationFromUrl: availableFilters[0].options[0].code },
            } as TRootStore);
            jest.spyOn(store, 'allDestinationFilters', 'get').mockReturnValue(availableFilters[0].options);

            store.rootStore.promoPageStore.resetDestinationsFromUrl = jest.fn();
            store.onSelectFilters = jest.fn();
            store.onApply = jest.fn();

            store.onChange(availableFilters[0].options[0]);

            expect(store.rootStore.promoPageStore.resetDestinationsFromUrl).toHaveBeenCalled();
        });

        it('should call resetDestinationsFromUrl when user unselect children destination from url on promo page', () => {
            const store = new SearchFilterStore({
                layoutStore: { isPromoPage: true, isPreviewMode: false },
                promoPageStore: { destinationFromUrl: availableFilters[0].options[0].code },
            } as TRootStore);
            jest.spyOn(store, 'allDestinationFilters', 'get').mockReturnValue(availableFilters[0].options);

            store.rootStore.promoPageStore.resetDestinationsFromUrl = jest.fn();
            store.onSelectFilters = jest.fn();
            store.onApply = jest.fn();

            store.onChange(availableFilters[0].options[0].children![0]);

            expect(store.rootStore.promoPageStore.resetDestinationsFromUrl).toHaveBeenCalled();
        });
    });

    describe('onTitleClick', () => {
        it('should return void when group is undefined', () => {
            const store = new SearchFilterStore(rootStore);

            jest.spyOn(store, 'filterData', 'get').mockReturnValue(new Map());
            store.isFilterGroupDisabled = jest.fn(() => false);
            store.onSelectGroup = jest.fn();

            store.onTitleClick(FilterGroupCodes.Flights);

            expect(store.onSelectGroup).not.toHaveBeenCalled();
        });

        it('should call onSelectGroup when group is NOT disabled', () => {
            const store = new SearchFilterStore(rootStore);

            jest.spyOn(store, 'filterData', 'get').mockReturnValue(
                new Map([[FilterGroupCodes.Flights, { code: FilterGroupCodes.Flights } as IFilters]]),
            );
            store.isFilterGroupDisabled = jest.fn(() => false);
            store.onSelectGroup = jest.fn();

            store.onTitleClick(FilterGroupCodes.Flights);

            expect(store.onSelectGroup).toHaveBeenCalledWith(FilterGroupCodes.Flights);
        });

        it('should do nothing when group is disabled', () => {
            const store = new SearchFilterStore(rootStore);

            jest.spyOn(store, 'filterData', 'get').mockReturnValue(
                new Map([[FilterGroupCodes.Flights, { code: FilterGroupCodes.Flights } as IFilters]]),
            );
            store.isFilterGroupDisabled = jest.fn(() => true);
            store.onSelectGroup = jest.fn();

            store.onTitleClick(FilterGroupCodes.Flights);

            expect(store.onSelectGroup).not.toHaveBeenCalled();
        });
    });

    describe('onChangeSearchFilterStore', () => {
        it('should set data', () => {
            const store = new SearchFilterStore(rootStore);

            store.isMapModalDisplayed = false;

            store.onChangeSearchFilterStore({ key: 'isMapModalDisplayed', value: true });

            expect(store.isMapModalDisplayed).toBe(true);
        });

        it('should set multiple data', () => {
            const store = new SearchFilterStore(rootStore);

            store.isMapModalDisplayed = false;
            store.filtersChanged = false;
            store.isModalDisplayed = false;

            store.onChangeSearchFilterStore({
                cb: ctx => {
                    ctx.isMapModalDisplayed = true;
                    ctx.filtersChanged = true;
                    ctx.isModalDisplayed = true;
                },
            });

            expect(store.isMapModalDisplayed).toBe(true);
            expect(store.filtersChanged).toBe(true);
            expect(store.isModalDisplayed).toBe(true);
        });

        it('should NOT set data when key is NOT existed', () => {
            const store = new SearchFilterStore(rootStore);

            store.onChangeSearchFilterStore({ key: 'no_key', value: 'new_value' });

            expect(store['no_key']).toBeUndefined();
        });
    });

    describe('getGroupContent', () => {
        it('should return group options', () => {
            const store = new SearchFilterStore(rootStore);

            const duration = { options: [{}] } as IFilters;

            jest.spyOn(store, 'filterData', 'get').mockReturnValue(new Map([[FilterGroupCodes.Duration, duration]]));

            const options = store.getGroupContent(FilterGroupCodes.Duration);

            expect(options).toStrictEqual(duration.options);
        });

        it('should return empty array when group is undefined', () => {
            const store = new SearchFilterStore(rootStore);

            jest.spyOn(store, 'filterData', 'get').mockReturnValue(new Map());

            const options = store.getGroupContent(FilterGroupCodes.Duration);

            expect(options).toStrictEqual([]);
        });
    });

    describe('isOptionDisabled', () => {
        it('should return true when count is 0', () => {
            const store = new SearchFilterStore(rootStore);

            const result = store.isOptionDisabled(0, FilterGroupCodes.Duration);

            expect(result).toBe(true);
        });

        it('should return false when count is NOT 0', () => {
            const store = new SearchFilterStore(rootStore);

            const result = store.isOptionDisabled(1, FilterGroupCodes.Duration);

            expect(result).toBe(false);
        });

        it('should call isExclusiveFilterDisabled when code is HotelTypes and option is provided', () => {
            const store = new SearchFilterStore(rootStore);

            const result = store.isOptionDisabled(1, FilterGroupCodes.HotelTypes, {} as IFilterOption);

            expect(result).toBe(false);
            expect(mockIsExclusiveFilterDisabled).toHaveBeenCalledWith({}, store.selectedFilters);
        });

        it('should NOT call isExclusiveFilterDisabled when code is HotelTypes and option is NOT provided', () => {
            const store = new SearchFilterStore(rootStore);

            store.isOptionDisabled(1, FilterGroupCodes.HotelTypes);

            expect(mockIsExclusiveFilterDisabled).not.toHaveBeenCalled();
        });

        it('should return true for Flights when only 1 option in group content', () => {
            const store = new SearchFilterStore(rootStore);
            store.getGroupContent = jest.fn(() => [{}] as IFilterOption[]);

            const result = store.isOptionDisabled(1, FilterGroupCodes.Flights);

            expect(result).toBe(true);
        });

        it('should return true for Flights when only 1 option is available in group content', () => {
            const store = new SearchFilterStore(rootStore);
            store.getGroupContent = jest.fn(() => [{ count: 0 }, { count: 1 }] as IFilterOption[]);

            const result = store.isOptionDisabled(1, FilterGroupCodes.Flights);

            expect(result).toBe(true);
        });

        it('should return true for Flights when count passed to isOptionDisabled is 0', () => {
            const store = new SearchFilterStore(rootStore);
            store.getGroupContent = jest.fn(() => [{ count: 0 }, { count: 0 }] as IFilterOption[]);

            const result = store.isOptionDisabled(0, FilterGroupCodes.Flights);

            expect(result).toBe(true);
        });

        it('should return false for Flights when more than 1 option is available in group content', () => {
            const store = new SearchFilterStore(rootStore);
            store.getGroupContent = jest.fn(() => [{ count: 1 }, { count: 1 }] as IFilterOption[]);

            const result = store.isOptionDisabled(1, FilterGroupCodes.Flights);

            expect(result).toBe(false);
        });

        it('should return true for Flights on Promo pages when count is 0', () => {
            rootStore.layoutStore.isPromoPage = true;

            const store = new SearchFilterStore(rootStore);
            store.getGroupContent = jest.fn(() => [{ count: 1 }, { count: 1 }] as IFilterOption[]);

            const result = store.isOptionDisabled(0, FilterGroupCodes.Flights);

            expect(result).toBe(true);
        });

        it('should return false for Flights on Promo pages when count is 1', () => {
            rootStore.layoutStore.isPromoPage = true;

            const store = new SearchFilterStore(rootStore);
            store.getGroupContent = jest.fn(() => [{}] as IFilterOption[]);

            const result = store.isOptionDisabled(1, FilterGroupCodes.Flights);

            expect(result).toBe(false);
        });
    });

    describe('getPreparedGroupContent', () => {
        it('should return content', () => {
            const store = new SearchFilterStore(rootStore);

            store.getGroupContent = jest.fn(() => [{}] as IFilterOption[]);

            const result = store.getPreparedGroupContent(FilterGroupCodes.Duration);

            expect(result).toStrictEqual([{}]);
        });

        it('should return content from HotelTypes and PromoCollection when code is HotelTypes', () => {
            const store = new SearchFilterStore(rootStore);

            store.getGroupContent = jest.fn(() => [{}, {}] as IFilterOption[]);

            const result = store.getPreparedGroupContent(FilterGroupCodes.HotelTypes);

            expect(result).toStrictEqual([{}, {}, {}, {}]);
            expect(store.getGroupContent).toHaveBeenNthCalledWith(1, FilterGroupCodes.HotelTypes);
            expect(store.getGroupContent).toHaveBeenNthCalledWith(2, FilterGroupCodes.PromoCollection);
        });
    });

    describe('isLastSelectDestination', () => {
        let option;

        beforeEach(() => {
            option = {
                code: 'code1',
                count: 1,
                destinationInfo: {
                    type: DestinationType.Region,
                    relatedRegions: ['code2', 'code3'],
                } as IFilterDestinationInfo,
                groupCode: FilterGroupCodes.Destination,
            };
        });

        it('should return true if option.count is falsy', () => {
            option.count = 0;

            const store = new SearchFilterStore(rootStore);

            const result = store.isLastSelectDestination(option);

            expect(result).toBe(true);
        });

        it('should return false if isPromoPage is true', () => {
            rootStore.layoutStore.isPromoPage = true;

            const store = new SearchFilterStore(rootStore);

            const result = store.isLastSelectDestination(option);

            expect(result).toBe(false);
        });
    });

    describe('selectDestinationFilterFromUrl', () => {
        let store;

        it('should NOT call resetDestinationsFromUrl when selectedNumberOfNights is less than 1', () => {
            rootStore = {
                trackingStore: { trackSearchFiltersUpdate: jest.fn() },
                layoutStore: { isPromoPage: true },
                promoPageStore: { resetDestinationsFromUrl: jest.fn(), destinationFromUrl: 'destinationFromUrl' },
                searchStore: { searchWhen: { selectedNumberOfNights: 0 } },
            };
            store = new SearchFilterStore(rootStore);
            store.checkIsFilterSelected = jest.fn();
            store.onSelectDestinationFilter = jest.fn();

            store.selectDestinationFilterFromUrl();

            expect(store.rootStore.promoPageStore.resetDestinationsFromUrl).not.toHaveBeenCalled();
        });

        it('should call resetDestinationsFromUrl when selectedNumberOfNights is more than 0', () => {
            rootStore = {
                trackingStore: { trackSearchFiltersUpdate: jest.fn() },
                layoutStore: { isPromoPage: true },
                promoPageStore: { resetDestinationsFromUrl: jest.fn(), destinationFromUrl: 'destinationFromUrl' },
                searchStore: { searchWhen: { selectedNumberOfNights: 2 } },
            };
            store = new SearchFilterStore(rootStore);
            store.checkIsFilterSelected = jest.fn();
            store.onSelectDestinationFilter = jest.fn();

            store.selectDestinationFilterFromUrl();

            expect(store.rootStore.promoPageStore.resetDestinationsFromUrl).toHaveBeenCalled();
        });

        describe('areFiltersSelected', () => {
            it('should return true when there are selected filters', () => {
                const store = new SearchFilterStore(rootStore);

                store.selectedFilters = [mockFlightSelectedFilter];
                expect(store.areFiltersSelected).toBe(true);
            });

            it('should return false when there are no selected filters', () => {
                const store = new SearchFilterStore(rootStore);
                store.selectedFilters = [];

                expect(store.areFiltersSelected).toBe(false);
            });

            it('should return true when there are selected filters with different group codes', () => {
                const store = new SearchFilterStore(rootStore);
                store.selectedFilters = [
                    mockFlightSelectedFilter,
                    {
                        ...mockFlightSelectedFilter,
                        groupCode: FilterGroupCodes.Facilities,
                    },
                ];

                expect(store.areFiltersSelected).toBe(true);
            });

            it('should return true when filterPriceFrom is changed', () => {
                const store = new SearchFilterStore(rootStore);
                store.filterPriceFrom = 100;
                store.selectedFilters = [];

                expect(store.areFiltersSelected).toBe(true);
            });

            it('should return true when filterPriceTo is changed', () => {
                const store = new SearchFilterStore(rootStore);
                store.filterPriceTo = 50;
                store.selectedFilters = [];

                expect(store.areFiltersSelected).toBe(true);
            });

            it('should return true when filterPriceFrom and filterPriceTo are changed', () => {
                const store = new SearchFilterStore(rootStore);
                store.filterPriceFrom = 0;
                store.filterPriceTo = 0;
                store.selectedFilters = [];

                expect(store.areFiltersSelected).toBe(true);
            });

            it('should return true when filterPriceTo, filterPriceTo and selectedFilters are changed', () => {
                const store = new SearchFilterStore(rootStore);
                store.filterPriceTo = 50;
                store.filterPriceFrom = 100;
                store.selectedFilters = [mockFlightSelectedFilter];

                expect(store.areFiltersSelected).toBe(true);
            });
        });
    });

    describe('getWeatherFilter', () => {
        let store;
        const weatherFilter = {
            options: [
                {
                    maxTemp: 20,
                    minTemp: 10,
                },
            ],
            code: FilterGroupCodes.Weather,
            name: FilterGroupCodes.Weather,
        } as IFilters;

        beforeEach(() => {
            rootStore = { hotelsStore: { hasHotels: true } };
            store = new SearchFilterStore(rootStore);
            store.setMinAvailableTemp = jest.fn();
            store.setMaxAvailableTemp = jest.fn();
        });

        it('should be null when weatherFilter is NOT provided', () => {
            expect(store['getWeatherFilter'](null)).toBe(null);
        });

        it('should return filter with min and max temps', () => {
            expect(store['getWeatherFilter'](weatherFilter)).toStrictEqual({
                options: [
                    {
                        code: WEATHER_FILTER_CODE,
                        name: `${FilterGroupCodes.Weather}_FilterName`,
                        count: 0,
                        maxTemp: 20,
                        minTemp: 10,
                    },
                ] as IFilterOption[],
                code: FilterGroupCodes.Weather,
                name: FilterGroupCodes.Weather,
            });
            expect(store.setMinAvailableTemp).toHaveBeenCalledWith(10);
            expect(store.setMaxAvailableTemp).toHaveBeenCalledWith(20);
        });

        it('should return filter without min and max temps when option is NOT provided', () => {
            weatherFilter.options = [{} as IFilterOption];

            expect(store['getWeatherFilter'](weatherFilter)).toStrictEqual({
                options: [
                    {
                        code: WEATHER_FILTER_CODE,
                        name: `${FilterGroupCodes.Weather}_FilterName`,
                        count: 0,
                        maxTemp: null,
                        minTemp: null,
                    },
                ],
                code: FilterGroupCodes.Weather,
                name: FilterGroupCodes.Weather,
            });
            expect(store.setMinAvailableTemp).toHaveBeenCalledWith(null);
            expect(store.setMaxAvailableTemp).toHaveBeenCalledWith(null);
        });

        it('should be weatherFilter when weatherFilter has no options', () => {
            weatherFilter.options = [];

            expect(store['getWeatherFilter'](weatherFilter)).toBe(weatherFilter);
        });
    });

    describe('setWeatherValue', () => {
        let store;

        beforeEach(() => {
            rootStore = { trackingStore: { trackSearchFiltersUpdate: jest.fn() } };
            store = new SearchFilterStore(rootStore);
            jest.spyOn(store, 'weatherFilterLabelForTracking', 'get').mockReturnValue(
                'From {minTemp}°C to {maxTemp}°C 10,20',
            );
        });

        it('should set weatherValue and NOT call trackSearchFiltersUpdate when needToTrack is false', () => {
            expect(store.weatherFrom).toBe(null);
            expect(store.weatherTo).toBe(null);

            store.setWeatherValue([10, 20]);

            expect(store.weatherFrom).toBe(10);
            expect(store.weatherTo).toBe(20);
        });

        it('should call trackSearchFiltersUpdate with label when needToTrack is true', () => {
            store.setWeatherValue([10, 20], true);

            expect(store.rootStore.trackingStore.trackSearchFiltersUpdate).toHaveBeenCalledWith(true, {
                groupCode: FilterGroupCodes.Weather,
                name: 'From {minTemp}°C to {maxTemp}°C 10,20',
            });
        });
    });

    describe('setMinAvailableTemp', () => {
        it('should set minAvailableTemp', () => {
            const store = new SearchFilterStore(rootStore);

            expect(store.minAvailableTemp).toBe(null);

            store.setMinAvailableTemp(10);

            expect(store.minAvailableTemp).toStrictEqual(10);
        });
    });

    describe('setMaxAvailableTemp', () => {
        it('should set maxAvailableTemp', () => {
            const store = new SearchFilterStore(rootStore);

            expect(store.maxAvailableTemp).toBe(null);

            store.setMaxAvailableTemp(10);

            expect(store.maxAvailableTemp).toStrictEqual(10);
        });
    });

    describe('clearWeatherValue', () => {
        let store;

        beforeEach(() => {
            rootStore = { trackingStore: { trackSearchFiltersUpdate: jest.fn() } };
            store = new SearchFilterStore(rootStore);
            store.weatherFrom = 10;
            store.weatherTo = 20;
            jest.spyOn(store, 'weatherFilterLabelForTracking', 'get').mockReturnValue(
                'From {minTemp}°C to {maxTemp}°C 10,20',
            );
        });

        it('should set weatherValue to null', () => {
            expect(store.weatherFrom).toBe(10);
            expect(store.weatherTo).toBe(20);

            store.clearWeatherValue();

            expect(store.weatherFrom).toBe(null);
            expect(store.weatherTo).toBe(null);
        });

        it('should call trackSearchFiltersUpdate with label when needToTrack is true', () => {
            store.clearWeatherValue(true);

            expect(store.rootStore.trackingStore.trackSearchFiltersUpdate).toHaveBeenCalledWith(false, {
                groupCode: FilterGroupCodes.Weather,
                name: 'From {minTemp}°C to {maxTemp}°C 10,20',
            });
        });
    });

    describe('clearFlightNumberValues', () => {
        let store;

        beforeEach(() => {
            store = new SearchFilterStore(rootStore);
            store.inboundFlightNumberFromUrl = 'EZY0001';
            store.outboundFlightNumberFromUrl = 'EZY0002';
        });

        it('should set inboundFlightNumberFromUrl and outboundFlightNumberFromUrl to null', () => {
            expect(store.inboundFlightNumberFromUrl).toBe('EZY0001');
            expect(store.outboundFlightNumberFromUrl).toBe('EZY0002');
            expect(store.inboundFlightNumber).toBe('EZY0001');
            expect(store.outboundFlightNumber).toBe('EZY0002');

            store.clearFlightNumberValues();

            expect(store.inboundFlightNumberFromUrl).toBe(null);
            expect(store.outboundFlightNumberFromUrl).toBe(null);
            expect(store.inboundFlightNumber).toBe(undefined);
            expect(store.outboundFlightNumber).toBe(undefined);
        });
    });

    describe('weatherFilter', () => {
        let store;

        beforeEach(() => {
            store = new SearchFilterStore(rootStore);
        });

        it('should find weather filter when filter has options', () => {
            store.filters = [{ code: FilterGroupCodes.Weather, options: [{}] }];

            expect(store.weatherFilter).toBe(store.filters[0]);
        });

        it('should be undefined when filter has 0 options', () => {
            store.filters = [{ code: FilterGroupCodes.Weather, options: [] }];

            expect(store.weatherFilter).toBe(undefined);
        });

        it('should be undefined when weather filter is NOT in filters', () => {
            store.filters = [{ code: FilterGroupCodes.Date, options: [{}] }];

            expect(store.weatherFilter).toBe(undefined);
        });
    });

    describe('weatherFilterLabel', () => {
        let store;

        beforeEach(() => {
            store = new SearchFilterStore(rootStore);
            store.weatherTo = 30;
            store.weatherFrom = 10;
            jest.spyOn(store, 'minAvailableTemp', 'get').mockReturnValue(1);
            jest.spyOn(store, 'maxAvailableTemp', 'get').mockReturnValue(40);
        });

        it('should be empty string when weatherTo and weatherFrom are null', () => {
            store.weatherTo = null;
            store.weatherFrom = null;

            expect(store.weatherFilterLabel).toBe('');
        });

        it('should be string with weatherTo and minAvailableTemp when weatherFrom is null', () => {
            store.weatherFrom = null;

            expect(store.weatherFilterLabel).toBe(`${SitecoreDictionary.SearchPodFiltersLabelsWeatherFromTo} 1,30`);
        });

        it('should be string with weatherTo and 0 when weatherFrom and minAvailableTemp are null', () => {
            store.weatherFrom = null;
            jest.spyOn(store, 'minAvailableTemp', 'get').mockReturnValue(null);

            expect(store.weatherFilterLabel).toBe(`${SitecoreDictionary.SearchPodFiltersLabelsWeatherFromTo} 0,30`);
        });

        it('should be string with weatherFrom and maxAvailableTemp when weatherTo is null', () => {
            store.weatherTo = null;

            expect(store.weatherFilterLabel).toBe(`${SitecoreDictionary.SearchPodFiltersLabelsWeatherFromTo} 10,40`);
        });

        it('should be string with weatherFrom and 0 when weatherTo and maxAvailableTemp are null', () => {
            store.weatherTo = null;
            jest.spyOn(store, 'maxAvailableTemp', 'get').mockReturnValue(null);

            expect(store.weatherFilterLabel).toBe(`${SitecoreDictionary.SearchPodFiltersLabelsWeatherFromTo} 10,0`);
        });
    });

    describe('weatherFilterLabelForTracking', () => {
        let store;

        beforeEach(() => {
            store = new SearchFilterStore(rootStore);
            store.weatherTo = 30;
            store.weatherFrom = 10;
            jest.spyOn(store, 'minAvailableTemp', 'get').mockReturnValue(1);
            jest.spyOn(store, 'maxAvailableTemp', 'get').mockReturnValue(40);
        });

        it('should be empty string when weatherTo and weatherFrom are null', () => {
            store.weatherTo = null;
            store.weatherFrom = null;

            expect(store.weatherFilterLabelForTracking).toBe('');
        });

        it('should call getRangeFilterTrackingValue with weatherTo and minAvailableTemp when weatherFrom is null', () => {
            store.weatherFrom = null;

            store.weatherFilterLabelForTracking;

            expect(mockGetRangeFilterTrackingValue).toHaveBeenCalledWith('1', '30', RangeFilterTrackingUnits.Celsius);
        });

        it('should call getRangeFilterTrackingValue with weatherTo and 0 when weatherFrom and minAvailableTemp are null', () => {
            store.weatherFrom = null;
            jest.spyOn(store, 'minAvailableTemp', 'get').mockReturnValue(null);

            store.weatherFilterLabelForTracking;

            expect(mockGetRangeFilterTrackingValue).toHaveBeenCalledWith('0', '30', RangeFilterTrackingUnits.Celsius);
        });

        it('should call getRangeFilterTrackingValue with weatherFrom and maxAvailableTemp when weatherTo is null', () => {
            store.weatherTo = null;

            store.weatherFilterLabelForTracking;

            expect(mockGetRangeFilterTrackingValue).toHaveBeenCalledWith('10', '40', RangeFilterTrackingUnits.Celsius);
        });

        it('should call getRangeFilterTrackingValue with weatherFrom and 0 when weatherTo and maxAvailableTemp are null', () => {
            store.weatherTo = null;
            jest.spyOn(store, 'maxAvailableTemp', 'get').mockReturnValue(null);

            store.weatherFilterLabelForTracking;

            expect(mockGetRangeFilterTrackingValue).toHaveBeenCalledWith('10', '0', RangeFilterTrackingUnits.Celsius);
        });
    });

    describe('onRemoveFilterGroup', () => {
        let store;

        beforeEach(() => {
            store = new SearchFilterStore(rootStore);
            store.clearPriceFiltersValue = jest.fn();
            store.clearFlightDurationValue = jest.fn();
            store.clearWeatherValue = jest.fn();
            store.selectedFilters = [
                { groupCode: FilterGroupCodes.InboundDepartureTime },
                { groupCode: FilterGroupCodes.OutboundDepartureTime },
                { groupCode: FilterGroupCodes.StarRating },
                { groupCode: FilterGroupCodes.TripAdvisorRating },
                { groupCode: FilterGroupCodes.HotelTypes },
                { groupCode: FilterGroupCodes.PromoCollection },
                { groupCode: FilterGroupCodes.BoardType },
            ];
        });

        it('should call clearPriceFiltersValue when group code is PriceRange', () => {
            store.onRemoveFilterGroup(FilterGroupCodes.PriceRange);

            expect(store.clearPriceFiltersValue).toHaveBeenCalled();
        });

        it('should call clearFlightDurationValue when group code is FlightDuration', () => {
            store.onRemoveFilterGroup(FilterGroupCodes.FlightDuration);

            expect(store.clearFlightDurationValue).toHaveBeenCalled();
        });

        it('should call clearWeatherValue when group code is Weather', () => {
            store.onRemoveFilterGroup(FilterGroupCodes.Weather);

            expect(store.clearWeatherValue).toHaveBeenCalled();
        });

        it('should remove InboundDepartureTime and OutboundDepartureTime from selected filters when group code is FlightTimes', () => {
            store.onRemoveFilterGroup(FilterGroupCodes.FlightTimes);

            expect(store.selectedFilters).toStrictEqual([
                { groupCode: FilterGroupCodes.StarRating },
                { groupCode: FilterGroupCodes.TripAdvisorRating },
                { groupCode: FilterGroupCodes.HotelTypes },
                { groupCode: FilterGroupCodes.PromoCollection },
                { groupCode: FilterGroupCodes.BoardType },
            ]);
        });

        it('should remove StarRating and TripAdvisorRating from selected filters when group code is StarRating', () => {
            store.onRemoveFilterGroup(FilterGroupCodes.StarRating);

            expect(store.selectedFilters).toStrictEqual([
                { groupCode: FilterGroupCodes.InboundDepartureTime },
                { groupCode: FilterGroupCodes.OutboundDepartureTime },
                { groupCode: FilterGroupCodes.HotelTypes },
                { groupCode: FilterGroupCodes.PromoCollection },
                { groupCode: FilterGroupCodes.BoardType },
            ]);
        });

        it('should remove StarRating and TripAdvisorRating from selected filters when group code is TripAdvisorRating', () => {
            store.onRemoveFilterGroup(FilterGroupCodes.TripAdvisorRating);

            expect(store.selectedFilters).toStrictEqual([
                { groupCode: FilterGroupCodes.InboundDepartureTime },
                { groupCode: FilterGroupCodes.OutboundDepartureTime },
                { groupCode: FilterGroupCodes.HotelTypes },
                { groupCode: FilterGroupCodes.PromoCollection },
                { groupCode: FilterGroupCodes.BoardType },
            ]);
        });

        it('should remove HotelTypes and PromoCollection from selected filters when group code is HotelTypes', () => {
            store.onRemoveFilterGroup(FilterGroupCodes.HotelTypes);

            expect(store.selectedFilters).toStrictEqual([
                { groupCode: FilterGroupCodes.InboundDepartureTime },
                { groupCode: FilterGroupCodes.OutboundDepartureTime },
                { groupCode: FilterGroupCodes.StarRating },
                { groupCode: FilterGroupCodes.TripAdvisorRating },
                { groupCode: FilterGroupCodes.BoardType },
            ]);
        });

        it('should remove BoardType from selected filters when group code is BoardType', () => {
            store.onRemoveFilterGroup(FilterGroupCodes.BoardType);

            expect(store.selectedFilters).toStrictEqual([
                { groupCode: FilterGroupCodes.InboundDepartureTime },
                { groupCode: FilterGroupCodes.OutboundDepartureTime },
                { groupCode: FilterGroupCodes.StarRating },
                { groupCode: FilterGroupCodes.TripAdvisorRating },
                { groupCode: FilterGroupCodes.HotelTypes },
                { groupCode: FilterGroupCodes.PromoCollection },
            ]);
        });

        it('should call resetDestinationsFromUrl when group code is Destination and user is on promo page', () => {
            rootStore.layoutStore.isPromoPage = true;
            rootStore.layoutStore.isPreviewMode = false;
            rootStore.promoPageStore.resetDestinationsFromUrl = jest.fn();
            store = new SearchFilterStore(rootStore);

            store.onRemoveFilterGroup(FilterGroupCodes.Destination);

            expect(store.rootStore.promoPageStore.resetDestinationsFromUrl).toHaveBeenCalled();
        });
    });

    describe('isFilterGroupDisabled', () => {
        let group;
        let store;

        beforeEach(() => {
            store = new SearchFilterStore(rootStore);
            store.rootStore.queryParamsStore = { isReferer: false };
            group = {
                code: FilterGroupCodes.StarRating,
                options: [{ count: 0 }, { count: 10 }],
            };
        });

        it('should return true when isReferer is true and hasOffers is false', () => {
            store.rootStore.queryParamsStore.isReferer = true;
            store.rootStore.hotelsStore.hasStore = false;

            const result = store.isFilterGroupDisabled(group);

            expect(result).toBe(true);
        });

        it('should return true when options are NOT provided', () => {
            group.options = [];

            const result = store.isFilterGroupDisabled(group);

            expect(result).toBe(true);
        });

        it('should return true when group is Destination, numberOfHotels is 0 and isAllFilterGroupItemsSelected is true', () => {
            group.code = FilterGroupCodes.Destination;
            store.rootStore.hotelsStore.numberOfHotels = 0;
            store.isAllFilterGroupItemsSelected = jest.fn().mockReturnValueOnce(true);

            const result = store.isFilterGroupDisabled(group);

            expect(result).toBe(true);
        });

        it('should return false when group is Flights and numberOfHotels is NOT 0', () => {
            group.code = FilterGroupCodes.Flights;
            store.rootStore.hotelsStore.numberOfHotels = 5;
            store.isAllFilterGroupItemsSelected = jest.fn().mockReturnValueOnce(true);

            const result = store.isFilterGroupDisabled(group);

            expect(result).toBe(false);
        });

        it('should call getPreparedGroupContent when group is HotelTypes', () => {
            group.code = FilterGroupCodes.HotelTypes;
            store.getPreparedGroupContent = jest.fn().mockReturnValueOnce([{ count: 0 }, { count: 2 }]);

            const result = store.isFilterGroupDisabled(group);

            expect(store.getPreparedGroupContent).toHaveBeenCalledWith(FilterGroupCodes.HotelTypes);
            expect(result).toBe(false);
        });

        it('should return true when group is BoardType and all counts are 0', () => {
            group.code = FilterGroupCodes.BoardType;
            group.options[1].count = 0;

            const result = store.isFilterGroupDisabled(group);

            expect(result).toBe(true);
        });

        it('should return false when group is BoardType and all counts are NOT 0', () => {
            group.code = FilterGroupCodes.BoardType;

            const result = store.isFilterGroupDisabled(group);

            expect(result).toBe(false);
        });

        it('should return true when group is FlightDuration', () => {
            group.code = FilterGroupCodes.FlightDuration;

            const result = store.isFilterGroupDisabled(group);

            expect(result).toBe(false);
        });

        it('should return false when group is Weather', () => {
            group.code = FilterGroupCodes.Weather;

            const result = store.isFilterGroupDisabled(group);

            expect(result).toBe(false);
        });

        it('should return false when group is PriceRange', () => {
            group.code = FilterGroupCodes.PriceRange;

            const result = store.isFilterGroupDisabled(group);

            expect(result).toBe(false);
        });
    });

    describe('hideClearAllBtn', () => {
        it('should return true when HideClearAllButton.value is true', () => {
            const store = new SearchFilterStore(rootStore);
            store.rootStore.layoutStore.layout.sitecore.route.fields.HideClearAllButton = { value: true };

            expect(store.hideClearAllBtn).toBe(true);
        });

        it('should return false when HideClearAllButton.value is false', () => {
            const store = new SearchFilterStore(rootStore);
            store.rootStore.layoutStore.layout.sitecore.route.fields.HideClearAllButton = { value: false };

            expect(store.hideClearAllBtn).toBe(false);
        });

        it('should return false when HideClearAllButton.value is undefined', () => {
            const store = new SearchFilterStore(rootStore);
            store.rootStore.layoutStore.layout.sitecore.route.fields.HideClearAllButton = { value: undefined };

            expect(store.hideClearAllBtn).toBe(false);
        });

        it('should return false when HideClearAllButton is missing', () => {
            const store = new SearchFilterStore(rootStore);
            store.rootStore.layoutStore.layout.sitecore.route.fields = {};

            expect(store.hideClearAllBtn).toBe(false);
        });

        it('should return false when fields is missing', () => {
            const store = new SearchFilterStore(rootStore);
            store.rootStore.layoutStore.layout.sitecore.route = {} as unknown as ISitecoreLayoutRoute;

            expect(store.hideClearAllBtn).toBe(false);
        });
    });

    describe('Personalized filter ordering', () => {
        const createStoreWithFiltersOrder = (overrides?: any) => {
            const baseConfig = {
                hotelsStore: {
                    numberOfHotels: 100,
                    hasHotels: true,
                },
                layoutStore: {
                    getPhrase: jest.fn(),
                    filtersOrder: [
                        FilterGroupCodes.Offers,
                        FilterGroupCodes.BoardType,
                        FilterGroupCodes.HotelTypes,
                        FilterGroupCodes.Duration,
                        FilterGroupCodes.PriceRange,
                        FilterGroupCodes.FlightDuration,
                        FilterGroupCodes.Weather,
                        FilterGroupCodes.Recommended,
                        FilterGroupCodes.RecentlyUsed,
                    ],
                    isPromoPage: false,
                },
                promoPageStore: {
                    pageThemeTypeCodes: [],
                    isPackageThemeEnabledOnPromoPage: jest.fn(),
                },
                searchStore: {
                    searchTo: { selectedDestinationCodes: ['LULU', 'AS'] },
                    searchWhen: {
                        selectedNumberOfNights: 1,
                    },
                },
            };

            return new SearchFilterStore({
                ...baseConfig,
                ...overrides,
                layoutStore: {
                    ...baseConfig.layoutStore,
                    ...overrides?.layoutStore,
                },
            } as any);
        };

        describe('saveFilters with reorderFilters flag', () => {
            let store: SearchFilterStore;

            beforeEach(() => {
                store = createStoreWithFiltersOrder();
            });

            it('should use CMS order when reorderFilters is false', () => {
                const filters: IFilters[] = [
                    {
                        code: FilterGroupCodes.BoardType,
                        name: FilterGroupCodes.BoardType,
                        options: [
                            { code: 'AI', name: 'All Inclusive', count: 10, groupCode: FilterGroupCodes.BoardType },
                        ],
                    },
                    {
                        code: FilterGroupCodes.HotelTypes,
                        name: FilterGroupCodes.HotelTypes,
                        options: [{ code: 'beach', name: 'Beach', count: 5, groupCode: FilterGroupCodes.HotelTypes }],
                    },
                    {
                        code: FilterGroupCodes.Offers,
                        name: FilterGroupCodes.Offers,
                        options: [
                            { code: 'kidsFree', name: 'Kids Go Free', count: 3, groupCode: FilterGroupCodes.Offers },
                        ],
                    },
                ];

                store.saveFilters(filters, false);

                expect(store.filters.length).toBeGreaterThanOrEqual(3);
                const providedFilters = store.filters.filter(f =>
                    [FilterGroupCodes.Offers, FilterGroupCodes.BoardType, FilterGroupCodes.HotelTypes].includes(f.code),
                );
                expect(providedFilters).toHaveLength(3);
                expect(providedFilters[0].code).toBe(FilterGroupCodes.Offers);
                expect(providedFilters[1].code).toBe(FilterGroupCodes.BoardType);
                expect(providedFilters[2].code).toBe(FilterGroupCodes.HotelTypes);
            });

            it('should use CMS order when reorderFilters is undefined', () => {
                const filters: IFilters[] = [
                    {
                        code: FilterGroupCodes.BoardType,
                        name: FilterGroupCodes.BoardType,
                        options: [
                            { code: 'AI', name: 'All Inclusive', count: 10, groupCode: FilterGroupCodes.BoardType },
                        ],
                    },
                    {
                        code: FilterGroupCodes.HotelTypes,
                        name: FilterGroupCodes.HotelTypes,
                        options: [{ code: 'beach', name: 'Beach', count: 5, groupCode: FilterGroupCodes.HotelTypes }],
                    },
                ];

                store.saveFilters(filters);

                expect(store.filters.length).toBeGreaterThanOrEqual(2);
                const providedFilters = store.filters.filter(f =>
                    [FilterGroupCodes.BoardType, FilterGroupCodes.HotelTypes].includes(f.code),
                );
                expect(providedFilters).toHaveLength(2);
                expect(providedFilters[0].code).toBe(FilterGroupCodes.BoardType);
                expect(providedFilters[1].code).toBe(FilterGroupCodes.HotelTypes);
            });

            it('should use API order when reorderFilters is true', () => {
                const filters: IFilters[] = [
                    {
                        code: FilterGroupCodes.HotelTypes,
                        name: FilterGroupCodes.HotelTypes,
                        options: [{ code: 'beach', name: 'Beach', count: 5, groupCode: FilterGroupCodes.HotelTypes }],
                    },
                    {
                        code: FilterGroupCodes.Offers,
                        name: FilterGroupCodes.Offers,
                        options: [
                            { code: 'kids', name: 'Kids Go Free', count: 10, groupCode: FilterGroupCodes.Offers },
                        ],
                    },
                ];

                store.saveFilters(filters, true);

                expect(store.filters).toHaveLength(2);
                expect(store.filters[0].code).toBe(FilterGroupCodes.HotelTypes);
                expect(store.filters[1].code).toBe(FilterGroupCodes.Offers);
            });

            it('should exclude filters not in API response when reorderFilters is true', () => {
                const filters: IFilters[] = [
                    {
                        code: FilterGroupCodes.HotelTypes,
                        name: FilterGroupCodes.HotelTypes,
                        options: [{ code: 'beach', name: 'Beach', count: 5, groupCode: FilterGroupCodes.HotelTypes }],
                    },
                ];

                store.saveFilters(filters, true);

                expect(store.filters).toHaveLength(1);
                expect(store.filters[0].code).toBe(FilterGroupCodes.HotelTypes);
            });

            it('should exclude duration filter on promo pages when using API order', () => {
                const promoStore = createStoreWithFiltersOrder({
                    layoutStore: {
                        ...store.rootStore.layoutStore,
                        isPromoPage: true,
                    },
                });

                const filters: IFilters[] = [
                    {
                        code: FilterGroupCodes.HotelTypes,
                        name: FilterGroupCodes.HotelTypes,
                        options: [{ code: 'beach', name: 'Beach', count: 5, groupCode: FilterGroupCodes.HotelTypes }],
                    },
                    {
                        code: FilterGroupCodes.Duration,
                        name: FilterGroupCodes.Duration,
                        options: [{ code: '7', name: '7 nights', count: 10, groupCode: FilterGroupCodes.Duration }],
                    },
                ];

                promoStore.saveFilters(filters, true);

                const hasDurationFilter = promoStore.filters.some(
                    f => f.code === FilterGroupCodes.Duration && f.options.length > 0,
                );
                expect(hasDurationFilter).toBe(false);

                const hotelTypesFilter = promoStore.filters.find(f => f.code === FilterGroupCodes.HotelTypes);
                expect(hotelTypesFilter).toBeDefined();
                expect(hotelTypesFilter?.options.length).toBeGreaterThan(0);
            });

            describe('Quick filters handling', () => {
                let mockFilterPillOptions: jest.SpyInstance;

                beforeEach(() => {
                    mockFilterPillOptions = jest.spyOn(filterUtils, 'filterPillOptions');
                });

                afterEach(() => {
                    mockFilterPillOptions.mockRestore();
                });

                it('should exclude RecentlyUsed filter when not on SearchResults page', () => {
                    const notSearchResultsStore = createStoreWithFiltersOrder({
                        layoutStore: {
                            ...store.rootStore.layoutStore,
                            isSearchResultsPage: false,
                        },
                    });

                    const filters: IFilters[] = [
                        {
                            code: FilterGroupCodes.RecentlyUsed,
                            name: FilterGroupCodes.RecentlyUsed,
                            options: [
                                {
                                    code: 'AIR',
                                    name: 'All Inclusive',
                                    count: 5,
                                    groupCode: FilterGroupCodes.StarRating,
                                },
                            ],
                        },
                    ];

                    mockFilterPillOptions.mockReturnValue({
                        code: FilterGroupCodes.RecentlyUsed,
                        name: FilterGroupCodes.RecentlyUsed,
                        options: [
                            {
                                code: 'AIR',
                                name: 'All Inclusive',
                                count: 5,
                                groupCode: FilterGroupCodes.StarRating,
                            },
                        ],
                    } as any);

                    notSearchResultsStore.saveFilters(filters, true);

                    const recentlyUsedFilter = notSearchResultsStore.filters.find(
                        f => f.code === FilterGroupCodes.RecentlyUsed,
                    );
                    expect(recentlyUsedFilter).toBeUndefined();
                    expect(mockFilterPillOptions).not.toHaveBeenCalled();
                });

                it('should include RecentlyUsed filter when on SearchResults page', () => {
                    const searchResultsStore = createStoreWithFiltersOrder({
                        layoutStore: {
                            ...store.rootStore.layoutStore,
                            isSearchResultsPage: true,
                        },
                    });
                    searchResultsStore.recentlyUsedFilterExperimentTestVariant = ExperimentVariants.VariantB;

                    const filters: IFilters[] = [
                        {
                            code: FilterGroupCodes.RecentlyUsed,
                            name: FilterGroupCodes.RecentlyUsed,
                            options: [
                                {
                                    code: 'AI',
                                    name: 'All Inclusive',
                                    count: 5,
                                    groupCode: FilterGroupCodes.BoardType,
                                },
                            ],
                        },
                    ];

                    mockFilterPillOptions.mockReturnValue({
                        code: FilterGroupCodes.RecentlyUsed,
                        name: FilterGroupCodes.RecentlyUsed,
                        options: [
                            {
                                code: 'AI',
                                name: 'All Inclusive',
                                count: 5,
                                groupCode: FilterGroupCodes.BoardType,
                            },
                        ],
                    } as any);

                    searchResultsStore.saveFilters(filters, true);

                    const recentlyUsedFilter = searchResultsStore.filters.find(
                        f => f.code === FilterGroupCodes.RecentlyUsed,
                    );
                    expect(recentlyUsedFilter).toBeDefined();
                    expect(recentlyUsedFilter?.options.length).toBeGreaterThan(0);
                    expect(mockFilterPillOptions).toHaveBeenCalledWith(
                        FilterGroupCodes.RecentlyUsed,
                        expect.any(Object),
                        expect.any(Array),
                        expect.any(Object),
                    );
                });

                it('should exclude quick filter when filterPillOptions returns empty options', () => {
                    const filters: IFilters[] = [
                        {
                            code: FilterGroupCodes.Recommended,
                            name: FilterGroupCodes.Recommended,
                            options: [
                                {
                                    code: 'AI',
                                    name: 'All Inclusive',
                                    count: 5,
                                    filterCode: FilterGroupCodes.BoardType,
                                    groupCode: FilterGroupCodes.Recommended,
                                },
                            ],
                        },
                    ];

                    // Mock filterPillOptions to return no options
                    mockFilterPillOptions.mockReturnValue({
                        code: FilterGroupCodes.Recommended,
                        name: FilterGroupCodes.Recommended,
                        options: [],
                    } as any);

                    store.recommendedFilterExperimentTestVariant = ExperimentVariants.VariantB;

                    store.saveFilters(filters, true);

                    const recommendedFilter = store.filters.find(f => f.code === FilterGroupCodes.Recommended);
                    expect(recommendedFilter).toBeUndefined();
                });

                it('should include quick filter when filterPillOptions returns options', () => {
                    const filters: IFilters[] = [
                        {
                            code: FilterGroupCodes.Recommended,
                            name: FilterGroupCodes.Recommended,
                            options: [
                                {
                                    code: 'AI',
                                    name: 'All Inclusive',
                                    count: 5,
                                    filterCode: FilterGroupCodes.BoardType,
                                    groupCode: FilterGroupCodes.Recommended,
                                },
                            ],
                        },
                    ];

                    mockFilterPillOptions.mockReturnValue({
                        code: FilterGroupCodes.Recommended,
                        name: FilterGroupCodes.Recommended,
                        options: [
                            {
                                code: 'AI',
                                name: 'All Inclusive',
                                count: 5,
                                groupCode: FilterGroupCodes.BoardType,
                            },
                        ],
                    } as any);

                    store.recommendedFilterExperimentTestVariant = ExperimentVariants.VariantB;
                    store.saveFilters(filters, true);

                    const recommendedFilter = store.filters.find(f => f.code === FilterGroupCodes.Recommended);
                    expect(recommendedFilter).toBeDefined();
                    expect(recommendedFilter?.options.length).toBeGreaterThan(0);
                });

                it('should include Recommended filter regardless of page type', () => {
                    const filters: IFilters[] = [
                        {
                            code: FilterGroupCodes.Recommended,
                            name: FilterGroupCodes.Recommended,
                            options: [
                                {
                                    code: 'AI',
                                    name: 'All Inclusive',
                                    count: 5,
                                    filterCode: FilterGroupCodes.BoardType,
                                    groupCode: FilterGroupCodes.Recommended,
                                },
                            ],
                        },
                    ];

                    mockFilterPillOptions.mockReturnValue({
                        code: FilterGroupCodes.Recommended,
                        name: FilterGroupCodes.Recommended,
                        options: [
                            {
                                code: 'AI',
                                name: 'All Inclusive',
                                count: 5,
                                groupCode: FilterGroupCodes.BoardType,
                            },
                        ],
                    } as any);

                    store.recommendedFilterExperimentTestVariant = ExperimentVariants.VariantB;
                    store.saveFilters(filters, true);

                    const recommendedFilter = store.filters.find(f => f.code === FilterGroupCodes.Recommended);
                    expect(recommendedFilter).toBeDefined();
                    expect(recommendedFilter?.options.length).toBeGreaterThan(0);
                });

                it('should call filterPillOptions with correct parameters', () => {
                    const filters: IFilters[] = [
                        {
                            code: FilterGroupCodes.Recommended,
                            name: FilterGroupCodes.Recommended,
                            options: [
                                {
                                    code: 'AI',
                                    name: 'All Inclusive',
                                    count: 5,
                                    filterCode: FilterGroupCodes.BoardType,
                                    groupCode: FilterGroupCodes.Recommended,
                                },
                            ],
                        },
                    ];

                    mockFilterPillOptions.mockReturnValue({
                        code: FilterGroupCodes.Recommended,
                        name: FilterGroupCodes.Recommended,
                        options: [
                            {
                                code: 'AI',
                                name: 'All Inclusive',
                                count: 5,
                                groupCode: FilterGroupCodes.BoardType,
                            },
                        ],
                    } as any);

                    store.recommendedFilterExperimentTestVariant = ExperimentVariants.VariantB;
                    store.saveFilters(filters, true);

                    expect(mockFilterPillOptions).toHaveBeenCalledWith(
                        FilterGroupCodes.Recommended,
                        expect.objectContaining({
                            code: FilterGroupCodes.Recommended,
                            name: FilterGroupCodes.Recommended,
                        }),
                        expect.arrayContaining([FilterGroupCodes.Recommended]),
                        expect.any(Object),
                    );
                });
            });
        });
    });

    describe('setGroupCodeToRecommendedOptions', () => {
        let store: SearchFilterStore;

        beforeEach(() => {
            store = new SearchFilterStore(rootStore);
        });

        it('should return empty array when options is undefined', () => {
            const result = store.setGroupCodeToRecommendedOptions(undefined);
            expect(result).toEqual([]);
        });

        it('should return empty array when options is empty', () => {
            const result = store.setGroupCodeToRecommendedOptions([]);
            expect(result).toEqual([]);
        });

        it('should transform FlightTimes children to InboundDepartureTime when name contains Inbound', () => {
            const options: IFilterOption[] = [
                {
                    filterCode: FilterGroupCodes.FlightTimes,
                    code: 'inbound',
                    name: 'Inbound Departure Time',
                    children: [
                        {
                            code: 'morning',
                            name: 'Morning',
                        } as IFilterOption,
                    ],
                } as IFilterOption,
            ];

            const result = store.setGroupCodeToRecommendedOptions(options);
            expect(result).toEqual([
                {
                    code: 'morning',
                    name: 'Morning',
                    groupCode: FilterGroupCodes.InboundDepartureTime,
                },
            ]);
        });

        it('should transform FlightTimes children to OutboundDepartureTime when name does not contain Inbound', () => {
            const options: IFilterOption[] = [
                {
                    filterCode: FilterGroupCodes.FlightTimes,
                    code: 'outbound',
                    name: 'Outbound Departure Time',
                    children: [
                        {
                            code: 'evening',
                            name: 'Evening',
                        } as IFilterOption,
                    ],
                } as IFilterOption,
            ];

            const result = store.setGroupCodeToRecommendedOptions(options);
            expect(result).toEqual([
                {
                    code: 'evening',
                    name: 'Evening',
                    groupCode: FilterGroupCodes.OutboundDepartureTime,
                },
            ]);
        });

        it('should transform PackageTheme children with groupCode set to PackageTheme', () => {
            const options: IFilterOption[] = [
                {
                    filterCode: FilterGroupCodes.PackageTheme,
                    code: 'theme',
                    name: 'Beach',
                    children: [
                        {
                            code: 'BA',
                            name: 'Adults Holiday',
                        } as IFilterOption,
                    ],
                } as IFilterOption,
            ];

            const result = store.setGroupCodeToRecommendedOptions(options);
            expect(result).toEqual([
                {
                    code: 'BA',
                    name: 'Adults Holiday',
                    groupCode: FilterGroupCodes.PackageTheme,
                },
            ]);
        });

        it('should transform Facilities children with groupCode set to Facilities', () => {
            const options: IFilterOption[] = [
                {
                    filterCode: FilterGroupCodes.Facilities,
                    code: 'facilities',
                    name: 'Pool & Beach',
                    children: [
                        {
                            code: '73-360',
                            name: 'Indoor pool',
                        } as IFilterOption,
                    ],
                } as IFilterOption,
            ];

            const result = store.setGroupCodeToRecommendedOptions(options);
            expect(result).toEqual([
                {
                    code: '73-360',
                    name: 'Indoor pool',
                    groupCode: FilterGroupCodes.Facilities,
                },
            ]);
        });

        it('should set groupCode to filterCode for options without children', () => {
            const options: IFilterOption[] = [
                {
                    filterCode: FilterGroupCodes.BoardType,
                    code: 'AI',
                    name: 'All Inclusive',
                } as IFilterOption,
            ];

            const result = store.setGroupCodeToRecommendedOptions(options);
            expect(result).toEqual([
                {
                    code: 'AI',
                    name: 'All Inclusive',
                    groupCode: FilterGroupCodes.BoardType,
                },
            ]);
        });

        it('should handle multiple options with different types', () => {
            const options: IFilterOption[] = [
                {
                    filterCode: FilterGroupCodes.BoardType,
                    code: 'AI',
                    name: 'All Inclusive',
                } as IFilterOption,
                {
                    filterCode: FilterGroupCodes.FlightTimes,
                    code: 'outbound',
                    name: 'Outbound Departure Time',
                    children: [
                        {
                            code: 'morning',
                            name: 'Morning',
                        } as IFilterOption,
                    ],
                } as IFilterOption,
                {
                    filterCode: FilterGroupCodes.PackageTheme,
                    code: 'theme',
                    name: 'Beach',
                    children: [
                        {
                            code: 'BA',
                            name: 'Adults Holiday',
                        } as IFilterOption,
                    ],
                } as IFilterOption,
            ];

            const result = store.setGroupCodeToRecommendedOptions(options);
            expect(result).toEqual([
                {
                    code: 'AI',
                    name: 'All Inclusive',
                    groupCode: FilterGroupCodes.BoardType,
                },
                {
                    code: 'morning',
                    name: 'Morning',
                    groupCode: FilterGroupCodes.OutboundDepartureTime,
                },
                {
                    code: 'BA',
                    name: 'Adults Holiday',
                    groupCode: FilterGroupCodes.PackageTheme,
                },
            ]);
        });
    });

    describe('setRecommendedFilterExperimentTestVariant', () => {
        let store: SearchFilterStore;

        beforeEach(() => {
            store = new SearchFilterStore(rootStore);
        });

        it('should update recommendedFilterExperimentTestVariant value', () => {
            expect(store.recommendedFilterExperimentTestVariant).toBeUndefined();

            store.setRecommendedFilterExperimentTestVariant('value');

            expect(store.recommendedFilterExperimentTestVariant).toBe('value');
        });
    });

    describe('setRecentlyUsedFilterExperimentTestVariant', () => {
        let store: SearchFilterStore;

        beforeEach(() => {
            store = new SearchFilterStore(rootStore);
        });

        it('should update recentlyUsedFilterExperimentTestVariant value', () => {
            expect(store.recentlyUsedFilterExperimentTestVariant).toBeUndefined();

            store.setRecentlyUsedFilterExperimentTestVariant('value');

            expect(store.recentlyUsedFilterExperimentTestVariant).toBe('value');
        });
    });

    describe('hydrateRecentlyUsedFilters', () => {
        let store: SearchFilterStore;

        beforeEach(() => {
            store = new SearchFilterStore(rootStore);
        });

        it('should hydrate recentlyUsedFilters from storage', () => {
            mockGetWebStorageItem = [
                {
                    code: 'code',
                    name: 'name',
                    groupCode: FilterGroupCodes.BoardType,
                    count: 1,
                },
            ];

            store.hydrateRecentlyUsedFilters();

            expect(store.recentlyUsedFilters).toEqual(mockGetWebStorageItem);
        });

        it('should update storage when normalized filters length differs', () => {
            mockGetWebStorageItem = [
                {
                    code: 'code',
                    name: 'name',
                    groupCode: FilterGroupCodes.BoardType,
                    count: 1,
                },
                {
                    code: 'code',
                    name: 'name',
                    groupCode: FilterGroupCodes.BoardType,
                    count: 1,
                },
            ];

            store.hydrateRecentlyUsedFilters();

            expect(mockSetWebStorageItem).toHaveBeenCalledWith(expect.any(String), [mockGetWebStorageItem[0]]);
            expect(store.recentlyUsedFilters).toEqual([mockGetWebStorageItem[0]]);
        });

        it('should not update storage when normalized filters length is the same', () => {
            mockGetWebStorageItem = [
                {
                    code: 'code',
                    name: 'name',
                    groupCode: FilterGroupCodes.BoardType,
                    count: 1,
                },
            ];

            store.hydrateRecentlyUsedFilters();

            expect(mockSetWebStorageItem).not.toHaveBeenCalled();
            expect(store.recentlyUsedFilters).toEqual(mockGetWebStorageItem);
        });

        it('should set empty array when storage is empty', () => {
            mockGetWebStorageItem = [];
            store.hydrateRecentlyUsedFilters();

            expect(store.recentlyUsedFilters).toEqual([]);
        });
    });
});
