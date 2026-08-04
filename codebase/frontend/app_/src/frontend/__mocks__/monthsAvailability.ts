import dayjs from 'dayjs';

import { IMonthAvailability, IMonthItem } from 'models/data/IMonthAvailability';

export const mockMonthsAvailability: IMonthAvailability[] = [
    { date: '2025-07-01T00:00:00Z', availability: false },
    { date: '2025-08-01T00:00:00Z', availability: true },
    { date: '2025-09-01T00:00:00Z', availability: true },
    { date: '2025-10-01T00:00:00Z', availability: true },
    { date: '2025-11-01T00:00:00Z', availability: true },
    { date: '2025-12-01T00:00:00Z', availability: true },
    { date: '2026-01-01T00:00:00Z', availability: true },
    { date: '2026-02-01T00:00:00Z', availability: true },
    { date: '2026-03-01T00:00:00Z', availability: true },
    { date: '2026-04-01T00:00:00Z', availability: true },
    { date: '2026-05-01T00:00:00Z', availability: true },
    { date: '2026-06-01T00:00:00Z', availability: true },
    { date: '2026-07-01T00:00:00Z', availability: true },
    { date: '2026-08-01T00:00:00Z', availability: true },
    { date: '2026-09-01T00:00:00Z', availability: true },
    { date: '2026-10-01T00:00:00Z', availability: true },
];

export const mockMonths: IMonthItem[] = mockMonthsAvailability.map(month => {
    const date = dayjs(month.date);

    return {
        ...month,
        date,
        monthName: date.format('MMMM'),
        year: date.year(),
        cheapestMonthPrice: 10,
        cheapestMonthPricePP: 5,
    };
});

export const mockMonthItem: IMonthItem = {
    availability: true,
    date: dayjs(new Date('2025-07-01T00:00:00Z')),
    monthName: 'July',
    year: 2025,
    cheapestMonthPrice: 0,
    cheapestMonthPricePP: 0,
};
