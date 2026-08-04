import { AmendBookingStatus } from 'models/enum/AmendBookingStatus';

export const AMEND_SEATS_DISABLED_STATUSES = [
    AmendBookingStatus.AmendSeatsDisabled,
    AmendBookingStatus.AmendSeatsDisabledOnSite,
    AmendBookingStatus.AmendSeatsDisabledByFlightDisruption,
];
