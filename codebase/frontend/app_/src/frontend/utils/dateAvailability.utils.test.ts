import { isDateAvailable } from './dateAvailability.utils';

describe('dateAvailability utils', () => {
    beforeAll(() => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date(2025, 6, 23));
    });

    afterAll(() => {
        jest.useRealTimers();
    });

    const availableDates = [
        { date: '2025-08-09', out: false, in: false },
        { date: '2025-08-10', out: true, in: true },
        { date: '2025-08-11', out: true, in: false },
        { date: '2025-08-12', out: false, in: true },
    ];

    describe('should return date out no matter what is in in field', () => {
        it('should return false for dates with out: false', () => {
            const res1 = isDateAvailable(new Date('2025-08-09'), availableDates, []);
            expect(res1).toBe(false);

            const res2 = isDateAvailable(new Date('2025-08-12'), availableDates, []);
            expect(res2).toBe(false);
        });

        it('should return true for dates with out: true', () => {
            const res1 = isDateAvailable(new Date('2025-08-10'), availableDates, []);
            expect(res1).toBe(true);

            const res2 = isDateAvailable(new Date('2025-08-11'), availableDates, []);
            expect(res2).toBe(true);
        });
    });

    describe('should return date in no matter what is out field when 1 date is selected', () => {
        it('should return true for dates with in: true', () => {
            const res1 = isDateAvailable(new Date('2025-08-10'), availableDates, [new Date('2025-08-09')]);
            expect(res1).toBe(true);

            const res2 = isDateAvailable(new Date('2025-08-12'), availableDates, [new Date('2025-08-09')]);
            expect(res2).toBe(true);
        });

        it('should return false for dates with in: false', () => {
            const res1 = isDateAvailable(new Date('2025-08-09'), availableDates, [new Date('2025-08-08')]);
            expect(res1).toBe(false);

            const res2 = isDateAvailable(new Date('2025-08-11'), availableDates, [new Date('2025-08-09')]);
            expect(res2).toBe(false);
        });
    });

    describe('should return false for the date of the availability of which is not loaded', () => {
        it('should return false when one date is selected', () => {
            const res = isDateAvailable(new Date('2025-08-13'), availableDates, [new Date('2025-08-09')]);
            expect(res).toBe(false);
        });

        it('should return false when no dates are selected', () => {
            const res = isDateAvailable(new Date('2025-08-13'), availableDates, []);
            expect(res).toBe(false);
        });
    });

    describe('should return date out  no matter what is in in field when 2 dates are selected', () => {
        it('should return false for dates with out: false', () => {
            const res1 = isDateAvailable(new Date('2025-08-09'), availableDates, [new Date(), new Date()]);
            expect(res1).toBe(false);

            const res2 = isDateAvailable(new Date('2025-08-12'), availableDates, [new Date(), new Date()]);
            expect(res2).toBe(false);
        });

        it('should return true for dates with out: true', () => {
            const res1 = isDateAvailable(new Date('2025-08-10'), availableDates, [new Date(), new Date()]);
            expect(res1).toBe(true);

            const res2 = isDateAvailable(new Date('2025-08-11'), availableDates, [new Date(), new Date()]);
            expect(res2).toBe(true);
        });
    });

    it('should should return true for dates before the selected one if they are available for departure', () => {
        const res = isDateAvailable(new Date('2025-08-10'), availableDates, [new Date('2025-08-11')]);
        expect(res).toBe(true);
    });
});
