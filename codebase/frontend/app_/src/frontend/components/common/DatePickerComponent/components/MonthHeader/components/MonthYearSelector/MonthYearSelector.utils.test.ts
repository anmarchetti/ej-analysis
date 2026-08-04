import dayjs, { MonthNames } from 'dayjs';
import localeData from 'dayjs/plugin/localeData';

import { isPeriodOutOfRange } from 'frontend/utils/date.utils';

import {
    createMonthOption,
    createYearOption,
    getMonthsOptions,
    getYearsOptions,
    isOptionDisabled,
} from './MonthYearSelector.utils';

dayjs.extend(localeData);

jest.mock('frontend/utils/date.utils', () => ({
    ...jest.requireActual('frontend/utils/date.utils'),
    getYearsBetweenTwoDates: () => [2020, 2021],
    isPeriodOutOfRange: jest.fn(),
}));

const mockedMonths: MonthNames = [
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
];
jest.spyOn(dayjs, 'months').mockReturnValue(mockedMonths);

describe('MonthYearSelector utils', () => {
    describe('createMonthOption', () => {
        it('should return month option when date object passed', () => {
            const result = createMonthOption(new Date(2020, 1, 1));

            expect(result).toEqual({
                value: 1,
                label: 'February',
            });
        });

        it('should return month option when Dayjs object passed', () => {
            const dayjsDate = dayjs().set('year', 2020).set('month', 1).set('date', 1);
            const result = createMonthOption(dayjsDate);

            expect(result).toEqual({
                value: 1,
                label: 'February',
            });
        });
    });

    describe('createYearOption', () => {
        it('should return year option', () => {
            const result = createYearOption(new Date(2020, 1, 1));

            expect(result).toEqual({
                label: 2020,
                value: 2020,
            });
        });
    });

    describe('getMonthsOptions', () => {
        it('should return months options', () => {
            const result = getMonthsOptions();
            expect(result).toEqual([
                {
                    label: 'January',
                    value: 0,
                },
                {
                    label: 'February',
                    value: 1,
                },
                {
                    label: 'March',
                    value: 2,
                },
                {
                    label: 'April',
                    value: 3,
                },
                {
                    label: 'May',
                    value: 4,
                },
                {
                    label: 'June',
                    value: 5,
                },
                {
                    label: 'July',
                    value: 6,
                },
                {
                    label: 'August',
                    value: 7,
                },
                {
                    label: 'September',
                    value: 8,
                },
                {
                    label: 'October',
                    value: 9,
                },
                {
                    label: 'November',
                    value: 10,
                },
                {
                    label: 'December',
                    value: 11,
                },
            ]);
        });
    });

    describe('getYearsOptions', () => {
        it('should return years options', () => {
            const result = getYearsOptions(new Date(2020, 1, 1), new Date(2021, 1, 1));
            expect(result).toEqual([
                {
                    label: 2020,
                    value: 2020,
                },
                {
                    label: 2021,
                    value: 2021,
                },
            ]);
        });
    });

    describe('isOptionDisabled', () => {
        it('should return true if option is before min date', () => {
            const minDate = new Date('2023-12-01');
            const maxDate = new Date('2024-02-01');

            isOptionDisabled({ value: 0, label: 'January' }, { value: 2024, label: 2024 }, minDate, maxDate);

            expect(isPeriodOutOfRange).toHaveBeenCalledWith(
                [dayjs('2024-01-01'), dayjs('2024-01-01')],
                [minDate, maxDate],
            );
        });
    });
});
