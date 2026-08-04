import { getRouteByDirection } from 'frontend/utils/airports.utils';
import { extractPassengerSeats } from 'frontend/utils/passenger.utils';
import { getFlightDigitalNumber } from 'frontend/utils/route.utils';
import { getSeatMapInfoFromSelectedSeats } from 'frontend/utils/seatAndBags.utils';
import { IGuestPassenger } from 'models/data/ILeadPassenger';
import { IRoute } from 'models/data/IRoute';
import { IPassengerSeats, ISelectedSeat } from 'models/data/ISeatMapStore';

export const getSelectedSeats = (
    routes: IRoute[],
    guests: IGuestPassenger[],
    seatSelection: ISelectedSeat[],
): IPassengerSeats => {
    const { inbound: inboundRoute, outbound: outboundRoute } = getRouteByDirection(routes);
    const inboundFlightNum = getFlightDigitalNumber(inboundRoute);
    const outboundFlightNum = getFlightDigitalNumber(outboundRoute);

    const passengersWithSeatSelection = getSeatMapInfoFromSelectedSeats({
        guests,
        seatSelection,
        outboundFlightNum,
        inboundFlightNum,
    });

    const { inboundSeats, outboundSeats } = extractPassengerSeats(passengersWithSeatSelection);

    return { outboundSeats, inboundSeats };
};
