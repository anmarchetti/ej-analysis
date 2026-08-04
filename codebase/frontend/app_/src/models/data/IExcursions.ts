import { CurrencyCode } from 'code/currency';

export interface IExcursionResponse {
    excursions: IExcursion[];
    excursionsLink: string;
}

export interface IExcursion {
    coverImageUrl: string;
    description: string;
    freeCancellation: boolean;
    likelyToSellOut: boolean;
    retailPrice: IExcursionPrice;
    reviewsAvg: number;
    reviewsNumber: number;
    title: string;
    url: string;
}

export interface IExcursionPrice {
    currency: CurrencyCode;
    value: number;
}
