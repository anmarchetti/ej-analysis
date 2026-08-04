import dayjs from 'dayjs';

import { getFirstAvailableMonth } from './MonthPickerSubTab.utils';

describe('getFirstAvailableMonth', () => {
    beforeAll(() => {
        jest.useFakeTimers().setSystemTime(new Date('2023-06-13'));
    });

    afterAll(() => {
        jest.useRealTimers();
    });

    it('should return first day of current month when month is available', () => {
        const result = getFirstAvailableMonth([6]);
        expect(result).toStrictEqual(dayjs('2023-06-01'));
    });

    it('should return first day of current month when availableMonths array is empty', () => {
        const result = getFirstAvailableMonth([]);
        expect(result).toStrictEqual(dayjs('2023-06-01'));
    });

    it('should return first day of nearest available month', () => {
        const result = getFirstAvailableMonth([8]);
        expect(result).toStrictEqual(dayjs('2023-08-01'));
    });

    it('fallback to avoid loop should return first day of current month', () => {
        const result = getFirstAvailableMonth([23]);
        expect(result).toStrictEqual(dayjs('2023-06-01'));
    });
});
