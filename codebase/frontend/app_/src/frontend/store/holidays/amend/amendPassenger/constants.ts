import { AmendBookingStatus } from 'models/enum/AmendBookingStatus';

export const AMEND_PASSENGERS_DISABLED_STATUSES = [
    AmendBookingStatus.AmendPassengerDisabledOnSite,
    AmendBookingStatus.AmendPassengerDisabledOnSiteForDIHotels,
    AmendBookingStatus.AmendPassengerDisabledByAtcom,
    AmendBookingStatus.AmendPassengerDisabledByTimeBound,
    AmendBookingStatus.AmendPassengerDisabledByFlightDisruption,
    AmendBookingStatus.AmendPassengerDisabledByInventoryError,
];
