import dayjs, { ConfigType as DateType, Dayjs } from 'dayjs';

import { ONE_HUNDRED } from 'code/commonNumbers';
import {
    DATE_FORMATS,
    DateLocalizedFormats,
    DAYJS_LOCALES_CONFIG,
    DayjsLocale,
    IAbbreviations,
    TIME_UNITS,
} from 'code/dates';
import { Tokens } from 'code/tokens';
import { LayoutStore } from 'frontend/store/holidays';
import { ICountdownTime } from 'models/data/ICountdownBaner';
import { ITimeSlot } from 'models/data/ITimeSlot';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ITimeUnitConfig, TimeUnitsDictionary } from 'models/enum/TimeUnitsDictionary';

import { Tokenizer } from './tokenizer';

/**
 * Format date by specific token based on global locale (default English locale);
 * If token is not provided, the default one will be used.
 * @param date date to format
 * @param format date format
 */
export function formatDateL10n(
    date: DateType | null,
    format: string = DATE_FORMATS.default,
    customLocale?: DayjsLocale,
): string {
    if (!date) return '';

    const d = typeof date === 'string' ? getDate(date) : date;

    const locale = customLocale ?? dayjs.locale();
    const config = dayjs.Ls[locale]?.customFormats;
    let formatForUsing = format;

    if (config) {
        const dayJsCustomFormatsList = Object.keys(config);
        const customFormat = config[`${format}`];
        formatForUsing = dayJsCustomFormatsList.includes(format) ? customFormat : format;
    }

    return customLocale
        ? dayjs(d).locale(DAYJS_LOCALES_CONFIG[locale].key).format(formatForUsing)
        : dayjs(d).format(formatForUsing);
}

/** Format date to query string (YYYY-MM-DD by default) */
export function formatDateToQuery(date: DateType | null, format = DATE_FORMATS.query): string {
    return formatDateL10n(date, format);
}

/**
 * Parse date by specific template. If template not provided then will use default one
 * @param date string date to parse
 * @param format date format
 * @param isStrict use strict parsing
 */
export function parseDateL10n(date: string, format = DATE_FORMATS.default, isStrict?: boolean): Date | null {
    const d = dayjs(date, format, isStrict);

    if (d.isValid()) {
        return d.toDate();
    }

    return null;
}

export function isValidDate(date: DateType, format?: string): boolean {
    return dayjs(date, format, true).isValid();
}

/**
 * Get sting {from} - {to} with formatted dates (default template)
 * @param from date from
 * @param to date to
 * @param tokenFrom format token for date from.
 * @param tokenTo format token for date to. If it's not provided, tokenFrom will be used.
 */
export function formatDatesRange(
    from: DateType,
    to: DateType,
    tokenFrom: string = DATE_FORMATS.default,
    tokenTo: string = tokenFrom,
    customLocale?: DayjsLocale,
): string {
    return `${formatDateL10n(from, tokenFrom, customLocale)} - ${formatDateL10n(to, tokenTo, customLocale)}`;
}

export function formatHolidayDatesRange(from: Date, to: Date): string {
    const fromMonth = from.getMonth();
    const toMonth = to.getMonth();
    const fromYear = from.getFullYear();
    const toYear = to.getFullYear();

    if (fromYear === toYear && fromMonth === toMonth) {
        return formatDatesRange(from, to, 'D', 'D MMM YYYY');
    }

    if (fromYear === toYear) {
        return formatDatesRange(from, to, 'D MMM', 'D MMM YYYY');
    }

    return formatDatesRange(from, to, 'D MMM YYYY');
}

/**
 * Return date based on passed params.
 * @param dateString date string format
 */
export function getDate(dateString: string): Date {
    if (/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(dateString)) {
        const a = dateString.split(/[^0-9]/);

        return new Date(
            parseInt(a[0]),
            parseInt(a[1]) - 1,
            parseInt(a[2]),
            parseInt(a[3]),
            parseInt(a[4]),
            parseInt(a[5]),
        );
    }

    if (/\d{2}-\d{2}-\d{4}/.test(dateString)) {
        /** Workaround for safari  */
        const a = dateString.split(/[^0-9]/);

        return new Date(parseInt(a[2]), parseInt(a[1]) - 1, parseInt(a[0]), 0, 0, 0);
    }

    if (/\d{4}-\d{2}-\d{2}/.test(dateString)) {
        /** Workaround for safari  */
        const a = dateString.split(/[^0-9]/);

        return new Date(parseInt(a[0]), parseInt(a[1]) - 1, parseInt(a[2]), 0, 0, 0);
    }

    return new Date(dateString);
}

/**
 * Returns the difference between dates in days (date1 should be greater)
 */
export function getDaysDifference(date1: Date, date2: Date, withoutRounding?: boolean): number {
    const dateDiff = date1.getTime() - date2.getTime();

    return withoutRounding
        ? dateDiff / TIME_UNITS.millisecondsInDay
        : Math.round(dateDiff / TIME_UNITS.millisecondsInDay);
}

/**
 * Returns the difference between dates in month
 * Incomplete months are not counted in the difference
 */
export const getFullMonthsDifference = (date1: Date, date2: Date): number => {
    let months: number;
    months = (date1.getFullYear() - date2.getFullYear()) * TIME_UNITS.monthsInYear;
    months -= date2.getMonth();
    months += date1.getMonth();

    return months <= 0 ? 0 : months;
};

export const getMonthsDifference = (startDate: Date, endDate: Date): number => {
    if (startDate < endDate) {
        return 0;
    }

    const yearsDiff = startDate.getFullYear() - endDate.getFullYear();
    const monthsDiff = startDate.getMonth() - endDate.getMonth();

    let totalMonths = yearsDiff * TIME_UNITS.monthsInYear + monthsDiff;

    if (startDate.getDate() !== endDate.getDate()) {
        totalMonths += 1;
    }

    return totalMonths;
};

export const getDaysDifferenceRoundedFloor = (date1: Date, date2: Date): number => {
    const dateDiff = date1.getTime() - date2.getTime();

    return Math.floor(dateDiff / TIME_UNITS.millisecondsInDay);
};

export const getHoursDifference = (date1: Date, date2: Date): number => {
    const dateDiff = date1.getTime() - date2.getTime();

    return Math.floor((dateDiff % TIME_UNITS.millisecondsInDay) / TIME_UNITS.millisecondsInHour);
};

// Returns total number of hours between two dates
export const getTotalHoursDifference = (date1: Date, date2: Date): number => {
    const dateDiff = (date1.getTime() - date2.getTime()) / TIME_UNITS.millisecondsInHour;

    return Math.floor(dateDiff);
};

// Returns total number of minutes between two dates
export const getTotalMinutesDifference = (date1: Date, date2: Date): number => {
    const dateDiff = (date1.getTime() - date2.getTime()) / TIME_UNITS.millisecondsInMinute;

    return Math.floor(dateDiff);
};

export const getMinutesDifference = (date1: Date, date2: Date): number => {
    const dateDiff = date1.getTime() - date2.getTime();

    return Math.floor(
        ((dateDiff % TIME_UNITS.millisecondsInDay) % TIME_UNITS.millisecondsInHour) / TIME_UNITS.millisecondsInMinute,
    );
};

export const getSecondsDifference = (date1: Date, date2: Date): number => {
    const dateDiff = date1.getTime() - date2.getTime();

    return Math.round(
        (((dateDiff % TIME_UNITS.millisecondsInDay) % TIME_UNITS.millisecondsInHour) %
            TIME_UNITS.millisecondsInMinute) /
            TIME_UNITS.millisecondsInSecond,
    );
};

export const getCountdownTime = (
    futureDate: Date,
    now: Date,
    getTimeUnitLabel: (time: number, config: ITimeUnitConfig) => string,
): ICountdownTime[] => {
    const daysValue = Math.max(getDaysDifferenceRoundedFloor(futureDate, now), 0);
    const hoursValue = Math.max(getHoursDifference(futureDate, now), 0);
    const minutesValue = Math.max(getMinutesDifference(futureDate, now), 0);
    const secondsValue = Math.max(getSecondsDifference(futureDate, now), 0);

    return [
        { value: daysValue, label: getTimeUnitLabel(daysValue, TimeUnitsDictionary.days) },
        { value: hoursValue, label: getTimeUnitLabel(hoursValue, TimeUnitsDictionary.hours) },
        { value: minutesValue, label: getTimeUnitLabel(minutesValue, TimeUnitsDictionary.minutes) },
        { value: secondsValue, label: getTimeUnitLabel(secondsValue, TimeUnitsDictionary.seconds) },
    ];
};

export const compareDates = (a: string | Date, b: string | Date): number => {
    const dateA = new Date(a);
    const dateB = new Date(b);

    return dateA.getTime() - dateB.getTime();
};

// Returns the difference between full years, does not take into account the current date
export const getYearsDifference = (date1: Date, date2: Date): number => date1.getFullYear() - date2.getFullYear();

export const createDayjsDate = (year: number, month: number, day: number): Dayjs => dayjs(`${year}-${month}-${day}`);

export function watermarkDate(
    currentValue: string | undefined,
    newValue: string,
    watermark: string = 'dd/mm/yyy',
): string {
    const separator = watermark.match(/[^a-zA-Z]/g)?.[0] || '';
    const prevVal = (currentValue || '').replaceAll(separator, '');
    let val = newValue.replaceAll(separator, '');

    const watermarkSpaces = {
        monthStart: 2,
        yearStart: 4,
        yearEnd: 8,
    };

    if (prevVal === val && currentValue !== newValue && currentValue === newValue + separator) {
        val = val.substring(0, val.length - 1);
    }

    if (val.length >= watermarkSpaces.yearStart) {
        return `${val.substring(0, watermarkSpaces.monthStart)}${separator}${val.substring(
            watermarkSpaces.monthStart,
            watermarkSpaces.yearStart,
        )}${separator}${val.substring(watermarkSpaces.yearStart, watermarkSpaces.yearEnd)}`;
    }

    if (val.length >= watermarkSpaces.monthStart) {
        return `${val.substring(0, watermarkSpaces.monthStart)}${separator}${val.substring(
            watermarkSpaces.monthStart,
            watermarkSpaces.yearStart,
        )}`;
    }

    return val;
}

/**
 * Is date in the past
 * @param date
 */
export function isExpired(date: string, format = DATE_FORMATS.default): boolean {
    const now = new Date();
    const parsedDate = parseDateL10n(date, format);

    return !parsedDate || parsedDate < now;
}

/** Check if date is greater then minDate and less then maxDate */
export const isDateInRange = (date: Date, minDate: Date, maxDate: Date): boolean =>
    date.getTime() >= minDate.getTime() && date.getTime() <= maxDate.getTime();

/**
 * Check if user can pay remaining balance
 */
export const canPayRemainingBalance = (dueDateString: string): boolean => {
    if (!dueDateString) {
        return false;
    }

    const dueDate = new Date(dueDateString);
    dueDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return dueDate.getTime() - today.getTime() > 0;
};

export const getMaxDateInMonth = (maxDate: Date): Date => {
    const date = new Date(maxDate);
    date.setDate(1);
    date.setMonth(date.getMonth() + 1);
    date.setDate(0);

    return date;
};

export const isTimeInRange = (
    time: string,
    startTime: string,
    endTime: string,
    timeFormat: string = DATE_FORMATS.timeFilter,
): boolean => {
    const dateFormat = `DD/MM/YYYY${timeFormat}`;
    const baseDay = '01/01/2000';
    const secondDay = 2;

    // Create Date objects for each time
    const date = parseDateL10n(`${baseDay}${time}`, dateFormat);
    const startDate = parseDateL10n(`${baseDay}${startTime}`, dateFormat);
    const endDate = parseDateL10n(`${baseDay}${endTime}`, dateFormat);

    if (!date || !startDate || !endDate) return false;

    // Handle case if time range between 2 days (e.g [18:00 - 6:00])
    if (startDate.getTime() > endDate.getTime()) {
        endDate.setDate(secondDay); // add one day to endDate
        startDate.getTime() > date.getTime() && date.setDate(secondDay); // add one day to current date
    }

    return isDateInRange(date, startDate, endDate);
};

export const isTimeInTimeSlots = (time: string, timeSlots: ITimeSlot[]): boolean =>
    !!time && timeSlots.some(timeSlot => isTimeInRange(time, timeSlot.start, timeSlot.end));

/**
 * Get the date without Daylight Saving Time offset (DST, aka "Summer Time").
 * It's used to fix an issue with parsing API dates (EJH-14078)
 * API returns date in the departure/arrival country timezone. It uses one time zone, even if DST is observed.
 * E.g. It always returns +00:00 for UK, but JS Date() add extra hour to adjust for DST and it causes an issue.
 */
export function getDateWithoutDSTOffset(dateString: string): Date {
    const date = new Date(dateString);
    const time = date.getTime();
    const dstOffset = getDSTOffset(date) * TIME_UNITS.secondsInMinute * TIME_UNITS.millisecondsInSecond;

    return new Date(time - dstOffset);
}

/** Get the Daylight Saving Time Offset in minutes  */
export function getDSTOffset(date: Date): number {
    const monthIndexForDST = 6;
    const dateOffset = date.getTimezoneOffset();
    const winterOffset = new Date(date.getFullYear(), 0, 1).getTimezoneOffset();
    const summerOffset = new Date(date.getFullYear(), monthIndexForDST, 1).getTimezoneOffset();
    const standardOffset = Math.max(winterOffset, summerOffset);

    // DST is observed, if date offset is less then Standard Timezone Offset.
    if (dateOffset < standardOffset) {
        return standardOffset - dateOffset;
    }

    return 0;
}

export const getMinutesLocalized = (minutes: number, getPhrase: (key: string) => string): string => {
    const result: string[] = [];

    const hours = minutes ? Math.floor(minutes / TIME_UNITS.minutesInHour) : 0;
    const mins = minutes ? minutes % TIME_UNITS.minutesInHour : 0;

    if (hours) {
        result.push(
            `${hours} ${getPhrase(
                hours === 1
                    ? SitecoreDictionary.GlobalsLabelsTimeHourSingularAbbr
                    : SitecoreDictionary.GlobalsLabelsTimeHoursPluralAbbr,
            )}`,
        );
    }

    if (mins) {
        result.push(
            `${mins} ${getPhrase(
                mins === 1
                    ? SitecoreDictionary.GlobalsLabelsTimeMinuteSingularAbbr
                    : SitecoreDictionary.GlobalsLabelsTimeMinutesPluralAbbr,
            )}`,
        );
    }

    return result.join(' ');
};

/**
 * Only subtracting 1 month is not suitable for cases related to March 30 or December 31.
 * Checking the equality of months is necessary for cases where the day limit is exceeded
 * and there is no 31st day in the previous month for example.
 */
export function getPreviousMonthDate(date: Date): Date {
    const result = new Date(date);
    const month = result.getMonth();

    result.setMonth(result.getMonth() - 1);

    while (result.getMonth() === month) {
        result.setDate(result.getDate() - 1);
    }

    return result;
}

/** Add set number of days to a date */
export function addDays(days: number, date?: Nullable<Date>): Date {
    const result = date ? new Date(date) : new Date();

    result.setDate(result.getDate() + days);

    return result;
}

/** Check if format token is localized */
export function isLocalizedFormat(format: string): format is DateLocalizedFormats {
    return Object.values<string>(DateLocalizedFormats).includes(format);
}

/**
 * Get value of localized format token based on current locale.
 * Eg. for localized format "L" will be return "DD/YY/MMMM" in English locale.
 */
export function getLocalizedFormatValue(localizedFormat: keyof IAbbreviations): string {
    const locale = dayjs.locale();
    const localeConfig = dayjs.Ls[locale];
    const engLettersAbbreviation = localeConfig?.formats?.[localizedFormat] || '';

    return localeConfig?.abbreviation?.[localizedFormat] || engLettersAbbreviation;
}

export const isDateInRangeOfPastMonths = (date: Date, numberOfMonths: number): boolean => {
    let currentDate = new Date();
    let maxDaysDifference = 0;
    const daysDifference = getDaysDifferenceRoundedFloor(currentDate, date);
    for (let i = 0; i < numberOfMonths; i++) {
        maxDaysDifference += getDaysInMonth(currentDate);
        currentDate = getPreviousMonthDate(currentDate);
    }

    return daysDifference <= maxDaysDifference;
};

export const getDaysInMonth = (date: Date): number => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

export const isDateIncludedInArray = (day: Dayjs, array: Dayjs[]): boolean =>
    array.some(item => item.isSame(day, 'day'));

/** Check if two dates are in the same month */
export const isSameMonth = (date1: Date, date2: Date): boolean => date1.getMonth() === date2.getMonth();

export const getMonthName = (monthNumber: number): string =>
    formatDateL10n(dayjs().month(monthNumber), DATE_FORMATS.fullMonth);

export const getCountOfNightLabel = (selectedNumberOfNights: number, getPhrase: LayoutStore['getPhrase']): string => {
    const nightsPhrase =
        selectedNumberOfNights === 1
            ? getPhrase(SitecoreDictionary.DatePickerLabelsSelectedNightsSingular)
            : getPhrase(SitecoreDictionary.DatePickerLabelsSelectedNights);

    return Tokenizer.replaceToken(nightsPhrase, Tokens.Count, selectedNumberOfNights.toString());
};

export const getYearsBetweenTwoDates = (startDate: Dayjs, endDate: Dayjs): number[] => {
    if (!startDate.isValid() || !endDate.isValid()) {
        return [];
    }

    const startYear = startDate.year();
    const endYear = endDate.year();

    return Array.from({ length: endYear - startYear + 1 }, (_, index) => startYear + index);
};

export const isPeriodOutOfRange = (
    [startPeriodDate, endPeriodDate]: [Dayjs, Dayjs],
    [minDate, maxDate]: [Date, Date],
): boolean => startPeriodDate.isBefore(minDate) || endPeriodDate.isAfter(maxDate);

export const findClosestDate = (originalDate: Dayjs, date1: Dayjs, date2: Dayjs): Dayjs => {
    const diff1 = Math.abs(originalDate.diff(date1));
    const diff2 = Math.abs(originalDate.diff(date2));

    return diff1 < diff2 ? date1 : date2;
};

export const getTimeWithoutSeconds = (time: string) => {
    const [hours, minutes] = time.split(':');

    return `${hours}:${minutes}`;
};

export const isDateGreater = (date1: DateType, date2: DateType): boolean => {
    if (!date1 || !date2) {
        return false;
    }

    return dayjs(date1).isAfter(dayjs(date2));
};

export const isDateInCurrentMonth = (date: Date): boolean => {
    const currentDate = new Date();

    return date.getFullYear() === currentDate.getFullYear() && date.getMonth() === currentDate.getMonth();
};

export const autoCompleteDateYear = (value: string): string => {
    const shortDateRegex = /^(\d{2})([/.])(\d{2})\2(\d{2})$/;
    let replaceValue: string = value;
    const match = new RegExp(shortDateRegex).exec(value);

    if (match) {
        const [, day, separator, month, year] = match;
        const century = Math.floor(new Date().getFullYear() / ONE_HUNDRED);
        replaceValue = `${day}${separator}${month}${separator}${century}${year}`;
    }

    return replaceValue;
};
