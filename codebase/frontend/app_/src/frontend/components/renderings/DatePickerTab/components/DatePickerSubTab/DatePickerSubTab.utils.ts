import { IAvailableDate } from 'models/data/IAvailableDate';

export const calculateExcludedDates = (availableDates: IAvailableDate[], option: 'in' | 'out'): Date[] =>
    availableDates.reduce((acc: Date[], item) => (!item[option] ? [...acc, new Date(item.date)] : acc), []);
