import { ScriptableContext as ChartJSContext } from 'chart.js';
import { Context as DataLabelsContext } from 'chartjs-plugin-datalabels';

import { DATE_FORMATS } from 'code/dates';
import { addDays, formatDateL10n, getDate } from 'frontend/utils/date.utils';
import { IAlternativeOffer } from 'models/data/IAlternativeOffers';
import { IPriceGraphBarConfig } from 'models/data/IPriceGraphBarConfig';

import PriceGraphSettings from './constants';

export const isEndDate = (date: Date, selectedDate: Nullable<Date>, holidayDuration: number) => {
    if (selectedDate) {
        const endDate = addDays(holidayDuration, selectedDate);

        return endDate.getTime() === date.getTime();
    }

    return false;
};

export const dateFormatter = (
    data: IAlternativeOffer,
    selectedDate: Nullable<Date>,
    holidayDuration: number,
    totalPrice: number,
    currentOfferDate: Date,
): IPriceGraphBarConfig => {
    const dateObj = getDate(data.date);
    const isEnd = isEndDate(dateObj, selectedDate, holidayDuration);
    const isStart = !!selectedDate && dateObj.getTime() === selectedDate.getTime();
    const price = data.price
        ? totalPrice && isStart && selectedDate?.getTime() === currentOfferDate.getTime()
            ? totalPrice
            : data.price
        : 0;

    return {
        y: price,
        price: price,
        date: data.date,
        isStartDate: isStart,
        isEndDate: isEnd,
    };
};

export const getFormattedDates = (
    dates: IAlternativeOffer[],
    selectedDate: Nullable<Date>,
    holidayDuration: number,
    totalPrice: number,
    currentOfferDate: Date,
): IPriceGraphBarConfig[] =>
    dates.map(data => dateFormatter(data, selectedDate, holidayDuration, totalPrice, currentOfferDate));

export const getEdgeAvailableDate = (selectedDate: Date, datesForLoading: number, isLast?: boolean): Date =>
    addDays(isLast ? datesForLoading : -datesForLoading, selectedDate);

export const getLabelColor = (context: DataLabelsContext) => {
    const data = context.dataset.data[context.dataIndex] as unknown as IPriceGraphBarConfig;

    if (!data.price) {
        return PriceGraphSettings.colors.grey;
    }

    if (context.active || !data.isStartDate) {
        return PriceGraphSettings.colors.white;
    }

    return PriceGraphSettings.colors.darkOrange;
};

export const getBackgroundColor = (context: ChartJSContext<'bar'>) => {
    const data = context.raw as IPriceGraphBarConfig;

    if (context.active) {
        return PriceGraphSettings.colors.darkOrange;
    }

    if (data.isStartDate) {
        return PriceGraphSettings.colors.white;
    }

    return PriceGraphSettings.colors.orange;
};

export const getHolidayDates = (selectedDate: Date, duration: number) => {
    const returnDate = addDays(duration, selectedDate);

    return {
        departure: formatDateL10n(selectedDate, DATE_FORMATS.DayOfWeekOrdinalDayMonthYearAbbr),
        return: formatDateL10n(returnDate, DATE_FORMATS.DayOfWeekOrdinalDayMonthYearAbbr),
    };
};
