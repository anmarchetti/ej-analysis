import { action, makeObservable, observable, runInAction } from 'mobx';

import bookingService from 'frontend/services/booking.service';
import { HolidaysRootStore } from 'frontend/store/holidays/HolidaysRootStore';
import { formatDateToQuery } from 'frontend/utils/date.utils';
import { GuestBookingInfo, GuestBookingInfoFields } from 'models/data/GuestBookingInfo';
import {
    ALREADY_ASSIGNED_CODE,
    ALREADY_ASSIGNED_TO_CURRENT_CODE,
    ASSIGN_AGENT_BOOKING,
    BOOKING_EMAIL_DIFFERS,
    BookingErrorCodes,
    FRAUD_CODE,
} from 'models/enum/BookingStatus';

/**
 * Store that handles any logic associated with add a booking popup
 */
export class AddBookingStore {
    @observable addBookingInfo = new GuestBookingInfo();
    @observable isAddBookingShown = false;
    @observable isAddingBooking = false;
    @observable error: Nullable<BookingErrorCodes> = null;
    @observable hasBookingAdded = false;

    constructor(public rootStore: HolidaysRootStore) {
        makeObservable(this);
    }

    /**
     * Clear stores state, called on each popup opening
     */
    @action clearStore = () => {
        this.isAddingBooking = false;
        this.hasBookingAdded = false;
        this.clearError();
        this.addBookingInfo = new GuestBookingInfo();
    };

    /**
     * Show/Hides add booking popup. Clears store when popup is going to be shown
     */
    @action toggleAddBooking = () => {
        // clear addBooking data if it's going to be shown
        if (!this.isAddBookingShown) {
            this.clearStore();
        }

        this.isAddBookingShown = !this.isAddBookingShown;
    };

    /**
     * Try assign booking to user. Closes popup and refresh booking list on sucess. Show appropriate error message on fail
     */
    @action addBooking = async () => {
        this.isAddingBooking = true;
        const date = formatDateToQuery(this.addBookingInfo.departureDateObject);

        try {
            await bookingService.addBooking(this.addBookingInfo.bookingReference, this.addBookingInfo.lastName, date);

            runInAction(() => (this.hasBookingAdded = true));
        } catch (e) {
            switch (e.errorCode) {
                case FRAUD_CODE:
                    this.setError(BookingErrorCodes.Fraud);
                    break;
                case ALREADY_ASSIGNED_CODE:
                    this.setError(BookingErrorCodes.AlreadyAssigned);
                    break;
                case ALREADY_ASSIGNED_TO_CURRENT_CODE:
                    this.setError(BookingErrorCodes.AlreadyAssignedToCurrent);
                    break;
                case BOOKING_EMAIL_DIFFERS:
                    this.setError(BookingErrorCodes.EmailDiffers);
                    break;
                case ASSIGN_AGENT_BOOKING:
                    this.setError(BookingErrorCodes.AssignAgentBooking);
                    break;
                default:
                    this.setError(BookingErrorCodes.NotFound);
            }
        } finally {
            runInAction(() => (this.isAddingBooking = false));
        }
    };

    /**
     * Stores error that came from api call
     */
    @action setError = (messageCode?: BookingErrorCodes) => {
        if (messageCode !== this.error) {
            this.error = messageCode || null;
        }
    };

    @action clearError = () => {
        this.error = null;
    };

    @action findAddedBooking = () => {
        // 1. Open active 'Find Booking' tab on Login Page
        this.rootStore.userStore.setLoginTabActive(false);

        // 2. Fill 'Find Booking' form with assigned booking info (i.e guestBookingInfo with addBookingInfo)
        const { guestBookingInfo } = this.rootStore.viewBookingStore;
        guestBookingInfo.onChangeField(GuestBookingInfoFields.DepartureDate, this.addBookingInfo.departureDate);
        guestBookingInfo.onChangeField(GuestBookingInfoFields.BookingReference, this.addBookingInfo.bookingReference);
        guestBookingInfo.onChangeField(GuestBookingInfoFields.LastName, this.addBookingInfo.lastName);
    };
}
