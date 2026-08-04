import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import localeData from 'dayjs/plugin/localeData';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import updateLocale from 'dayjs/plugin/updateLocale';

// TODO static import added because it doesn't work dynamic
import 'dayjs/locale/en-gb';
import 'dayjs/locale/fr-ch';
import 'dayjs/locale/de-ch';
import 'dayjs/locale/fr';
import 'dayjs/locale/de';

dayjs.extend(advancedFormat);
dayjs.extend(localeData);
dayjs.extend(localizedFormat);
dayjs.extend(customParseFormat);
dayjs.extend(updateLocale);

// Localized Formats (they are different for each language)
// https://day.js.org/docs/en/display/format#list-of-localized-formats
export enum DateLocalizedFormats {
    L = 'L', // DD/MM/YYYY (en)
}
export enum DateCustomFormats {
    DayOfWeekAbbr = 'DayOfWeekAbbr', // ddd (en)
    DayAndMonthAbbr = 'DayAndMonthAbbr', // DD MMM (en)
    DayMonthYearAbbr = 'DayMonthYearAbbr', // DD MMM YYYY (en)
    DayMonthShortYear = 'DayMonthShortYear', // DD MMM. YYYY (en)
    DayOfWeekDayMonthYearAbbr = 'DayOfWeekDayMonthYearAbbr', // ddd D MMM YYYY (en)
    DayOfWeekOrdinalDayMonthYearAbbr = 'DayOfWeekOrdinalDayMonthYearAbbr', // ddd Do MMM YYYY (en)
    DayOfWeekOrdinalDayMonthYearTimeRange = 'DayOfWeekOrdinalDayMonthYearTimeRange', // ddd Do MMM YYYY - HH:mm (en)
}

export const DATE_FORMATS = {
    default: 'DD-MM-YYYY',
    query: 'YYYY-MM-DD',
    time: 'HH:mm',
    timeFilter: 'HHmm',
    dateWithAbbrMonthName: 'DD MMM YYYY', // 07 May 2023
    dateWithAbbrMonthNameAndYear: 'DD MMM YY', // 07 May 23
    ordinalDateWithAbbrMonthName: 'Do MMM YYYY', // 7th May 2023
    fullDate: 'ddd Do MMM YYYY', // Sun 7th May 2023
    fullDateTime: 'ddd Do MMM YYYY - HH:mm', // Sun 7th May 2023 - 08:45
    dateMonthTime: 'ddd Do MMM HH:mm', // Sun 7th May 08:45
    inputField: DateLocalizedFormats.L,
    isoString: 'YYYY-MM-DDTHH:mm:ssZ[Z]', // 2023-01-25T00:00:00-02:00Z
    dateWithTime: 'YYYY-MM-DDTHH:mm:ss', // 2023-01-25T00:00:00:00
    serverIsoFormat: 'YYYY-MM-DDTHH:mm:ss.SSS[Z]',
    defaultShort: 'DD/MM/YY', // 07/05/23
    fullMonth: 'MMMM',
    shortMonth: 'MMM',
    year: 'YYYY',
    fullMonthAndYear: 'MMMM YYYY',
    yearMonthFormat: 'YYYY-MM',

    ...DateLocalizedFormats,
    ...DateCustomFormats,
};

interface ILocaleImportConfig<LocaleKey = string> {
    key: LocaleKey;
    expandLocale?: () => void;
}

export interface IAbbreviations {
    [DateLocalizedFormats.L]: string;
    monthAnYear: string;
}

// expand dayjs ILocale interface with fields added in updateLocale functions
declare global {
    interface ILocale {
        abbreviation?: IAbbreviations;
        customFormats?: Record<DateCustomFormats, string>;
    }
}

export enum DayjsLocale {
    En = 'en',
    ChFr = 'ch-fr',
    ChDe = 'ch-de',
    Fr = 'fr',
    De = 'de',
}

export const DAYJS_LOCALES_CONFIG: Record<string, ILocaleImportConfig> = {
    en: {
        key: 'en-gb',
        expandLocale: () => {
            dayjs.updateLocale('en-gb', {
                abbreviation: {
                    [DateLocalizedFormats.L]: 'dd/mm/yyyy',
                    monthAnYear: 'MM/YY',
                },
                customFormats: {
                    [DateCustomFormats.DayOfWeekAbbr]: 'ddd',
                    [DateCustomFormats.DayAndMonthAbbr]: 'DD MMM',
                    [DateCustomFormats.DayMonthYearAbbr]: 'DD MMM YYYY',
                    [DateCustomFormats.DayMonthShortYear]: 'DD MMM. YYYY',
                    [DateCustomFormats.DayOfWeekDayMonthYearAbbr]: 'ddd D MMM YYYY',
                    [DateCustomFormats.DayOfWeekOrdinalDayMonthYearAbbr]: 'ddd Do MMM YYYY',
                    [DateCustomFormats.DayOfWeekOrdinalDayMonthYearTimeRange]: 'ddd Do MMM YYYY - HH:mm',
                },
            });
        },
    },
    'ch-fr': {
        key: 'fr-ch',
        expandLocale: () => {
            dayjs.updateLocale('fr-ch', {
                abbreviation: {
                    [DateLocalizedFormats.L]: 'JJ.MM.AAAA',
                    monthAnYear: 'MM.AA',
                },
                customFormats: {
                    [DateCustomFormats.DayOfWeekAbbr]: 'ddd',
                    [DateCustomFormats.DayAndMonthAbbr]: 'DD MMM',
                    [DateCustomFormats.DayMonthYearAbbr]: 'DD MMM YYYY',
                    [DateCustomFormats.DayMonthShortYear]: 'DD MMM YYYY',
                    [DateCustomFormats.DayOfWeekDayMonthYearAbbr]: 'ddd D MMM YYYY',
                    [DateCustomFormats.DayOfWeekOrdinalDayMonthYearAbbr]: 'ddd Do MMM YYYY',
                    [DateCustomFormats.DayOfWeekOrdinalDayMonthYearTimeRange]: 'ddd Do MMM YYYY - HH:mm',
                },
            });
        },
    },
    'ch-de': {
        key: 'de-ch',
        expandLocale: () => {
            dayjs.updateLocale('de-ch', {
                abbreviation: {
                    [DateLocalizedFormats.L]: 'TT.MM.JJJJ',
                    monthAnYear: 'MM.JJ',
                },
                customFormats: {
                    [DateCustomFormats.DayOfWeekAbbr]: 'ddd',
                    [DateCustomFormats.DayAndMonthAbbr]: 'DD MMM',
                    [DateCustomFormats.DayMonthYearAbbr]: 'DD MMM YYYY',
                    [DateCustomFormats.DayMonthShortYear]: 'DD MMM YYYY',
                    [DateCustomFormats.DayOfWeekDayMonthYearAbbr]: 'ddd D MMM YYYY',
                    [DateCustomFormats.DayOfWeekOrdinalDayMonthYearAbbr]: 'ddd Do MMM YYYY',
                    [DateCustomFormats.DayOfWeekOrdinalDayMonthYearTimeRange]: 'ddd Do MMM YYYY - HH:mm',
                },
            });
        },
    },
    fr: {
        key: 'fr',
        expandLocale: () => {
            dayjs.updateLocale('fr', {
                abbreviation: {
                    [DateLocalizedFormats.L]: 'JJ/MM/AAAA',
                    monthAnYear: 'MM/AA',
                },
                customFormats: {
                    [DateCustomFormats.DayOfWeekAbbr]: 'ddd',
                    [DateCustomFormats.DayAndMonthAbbr]: 'DD MMM',
                    [DateCustomFormats.DayMonthYearAbbr]: 'DD MMM YYYY',
                    [DateCustomFormats.DayMonthShortYear]: 'DD MMM YYYY',
                    [DateCustomFormats.DayOfWeekDayMonthYearAbbr]: 'ddd D MMM YYYY',
                    [DateCustomFormats.DayOfWeekOrdinalDayMonthYearAbbr]: 'ddd Do MMM YYYY',
                    [DateCustomFormats.DayOfWeekOrdinalDayMonthYearTimeRange]: 'ddd Do MMM YYYY - HH:mm',
                },
            });
        },
    },
    de: {
        key: 'de',
        expandLocale: () => {
            dayjs.updateLocale('de', {
                abbreviation: {
                    [DateLocalizedFormats.L]: 'TT.MM.JJJJ',
                    monthAnYear: 'MM.JJ',
                },
                customFormats: {
                    [DateCustomFormats.DayOfWeekAbbr]: 'ddd,',
                    [DateCustomFormats.DayAndMonthAbbr]: 'DD. MMM',
                    [DateCustomFormats.DayMonthYearAbbr]: 'DD. MMM YYYY',
                    [DateCustomFormats.DayMonthShortYear]: 'DD MMM YYYY',
                    [DateCustomFormats.DayOfWeekDayMonthYearAbbr]: 'ddd, D. MMM YYYY',
                    [DateCustomFormats.DayOfWeekOrdinalDayMonthYearAbbr]: 'ddd, Do MMM YYYY',
                    [DateCustomFormats.DayOfWeekOrdinalDayMonthYearTimeRange]: 'ddd, Do MMM YYYY - HH:mm',
                },
            });
        },
    },
};

export const TIME_UNITS = {
    millisecondsInDay: 86400000,
    millisecondsInHour: 3600000,
    millisecondsInMinute: 60000,
    millisecondsInSecond: 1000,
    secondsInMinute: 60,
    minutesInHour: 60,
    monthsInYear: 12,
    OneMillisecond: 1,
    daysInTwoWeeks: 14,
};

export const MONDAY = 1;
