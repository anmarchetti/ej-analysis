import { BookingErrorCodes } from 'models/enum/BookingStatus';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

/**
 * Returns `SitecoreDictionary` key associated with given booking error code
 */
export const getBookingErrorMessageByCode = (code: Nullable<BookingErrorCodes>) => {
    if (!code) {
        return '';
    }

    switch (code) {
        case BookingErrorCodes.Fraud:
            return SitecoreDictionary.LoginErrorMessagesFraud;
        case BookingErrorCodes.Canceled:
            return SitecoreDictionary.LoginErrorMessagesCanceled;
        case BookingErrorCodes.AlreadyAssigned:
            return SitecoreDictionary.ViewBookingsErrorMessagesAlreadyAssignedHTML;
        case BookingErrorCodes.AlreadyAssignedToCurrent:
            return SitecoreDictionary.ViewBookingsErrorMessagesAlreadyAssignedToCurrentHTML;
        case BookingErrorCodes.EmailDiffers:
            return SitecoreDictionary.ViewBookingsErrorMessagesEmailDiffersHTML;
        case BookingErrorCodes.Privacy:
            return SitecoreDictionary.ViewBookingErrorMessagesTryAgainLater;
        case BookingErrorCodes.AccessToPrivateBooking:
            return SitecoreDictionary.LoginErrorMessagesPrivateBookingDescription;
        default:
            return SitecoreDictionary.LoginErrorMessagesCantFindBooking;
    }
};

export const getBookingErrorMessageTitleByCode = (code: Nullable<BookingErrorCodes>) => {
    if (!code) {
        return '';
    }

    switch (code) {
        case BookingErrorCodes.AccessToPrivateBooking:
            return SitecoreDictionary.LoginErrorMessagesPrivateBooking;
        default:
            return SitecoreDictionary.LoginLabelsSomethingWentWrong;
    }
};
