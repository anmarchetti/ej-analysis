import { FindBookingInfo, FindBookingInfoFields } from './FindBookingInfo';

let mockBooking: FindBookingInfo;

describe('FindBookingInfo', () => {
    beforeEach(() => {
        mockBooking = new FindBookingInfo();
    });

    it('should return false "isValid"', () => {
        expect(mockBooking.isValid).toBe(false);
    });

    it('should return error for booking reference with validateField', () => {
        expect(mockBooking.validateField(FindBookingInfoFields.BookingReference)[0].errorMessage).toBe(
            'Globals.ErrorMessages.BookingReferenceRequired',
        );
    });

    it('should apply new values within onChangeField method', () => {
        mockBooking.onChangeField(FindBookingInfoFields.BookingReference, 'booking_reference');

        expect(mockBooking[FindBookingInfoFields.BookingReference]).toBe('booking_reference');
    });
});
