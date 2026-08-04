import BaseBookingStore from 'frontend/store/base/booking/BaseBookingStore';
import BaseViewBookingStore from 'frontend/store/base/viewBooking/BaseViewBookingStore';
import { BookingStore } from 'frontend/store/holidays/booking/BookingStore';
import INavLink from 'models/data/INavLink';
import { QueryParamName } from 'models/enum/QueryParamName';
import { ShowOn } from 'models/enum/ShowOn';
import SitePath from 'models/enum/SitePath';

import { containsSubstring } from './string.utils';

type TIsUserLinkValidParams = {
    booking: BaseBookingStore['booking'];
    isBookingConfirmationPage: boolean;
    isCheckInAvailable: BookingStore['isCheckInAvailable'];
    isLoggedIn: boolean | undefined;
    isViewBookingPage: boolean;
    item: INavLink;
    viewBooking: BaseViewBookingStore['booking'];
};

export const isHolidayCreditItem = (item: INavLink): boolean =>
    containsSubstring(item?.fields?.Link?.value?.href || '', SitePath.HolidayCredit);

export const isRedeemVoucherItem = (item: INavLink): boolean =>
    containsSubstring(item?.fields?.Link?.value?.href || '', SitePath.RedeemVoucher) ||
    containsSubstring(item?.fields?.Link?.value?.querystring || '', SitePath.RedeemVoucher);

export const isLogOutItem = (querystring: string): boolean => containsSubstring(querystring, QueryParamName.Logout);

export const isHelpItem = (item: INavLink): boolean =>
    containsSubstring(item?.fields?.Link?.value?.href || '', SitePath.Help);

export const getIdFromAnchor = (anchor: string): string => (anchor[0] === '#' ? anchor.substring(1) : anchor);

export const isUserLinkValid = ({
    item,
    isLoggedIn,
    isBookingConfirmationPage,
    booking,
    viewBooking,
    isViewBookingPage,
    isCheckInAvailable,
}: TIsUserLinkValidParams): boolean => {
    const showCase = item.fields?.ShowOn?.value;

    if (showCase === ShowOn.ShowOnIfAvailableToCheckIn) {
        if (isBookingConfirmationPage && booking) {
            return isCheckInAvailable(booking);
        }

        if (isViewBookingPage && viewBooking) {
            return isCheckInAvailable(viewBooking);
        }

        return true;
    }

    return (
        !showCase ||
        (isLoggedIn && showCase === ShowOn.ShowOnLogedIn) ||
        (!isLoggedIn && showCase === ShowOn.ShowOnLogedOut) ||
        showCase === ShowOn.ShowOnDesktop
    );
};
