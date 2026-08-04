import { CurrencyCode } from 'code/currency';
import { IMarketCredits } from 'models/data/MyCreditInfo';
import { ISitecoreCompositeField } from 'models/sitecore/generic/ISitecoreField';

export const mockMarketCreditsField = [
    {
        id: '1',
        fields: {
            Flag: { value: { src: 'src', alt: 'CH' } },
            Market: {
                id: '11',
                fields: {
                    Currency: { fields: { Code: { value: CurrencyCode.CHF } } },
                },
            },
        },
    },
    {
        id: '2',
        fields: {
            Flag: { value: { src: 'src', alt: 'UK' } },
            Market: {
                id: '22',
                fields: { Currency: { fields: { Code: { value: CurrencyCode.GBP } } } },
            },
        },
    },
    {
        id: '3',
        fields: {
            Flag: { value: { src: 'src', alt: 'EU' } },
            Market: {
                id: '33',
                fields: { Currency: { fields: { Code: { value: 'EUR' } } } },
            },
        },
    },
] as ISitecoreCompositeField<IMarketCredits>[];
