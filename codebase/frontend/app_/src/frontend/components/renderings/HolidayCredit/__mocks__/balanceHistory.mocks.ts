import { CurrencyCode } from 'code/currency';
import { SitecoreChannel } from 'frontend/store/base/tracking/sitecore/constants';
import { addDays } from 'frontend/utils/date.utils';
import { IBalanceHistoryItem } from 'models/data/IBalanceHistory';
const DATE_MARGIN = 3;

export const mockBalanceHistoryItems: IBalanceHistoryItem[] = [
    {
        id: '2293400790-onetimeuse',
        order: {
            date: '2025-01-15T14:22:21.371Z',
            amount: 1100.0,
        },
        metadata: [
            {
                key: 'action',
                value: 'Credit and refund',
            },
            {
                key: 'market',
                value: 'UK',
            },
            {
                key: 'reason',
                value: 'onetimeuse',
            },
            {
                key: 'source',
                value: SitecoreChannel.Desktop,
            },
            {
                key: 'currency',
                value: CurrencyCode.GBP,
            },
            {
                key: 'hotel_code',
                value: 'MTMT0021',
            },
            {
                key: 'hotel_name',
                value: 'Be.Hotel',
            },
            {
                key: 'booking_ref',
                value: '40375671',
            },
            {
                key: 'hotel_resort_code',
                value: 'MTMTSJ',
            },
            {
                key: 'hotel_resort_name',
                value: 'St Julians',
            },
            {
                key: 'hotel_country_code',
                value: 'MT',
            },
            {
                key: 'hotel_country_name',
                value: 'Malta',
            },
            {
                key: 'hotel_location_code',
                value: 'MTMT',
            },
            {
                key: 'hotel_location_name',
                value: 'Malta',
            },
        ],
        redemptions: [
            {
                id: 'r_0ffd3733780b6f3176',
                order: {
                    date: '2025-01-16T07:04:10.946Z',
                    id: 'ord_0ffd37336a0b6f3168',
                    status: 'Paid',
                    amount: -700,
                },
                voucherId: '2281296179-refund',
                result: 'Success',
                metadata: [
                    {
                        key: 'hotel_name',
                        value: 'Alexandra',
                    },
                    {
                        key: 'hotel_code',
                        value: 'GRSN0031',
                    },
                    {
                        key: 'hotel_location_code',
                        value: 'GRSN',
                    },
                    {
                        key: 'hotel_location_name',
                        value: 'Santorini',
                    },
                    {
                        key: 'hotel_resort_code',
                        value: 'GRSNKA',
                    },
                    {
                        key: 'hotel_resort_name',
                        value: 'Kamari',
                    },
                    {
                        key: 'hotel_country_code',
                        value: 'GR',
                    },
                    {
                        key: 'hotel_country_name',
                        value: 'Greece',
                    },
                    {
                        key: 'source',
                        value: SitecoreChannel.Desktop,
                    },
                    {
                        key: 'action',
                        value: 'Credit and refund',
                    },
                    {
                        key: 'currency',
                        value: CurrencyCode.GBP,
                    },
                    {
                        key: 'booking_ref',
                        value: '40378032',
                    },
                ],
            },
            {
                id: 'r_0ffc6b5dfdc06eb79f',
                order: {
                    date: '2025-01-15T16:13:37.114Z',
                    id: 'ord_0ffc6b5defc06eb791',
                    status: 'Paid',
                    amount: -100.0,
                },
                voucherId: '2281296179-refund',
                result: 'Success',
                metadata: [
                    {
                        key: 'hotel_name',
                        value: 'Club Tuana Fethiye',
                    },
                    {
                        key: 'hotel_code',
                        value: 'TRDL0007',
                    },
                    {
                        key: 'hotel_location_code',
                        value: 'TRDL',
                    },
                    {
                        key: 'hotel_location_name',
                        value: 'Dalaman',
                    },
                    {
                        key: 'hotel_resort_code',
                        value: 'TRDLFE',
                    },
                    {
                        key: 'hotel_resort_name',
                        value: 'Fethiye',
                    },
                    {
                        key: 'hotel_country_code',
                        value: 'TR',
                    },
                    {
                        key: 'hotel_country_name',
                        value: 'Turkey',
                    },
                    {
                        key: 'source',
                        value: SitecoreChannel.Desktop,
                    },
                    {
                        key: 'action',
                        value: 'Credit and refund',
                    },
                    {
                        key: 'currency',
                        value: CurrencyCode.GBP,
                    },
                    {
                        key: 'booking_ref',
                        value: '40377054',
                    },
                ],
            },
        ],
        expires: '2026-01-15T23:59:59Z',
        createdAt: '2025-01-15T14:22:21.371Z',
    },
    {
        id: '2281125786-refund',
        order: {
            date: '2025-01-02T15:09:10.753Z',
            amount: 1290.93,
        },
        metadata: [
            {
                key: 'action',
                value: 'Credit and refund',
            },
            {
                key: 'market',
                value: 'UK',
            },
            {
                key: 'reason',
                value: 'refund',
            },
            {
                key: 'source',
                value: SitecoreChannel.Desktop,
            },
            {
                key: 'currency',
                value: CurrencyCode.GBP,
            },
            {
                key: 'hotel_code',
                value: 'TRDL0007',
            },
            {
                key: 'hotel_name',
                value: 'Club Tuana Fethiye',
            },
            {
                key: 'booking_ref',
                value: '50178009',
            },
            {
                key: 'hotel_resort_code',
                value: 'TRDLFE',
            },
            {
                key: 'hotel_resort_name',
                value: 'Fethiye',
            },
            {
                key: 'hotel_country_code',
                value: 'TR',
            },
            {
                key: 'hotel_country_name',
                value: 'Turkey',
            },
            {
                key: 'hotel_location_code',
                value: 'TRDL',
            },
            {
                key: 'hotel_location_name',
                value: 'Dalaman',
            },
        ],
        redemptions: [],
        expires: '2026-01-02T23:59:59Z',
        createdAt: '2025-01-02T15:09:10.753Z',
    },
    {
        id: '2281125786-goodwill',
        order: {
            date: '2025-01-02T15:09:10.285Z',
            amount: 120,
        },
        metadata: [
            {
                key: 'action',
                value: 'Credit and refund',
            },
            {
                key: 'market',
                value: 'UK',
            },
            {
                key: 'reason',
                value: 'goodwill',
            },
            {
                key: 'source',
                value: SitecoreChannel.Desktop,
            },
            {
                key: 'currency',
                value: CurrencyCode.GBP,
            },
            {
                key: 'hotel_code',
                value: 'TRDL0007',
            },
            {
                key: 'hotel_name',
                value: 'Club Tuana Fethiye',
            },
            {
                key: 'booking_ref',
                value: '50178009',
            },
            {
                key: 'hotel_resort_code',
                value: 'TRDLFE',
            },
            {
                key: 'hotel_resort_name',
                value: 'Fethiye',
            },
            {
                key: 'hotel_country_code',
                value: 'TR',
            },
            {
                key: 'hotel_country_name',
                value: 'Turkey',
            },
            {
                key: 'hotel_location_code',
                value: 'TRDL',
            },
            {
                key: 'hotel_location_name',
                value: 'Dalaman',
            },
        ],
        redemptions: [],
        expires: '2026-01-02T23:59:59Z',
        createdAt: '2025-01-02T15:09:10.285Z',
    },
];

export const mockBalanceHistoryItem: IBalanceHistoryItem = {
    ...mockBalanceHistoryItems[0],
    expires: addDays(DATE_MARGIN).toString(),
    createdAt: addDays(-DATE_MARGIN).toString(),
};
