import { IAvailableDate } from 'models/data/IAvailableDate';

import {
    getFirstDisplayedMonthOnDesktop,
    getUnavailableMonths,
    groupByMonthsWithYear,
} from './SearchPodCalendar.utils';

describe('SearchPodCalendar.utils', () => {
    describe('getUnavailableMonths', () => {
        it('should return empty array when no availability', () => {
            const result = getUnavailableMonths([], null);

            expect(result).toEqual([]);
        });

        it('should return months where all date out values are unavailable when from is null', () => {
            const availableDates: IAvailableDate[] = [
                { date: '2024-06-01', in: false, out: false },
                { date: '2024-06-15', in: false, out: false },
                { date: '2024-07-01', in: true, out: false },
                { date: '2024-07-10', in: false, out: false },
                { date: '2024-08-05', in: false, out: false },
                { date: '2024-08-20', in: false, out: true },
            ];

            const result = getUnavailableMonths(availableDates, null);

            expect(result).toEqual(['June 2024', 'July 2024']);
        });

        it('should return months where all date in values are unavailable when from is defined', () => {
            const availableDates: IAvailableDate[] = [
                { date: '2024-06-01', in: false, out: false },
                { date: '2024-06-15', in: false, out: false },
                { date: '2024-07-01', in: true, out: false },
                { date: '2024-07-10', in: false, out: false },
                { date: '2024-08-05', in: false, out: false },
                { date: '2024-08-20', in: false, out: true },
            ];

            const result = getUnavailableMonths(availableDates, new Date('2024-12-01'));

            expect(result).toEqual(['June 2024', 'August 2024']);
        });

        it('should returns an empty array if there is no month where all date out values are unavailable when from is null', () => {
            const availableDates: IAvailableDate[] = [
                { date: '2024-06-01', in: false, out: true },
                { date: '2024-06-15', in: false, out: false },
            ];

            const result = getUnavailableMonths(availableDates, null);

            expect(result).toEqual([]);
        });

        it('should returns an empty array if there is no month where all date in values are unavailable when from is defined', () => {
            const availableDates: IAvailableDate[] = [
                { date: '2024-06-01', in: true, out: false },
                { date: '2024-06-15', in: false, out: false },
            ];

            const result = getUnavailableMonths(availableDates, new Date('2024-12-01'));

            expect(result).toEqual([]);
        });
    });

    describe('groupByMonthsWithYear', () => {
        it('should group available dates by years and months', () => {
            const result = groupByMonthsWithYear([
                { date: '2024-01-01', in: true, out: false },
                { date: '2024-02-01', in: false, out: true },
                { date: '2025-01-01', in: true, out: false },
                { date: '2025-02-01', in: false, out: true },
            ]);
            expect(result).toEqual({
                'January 2024': [{ date: '2024-01-01', in: true, out: false }],
                'February 2024': [{ date: '2024-02-01', in: false, out: true }],
                'January 2025': [{ date: '2025-01-01', in: true, out: false }],
                'February 2025': [{ date: '2025-02-01', in: false, out: true }],
            });
        });
    });

    describe('getFirstDisplayedMonthOnDesktop', () => {
        const minDate = new Date('2026-01-01');

        it('should return selected month when from is selected', () => {
            const availableDates = [{ date: '2026-05-18', in: true, out: false }];
            const from = new Date('2026-05-18');

            const result = getFirstDisplayedMonthOnDesktop(availableDates, from, minDate, []);

            expect(result).toEqual(new Date('2026-05-18'));
        });

        it('should return min date when no selected from', () => {
            const availableDates = [{ date: '2026-01-01', in: true, out: false }];

            const result = getFirstDisplayedMonthOnDesktop(availableDates, null, minDate, []);

            expect(result).toEqual(minDate);
        });

        it('should return min date when no availability', () => {
            const result = getFirstDisplayedMonthOnDesktop([], null, minDate, []);

            expect(result).toEqual(minDate);
        });

        it('should find first available month when day available for departure when current month does not have availability', () => {
            const availableDates = [
                { date: '2026-01-01', in: false, out: false },
                { date: '2026-01-01', in: false, out: false },
                { date: '2026-02-01', in: true, out: true },
            ];

            const result = getFirstDisplayedMonthOnDesktop(availableDates, null, minDate, ['January 2026']);

            expect(result).toEqual(new Date('2026-02-01'));
        });
    });
});
