import { getDaysDifferenceRoundedFloor } from 'frontend/utils/date.utils';

import { getDaysUntilDeparture, shouldShowDaysUntilDepartureBadge } from './utils';

jest.mock('frontend/utils/date.utils', () => ({
    getDaysDifferenceRoundedFloor: jest.fn(),
}));

const mockGetDaysDifferenceRoundedFloor = jest.mocked(getDaysDifferenceRoundedFloor);

describe('getDaysUntilDeparture', () => {
    it('should return null when departureDatetimeLocal is undefined', () => {
        expect(getDaysUntilDeparture(undefined)).toBeNull();
    });

    it('should return null when departureDatetimeLocal is null', () => {
        expect(getDaysUntilDeparture(null)).toBeNull();
    });

    it('should return null when departureDatetimeLocal is empty string', () => {
        expect(getDaysUntilDeparture('')).toBeNull();
    });

    it('should return null when departureDatetimeLocal is an invalid date', () => {
        expect(getDaysUntilDeparture('not-a-date')).toBeNull();
    });

    it('should return the result of getDaysDifferenceRoundedFloor for a valid date', () => {
        mockGetDaysDifferenceRoundedFloor.mockReturnValue(14);

        const result = getDaysUntilDeparture('2026-06-10T08:00:00Z');

        expect(result).toBe(14);
        expect(mockGetDaysDifferenceRoundedFloor).toHaveBeenCalledWith(expect.any(Date), expect.any(Date));
    });
});

describe('shouldShowDaysUntilDepartureBadge', () => {
    it('should return false when daysUntilDeparture is null', () => {
        expect(shouldShowDaysUntilDepartureBadge(null)).toBe(false);
    });

    it('should return false when daysUntilDeparture is negative', () => {
        expect(shouldShowDaysUntilDepartureBadge(-1)).toBe(false);
    });

    it('should return true when daysUntilDeparture is 0', () => {
        expect(shouldShowDaysUntilDepartureBadge(0)).toBe(true);
    });

    it('should return true when daysUntilDeparture is 29', () => {
        expect(shouldShowDaysUntilDepartureBadge(29)).toBe(true);
    });

    it('should return false when daysUntilDeparture is 30', () => {
        expect(shouldShowDaysUntilDepartureBadge(30)).toBe(false);
    });

    it('should return false when daysUntilDeparture is greater than 30', () => {
        expect(shouldShowDaysUntilDepartureBadge(45)).toBe(false);
    });
});
