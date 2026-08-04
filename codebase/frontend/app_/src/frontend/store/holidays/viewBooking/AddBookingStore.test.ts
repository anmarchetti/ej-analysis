import bookingService from 'frontend/services/booking.service';
import { GuestBookingInfo } from 'models/data/GuestBookingInfo';
import {
    ALREADY_ASSIGNED_CODE,
    ALREADY_ASSIGNED_TO_CURRENT_CODE,
    ASSIGN_AGENT_BOOKING,
    BOOKING_EMAIL_DIFFERS,
    BookingErrorCodes,
    FRAUD_CODE,
} from 'models/enum/BookingStatus';

import { AddBookingStore } from './AddBookingStore';

jest.mock('frontend/services/booking.service');

describe('AddBookingStore', () => {
    const rootStore = {
        userStore: { setLoginTabActive: jest.fn() },
        viewBookingStore: { guestBookingInfo: new GuestBookingInfo() },
    } as any;
    const createStore = () => new AddBookingStore(rootStore);
    const createApiError = () => ({
        errorCode: FRAUD_CODE,
    });

    let store = createStore();
    let apiError = createApiError();

    beforeEach(() => {
        store = createStore();
        apiError = createApiError();

        (bookingService.addBooking as any).mockRestore();
    });

    it('should correctly clear error', () => {
        store.error = BookingErrorCodes.Canceled;

        expect(store.error).toBe(BookingErrorCodes.Canceled);

        store.clearError();

        expect(store.error).toBe(null);
    });

    it('should correctly set error', () => {
        store.setError(BookingErrorCodes.Canceled);

        expect(store.error).toBe(BookingErrorCodes.Canceled);
    });

    it('should clear error', () => {
        store.setError(BookingErrorCodes.Canceled);

        expect(store.error).toBe(BookingErrorCodes.Canceled);

        store.setError();

        expect(store.error).toBe(null);
    });

    it('should correctly toggle booking and clear store', () => {
        const clearStoreSpy = jest.spyOn(store, 'clearStore');

        expect(store.isAddBookingShown).toBe(false);

        store.toggleAddBooking();

        expect(clearStoreSpy).toHaveBeenCalled();
        expect(store.isAddBookingShown).toBe(true);

        clearStoreSpy.mockRestore();
    });

    it('should correctly toggle booking without clearing of the store', () => {
        const clearStoreSpy = jest.spyOn(store, 'clearStore');
        store.isAddBookingShown = true;

        store.toggleAddBooking();

        expect(clearStoreSpy).not.toHaveBeenCalled();
        expect(store.isAddBookingShown).toBe(false);

        clearStoreSpy.mockRestore();
    });

    it('should correctly add booking', async () => {
        const bookingReference = 'Test booking reference';
        const lastName = 'Test last name';
        const currentDate = new Date().toISOString().slice(0, 10);

        store.addBookingInfo.bookingReference = bookingReference;
        store.addBookingInfo.lastName = lastName;

        await store.addBooking();

        expect(bookingService.addBooking).toHaveBeenCalledWith(bookingReference, lastName, currentDate);
        expect(store.hasBookingAdded).toBe(true);
    });

    describe.each([
        [FRAUD_CODE, BookingErrorCodes.Fraud],
        [ALREADY_ASSIGNED_CODE, BookingErrorCodes.AlreadyAssigned],
        [ALREADY_ASSIGNED_TO_CURRENT_CODE, BookingErrorCodes.AlreadyAssignedToCurrent],
        [BOOKING_EMAIL_DIFFERS, BookingErrorCodes.EmailDiffers],
        [ASSIGN_AGENT_BOOKING, BookingErrorCodes.AssignAgentBooking],
        ['', BookingErrorCodes.NotFound],
    ])('Add Booking Error', (errorCode, expected) => {
        it(`should hanlde ${expected} error`, async () => {
            apiError.errorCode = errorCode;
            (bookingService.addBooking as any).mockRejectedValueOnce(apiError);
            await store.addBooking();

            expect(store.error).toBe(expected);
            expect(store.isAddingBooking).toBeFalsy();
        });
    });

    it('should find booking with addedBookingInfo', async () => {
        store.addBookingInfo.bookingReference = '123';
        store.addBookingInfo.lastName = 'test';
        store.addBookingInfo.departureDate = '01/01/2021';
        store.findAddedBooking();

        expect(rootStore.userStore.setLoginTabActive).toBeCalledWith(false);
        expect(rootStore.viewBookingStore.guestBookingInfo).toEqual({
            bookingReference: '123',
            lastName: 'test',
            departureDate: '01/01/2021',
        });
    });
});
