import dayjs, { Dayjs } from 'dayjs';

import { createDayjsDate, getYearsBetweenTwoDates, isPeriodOutOfRange } from 'frontend/utils/date.utils';
import { TMonthOption, TYearOption } from 'models/data/ISelectOption';

export const createMonthOption = (monthDate: Date | Dayjs): TMonthOption => {
    const monthIndex = dayjs.isDayjs(monthDate) ? monthDate.get('month') : monthDate.getMonth();

    return {
        value: monthIndex,
        label: dayjs.months()[monthIndex],
    };
};

export const createYearOption = (monthDate: Date): TYearOption => {
    const year = monthDate.getFullYear();

    return {
        value: year,
        label: year,
    };
};

const COUNT_MONTH_IN_YEAR = 12;
export const getMonthsOptions = (): TMonthOption[] =>
    [...Array(COUNT_MONTH_IN_YEAR)].map((_, index) => ({
        value: index,
        label: dayjs.months()[index],
    }));

export const getYearsOptions = (minDate: Date, maxDate: Date): TYearOption[] =>
    getYearsBetweenTwoDates(dayjs(minDate), dayjs(maxDate)).map(year => ({
        value: year,
        label: year,
    }));

export const isOptionDisabled = (
    option: TMonthOption,
    selectedYear: TYearOption,
    minDate: Date,
    maxDate: Date,
): boolean => {
    const year = selectedYear.value;
    const month = option.value + 1;
    const minDateCalculated = createDayjsDate(year, month, dayjs(minDate).get('date'));
    const maxDateCalculated = createDayjsDate(year, month, dayjs(maxDate).get('date'));

    return isPeriodOutOfRange([minDateCalculated, maxDateCalculated], [minDate, maxDate]);
};
