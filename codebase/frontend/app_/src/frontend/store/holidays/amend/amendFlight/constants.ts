import { AmendBookingStatus } from 'models/enum/AmendBookingStatus';

export const AMEND_FLIGHTS_DISABLED_STATUSES = [
    AmendBookingStatus.AmendFlightsDisabled,
    AmendBookingStatus.AmendFlightsDisabledByTimeBound,
    AmendBookingStatus.AmendFlightsDisabledOnSite,
    AmendBookingStatus.AmendFlightsDisabledSeriesFlights,
];
