import { getFilterSelectionTrackingName, getRangeFilterTrackingValue } from 'frontend/utils/tracking/filters.utils';
import { ITrackingFilterOption } from 'models/data/IFilters';
import { FilterGroupCodes } from 'models/enum/FilterGroupCodes';
import { RangeFilterTrackingUnits } from 'models/enum/tracking/RangeFilterTrackingUnits';

describe('filters.utils', () => {
    describe('getFilterSelectionTrackingName', () => {
        it('should return English values for Duration FilterGroupCodes', () => {
            const filterSelection = getFilterSelectionTrackingName({
                groupCode: FilterGroupCodes.Duration,
                code: '5',
                name: 'Tripadvisor Rating',
            });

            expect(filterSelection).toBe('5 nights');
        });

        it('should return English values for StarRating FilterGroupCodes', () => {
            const filterSelection = getFilterSelectionTrackingName({
                groupCode: FilterGroupCodes.StarRating,
                code: '3',
                name: 'Star Rating',
            });

            expect(filterSelection).toBe('3 stars');
        });

        it('should return English values for TripAdvisorRating FilterGroupCodes below 5', () => {
            const filterSelection = getFilterSelectionTrackingName({
                groupCode: FilterGroupCodes.TripAdvisorRating,
                code: '3',
                name: 'Tripadvisor Rating',
            });

            expect(filterSelection).toBe('3 stars & up');
        });

        it('should return English values for TripAdvisorRating FilterGroupCodes equal 5', () => {
            const filterSelection = getFilterSelectionTrackingName({
                groupCode: FilterGroupCodes.TripAdvisorRating,
                code: '5',
                name: 'Tripadvisor Rating',
            });

            expect(filterSelection).toBe('5 stars only');
        });

        it('should return name when trackingId is NOT provided', () => {
            const filterSelection = getFilterSelectionTrackingName({
                groupCode: FilterGroupCodes.BoardType,
                name: 'board type name',
            });

            expect(filterSelection).toBe('board type name');
        });

        it('should return trackingId when it is provided', () => {
            const filterSelection = getFilterSelectionTrackingName({
                groupCode: FilterGroupCodes.BoardType,
                name: 'board type name',
                trackingId: 'board type trackingId',
            });

            expect(filterSelection).toBe('board type trackingId');
        });

        it('should return "All" when it is not a special case and there is no name or trackingId', () => {
            const filterSelection = getFilterSelectionTrackingName({
                groupCode: FilterGroupCodes.BoardType,
                name: undefined,
            } as unknown as ITrackingFilterOption);

            expect(filterSelection).toBe('All');
        });

        it('should return trackingId for special case of TripAdvisorRating FilterGroupCodes when there is no code', () => {
            const filterSelection = getFilterSelectionTrackingName({
                groupCode: FilterGroupCodes.TripAdvisorRating,
                name: 'tripAdvisorRating name',
                trackingId: 'tripAdvisorRating trackingId',
            });

            expect(filterSelection).toBe('tripAdvisorRating trackingId');
        });
    });

    describe('getRangeFilterTrackingValue', () => {
        it('should return the correct tracking value with units', () => {
            const minValue = '10';
            const maxValue = '20';
            const minValueUnit = RangeFilterTrackingUnits.Celsius;

            const result = getRangeFilterTrackingValue(minValue, maxValue, minValueUnit);

            expect(result).toBe(`From ${minValue}${minValueUnit} to ${maxValue}${minValueUnit}`);
        });

        it('should return the correct tracking value without units', () => {
            const minValue = '5';
            const maxValue = '15';

            const result = getRangeFilterTrackingValue(minValue, maxValue);

            expect(result).toBe(`From ${minValue} to ${maxValue}`);
        });

        it('should return the correct tracking value with space before units', () => {
            const minValue = '1';
            const maxValue = '2';
            const minValueUnit = RangeFilterTrackingUnits.Hour;
            const maxValueUnit = RangeFilterTrackingUnits.Hours;

            const result = getRangeFilterTrackingValue(minValue, maxValue, minValueUnit, maxValueUnit, true);

            expect(result).toBe(`From ${minValue} ${minValueUnit} to ${maxValue} ${maxValueUnit}`);
        });
    });
});
