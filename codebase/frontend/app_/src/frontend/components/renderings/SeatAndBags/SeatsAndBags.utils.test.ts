import { mockBooking } from 'frontend/__mocks__';

import { getPageFlow } from './SeatsAndBags.utils';

describe('SeatsAndBags.utils', () => {
    describe('getPageFlow', () => {
        it('should return isPostBookingFlow as true when booking is provided and isViewBookingPage is true', () => {
            const result = getPageFlow(mockBooking, true, false, false);
            expect(result).toEqual({ isPostBookingFlow: true, isBookingFlow: false });
        });

        it('should return isBookingFlow as true when no post-booking or confirmation flow is active', () => {
            const result = getPageFlow(undefined, false, false, false);
            expect(result).toEqual({ isPostBookingFlow: false, isBookingFlow: true });
        });

        it('should return isPostBookingFlow as false when booking is undefined', () => {
            const result = getPageFlow(undefined, true, false, false);
            expect(result).toEqual({ isPostBookingFlow: false, isBookingFlow: true });
        });

        it('should return isBookingFlow as false when isAmendPaymentPage is true', () => {
            const result = getPageFlow(undefined, false, false, true);
            expect(result).toEqual({ isPostBookingFlow: false, isBookingFlow: false });
        });

        it('should return isPostBookingFlow as false when isViewBookingPage is false', () => {
            const result = getPageFlow(mockBooking, false, false, false);
            expect(result).toEqual({ isPostBookingFlow: false, isBookingFlow: true });
        });

        it('should return isPostBookingFlow as false and isBookingFlow as false when isConfirmationPage is true', () => {
            const result = getPageFlow(mockBooking, false, true, false);
            expect(result).toEqual({ isPostBookingFlow: false, isBookingFlow: false });
        });
    });
});
