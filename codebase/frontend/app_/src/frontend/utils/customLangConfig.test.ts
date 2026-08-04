import { customLocale } from 'frontend/utils/customLangConfig';

jest.mock('dayjs', () => ({
    __esModule: true,
    default: {
        locale: () => 'en',
        months: () => [
            'January',
            'February',
            'March',
            'April',
            'May',
            'June',
            'July',
            'August',
            'September',
            'October',
            'November',
            'December',
        ],
        weekdaysShort: () => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    },
}));

describe('customLocale', () => {
    describe('formatLong.date', () => {
        it('should return any format', () => {
            const result = customLocale.formatLong.date({ width: 'any' });
            expect(result).toBe('EEEE, d MMMM y');
        });

        it('should return full format', () => {
            const result = customLocale.formatLong.date({ width: 'full' });
            expect(result).toBe('EEEE, d MMMM y');
        });

        it('should return long format', () => {
            const result = customLocale.formatLong.date({ width: 'long' });
            expect(result).toBe('d MMMM y');
        });

        it('should return medium format', () => {
            const result = customLocale.formatLong.date({ width: 'medium' });
            expect(result).toBe('d MMM y');
        });

        it('should return short format', () => {
            const result = customLocale.formatLong.date({ width: 'short' });
            expect(result).toBe('dd.MM.y');
        });

        it('should return default format', () => {
            const result = customLocale.formatLong.date({ width: null });
            expect(result).toBe('EEEE, d MMMM y');
        });
    });

    it('localize.month should return month name', () => {
        const result = customLocale.localize.month(0);
        expect(result).toBe('January');
    });

    it('localize.day should return day name ', () => {
        const result = customLocale.localize.day(0);
        expect(result).toBe('Sun');
    });

    it('should return dayjs locale', () => {
        const result = customLocale.code;
        expect(result).toBe('en');
    });
});
