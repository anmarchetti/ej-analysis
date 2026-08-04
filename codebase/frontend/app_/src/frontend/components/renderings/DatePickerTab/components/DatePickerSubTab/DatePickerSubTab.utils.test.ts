import { calculateExcludedDates } from './DatePickerSubTab.utils';

describe('DatePickerTab utils', () => {
    describe('calculateExcludedDates', () => {
        const availableDates = [
            {
                date: '2024-10-08',
                in: true,
                out: true,
            },
            {
                date: '2024-10-09',
                in: false,
                out: true,
            },
            {
                date: '2024-10-10',
                in: true,
                out: false,
            },
            {
                date: '2024-10-11',
                in: false,
                out: false,
            },
        ];

        it('should return all dates with out false', () => {
            const result = calculateExcludedDates(availableDates, 'out');
            expect(result).toMatchObject([new Date('2024-10-10'), new Date('2024-10-11')]);
        });

        it('should return all dates with in false', () => {
            const result = calculateExcludedDates(availableDates, 'in');
            expect(result).toMatchObject([new Date('2024-10-09'), new Date('2024-10-11')]);
        });
    });
});
