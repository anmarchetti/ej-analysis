import { FunctionComponent } from 'react';
import { Placeholder } from '@sitecore-jss/sitecore-jss-nextjs';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { getRouteByDirection } from 'frontend/utils/airports.utils';
import { formatDateToQuery } from 'frontend/utils/date.utils';
import { getPassengersWithInfants } from 'frontend/utils/seatAndBags.utils';
import { IFlightPassenger } from 'models/data/AncillariesInfo';
import { GuestType } from 'models/enum/GuestType';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';

export interface IAmendDatesSummarySeatMapProps {
    onClose: () => void;
    rendering: ISitecoreComponent['rendering'];
}

const AmendDatesSummarySeatMap: FunctionComponent<IAmendDatesSummarySeatMapProps> = ({ rendering, onClose }) => {
    const { guestsCounts, offerWithPrices, booking } = useStore((stores: IHolidaysStores) => ({
        guestsCounts: stores.amendDatesStore.guestsCounts,
        offerWithPrices: stores.amendDatesStore.offerWithPrices,
        booking: stores.amendDatesStore.booking,
    }));

    const passengers: IFlightPassenger[] = getPassengersWithInfants(booking!.guests);
    const adultsWithInfantsCount = passengers.filter(({ withInfant }) => withInfant).length;

    const { inbound: inboundRoute, outbound: outboundRoute } = getRouteByDirection(
        offerWithPrices!.offer.transport.routes,
    );
    const inboundRouteData = inboundRoute
        ? {
              depAirportCodeIn: inboundRoute?.depPt,
              arrAirportCodeIn: inboundRoute?.arrPt,
              depDateIn: formatDateToQuery(inboundRoute?.depDate),
              flightNumberIn: inboundRoute?.fltNo.replace(/\D/g, ''),
          }
        : {};

    return (
        <Placeholder
            name={PlaceholderNames.SeatMap}
            rendering={rendering}
            props={{
                isPostBooking: true,
                adultsCount: guestsCounts[GuestType.Adult],
                childrenCount: guestsCounts[GuestType.Child],
                adultsWithInfantsCount,
                depAirportCodeOut: outboundRoute?.depPt,
                arrAirportCodeOut: outboundRoute?.arrPt,
                depDateOut: formatDateToQuery(outboundRoute?.depDate),
                flightNumberOut: outboundRoute?.fltNo.replace(/\D/g, ''),
                ...inboundRouteData,
            }}
            onClose={onClose}
        />
    );
};

export default AmendDatesSummarySeatMap;
