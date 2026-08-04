import { IApolloBookingItem } from 'models/data/IApolloBooking';

export const mockApolloBooking = (overrides: Partial<IApolloBookingItem> = {}): IApolloBookingItem => ({
    bookingReference: 'MOCK123',
    departureDatetimeLocal: '2026-04-14T08:00:00Z',
    departureDatetimeUtc: '2026-04-14T07:00:00Z',
    hotelCode: 'ESMJ0047',
    hotelName: 'Test Hotel Majorca',
    hotelLocation: 'Majorca, Spain',
    holidayDateStartLocal: '2026-04-14T00:00:00Z',
    holidayDateEndLocal: '2026-04-21T00:00:00Z',
    holidayNightsCount: 7,
    resortCode: 'ESBABA',
    ...overrides,
});
