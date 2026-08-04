export interface IApolloBookingItem {
    bookingReference: string;
    holidayDateEndLocal: string;
    holidayDateStartLocal: string;
    holidayNightsCount: number;
    hotelCode: string;
    hotelLocation: string;
    hotelName: string;
    resortCode: string;
    departureDatetimeLocal?: string | null;
    departureDatetimeUtc?: string | null;
}

export interface IApolloBookingsResponse {
    bookings: IApolloBookingItem[];
}
