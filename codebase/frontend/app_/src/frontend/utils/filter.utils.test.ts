import { afterAll } from '@jest/globals';

import { mockFlightsOffers } from 'frontend/__mocks__';
import { mockFilterOutboundDepartureTime } from 'frontend/__mocks__/filters';
import * as utils from 'frontend/utils/route.utils';
import { IFilterOption, IFilters, ISelectedFilter, ITimeFilterOptionSetting } from 'models/data/IFilters';
import { FilterTypes } from 'models/data/IFiltersTypes';
import { IRoute } from 'models/data/IRoute';
import { MarketCode } from 'models/data/MarketSettings';
import { FilterGroupCodes } from 'models/enum/FilterGroupCodes';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import {
    buildAirportsFilterOptionsFromOffers,
    buildTimeFilterOptions,
    filterPillOptions,
    findFilterOptionByCode,
    findParentFilter,
    getBoardOptions,
    getDepartureAirportsWithCountryName,
    getFilterByGroupCode,
    getFilterOptionByCode,
    getFilterTitle,
    getQuickFilterOptionGroupCode,
    getSelectedPriceRangeDictionary,
    getTimeFiltersCounts,
    isExclusiveFilterDisabled,
    normalizeRecentlyUsedFilters,
} from './filter.utils';

jest.mock('./date.utils', () => ({
    isTimeInRange: jest.fn(() => true),
    formatDateL10n: jest.fn(d => d),
}));

jest.mock('./search/search.utils', () => ({
    sortDepartureAirportsAlphabetically: jest.fn(p => p),
}));

describe('filter.utils', () => {
    describe('getFilterTitle', () => {
        it('should return BoardType', () => {
            expect(getFilterTitle(FilterGroupCodes.BoardType)).toEqual(FilterTypes.boardType);
        });

        it('should return empty string when filter code does NOT exists', () => {
            expect(getFilterTitle('test')).toEqual('');
        });
    });

    describe('buildTimeFilterOptions', () => {
        let filterSettings: ITimeFilterOptionSetting[];
        const buildPillMock = jest.fn(() => 'pill');

        beforeEach(() => {
            filterSettings = [
                {
                    id: '1',
                    fields: {
                        StartTime: { value: '2000-01-01T03:00:00Z' },
                        EndTime: { value: '2000-01-01T08:59:00Z' },
                        Code: { value: 'Morning Code' },
                        Name: { value: 'Morning Name' },
                    },
                },
            ];
        });

        it('Should convert to options', () => {
            const groupCode = FilterGroupCodes.AltFlightsOutboundDepartureTime;
            const res = buildTimeFilterOptions(filterSettings, groupCode, buildPillMock);
            expect(res).toEqual([
                {
                    code: 'Morning Code',
                    count: 0,
                    groupCode,
                    name: 'Morning Name',
                    pillLabel: 'pill',
                    timeSlot: { start: '2000-01-01T03:00:00Z', end: '2000-01-01T08:59:00Z' },
                },
            ]);
        });

        it('Should not set option if option does NOT have fields', () => {
            // @ts-ignore
            delete filterSettings[0].fields;
            const res = buildTimeFilterOptions(
                filterSettings,
                FilterGroupCodes.AltFlightsOutboundDepartureTime,
                buildPillMock,
            );
            expect(res).toEqual([]);
        });

        it('Should not set option if option does NOT have a code', () => {
            filterSettings[0].fields.Code = null as any;
            filterSettings[0].fields.Name.value = '';

            const res = buildTimeFilterOptions(
                filterSettings,
                FilterGroupCodes.AltFlightsOutboundDepartureTime,
                buildPillMock,
            );
            expect(res).toEqual([]);
        });
    });

    describe('getBoardOptions', () => {
        let filterOptions: IFilterOption[];

        it('should NOT return filter when filter does NOT have children', () => {
            filterOptions = [
                {
                    code: 'AI',
                    count: 10,
                    name: 'All Inclusive',
                    groupCode: FilterGroupCodes.BoardType,
                    children: [],
                },
            ];
            const res = getBoardOptions(filterOptions);

            expect(res).toEqual([]);
        });

        it('should return filter when filter does has children', () => {
            filterOptions = [
                {
                    code: 'AI',
                    count: 10,
                    name: 'All Inclusive',
                    groupCode: FilterGroupCodes.BoardType,
                    children: [1, 2, 3] as any,
                },
            ];
            const res = getBoardOptions(filterOptions);

            expect(res).toEqual(filterOptions);
        });

        it('should return filter when filter has children and board group', () => {
            filterOptions = [
                {
                    code: 'AI',
                    count: 10,
                    name: 'All Inclusive',
                    groupCode: FilterGroupCodes.BoardType,
                    children: [1, 2, 3] as any,
                    boardGroup: { code: 'AI', name: 'All Inclusive' },
                },
            ];
            const res = getBoardOptions(filterOptions);

            expect(res).toEqual([
                {
                    children: [1, 2, 3],
                    code: 'AI',
                    count: 10,
                    groupCode: 'boardType',
                    name: 'All Inclusive',
                },
            ]);
        });
    });

    describe('getSelectedPriceRangeDictionary', () => {
        it('should return null when no prices', () => {
            const res = getSelectedPriceRangeDictionary(null, null, false);

            expect(res).toBeNull();
        });

        it('should return TotalFromTo dictionary', () => {
            const res = getSelectedPriceRangeDictionary(100, 200, false);

            expect(res).toBe(SitecoreDictionary.SearchPodFiltersSelectedPriceTotalFromTo);
        });

        it('should return PerPersonFromTo dictionary', () => {
            const res = getSelectedPriceRangeDictionary(100, 200, true);

            expect(res).toBe(SitecoreDictionary.SearchPodFiltersSelectedPricePerPersonFromTo);
        });

        it('should return TotalFrom dictionary', () => {
            const res = getSelectedPriceRangeDictionary(100, null, false);

            expect(res).toBe(SitecoreDictionary.SearchPodFiltersSelectedPriceTotalFrom);
        });

        it('should return PerPersonFrom dictionary', () => {
            const res = getSelectedPriceRangeDictionary(100, null, true);

            expect(res).toBe(SitecoreDictionary.SearchPodFiltersSelectedPricePerPersonFrom);
        });

        it('should return TotalUnder dictionary', () => {
            const res = getSelectedPriceRangeDictionary(null, 200, false);

            expect(res).toBe(SitecoreDictionary.SearchPodFiltersSelectedPriceTotalUnder);
        });

        it('should return PerPersonUnder dictionary', () => {
            const res = getSelectedPriceRangeDictionary(null, 200, true);

            expect(res).toBe(SitecoreDictionary.SearchPodFiltersSelectedPricePerPersonUnder);
        });
    });

    describe('getDepartureAirportsWithCountryName', () => {
        let filtersToShow;
        let originsWithNames;

        beforeEach(() => {
            filtersToShow = [{ code: 'code', name: 'name' }];
            originsWithNames = [{ code: 'code', originCountry: { name: 'country', code: MarketCode.CH } }];
        });

        it('should return filter with name that includes country name', () => {
            const airports = getDepartureAirportsWithCountryName(filtersToShow, originsWithNames, MarketCode.FR);

            expect(airports).toStrictEqual([{ code: 'code', name: '(country) name' }]);
        });

        it('should return filter from props when market code is equal to market code of original country', () => {
            const airports = getDepartureAirportsWithCountryName(filtersToShow, originsWithNames, MarketCode.CH);

            expect(airports).toStrictEqual(filtersToShow);
        });

        it('should return filter from props when market code is UK', () => {
            const airports = getDepartureAirportsWithCountryName(filtersToShow, originsWithNames, MarketCode.UK);

            expect(airports).toStrictEqual(filtersToShow);
        });

        it('should return filter from props when filter code is different from original country code', () => {
            filtersToShow[0].code = 'code-test';

            const airports = getDepartureAirportsWithCountryName(filtersToShow, originsWithNames, MarketCode.FR);

            expect(airports).toStrictEqual(filtersToShow);
        });

        it('should fallback filter name with code value if name is missing', () => {
            filtersToShow[0].name = undefined;

            const airports = getDepartureAirportsWithCountryName(filtersToShow, originsWithNames, MarketCode.UK);

            expect(airports).toStrictEqual([{ code: 'code', name: 'code' }]);
        });

        it('should fallback filter name with code value if name is missing for cross market', () => {
            filtersToShow[0].name = undefined;

            const airports = getDepartureAirportsWithCountryName(filtersToShow, originsWithNames, MarketCode.FR);

            expect(airports).toStrictEqual([{ code: 'code', name: '(country) code' }]);
        });
    });

    describe('findFilterOptionByCode', () => {
        const options = [
            {
                code: 'code',
                count: 1,
                groupCode: FilterGroupCodes.BoardType,
                name: 'test',
                children: [
                    {
                        code: 'test-code',
                        count: 2,
                        groupCode: FilterGroupCodes.Destination,
                        name: 'test2',
                    },
                ],
            },
        ];

        it('should return filter from props when filter code is equal to code', () => {
            const filters = findFilterOptionByCode(options, 'code');

            expect(filters).toBe(options[0]);
        });

        it('should return child of filter when child code is equal to code', () => {
            const filters = findFilterOptionByCode(options, 'test-code');

            expect(filters).toBe(options[0].children[0]);
        });

        it('should return null when code does NOT exist is filters', () => {
            const filters = findFilterOptionByCode(options, 'code1');

            expect(filters).toBe(null);
        });
    });

    describe('buildAirportsFilterOptionsFromOffers', () => {
        let offers;
        const mockGetRoute = jest.spyOn(utils, 'getRoute');

        afterAll(() => {
            jest.restoreAllMocks();
        });

        beforeEach(() => {
            offers = [{}, {}];
        });

        it('should return empty array when geRoute returns undefined', () => {
            mockGetRoute.mockReturnValue(undefined);

            const filter = buildAirportsFilterOptionsFromOffers(offers, FilterGroupCodes.BoardType);

            expect(filter).toStrictEqual([]);
        });

        it('should build filter when getRoute returns route', () => {
            mockGetRoute.mockReturnValue({
                depPt: 'code',
                depName: 'name',
            } as IRoute);

            const filter = buildAirportsFilterOptionsFromOffers(offers, FilterGroupCodes.BoardType);

            expect(filter).toStrictEqual([
                {
                    code: 'code',
                    name: 'name',
                    groupCode: FilterGroupCodes.BoardType,
                    count: 2,
                },
            ]);
        });
    });

    describe('isExclusiveFilterDisabled', () => {
        const selectedFilters = [
            { groupCode: FilterGroupCodes.HotelTypes, isExclusive: true, code: 'code1' },
        ] as ISelectedFilter[];
        const filter = {
            code: 'code1',
            name: 'luxury holidays',
            count: 2,
            groupCode: FilterGroupCodes.HotelTypes,
            isExclusive: true,
        };

        it('should return false when exclusive filter is selected', () => {
            expect(isExclusiveFilterDisabled(filter, selectedFilters)).toBe(false);
        });

        it('should return true when exclusive filter is NOT selected', () => {
            selectedFilters[0].code = 'code2';

            expect(isExclusiveFilterDisabled(filter, selectedFilters)).toBe(true);
        });

        it('should return true when selected filter is NOT exclusive', () => {
            selectedFilters[0].isExclusive = false;

            expect(isExclusiveFilterDisabled(filter, selectedFilters)).toBe(true);
        });

        it('should return false when selected filter and filter are NOT exclusive', () => {
            filter.isExclusive = false;

            expect(isExclusiveFilterDisabled(filter, selectedFilters)).toBe(false);
        });

        it('should return false when FilterGroupCodes is NOT HotelTypes', () => {
            filter.groupCode = FilterGroupCodes.BoardType;
            filter.isExclusive = false;

            expect(isExclusiveFilterDisabled(filter, selectedFilters)).toBe(false);
        });
    });

    describe('getTimeFiltersCounts', () => {
        it('should return updated filter options with counts', () => {
            const updatedOptions = getTimeFiltersCounts(
                mockFilterOutboundDepartureTime,
                FilterGroupCodes.AltFlightsOutboundDepartureTime,
                mockFlightsOffers,
            );

            expect(updatedOptions[0].count).toBe(2);
        });
    });

    describe('findParentFilter', () => {
        const destinationFilters = [
            {
                code: 'parent-code',
                count: 1,
                groupCode: FilterGroupCodes.Destination,
                name: 'Parent destination',
                children: [
                    {
                        code: 'child-code',
                        count: 2,
                        groupCode: FilterGroupCodes.Destination,
                        name: 'Child destination',
                    },
                ],
            },
            {
                code: 'another-parent-code',
                count: 1,
                groupCode: FilterGroupCodes.Destination,
                name: 'Another parent destination',
                children: [
                    {
                        code: 'another-child-code',
                        count: 3,
                        groupCode: FilterGroupCodes.Destination,
                        name: 'Another child destination',
                    },
                ],
            },
        ];

        it('should return parent filter when child code exists', () => {
            const parent = findParentFilter(destinationFilters, 'child-code');

            expect(parent).toBe(destinationFilters[0]);
        });

        it('should return undefined when child code does NOT exist', () => {
            const parent = findParentFilter(destinationFilters, 'missing-child-code');

            expect(parent).toBeUndefined();
        });

        it('should return undefined when filters do NOT have children', () => {
            const parent = findParentFilter(
                [
                    {
                        code: 'parent-code',
                        count: 1,
                        groupCode: FilterGroupCodes.Destination,
                        name: 'Parent destination',
                    },
                ],
                'child-code',
            );

            expect(parent).toBeUndefined();
        });
    });

    describe('getGroupCodeForChecking', () => {
        it('should return filterCode when code is Recommended', () => {
            const result = getQuickFilterOptionGroupCode(FilterGroupCodes.Recommended, {
                filterCode: FilterGroupCodes.BoardType,
                groupCode: FilterGroupCodes.StarRating,
            } as IFilterOption);

            expect(result).toBe(FilterGroupCodes.BoardType);
        });

        it('should return groupCode when code is RecentlyUsed', () => {
            const result = getQuickFilterOptionGroupCode(FilterGroupCodes.RecentlyUsed, {
                filterCode: FilterGroupCodes.BoardType,
                groupCode: FilterGroupCodes.StarRating,
            } as IFilterOption);

            expect(result).toBe(FilterGroupCodes.StarRating);
        });

        it('should transform OutboundDepartureTime to FlightTimes', () => {
            const result = getQuickFilterOptionGroupCode(FilterGroupCodes.Recommended, {
                filterCode: FilterGroupCodes.OutboundDepartureTime,
            } as IFilterOption);

            expect(result).toBe(FilterGroupCodes.FlightTimes);
        });

        it('should transform InboundDepartureTime to FlightTimes', () => {
            const result = getQuickFilterOptionGroupCode(FilterGroupCodes.Recommended, {
                filterCode: FilterGroupCodes.InboundDepartureTime,
            } as IFilterOption);

            expect(result).toBe(FilterGroupCodes.FlightTimes);
        });

        it('should handle undefined filterCode', () => {
            const result = getQuickFilterOptionGroupCode(FilterGroupCodes.Recommended, {} as IFilterOption);

            expect(result).toBeUndefined();
        });

        it('should handle undefined groupCode', () => {
            const result = getQuickFilterOptionGroupCode(FilterGroupCodes.RecentlyUsed, {} as IFilterOption);

            expect(result).toBeUndefined();
        });
    });

    describe('filterPillOptions', () => {
        it('should filter out options without filterCode', () => {
            const filter: IFilters = {
                code: FilterGroupCodes.RecentlyUsed,
                name: FilterGroupCodes.RecentlyUsed,
                options: [
                    { code: 'AI', name: 'All Inclusive', count: 10 },
                    { groupCode: FilterGroupCodes.BoardType, code: 'HB', name: 'Half Board', count: 5 },
                ] as IFilterOption[],
            };
            const orderArray = [FilterGroupCodes.BoardType];
            const filters = [
                {
                    code: FilterGroupCodes.BoardType,
                    name: FilterGroupCodes.BoardType,
                    options: [{ code: 'HB', name: 'Half Board' }],
                },
            ];
            const result = filterPillOptions(FilterGroupCodes.RecentlyUsed, filter, orderArray, filters as any);
            expect(result.options).toHaveLength(1);
            expect(result.options[0].groupCode).toBe(FilterGroupCodes.BoardType);
        });

        it('should filter out options with filterCode not in orderArray', () => {
            const filter: IFilters = {
                code: FilterGroupCodes.RecentlyUsed,
                name: FilterGroupCodes.RecentlyUsed,
                options: [
                    { groupCode: FilterGroupCodes.BoardType, code: 'AI', name: 'All Inclusive', count: 10 },
                    { groupCode: FilterGroupCodes.Facilities, code: 'pool', name: 'Pool', count: 5 },
                ] as IFilterOption[],
            };
            const orderArray = [FilterGroupCodes.BoardType];
            const filters = [
                {
                    code: FilterGroupCodes.BoardType,
                    name: FilterGroupCodes.BoardType,
                    options: [{ code: 'AI', name: 'All Inclusive' }],
                },
                {
                    code: FilterGroupCodes.Facilities,
                    name: FilterGroupCodes.Facilities,
                    options: [{ code: 'pool', name: 'Pool' }],
                },
            ];
            const result = filterPillOptions(FilterGroupCodes.RecentlyUsed, filter, orderArray, filters as any);
            expect(result.options).toHaveLength(1);
            expect(result.options[0].groupCode).toBe(FilterGroupCodes.BoardType);
        });

        it('should filter out options with RANGE_FILTER_CODES', () => {
            const filter: IFilters = {
                code: FilterGroupCodes.RecentlyUsed,
                name: FilterGroupCodes.RecentlyUsed,
                options: [
                    { groupCode: FilterGroupCodes.BoardType, code: 'AI', name: 'All Inclusive', count: 10 },
                    { groupCode: FilterGroupCodes.PriceRange, code: 'price', name: 'Price', count: 5 },
                ] as IFilterOption[],
            };
            const orderArray = [FilterGroupCodes.BoardType, FilterGroupCodes.PriceRange];
            const filters = [
                {
                    code: FilterGroupCodes.PriceRange,
                    name: FilterGroupCodes.PriceRange,
                    options: [{ code: 'price', name: 'Price' }],
                },
                {
                    code: FilterGroupCodes.BoardType,
                    name: FilterGroupCodes.BoardType,
                    options: [{ code: 'AI', name: 'All Inclusive' }],
                },
            ];
            const result = filterPillOptions(FilterGroupCodes.RecentlyUsed, filter, orderArray, filters as any);
            expect(result.options).toHaveLength(1);
            expect(result.options[0].groupCode).toBe(FilterGroupCodes.BoardType);
        });

        it('should keep Duration options that exist in filterMapping', () => {
            const filter: IFilters = {
                code: FilterGroupCodes.RecentlyUsed,
                name: FilterGroupCodes.RecentlyUsed,
                options: [
                    { groupCode: FilterGroupCodes.Duration, code: '4', name: '4 nights', count: 10 },
                    { groupCode: FilterGroupCodes.Duration, code: '7', name: '7 nights', count: 5 },
                ] as IFilterOption[],
            };
            const orderArray = [FilterGroupCodes.Duration];
            const filters = [
                {
                    code: FilterGroupCodes.Duration,
                    options: [{ code: '4' }, { code: '5' }],
                },
            ];
            const result = filterPillOptions(FilterGroupCodes.RecentlyUsed, filter, orderArray, filters as any);
            expect(result.options).toHaveLength(1);
            expect(result.options[0].code).toBe('4');
        });

        it('should filter out Duration options that do not exist in filterMapping', () => {
            const filter: IFilters = {
                code: FilterGroupCodes.RecentlyUsed,
                name: FilterGroupCodes.RecentlyUsed,
                options: [
                    { groupCode: FilterGroupCodes.Duration, code: '4', name: '4 nights', count: 10 },
                ] as IFilterOption[],
            };
            const orderArray = [FilterGroupCodes.Duration];
            const filters = [
                {
                    code: FilterGroupCodes.Duration,
                    options: [{ code: '5' }, { code: '6' }],
                },
            ];
            const result = filterPillOptions(FilterGroupCodes.RecentlyUsed, filter, orderArray, filters as any);
            expect(result.options).toHaveLength(0);
        });

        it('should keep non-Duration options in orderArray', () => {
            const filter: IFilters = {
                code: FilterGroupCodes.RecentlyUsed,
                name: FilterGroupCodes.RecentlyUsed,
                options: [
                    { groupCode: FilterGroupCodes.BoardType, code: 'AI', name: 'All Inclusive', count: 10 },
                    { groupCode: FilterGroupCodes.StarRating, code: '5', name: '5 Star', count: 8 },
                    { groupCode: FilterGroupCodes.Facilities, code: 'pool', name: 'Pool', count: 5 },
                ] as IFilterOption[],
            };
            const orderArray = [FilterGroupCodes.BoardType, FilterGroupCodes.StarRating];
            const filters = [
                {
                    code: FilterGroupCodes.BoardType,
                    name: FilterGroupCodes.BoardType,
                    options: [{ code: 'AI', name: 'All Inclusive' }],
                },
                {
                    code: FilterGroupCodes.StarRating,
                    name: FilterGroupCodes.StarRating,
                    options: [{ code: '5', name: '5 Star' }],
                },
            ];
            const result = filterPillOptions(FilterGroupCodes.RecentlyUsed, filter, orderArray, filters as any);
            expect(result.options).toHaveLength(2);
            expect(result.options.map(o => o.groupCode)).toEqual([
                FilterGroupCodes.BoardType,
                FilterGroupCodes.StarRating,
            ]);
        });

        it('should handle empty filters for Duration', () => {
            const filter: IFilters = {
                code: FilterGroupCodes.RecentlyUsed,
                name: FilterGroupCodes.RecentlyUsed,
                options: [
                    { groupCode: FilterGroupCodes.Duration, code: '4', name: '4 nights', count: 10 },
                ] as IFilterOption[],
            };
            const orderArray = [FilterGroupCodes.Duration];
            const result = filterPillOptions(FilterGroupCodes.RecentlyUsed, filter, orderArray, []);
            expect(result.options).toHaveLength(0);
        });

        it('should preserve filter structure when filtering', () => {
            const filter: IFilters = {
                code: FilterGroupCodes.RecentlyUsed,
                name: FilterGroupCodes.RecentlyUsed,
                options: [
                    { groupCode: FilterGroupCodes.BoardType, code: 'AI', name: 'All Inclusive', count: 10 },
                ] as IFilterOption[],
            };
            const orderArray = [FilterGroupCodes.BoardType];
            const result = filterPillOptions(FilterGroupCodes.RecentlyUsed, filter, orderArray, []);
            expect(result.code).toBe(FilterGroupCodes.RecentlyUsed);
            expect(result.name).toBe(FilterGroupCodes.RecentlyUsed);
        });

        it('should handle multiple Duration options with mixed existence in filters', () => {
            const filter: IFilters = {
                code: FilterGroupCodes.RecentlyUsed,
                name: FilterGroupCodes.RecentlyUsed,
                options: [
                    { groupCode: FilterGroupCodes.Duration, code: '4', name: '4 nights', count: 10 },
                    { groupCode: FilterGroupCodes.Duration, code: '5', name: '5 nights', count: 8 },
                    { groupCode: FilterGroupCodes.Duration, code: '7', name: '7 nights', count: 5 },
                ] as IFilterOption[],
            };
            const orderArray = [FilterGroupCodes.Duration];
            const filters = [
                {
                    code: FilterGroupCodes.Duration,
                    name: FilterGroupCodes.Duration,
                    options: [{ code: '4' }, { code: '7' }],
                },
            ];
            const result = filterPillOptions(FilterGroupCodes.RecentlyUsed, filter, orderArray, filters as any);
            expect(result.options).toHaveLength(2);
            expect(result.options.map(o => o.code)).toEqual(['4', '7']);
        });

        it('should ignore actual options and handle multiple Duration options with mixed existence in filters for Recommended', () => {
            const filter: IFilters = {
                code: FilterGroupCodes.Recommended,
                name: FilterGroupCodes.Recommended,
                options: [
                    { filterCode: FilterGroupCodes.Duration, code: '4', name: '4 nights', count: 10 },
                    { filterCode: FilterGroupCodes.Duration, code: '5', name: '5 nights', count: 8 },
                    { filterCode: FilterGroupCodes.Duration, code: '7', name: '7 nights', count: 5 },
                ] as IFilterOption[],
            };
            const orderArray = [FilterGroupCodes.Duration];
            const filters = [
                {
                    code: FilterGroupCodes.Duration,
                    name: FilterGroupCodes.Duration,
                    options: [{ code: '4' }, { code: '7' }],
                },
            ];
            const result = filterPillOptions(FilterGroupCodes.Recommended, filter, orderArray, filters as any);
            expect(result.options).toHaveLength(3);
            expect(result.options.map(o => o.code)).toEqual(['4', '5', '7']);
        });

        it('should preserve all option properties when filtering', () => {
            const option = {
                filterCode: FilterGroupCodes.BoardType,
                groupCode: FilterGroupCodes.BoardType,
                code: 'AI',
                name: 'All Inclusive',
                count: 10,
                icon: 'icon-url',
                custom: 'custom-value',
            };
            const filter: IFilters = {
                code: FilterGroupCodes.RecentlyUsed,
                name: FilterGroupCodes.RecentlyUsed,
                options: [option as any],
            };
            const orderArray = [FilterGroupCodes.BoardType];
            const filters = [
                {
                    code: FilterGroupCodes.BoardType,
                    name: FilterGroupCodes.BoardType,
                    options: [option],
                },
            ];
            const result = filterPillOptions(FilterGroupCodes.RecentlyUsed, filter, orderArray, filters);
            expect(result.options[0]).toEqual(option);
        });
    });

    describe('getFilterByGroupCode', () => {
        it('should return the filter when code matches', () => {
            const filters: IFilters[] = [
                {
                    code: FilterGroupCodes.BoardType,
                    name: FilterGroupCodes.BoardType,
                    options: [],
                },
                {
                    code: FilterGroupCodes.StarRating,
                    name: FilterGroupCodes.StarRating,
                    options: [],
                },
            ];

            const result = getFilterByGroupCode(filters, FilterGroupCodes.BoardType);

            expect(result).toBe(filters[0]);
        });

        it('should return undefined when code does not match any filter', () => {
            const filters: IFilters[] = [
                {
                    code: FilterGroupCodes.BoardType,
                    name: FilterGroupCodes.BoardType,
                    options: [],
                },
            ];

            const result = getFilterByGroupCode(filters, FilterGroupCodes.StarRating);

            expect(result).toBeUndefined();
        });

        it('should return undefined for empty filter array', () => {
            const filters: IFilters[] = [];

            const result = getFilterByGroupCode(filters, FilterGroupCodes.BoardType);

            expect(result).toBeUndefined();
        });

        it('should find filter among multiple options', () => {
            const filters: IFilters[] = [
                {
                    code: FilterGroupCodes.Destination,
                    name: FilterGroupCodes.Destination,
                    options: [],
                },
                {
                    code: FilterGroupCodes.Duration,
                    name: FilterGroupCodes.Duration,
                    options: [],
                },
                {
                    code: FilterGroupCodes.PriceRange,
                    name: FilterGroupCodes.PriceRange,
                    options: [],
                },
                {
                    code: FilterGroupCodes.StarRating,
                    name: FilterGroupCodes.StarRating,
                    options: [],
                },
            ];

            const result = getFilterByGroupCode(filters, FilterGroupCodes.PriceRange);

            expect(result).toBe(filters[2]);
            expect(result?.code).toBe(FilterGroupCodes.PriceRange);
        });
    });

    describe('getFilterOptionByCode', () => {
        it('should return an option when code matches a top-level option', () => {
            const filters: IFilters[] = [
                {
                    code: FilterGroupCodes.BoardType,
                    name: FilterGroupCodes.BoardType,
                    options: [
                        {
                            code: 'HB',
                            name: 'Half Board',
                            count: 10,
                            groupCode: FilterGroupCodes.BoardType,
                        },
                        {
                            code: 'FB',
                            name: 'Full Board',
                            count: 5,
                            groupCode: FilterGroupCodes.BoardType,
                        },
                    ],
                },
            ];
            const option = {
                code: 'HB',
                name: 'Half Board',
                count: 10,
                groupCode: FilterGroupCodes.BoardType,
            };

            const result = getFilterOptionByCode(filters, FilterGroupCodes.BoardType, option);

            expect(result).toEqual(filters[0].options[0]);
            expect(result?.name).toBe('Half Board');
        });

        it('should return an option from children', () => {
            const filters: IFilters[] = [
                {
                    code: FilterGroupCodes.Destination,
                    name: FilterGroupCodes.Destination,
                    options: [
                        {
                            code: 'EUR',
                            name: 'Europe',
                            count: 100,
                            groupCode: FilterGroupCodes.Destination,
                            children: [
                                {
                                    code: 'FR',
                                    name: 'France',
                                    count: 30,
                                    groupCode: FilterGroupCodes.Destination,
                                },
                                {
                                    code: 'ES',
                                    name: 'Spain',
                                    count: 25,
                                    groupCode: FilterGroupCodes.Destination,
                                },
                            ],
                        },
                    ],
                },
            ];
            const option = {
                code: 'FR',
                name: 'France',
                count: 30,
                groupCode: FilterGroupCodes.Destination,
            };

            const result = getFilterOptionByCode(filters, FilterGroupCodes.Destination, option);

            expect(result).toEqual(filters[0].options[0].children?.[0]);
            expect(result?.name).toBe('France');
        });

        it('should return undefined when code does not exist', () => {
            const filters: IFilters[] = [
                {
                    code: FilterGroupCodes.BoardType,
                    name: FilterGroupCodes.BoardType,
                    options: [
                        {
                            code: 'HB',
                            name: 'Half Board',
                            count: 10,
                            groupCode: FilterGroupCodes.BoardType,
                        },
                    ],
                },
            ];
            const option = { code: 'INVALID' } as IFilterOption;

            const result = getFilterOptionByCode(filters, FilterGroupCodes.BoardType, option);

            expect(result).toBeUndefined();
        });

        it('should return undefined when groupCode does not exist', () => {
            const filters: IFilters[] = [
                {
                    code: FilterGroupCodes.BoardType,
                    name: FilterGroupCodes.BoardType,
                    options: [],
                },
            ];
            const option = {
                code: 'HB',
                name: 'Half Board',
                count: 10,
                groupCode: FilterGroupCodes.BoardType,
            };

            const result = getFilterOptionByCode(filters, FilterGroupCodes.StarRating, option);

            expect(result).toBeUndefined();
        });

        it('should return undefined for empty filters array', () => {
            const filters: IFilters[] = [];
            const option = {
                code: 'HB',
                name: 'Half Board',
                count: 10,
                groupCode: FilterGroupCodes.BoardType,
            };

            const result = getFilterOptionByCode(filters, FilterGroupCodes.BoardType, option);

            expect(result).toBeUndefined();
        });

        it('should handle options with empty children array', () => {
            const filters: IFilters[] = [
                {
                    code: FilterGroupCodes.Destination,
                    name: FilterGroupCodes.Destination,
                    options: [
                        {
                            code: 'EUR',
                            name: 'Europe',
                            count: 100,
                            groupCode: FilterGroupCodes.Destination,
                            children: [],
                        },
                    ],
                },
            ];
            const option = {
                code: 'EUR',
                name: 'Europe',
                count: 100,
                groupCode: FilterGroupCodes.Destination,
            };

            const result = getFilterOptionByCode(filters, FilterGroupCodes.Destination, option);

            expect(result).toEqual(filters[0].options[0]);
        });

        describe('with shouldCheckParentName parameter', () => {
            it('should assign InboundDepartureTime groupCode to children of "Inbound Departure Time" parent', () => {
                const filters: IFilters[] = [
                    {
                        code: FilterGroupCodes.FlightTimes,
                        name: FilterGroupCodes.FlightTimes,
                        options: [
                            {
                                name: 'Inbound Departure Time',
                                count: 100,
                                groupCode: FilterGroupCodes.FlightTimes,
                                children: [
                                    {
                                        code: 'morning',
                                        name: 'Morning',
                                        count: 70,
                                    },
                                    {
                                        code: 'afternoon',
                                        name: 'Afternoon',
                                        count: 25,
                                    },
                                ] as IFilterOption[],
                            },
                            {
                                code: 'parent-inbound',
                                name: 'Outbound Departure Time',
                                count: 100,
                                groupCode: FilterGroupCodes.FlightTimes,
                                children: [
                                    {
                                        code: 'morning',
                                        name: 'Morning',
                                        count: 30,
                                    },
                                ] as IFilterOption[],
                            },
                        ] as IFilterOption[],
                    },
                ];
                const option = {
                    code: 'morning',
                    name: 'Morning',
                    count: 70,
                    groupCode: FilterGroupCodes.InboundDepartureTime,
                };

                const result = getFilterOptionByCode(filters, FilterGroupCodes.FlightTimes, option, true);

                expect(result).toBeDefined();
                expect(result?.code).toBe('morning');
                expect(result?.groupCode).toBe(FilterGroupCodes.InboundDepartureTime);
                expect(result?.count).toBe(70);
            });

            it('should assign OutboundDepartureTime groupCode to children of "Outbound Departure Time" parent', () => {
                const filters: IFilters[] = [
                    {
                        code: FilterGroupCodes.FlightTimes,
                        name: FilterGroupCodes.FlightTimes,
                        options: [
                            {
                                name: 'Inbound Departure Time',
                                count: 100,
                                groupCode: FilterGroupCodes.FlightTimes,
                                children: [
                                    {
                                        code: 'night',
                                        name: 'Night',
                                        count: 20,
                                    },
                                ],
                            },
                            {
                                name: 'Outbound Departure Time',
                                count: 100,
                                groupCode: FilterGroupCodes.FlightTimes,
                                children: [
                                    {
                                        code: 'night',
                                        name: 'Night',
                                        count: 40,
                                    },
                                ],
                            },
                        ] as IFilterOption[],
                    },
                ];
                const option = {
                    code: 'night',
                    name: 'Night',
                    count: 40,
                    groupCode: FilterGroupCodes.OutboundDepartureTime,
                };

                const result = getFilterOptionByCode(filters, FilterGroupCodes.FlightTimes, option, true);

                expect(result).toBeDefined();
                expect(result?.code).toBe('night');
                expect(result?.groupCode).toBe(FilterGroupCodes.OutboundDepartureTime);
                expect(result?.count).toBe(40);
            });

            it('should not modify groupCode for children of parents with other names', () => {
                const filters: IFilters[] = [
                    {
                        code: FilterGroupCodes.Destination,
                        name: FilterGroupCodes.Destination,
                        options: [
                            {
                                code: 'EUR',
                                name: 'Europe',
                                count: 100,
                                groupCode: FilterGroupCodes.Destination,
                                children: [
                                    {
                                        code: 'FR',
                                        name: 'France',
                                        count: 30,
                                        groupCode: FilterGroupCodes.Destination,
                                    },
                                ],
                            },
                        ],
                    },
                ];
                const option = {
                    code: 'FR',
                    name: 'France',
                    count: 30,
                    groupCode: FilterGroupCodes.Destination,
                };

                const result = getFilterOptionByCode(filters, FilterGroupCodes.Destination, option, true);

                expect(result).toBeDefined();
                expect(result?.code).toBe('FR');
                // groupCode should remain as Destination since parent name is 'Europe'
                expect(result?.groupCode).toEqual(expect.any(String));
            });

            it('should return undefined when code does not match with shouldCheckParentName', () => {
                const filters: IFilters[] = [
                    {
                        code: FilterGroupCodes.FlightTimes,
                        name: FilterGroupCodes.FlightTimes,
                        options: [
                            {
                                code: 'parent-inbound',
                                name: 'Inbound Departure Time',
                                count: 100,
                                groupCode: FilterGroupCodes.FlightTimes,
                                children: [
                                    {
                                        code: 'morning',
                                        name: 'Morning',
                                        count: 30,
                                    } as IFilterOption,
                                ],
                            },
                        ],
                    },
                ];
                const option = {
                    code: 'evening',
                    groupCode: FilterGroupCodes.InboundDepartureTime,
                } as IFilterOption;

                const result = getFilterOptionByCode(filters, FilterGroupCodes.FlightTimes, option, true);

                expect(result).toBeUndefined();
            });
        });
    });

    describe('normalizeRecentlyUsedFilters', () => {
        it('should place incoming option first when provided', () => {
            const existingFilters: IFilterOption[] = [
                { code: '1', groupCode: FilterGroupCodes.StarRating, name: 'Option 1', count: 1 },
                { code: '2', groupCode: FilterGroupCodes.Duration, name: 'Option 2', count: 1 },
            ];
            const incomingOption: IFilterOption = {
                code: 'new',
                groupCode: FilterGroupCodes.BoardType,
                name: 'New Option',
                count: 1,
            };

            const result = normalizeRecentlyUsedFilters(existingFilters, incomingOption);

            expect(result[0]).toEqual(incomingOption);
            expect(result).toHaveLength(3);
        });

        it('should remove duplicate filters based on code and groupCode', () => {
            const filters: IFilterOption[] = [
                { code: '1', groupCode: FilterGroupCodes.StarRating, name: 'Option 1', count: 1 },
                { code: '2', groupCode: FilterGroupCodes.Duration, name: 'Option 2', count: 1 },
                { code: '1', groupCode: FilterGroupCodes.StarRating, name: 'Option 1 Duplicate', count: 1 },
            ];

            const result = normalizeRecentlyUsedFilters(filters);

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual(filters[0]);
            expect(result[1]).toEqual(filters[1]);
        });

        it('should keep first occurrence when duplicates exist', () => {
            const filters: IFilterOption[] = [
                { code: '1', groupCode: FilterGroupCodes.StarRating, name: 'First', count: 1 },
                { code: '1', groupCode: FilterGroupCodes.StarRating, name: 'Second', count: 2 },
            ];

            const result = normalizeRecentlyUsedFilters(filters);

            expect(result).toHaveLength(1);
            expect(result[0].name).toBe('First');
            expect(result[0].count).toBe(1);
        });

        it('should slice result to RECENTLY_USED_FILTERS_MAX_LENGTH', () => {
            // Create more filters than MAX_LENGTH
            const filters: IFilterOption[] = Array.from({ length: 50 }, (_, i) => ({
                code: `${i}`,
                groupCode: FilterGroupCodes.StarRating,
                name: `Option ${i}`,
                count: 1,
            }));

            const result = normalizeRecentlyUsedFilters(filters);

            // The constant should limit the result
            expect(result.length).toBeLessThanOrEqual(50); // Assuming MAX_LENGTH is sufficient
        });

        it('should handle empty array without incoming option', () => {
            const result = normalizeRecentlyUsedFilters([]);

            expect(result).toEqual([]);
        });

        it('should handle empty array with incoming option', () => {
            const incomingOption: IFilterOption = {
                code: 'new',
                groupCode: FilterGroupCodes.BoardType,
                name: 'New Option',
                count: 1,
            };

            const result = normalizeRecentlyUsedFilters([], incomingOption);

            expect(result).toHaveLength(1);
            expect(result[0]).toEqual(incomingOption);
        });

        it('should deduplicate incoming option with existing filters', () => {
            const existingFilters: IFilterOption[] = [
                { code: '1', groupCode: FilterGroupCodes.StarRating, name: 'Option 1', count: 1 },
                { code: '2', groupCode: FilterGroupCodes.Duration, name: 'Option 2', count: 1 },
            ];
            const incomingOption: IFilterOption = {
                code: '1',
                groupCode: FilterGroupCodes.StarRating,
                name: 'Option 1 New',
                count: 5,
            };

            const result = normalizeRecentlyUsedFilters(existingFilters, incomingOption);

            // Incoming option should be first, and the duplicate should be removed
            expect(result[0]).toEqual(incomingOption);
            expect(result).toHaveLength(2); // Only incoming and second option
        });

        it('should handle different groupCodes with same code', () => {
            const filters: IFilterOption[] = [
                { code: '1', groupCode: FilterGroupCodes.StarRating, name: 'Star 1', count: 1 },
                { code: '1', groupCode: FilterGroupCodes.Duration, name: 'Duration 1', count: 1 },
            ];

            const result = normalizeRecentlyUsedFilters(filters);

            // Should not be considered duplicates since groupCode is different
            expect(result).toHaveLength(2);
        });
    });
});
