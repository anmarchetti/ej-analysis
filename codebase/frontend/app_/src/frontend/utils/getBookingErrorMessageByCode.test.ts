import { BookingErrorCodes } from 'models/enum/BookingStatus';

import { getBookingErrorMessageByCode } from './getBookingErrorMessageByCode';

describe('getBookingErrorMessageByCode util', () => {
    describe.each([
        [null, ''],
        [BookingErrorCodes.Fraud, 'Login.ErrorMessages.Fraud'],
        [BookingErrorCodes.Canceled, 'Login.ErrorMessages.Canceled'],
        [BookingErrorCodes.AlreadyAssigned, 'ViewBookings.ErrorMessages.AlreadyAssignedHTML'],
        [BookingErrorCodes.AlreadyAssignedToCurrent, 'ViewBookings.ErrorMessages.AlreadyAssignedToCurrentHTML'],
        [BookingErrorCodes.EmailDiffers, 'ViewBookings.ErrorMessages.EmailDiffersHTML'],
        [BookingErrorCodes.NotFound, 'Login.ErrorMessages.CantFindBooking'],
    ])('getBookingErrorMessageByCode', (code, expectedMessage) => {
        it(`should return message ${expectedMessage} by the code ${code} `, () => {
            const res = getBookingErrorMessageByCode(code);
            expect(res).toEqual(expectedMessage);
        });
    });
});
