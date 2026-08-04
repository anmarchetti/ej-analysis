import { IAmendBookingPromoBreakDown } from 'models/data/IAmendBookingFlights';
import { TierStatuses } from 'models/data/IPromocode';

export const mockPromoCodeBreakdown: IAmendBookingPromoBreakDown = {
    due: 13,
    promoCodeStatus: TierStatuses.TIER_UPGRADE,
    errors: [
        {
            code: '404',
            message: 'error happened',
        },
    ],
    promoCode: 'promoCode',
};
