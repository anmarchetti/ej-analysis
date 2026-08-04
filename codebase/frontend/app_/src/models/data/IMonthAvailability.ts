import { Dayjs } from 'dayjs';

export interface IMonthAvailability {
    availability: boolean;
    date: string;
}

export interface IAvailableMonthsResponse {
    lastAvailableDate: string;
    monthsAvailability: IMonthAvailability[];
}

export interface IMonthItem {
    availability: boolean;
    cheapestMonthPrice: number;
    cheapestMonthPricePP: number;
    date: Dayjs;
    monthName: string;
    year: number;
}
