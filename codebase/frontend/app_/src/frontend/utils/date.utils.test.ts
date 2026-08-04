import dayjs, { Dayjs } from 'dayjs';
import de from 'dayjs/locale/de';
import fr from 'dayjs/locale/fr';

import { DATE_FORMATS, DateCustomFormats, DateLocalizedFormats, DayjsLocale } from 'code/dates';
import { mockTokenizer } from 'frontend/__mocks__/utils/tokenizer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { TimeUnitsDictionary } from 'models/enum/TimeUnitsDictionary';

import {
    addDays,
    autoCompleteDateYear,
    createDayjsDate,
    findClosestDate,
    formatDateL10n,
    formatDatesRange,
    formatHolidayDatesRange,
    getCountdownTime,
    getCountOfNightLabel,
    getDate,
    getDaysDifference,
    getDaysInMonth,
    getFullMonthsDifference,
    getHoursDifference,
    getLocalizedFormatValue,
    getMinutesDifference,
    getMonthName,
    getMonthsDifference,
    getPreviousMonthDate,
    getTimeWithoutSeconds,
    getTotalMinutesDifference,
    getYearsBetweenTwoDates,
    isDateGreater,
    isDateIncludedInArray,
    isDateInCurrentMonth,
    isDateInRangeOfPastMonths,
    isExpired,
    isPeriodOutOfRange,
    isSameMonth,
    isTimeInRange,
    parseDateL10n,
} from './date.utils';

import 'dayjs/locale/en-gb';
import 'dayjs/locale/fr-ch';
import 'dayjs/locale/de-ch';

jest.mock('frontend/utils/tokenizer', () => ({
    __esModule: true,
    Tokenizer: mockTokenizer,
}));

describe('formatDate.ts', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date(2022, 0, 11));
    });

    describe('isDateGreater', () => {
        test('should return true when the first date is after the second date', () => {
            const laterDate = new Date('2022-12-31');
            const earlierDate = new Date('2022-01-01');
            expect(isDateGreater(laterDate, earlierDate)).toBe(true);
        });

        test('should return false when the first date is not after the second date', () => {
            const earlierDate = new Date('2022-01-01');
            const laterDate = new Date('2022-12-31');

            expect(isDateGreater(earlierDate, laterDate)).toBe(false);
        });

        test('should return false when any date is invalid', () => {
            const earlierDate = new Date('2022-01-01');
            const laterDate = new Date('2022-12-31');

            expect(isDateGreater(null, laterDate)).toBe(false);
            expect(isDateGreater(earlierDate, undefined)).toBe(false);
        });
    });

    describe('formatDate', () => {
        test('should format date with default token', () => {
            const d = new Date('2019-06-13T01:41:20.000Z');
            const formattedDate = formatDateL10n(d);
            expect(formattedDate).toBe('13-06-2019');
        });

        test('should format date with provided token', () => {
            const d = new Date('2019-06-13T01:41:20.000Z');
            const formattedDate = formatDateL10n(d, 'MM/DD/YYYY');
            expect(formattedDate).toBe('06/13/2019');
        });

        test('should format date with custom provided token', () => {
            jest.spyOn(dayjs, 'locale').mockReturnValue('de');
            const d = new Date('2019-06-13T01:41:20.000Z');
            const formattedDate = formatDateL10n(d, DATE_FORMATS.DayMonthYearAbbr);
            expect(formattedDate).toBe('13 Jun 2019');
        });

        test('should format date with custom locale when it is provided', () => {
            jest.spyOn(dayjs, 'locale').mockReturnValue('de');
            const d = new Date('2019-06-13T01:41:20.000Z');
            const formattedDate = formatDateL10n(d, DATE_FORMATS.fullMonthAndYear, DayjsLocale.En);
            expect(formattedDate).toBe('June 2019');
        });
    });

    describe('parseDate', () => {
        test('should return date for default format token', () => {
            const d = '02-01-2019';
            const formatedDate = parseDateL10n(d);
            expect(formatedDate).toEqual(new Date('Thu Jan 02 2019'));
        });

        test('should return date for template MM/DD/YYYY', () => {
            const d = '02/01/2019';
            const formatedDate = parseDateL10n(d, 'MM/DD/YYYY');
            expect(formatedDate).toEqual(new Date('Fri Feb 01 2019'));
        });
    });

    describe('formatDatesRange', () => {
        test('should return dates range', () => {
            const formatedDate = formatDatesRange(
                new Date('2019-05-02T01:41:20.000Z'),
                new Date('2019-06-02T01:41:20.000Z'),
            );
            expect(formatedDate).toBe('02-05-2019 - 02-06-2019');
        });

        test('should return dates range with custom locale when it is provided', () => {
            const formatedDate = formatDatesRange(
                new Date('2019-05-02T01:41:20.000Z'),
                new Date('2019-06-02T01:41:20.000Z'),
                DATE_FORMATS.L,
                DATE_FORMATS.L,
                DayjsLocale.En,
            );
            expect(formatedDate).toBe('02/05/2019 - 02/06/2019');
        });
    });

    describe('formatHolidaysDatesRange', () => {
        test('should return date as D - D MMM YYYY', () => {
            const from = new Date('2020-05-02T01:41:20.000Z');
            const to = new Date('2020-05-10T01:41:20.000Z');
            const formattedDateRange = formatHolidayDatesRange(from, to);
            expect(formattedDateRange).toBe('2 - 10 May 2020');
        });

        test('should return date as D MMM - D MMM YYYY', () => {
            const from = new Date('2020-05-02T01:41:20.000Z');
            const to = new Date('2020-10-10T01:41:20.000Z');
            const formattedDateRange = formatHolidayDatesRange(from, to);
            expect(formattedDateRange).toBe('2 May - 10 Oct 2020');
        });

        test('should return date as D MMM YYYY - D MMM YYYY', () => {
            const from = new Date('2020-05-02T01:41:20.000Z');
            const to = new Date('2021-10-10T01:41:20.000Z');
            const formattedDateRange = formatHolidayDatesRange(from, to);
            expect(formattedDateRange).toBe('2 May 2020 - 10 Oct 2021');
        });
    });

    describe('getDate', () => {
        test('should return date from passed values', () => {
            const finalDate = new Date('2019-05-02T10:45:30');
            const formatedDate = getDate('2019-05-02T10:45:30');
            expect(formatedDate).toEqual(finalDate);
        });
    });

    describe('getDaysDifference', () => {
        test('should return difference in days', () => {
            const days = getDaysDifference(new Date('2019-06-02'), new Date('2019-06-01'));
            expect(days).toBe(1);
        });

        test('should return difference in days without rounding', () => {
            const days = getDaysDifference(new Date('2019-06-02 13:00'), new Date('2019-06-01 10:00'), true);
            expect(days).toBe(1.125);
        });

        test('should return difference for many days', () => {
            const days = getDaysDifference(new Date('2019-07-02'), new Date('2019-06-02'));
            expect(days).toBe(30);
        });
    });

    describe('getHoursDifference', () => {
        test('should return difference in hours', () => {
            const days = getHoursDifference(
                new Date('December 1, 1995 05:00:00'),
                new Date('December 1, 1995 03:00:00'),
            );
            expect(days).toBe(2);
        });
    });

    describe('getMinutesDifference', () => {
        test('should return difference in minutes', () => {
            const days = getMinutesDifference(
                new Date('December 1, 1995 05:20:00'),
                new Date('December 1, 1995 03:00:00'),
            );
            expect(days).toBe(20);
        });
    });

    describe('getCountdownTime', () => {
        test('should return countdown values and labels for each time unit', () => {
            const now = new Date(1995, 11, 1, 3, 0, 10);
            const futureDate = new Date(1995, 11, 1, 5, 20, 40);
            const getTimeUnitLabel = jest.fn((time: number, config) => `${config.singular}-${time}`);

            const countdown = getCountdownTime(futureDate, now, getTimeUnitLabel);

            expect(countdown).toEqual([
                {
                    value: 0,
                    label: 'Globals.Labels.Time.DaySingular-0',
                },
                {
                    value: 2,
                    label: 'Globals.Labels.Time.HoursSingular-2',
                },
                {
                    value: 20,
                    label: 'Globals.Labels.Time.MinuteSingular-20',
                },
                {
                    value: 30,
                    label: 'Globals.Labels.Time.SecondSingular-30',
                },
            ]);

            expect(getTimeUnitLabel).toHaveBeenNthCalledWith(1, 0, TimeUnitsDictionary.days);
            expect(getTimeUnitLabel).toHaveBeenNthCalledWith(2, 2, TimeUnitsDictionary.hours);
            expect(getTimeUnitLabel).toHaveBeenNthCalledWith(3, 20, TimeUnitsDictionary.minutes);
            expect(getTimeUnitLabel).toHaveBeenNthCalledWith(4, 30, TimeUnitsDictionary.seconds);
        });

        test('should clamp all values to zero when future date is in the past', () => {
            const now = new Date(1995, 11, 1, 5, 20, 40);
            const futureDate = new Date(1995, 11, 1, 3, 0, 10);
            const getTimeUnitLabel = jest.fn(() => 'label');

            const countdown = getCountdownTime(futureDate, now, getTimeUnitLabel);

            expect(countdown).toEqual([
                { value: 0, label: 'label' },
                { value: 0, label: 'label' },
                { value: 0, label: 'label' },
                { value: 0, label: 'label' },
            ]);

            expect(getTimeUnitLabel).toHaveBeenNthCalledWith(1, 0, TimeUnitsDictionary.days);
            expect(getTimeUnitLabel).toHaveBeenNthCalledWith(2, 0, TimeUnitsDictionary.hours);
            expect(getTimeUnitLabel).toHaveBeenNthCalledWith(3, 0, TimeUnitsDictionary.minutes);
            expect(getTimeUnitLabel).toHaveBeenNthCalledWith(4, 0, TimeUnitsDictionary.seconds);
        });
    });

    describe('getTotalMinutesDifference', () => {
        test('should return total difference in minutes', () => {
            const minutes = getTotalMinutesDifference(
                new Date('December 1, 1995 05:20:00'),
                new Date('December 1, 1995 03:00:00'),
            );
            expect(minutes).toBe(140);
        });
    });

    describe('createDayjsDate', () => {
        test('should return correct date in datejs type', () => {
            const year = 1997;
            const month = 11;
            const monthIndex = month - 1;
            const date = 5;
            const res = createDayjsDate(year, month, date);

            expect(dayjs.isDayjs(res)).toBe(true);
            expect(res.year()).toBe(year);
            expect(res.month()).toBe(monthIndex);
            expect(res.date()).toBe(date);
        });
    });

    describe('isExpired', () => {
        test('should return true for past date', () => {
            expect(isExpired('13-06-2000')).toBeTruthy();
        });

        test('should return false for future date', () => {
            expect(isExpired('13-06-2100')).toBeFalsy();
        });
    });

    describe('addDays', () => {
        it('should return set date plus added days', () => {
            const startDate = new Date('2022-01-01');
            const addedDate = addDays(10, startDate);
            expect(addedDate).toEqual(new Date('2022-01-11'));
        });

        it('should add days to today', () => {
            const addedDate = addDays(10);
            expect(addedDate).toEqual(new Date('2022-01-21'));
        });
    });

    describe.each([
        ['0800', '0600', '1800', true],
        ['1801', '0600', '1800', false],
        ['1900', '1800', '0600', true],
        ['0000', '1800', '0600', true],
        ['1130', '1200', '1100', false],
    ])('isTimeInRange', (time, minTime, maxTime, expected) => {
        it(`should return ${expected} for ${time} in ${minTime}-${maxTime}`, () => {
            const res = isTimeInRange(time, minTime, maxTime);
            expect(res).toEqual(expected);
        });
    });

    describe.each([
        ['2022-03-29', '2022-02-28'],
        ['2022-03-30', '2022-02-28'],
        ['2022-03-31', '2022-02-28'],
        ['2022-12-31', '2022-11-30'],
        ['2022-01-31', '2021-12-31'],
        ['2022-05-15', '2022-04-15'],
    ])('getPreviousMonthDate', (date, expected) => {
        it(`should return ${expected} for ${date} date`, () => {
            const testValue = new Date(date);
            const expectedValue = new Date(expected);
            const res = getPreviousMonthDate(testValue);

            // check only the date values without time due to the timezone variance
            expect(res.getFullYear()).toEqual(expectedValue.getFullYear());
            expect(res.getMonth()).toEqual(expectedValue.getMonth());
            expect(res.getDate()).toEqual(expectedValue.getDate());
        });
    });

    describe('getLocalizedFormatValue', () => {
        jest.spyOn(dayjs, 'locale').mockReturnValue('fr');

        // add config with locales to dayjs, in code we use plugin updateLocale from dayjs
        Object.assign(dayjs.Ls, {
            fr: {
                formats: {
                    L: 'DD.MM.YYYY',
                },
                abbreviation: {
                    L: 'AA.MM.JJJJ',
                },
            },
            de: {
                formats: {
                    L: 'DD/MM/YYYY',
                },
                customFormats: {
                    [DateCustomFormats.DayMonthYearAbbr]: 'DD MMM YYYY',
                },
            },
        });

        it('should return abbreviation in english that exist for each lang in dayjs config by defaults when config is not extend by custom abbreviations', () => {
            jest.spyOn(dayjs, 'locale').mockReturnValue('de');

            expect(getLocalizedFormatValue(DateLocalizedFormats.L)).toBe('DD/MM/YYYY');
        });

        it('should return translated abbreviation when config is extend by custom abbreviations', () => {
            jest.spyOn(dayjs, 'locale').mockReturnValue('fr');

            expect(getLocalizedFormatValue(DateLocalizedFormats.L)).toBe('AA.MM.JJJJ');
        });

        it('should return empty string when cant define format', () => {
            jest.spyOn(dayjs, 'locale').mockReturnValue('fr');

            // @ts-ignore
            expect(getLocalizedFormatValue('test')).toBe('');
        });
    });

    describe('isDateInRangeOfPastMonths', () => {
        beforeEach(() => {
            jest.useFakeTimers({ now: new Date('2023-01-31') });
        });

        it('should return true when date is in range of 2 months', () => {
            expect(isDateInRangeOfPastMonths(new Date('2022-11-31'), 2)).toEqual(true);
        });

        it('should return false when date is out of range of 2 months', () => {
            expect(isDateInRangeOfPastMonths(new Date('2022-11-29'), 2)).toEqual(false);
        });

        it('should return true when date is in range of 3 months including February', () => {
            jest.useFakeTimers({ now: new Date('2023-03-28') });

            expect(isDateInRangeOfPastMonths(new Date('2022-12-31'), 3)).toEqual(true);
        });
    });

    describe('getDaysInMonth', () => {
        it('should return 29 days for February in 2024', () => {
            expect(getDaysInMonth(new Date('2024-02-01'))).toBe(29);
        });

        it('should return 31 days for January', () => {
            expect(getDaysInMonth(new Date('2024-01-01'))).toBe(31);
        });

        it('should return 30 days for November', () => {
            expect(getDaysInMonth(new Date('2024-11-01'))).toBe(30);
        });
    });

    describe('isDateIncludedInArray', () => {
        it('should return true when there is day in array', () => {
            const result = isDateIncludedInArray(dayjs('2024-06-13'), [dayjs('2024-06-13'), dayjs('2024-07-13')]);
            expect(result).toBe(true);
        });

        it('should return false when there is no day in array', () => {
            const result = isDateIncludedInArray(dayjs('2024-06-13'), [dayjs('2024-08-13'), dayjs('2024-07-13')]);
            expect(result).toBe(false);
        });
    });

    describe('isSameMonth', () => {
        it('should return true when moths is the same', () => {
            const result = isSameMonth(new Date('2026-02-01'), new Date('2025-02-01'));
            expect(result).toBe(true);
        });

        it('should return true when date is the same', () => {
            const result = isSameMonth(new Date('2026-02-01'), new Date('2026-02-01'));
            expect(result).toBe(true);
        });

        it('should return false when month is differ', () => {
            const result = isSameMonth(new Date('2026-02-01'), new Date('2026-03-01'));
            expect(result).toBe(false);
        });
    });

    describe.each([
        [1, 0, 'en', 'January'],
        [2, 11, 'en', 'December'],
        [3, 0, 'fr-ch', 'janvier'],
        [4, 11, 'fr-ch', 'décembre'],
        [5, 0, 'de-ch', 'Januar'],
        [6, 11, 'de-ch', 'Dezember'],
        [7, 0, 'fr', 'janvier'],
        [8, 11, 'fr', 'décembre'],
        [9, 0, 'de', 'Januar'],
        [10, 11, 'de', 'Dezember'],
    ])('getMonthName', (index, monthNumber, locale, expected) => {
        beforeEach(() => {
            jest.spyOn(dayjs, 'locale').mockRestore();
            Object.assign(dayjs.Ls, {
                fr,
                de,
            });
        });

        it(`${index}. should return ${expected} for ${monthNumber} month number in ${locale} locale`, () => {
            dayjs.locale(locale);

            const result = getMonthName(monthNumber);
            expect(result).toBe(expected);
        });
    });

    describe('getCountOfNightLabel', () => {
        const getPhrase = p => p;

        it('should return singular night label', () => {
            const result = getCountOfNightLabel(1, getPhrase);
            expect(result).toBe(`${SitecoreDictionary.DatePickerLabelsSelectedNightsSingular} 1`);
        });

        it('should return plural night label', () => {
            const result = getCountOfNightLabel(2, getPhrase);
            expect(result).toBe(`${SitecoreDictionary.DatePickerLabelsSelectedNights} 2`);
        });
    });

    describe('getYearsBetweenTwoDates', () => {
        it('should return years between two dates', () => {
            const result = getYearsBetweenTwoDates(dayjs('2024-12-13'), dayjs('2025-01-31'));

            expect(result).toMatchObject([2024, 2025]);
        });

        it('should return one year', () => {
            const result = getYearsBetweenTwoDates(dayjs('2024-01-13'), dayjs('2024-11-31'));

            expect(result).toMatchObject([2024]);
        });

        it('should return empty array when first date is not valid', () => {
            const result = getYearsBetweenTwoDates(dayjs('gfgf'), dayjs('2024-01-01'));

            expect(result).toMatchObject([]);
        });

        it('should return empty array when second date is not valid', () => {
            const result = getYearsBetweenTwoDates(dayjs('2022-01-01'), dayjs('dfgdf'));

            expect(result).toMatchObject([]);
        });
    });

    describe('isPeriodOutOfRange', () => {
        const minDate = new Date('2025-01-01');
        const maxDate = new Date('2025-12-31');
        const range: [Date, Date] = [minDate, maxDate];
        let startPeriodDate;
        let endPeriodDate;

        beforeEach(() => {
            startPeriodDate = dayjs('2025-01-01');
            endPeriodDate = dayjs('2025-12-31');
        });

        it('should return true when period is started before range', () => {
            startPeriodDate = dayjs('2024-01-01');
            const period: [Dayjs, Dayjs] = [startPeriodDate, endPeriodDate];
            const result = isPeriodOutOfRange(period, range);

            expect(result).toBe(true);
        });

        it('should return true when the period ends after the range', () => {
            endPeriodDate = dayjs('2026-12-31');
            const period: [Dayjs, Dayjs] = [startPeriodDate, endPeriodDate];
            const result = isPeriodOutOfRange(period, range);

            expect(result).toBe(true);
        });

        it('should return false if period is in range', () => {
            const period: [Dayjs, Dayjs] = [startPeriodDate, endPeriodDate];
            const result = isPeriodOutOfRange(period, range);

            expect(result).toBe(false);
        });
    });

    describe('findClosestDate', () => {
        let original;
        let date1;
        let date2;

        beforeEach(() => {
            original = dayjs('2024-06-15');
            date1 = dayjs('2024-03-01');
            date2 = dayjs('2024-09-29');
        });

        it('should return the second date when both are equidistant', () => {
            const closest = findClosestDate(original, date1, date2);

            expect(closest.isSame(date2)).toBe(true);
        });

        it('should return the second date when it is earlier', () => {
            date2 = dayjs('2024-07-15');
            const closest = findClosestDate(original, date1, date2);

            expect(closest.isSame(date2)).toBe(true);
        });

        it('should return the first date when the second one is later', () => {
            date2 = dayjs('2025-07-15');
            const closest = findClosestDate(original, date1, date2);

            expect(closest.isSame(date1)).toBe(true);
        });
    });

    describe('getTimeWithoutSeconds', () => {
        it('should return hours and minutes if given time has the seconds', () => {
            const time = '23:05:45';

            expect(getTimeWithoutSeconds(time)).toBe('23:05');
        });

        it('should return hours and minutes if given time have just hours and minutes', () => {
            const time = '22:15';

            expect(getTimeWithoutSeconds(time)).toBe('22:15');
        });
    });

    describe.each([[new Date('2025-08-14'), new Date('2026-10-31'), 14]])(
        'getFullMonthsDifference',
        (date1, date2, expected) => {
            it(`should return ${expected} for ${date1.toString()} - ${date2.toString()}`, () => {
                const result = getFullMonthsDifference(date2, date1);
                expect(result).toBe(expected);
            });
        },
    );

    describe.each([
        [new Date('2025-08-14'), new Date('2026-10-31'), 15],
        [new Date('2025-08-01'), new Date('2025-08-31'), 1],
        [new Date('2026-01-16'), new Date('2026-02-28'), 2],
        [new Date('2025-08-18'), new Date('2026-09-13'), 14],
        [new Date('2026-08-18'), new Date('2025-09-13'), 0],
    ])('getMonthsDifference', (date1, date2, expected) => {
        it(`should return ${expected} for ${date1.toString()} - ${date2.toString()}`, () => {
            const result = getMonthsDifference(date2, date1);
            expect(result).toBe(expected);
        });
    });

    describe('isDateInCurrentMonth', () => {
        beforeEach(() => {
            jest.useFakeTimers({ now: new Date('2025-12-11') });
        });

        it('should return true when date at the beginning of current month', () => {
            expect(isDateInCurrentMonth(new Date('2025-12-01'))).toEqual(true);
        });

        it('should return true when date at the end of current month', () => {
            expect(isDateInCurrentMonth(new Date('2025-12-31'))).toEqual(true);
        });

        it('should return false when date is out of current month', () => {
            expect(isDateInCurrentMonth(new Date('2025-11-29'))).toEqual(false);
        });
    });

    describe('autoCompleteDateYear', () => {
        it('should expand 2-digit year to 4-digit year with "/" separator', () => {
            const result = autoCompleteDateYear('15/06/26');

            expect(result).toBe('15/06/2026');
        });

        it('should expand 2-digit year to 4-digit year with "." separator', () => {
            const result = autoCompleteDateYear('15.06.26');

            expect(result).toBe('15.06.2026');
        });

        it('should NOT modify date when year is already 4 digits with "/" separator', () => {
            const result = autoCompleteDateYear('15/06/2026');

            expect(result).toBe('15/06/2026');
        });

        it('should NOT modify date when year is already 4 digits with "." separator', () => {
            const result = autoCompleteDateYear('15.06.2026');

            expect(result).toBe('15.06.2026');
        });

        it('should NOT modify date when separators are mixed', () => {
            const result = autoCompleteDateYear('15/06.26');

            expect(result).toBe('15/06.26');
        });
    });
});
