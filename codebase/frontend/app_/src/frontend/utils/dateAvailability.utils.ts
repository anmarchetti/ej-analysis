import { IAvailableDate } from 'models/data/IAvailableDate';

import { formatDateToQuery } from './date.utils';

const findAvailabilityForDate = (date: string, availableDates: IAvailableDate[]): IAvailableDate | undefined =>
    availableDates.find(dateDetails => dateDetails.date === date);

export const isDateAvailable = (
    date: Date,
    availableDates: Nullable<IAvailableDate[]>,
    selectedDates: Date[],
): boolean => {
    if (!availableDates?.length) {
        return true;
    }

    const dateStr = formatDateToQuery(date);
    const dateAvailability = findAvailabilityForDate(dateStr, availableDates);

    if (!dateAvailability) {
        return false;
    }

    if (selectedDates.length === 1 && date > selectedDates[0]) {
        return dateAvailability.in;
    }

    return dateAvailability.out;
};
