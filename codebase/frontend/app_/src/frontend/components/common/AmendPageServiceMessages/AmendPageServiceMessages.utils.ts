import bookingService from 'frontend/services/booking.service';
import { logger } from 'frontend/services/logging';
import { getRouteByDirection } from 'frontend/utils/airports.utils';
import { formatDateToQuery } from 'frontend/utils/date.utils';
import { IBookingInfo } from 'models/data/IBookingInfo';

export enum AmendServiceMessages {
    Errata = 'errata',
    FreeChildPlace = 'free-child-place',
}

export type TErrataOverrides = {
    accomCode?: string;
    date?: string;
};

export const fetchErrataOfferMessages = async (
    booking: Nullable<IBookingInfo>,
    overrides?: TErrataOverrides,
): Promise<string[]> => {
    if (!booking) return [];

    try {
        const { inbound } = getRouteByDirection(booking.package.transport.routes);
        const accomCode = overrides?.accomCode ?? booking.package.accom.code;
        const flightDepPt = inbound?.depPt ?? '';

        const date = overrides?.date ?? booking.package.accom.startDate;

        const response = await bookingService.getHotelErrataMessages({
            codes: [accomCode, flightDepPt],
            offerDate: formatDateToQuery(date),
        });

        return response;
    } catch (e) {
        logger.error(e);

        return [];
    }
};
