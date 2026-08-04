import dayjs from 'dayjs';

import { ICheapestMonth } from 'models/data/ICheapestMonth';

import { getMonthFields } from './MonthViewDropdown.utils';

describe('MonthViewDropdown.utils', () => {
    describe('getMonthFields', () => {
        const date = dayjs('2025-03-01');

        it('should return correct date, monthName and year', () => {
            const result = getMonthFields(date, undefined);

            expect(result.date).toBe(date);
            expect(result.year).toBe(2025);
            expect(result.monthName).toBe(date.format('MMMM'));
        });

        it('should return zero prices when cheapestMonthList is undefined', () => {
            const result = getMonthFields(date, undefined);

            expect(result.cheapestMonthPrice).toBe(0);
            expect(result.cheapestMonthPricePP).toBe(0);
        });

        it('should return zero prices when cheapestMonthList is empty', () => {
            const result = getMonthFields(date, []);

            expect(result.cheapestMonthPrice).toBe(0);
            expect(result.cheapestMonthPricePP).toBe(0);
        });

        it('should return prices from matching cheapest month', () => {
            const cheapestMonthList: ICheapestMonth[] = [
                { year: 2025, month: 2, price: 500, pricePP: 250, searchStartDate: '2025-03-01' },
            ];

            const result = getMonthFields(date, cheapestMonthList);

            expect(result.cheapestMonthPrice).toBe(500);
            expect(result.cheapestMonthPricePP).toBe(250);
        });

        it('should return zero prices when no entry matches year and month', () => {
            const cheapestMonthList: ICheapestMonth[] = [
                { year: 2025, month: 5, price: 999, pricePP: 499, searchStartDate: '2025-06-01' },
                { year: 2024, month: 2, price: 300, pricePP: 150, searchStartDate: '2024-03-01' },
            ];

            const result = getMonthFields(date, cheapestMonthList);

            expect(result.cheapestMonthPrice).toBe(0);
            expect(result.cheapestMonthPricePP).toBe(0);
        });
    });
});
