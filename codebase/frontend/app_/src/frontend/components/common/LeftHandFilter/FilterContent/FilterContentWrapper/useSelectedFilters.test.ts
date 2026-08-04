import { renderHook } from '@testing-library/react';

import { DestinationType } from 'models/enum/DestinationType';
import { FilterGroupCodes } from 'models/enum/FilterGroupCodes';

import useSelectedFilters from './useSelectedFilters';

let mockAvailableFilters;
let mockSelectedFilters;

const createAvailableFilters = (type: FilterGroupCodes) => [
    {
        code: type,
        options: [{ code: 'code1', boardGroup: { code: 'code2' }, children: [{ code: 'test-code' }] }],
    },
];

describe('useSelectedFilter', () => {
    it('should return empty array when selected filters are NOT provided', () => {
        const { result } = renderHook(() => useSelectedFilters(mockAvailableFilters, undefined));

        expect(result.current).toStrictEqual([]);
    });

    it('should return selected filters when selected filter is NOT board, destination, duration or fight type', () => {
        mockAvailableFilters = createAvailableFilters(FilterGroupCodes.StarRating);
        mockSelectedFilters = [
            {
                groupCode: FilterGroupCodes.StarRating,
                code: 'code1',
            },
        ];

        const { result } = renderHook(() => useSelectedFilters(mockAvailableFilters, mockSelectedFilters));

        expect(result.current).toStrictEqual(mockSelectedFilters);
    });

    describe('Board Type', () => {
        beforeEach(() => {
            mockAvailableFilters = createAvailableFilters(FilterGroupCodes.BoardType);
            mockSelectedFilters = [
                {
                    groupCode: FilterGroupCodes.BoardType,
                    code: 'code1',
                },
            ];
        });

        it('should return empty array when any element from availableFilters boardGroup code is different from code', () => {
            const { result } = renderHook(() => useSelectedFilters(mockAvailableFilters, mockSelectedFilters));

            expect(result.current).toStrictEqual([]);
        });

        it('should return empty array when any children code is equal to filterSelected code', () => {
            mockAvailableFilters[0].options[0].boardGroup.code = 'code1';
            mockSelectedFilters[0].code = 'test-code';

            const { result } = renderHook(() => useSelectedFilters(mockAvailableFilters, mockSelectedFilters));

            expect(result.current).toStrictEqual([]);
        });

        it('should return selected filters when available filter is NOT board type', () => {
            mockAvailableFilters[0].code = 'test';

            const { result } = renderHook(() => useSelectedFilters(mockAvailableFilters, mockSelectedFilters));

            expect(result.current).toStrictEqual(mockSelectedFilters);
        });
    });

    describe('Duration Type', () => {
        beforeEach(() => {
            mockSelectedFilters = [
                {
                    groupCode: FilterGroupCodes.Duration,
                    code: 'code1',
                },
            ];
        });

        it('should return empty array when filter is pre checked', () => {
            mockSelectedFilters[0].preChecked = true;

            const { result } = renderHook(() => useSelectedFilters(mockAvailableFilters, mockSelectedFilters));

            expect(result.current).toStrictEqual([]);
        });

        it('should return selected filter when filter is NOT pre checked', () => {
            const { result } = renderHook(() => useSelectedFilters(mockAvailableFilters, mockSelectedFilters));

            expect(result.current).toStrictEqual(mockSelectedFilters);
        });
    });

    describe('Flights Type', () => {
        beforeEach(() => {
            mockSelectedFilters = [
                {
                    groupCode: FilterGroupCodes.Flights,
                    code: 'code1',
                },
            ];
        });

        it('should return empty array when filter is pre checked', () => {
            mockSelectedFilters[0].preChecked = true;

            const { result } = renderHook(() => useSelectedFilters(mockAvailableFilters, mockSelectedFilters));

            expect(result.current).toStrictEqual([]);
        });

        it('should return selected filter when filter is NOT pre checked', () => {
            const { result } = renderHook(() => useSelectedFilters(mockAvailableFilters, mockSelectedFilters));

            expect(result.current).toStrictEqual(mockSelectedFilters);
        });
    });

    describe('Destination Type', () => {
        beforeEach(() => {
            mockAvailableFilters = createAvailableFilters(FilterGroupCodes.Destination);
            mockSelectedFilters = [
                {
                    groupCode: FilterGroupCodes.Destination,
                    code: 'code1',
                },
            ];
        });

        it('should return selected filter when available filters does NOT have destination type filter', () => {
            mockAvailableFilters[0].code = FilterGroupCodes.Date;

            const { result } = renderHook(() => useSelectedFilters(mockAvailableFilters, mockSelectedFilters));

            expect(result.current).toStrictEqual(mockSelectedFilters);
        });

        it('should return empty array when selected filter is pre checked', () => {
            mockSelectedFilters[0].preChecked = true;

            const { result } = renderHook(() => useSelectedFilters(mockAvailableFilters, mockSelectedFilters));

            expect(result.current).toStrictEqual([]);
        });

        it('should return selected filter when there are no virtual regions', () => {
            const { result } = renderHook(() => useSelectedFilters(mockAvailableFilters, mockSelectedFilters));

            expect(result.current).toStrictEqual(mockSelectedFilters);
        });

        it('should return empty array when children code and group code are equal to code and group code from selected filter', () => {
            mockAvailableFilters[0].options[0].children[0] = {
                code: 'code1',
                groupCode: FilterGroupCodes.Destination,
            };

            const { result } = renderHook(() => useSelectedFilters(mockAvailableFilters, mockSelectedFilters));

            expect(result.current).toStrictEqual([]);
        });

        it('should return selected filter when country code is NOT equal to selected filters code', () => {
            mockSelectedFilters[0].code = 'code';

            const { result } = renderHook(() => useSelectedFilters(mockAvailableFilters, mockSelectedFilters));

            expect(result.current).toStrictEqual(mockSelectedFilters);
        });

        it('should return empty array when virtual region related regions are pre checked', () => {
            mockSelectedFilters = [
                {
                    groupCode: FilterGroupCodes.Destination,
                    code: 'code1',
                    destinationInfo: { type: DestinationType.VirtualRegion, relatedRegions: ['code1'] },
                },
                {
                    groupCode: FilterGroupCodes.Destination,
                    code: 'code1',
                    destinationInfo: { type: DestinationType.VirtualRegion, relatedRegions: ['code1'] },
                    preChecked: true,
                },
            ];

            const { result } = renderHook(() => useSelectedFilters(mockAvailableFilters, mockSelectedFilters));

            expect(result.current).toStrictEqual([]);
        });

        it('should return empty array when isDestinationPreCheckCountry is true', () => {
            mockAvailableFilters[0].options[0].children = [
                {
                    code: 'test-code',
                    destinationInfo: { type: DestinationType.VirtualRegion, relatedRegions: ['code1'] },
                },
            ];

            const { result } = renderHook(() => useSelectedFilters(mockAvailableFilters, mockSelectedFilters));

            expect(result.current).toStrictEqual([]);
        });

        it('should return empty array when correct virtual regions exists', () => {
            mockSelectedFilters[0].destinationInfo = {
                type: DestinationType.Region,
                relatedRegions: ['test'],
            };
            mockAvailableFilters[0].options[0].children = [
                {
                    code: 'test-code',
                    destinationInfo: { type: DestinationType.VirtualRegion, relatedRegions: ['code1'] },
                },
                {
                    code: 'test-code1',
                },
            ];

            const { result } = renderHook(() => useSelectedFilters(mockAvailableFilters, mockSelectedFilters));

            expect(result.current).toStrictEqual([]);
        });

        it('should return selected filters when not all related regions of virtual region are correct', () => {
            mockSelectedFilters[0].destinationInfo = {
                type: DestinationType.Region,
                relatedRegions: ['test'],
            };
            mockAvailableFilters[0].options[0].children = [
                {
                    code: 'test-code',
                    destinationInfo: { type: DestinationType.VirtualRegion, relatedRegions: ['code1', 'test'] },
                },
                {
                    code: 'test-code1',
                },
            ];

            const { result } = renderHook(() => useSelectedFilters(mockAvailableFilters, mockSelectedFilters));

            expect(result.current).toStrictEqual(mockSelectedFilters);
        });

        it('should return selected filters when virtual regions have wrong related regions', () => {
            mockSelectedFilters[0].destinationInfo = {
                type: DestinationType.Region,
                relatedRegions: ['test'],
            };
            mockAvailableFilters[0].options[0].children = [
                {
                    code: 'test-code',
                    destinationInfo: { type: DestinationType.VirtualRegion, relatedRegions: ['test'] },
                },
                {
                    code: 'test-code1',
                },
            ];

            const { result } = renderHook(() => useSelectedFilters(mockAvailableFilters, mockSelectedFilters));

            expect(result.current).toStrictEqual(mockSelectedFilters);
        });

        it('should return selected filters when options are NOT provided', () => {
            mockAvailableFilters[0].options = undefined;

            const { result } = renderHook(() => useSelectedFilters(mockAvailableFilters, mockSelectedFilters));

            expect(result.current).toStrictEqual(mockSelectedFilters);
        });

        it('should return empty array when options children are NOT provided', () => {
            mockAvailableFilters[0].options[0].children = undefined;

            const { result } = renderHook(() => useSelectedFilters(mockAvailableFilters, mockSelectedFilters));

            expect(result.current).toStrictEqual([]);
        });
    });
});
