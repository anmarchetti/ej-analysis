import { IAmendBookingPayload } from 'frontend/store/base';

import { mockBooking } from './booking';
import { mockFlightSelectedFilter } from './filters';
import { mockValidatedFlights } from './flights';
import { mockPaymentInfo } from './payment';
import { mockAmendDatesOfferWithPrice } from './stores';

export const mockAmendBookingPayload: IAmendBookingPayload = {
    amendDatesOffer: mockAmendDatesOfferWithPrice,
    bookingReference: '12345',
    date: '2024-02-05T00:00:00',
    lastName: 'Proudmoore',
    package: mockBooking.package,
    paymentInfo: mockPaymentInfo,
    redirectedByBreadcrumbs: false,
    selectedFlight: mockValidatedFlights[0],
    selectedFlightFilters: [mockFlightSelectedFilter],
    selectedSeats: undefined,
    selectedTransfer: undefined,
};
