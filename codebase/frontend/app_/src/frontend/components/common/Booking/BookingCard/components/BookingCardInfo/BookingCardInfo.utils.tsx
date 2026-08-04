import { getFlightsReferences } from 'frontend/utils/route.utils';
import { getCheckInLink } from 'frontend/utils/viewBooking.utils';
import { IBookingInfo } from 'models/data/IBookingInfo';
import SiteSettings from 'models/enum/SiteSettings';
import { getCommonData } from 'frontend/components/common/Booking/BookingCard/BookingCard.utils';

interface IPreparedBookingData {
    checkInLink: Nullable<string>;
    isCanceled: boolean;
    isCheckInButtonDisplayed: boolean;
}

export const usePreparedBookingInfoData = (
    booking: IBookingInfo,
    getSetting: (setting: SiteSettings) => string,
): IPreparedBookingData => {
    const { isCanceled } = getCommonData(booking);
    const { package: bookingPackage } = booking;
    const flightReferences = getFlightsReferences(bookingPackage.transport?.routes || []);
    const hasMultipleFlightsRefs = flightReferences.length > 1;
    const checkInLink = getCheckInLink(booking, getSetting);

    return {
        isCanceled,
        checkInLink,
        isCheckInButtonDisplayed: !isCanceled && !hasMultipleFlightsRefs && !!checkInLink,
    };
};
