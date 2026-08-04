import { AmendBookingStatus } from 'models/enum/AmendBookingStatus';

export const AMEND_TRANSFERS_DISABLED_STATUSES = [
    AmendBookingStatus.AmendTransfersDisabled,
    AmendBookingStatus.AmendTransfersDisabledByTimeBound,
    AmendBookingStatus.AmendTransfersDisabledOnSite,
];
