import { getRoute } from 'frontend/utils/route.utils';
import { getBookingRoute } from 'frontend/utils/viewBooking.utils';
import { IBookingInfo } from 'models/data/IBookingInfo';
import { IOffer } from 'models/data/IOffer';
import { RouteDirection } from 'models/enum/RouteDirection';

export const getBookingData = (
    amendDatesOffer: Nullable<IOffer>,
    booking: IBookingInfo,
    isFromChangeDate?: boolean,
): {
    bookingStartDate: string;
    arrAirportName?: string;
    depAirportName?: string;
} => {
    if (isFromChangeDate && amendDatesOffer) {
        const { depName: depAirportName, arrName: arrAirportName } =
            getRoute(amendDatesOffer, RouteDirection.Outbound) || {};

        return { depAirportName, arrAirportName, bookingStartDate: amendDatesOffer.accom.date };
    }

    const { depName: depAirportName, arrName: arrAirportName } =
        getBookingRoute(booking, RouteDirection.Outbound) || {};

    return { depAirportName, arrAirportName, bookingStartDate: booking.package?.accom?.startDate };
};
