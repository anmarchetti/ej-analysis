import dayjs, { Dayjs } from 'dayjs';

import { DATE_FORMATS } from 'code/dates';
import { IAvailableDate } from 'models/data/IAvailableDate';

export const groupByMonthsWithYear = (availableDates: IAvailableDate[]): Record<number, IAvailableDate[]> =>
    availableDates.reduce((acc, item) => {
        const key = dayjs(item.date).format(DATE_FORMATS.fullMonthAndYear);

        if (!acc[key]) {
            acc[key] = [];
        }

        acc[key].push(item);

        return acc;
    }, {});

export const getUnavailableMonths = (availableDates: IAvailableDate[] | null, from: Date | null): string[] => {
    if (!availableDates || availableDates.length === 0) {
        return [];
    }

    const groupedAvailableDates = groupByMonthsWithYear(availableDates);

    return Object.keys(groupedAvailableDates).reduce((acc: string[], key: string) => {
        const isAllMonthUnavailable = groupedAvailableDates[key].every((date: IAvailableDate) =>
            from ? !date.in : !date.out,
        );

        return isAllMonthUnavailable ? [...acc, key] : acc;
    }, []);
};

export const isAvailabilityForMonthLoaded = (availableDates: IAvailableDate[] | null, month: Dayjs): boolean =>
    availableDates?.some(date => dayjs(date.date).isSame(month, 'month')) ?? false;

export const getFirstDisplayedMonthOnDesktop = (
    availableDates: IAvailableDate[] | null,
    from: Date | null,
    minDate: Date,
    unavailableMonths: string[],
): Date => {
    const min = dayjs(minDate);

    if (!availableDates || availableDates.length === 0) {
        return minDate;
    }

    if (!from) {
        const isAvailabilityForCurrentMonthLoaded = isAvailabilityForMonthLoaded(availableDates, min);
        const isMinMonthUnavailable = unavailableMonths.includes(min.format(DATE_FORMATS.fullMonthAndYear));

        if (isAvailabilityForCurrentMonthLoaded && isMinMonthUnavailable) {
            const firstAvailableDay = availableDates.find(date => dayjs(date.date).isAfter(min) && date.in)?.date;

            return dayjs(firstAvailableDay).toDate();
        }

        return minDate;
    }

    return from;
};
