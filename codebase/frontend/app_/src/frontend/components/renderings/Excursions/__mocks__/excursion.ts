import { CurrencyCode } from 'code/currency';
import { IExcursion, IExcursionResponse } from 'models/data/IExcursions';

export const getMockedExcursion = (): IExcursion => ({
    coverImageUrl: 'test_header.jpeg',
    description: 'Test desrciption',
    freeCancellation: true,
    likelyToSellOut: false,
    retailPrice: { value: 66, currency: CurrencyCode.GBP },
    reviewsAvg: 4.2,
    reviewsNumber: 14,
    title: 'Test title',
    url: 'https://.sbox.musement.com/uk/athens/athens-tour-by-night-590/',
});

export const getMockedExcursions = (length: number = 1): IExcursion[] => Array(length).fill(getMockedExcursion());

export const getMockedExcursionsResponse = (): IExcursionResponse => ({
    excursions: Array(1).fill(getMockedExcursion()),
    excursionsLink: 'excursionsLink',
});
