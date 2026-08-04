import { IAlternativeOffer } from 'models/data/IAlternativeOffers';
import { RouteDirection } from 'models/enum/RouteDirection';

export const getNewOfferForPriceGraph = (
    alternativeFlights: IAlternativeOffer[],
    inboundRouteId?: string,
    outboundRouteId?: string,
): IAlternativeOffer => {
    let matchingOffer;

    if (inboundRouteId && outboundRouteId) {
        matchingOffer = alternativeFlights.find(flight => {
            const inboundFlight = flight.transport.routes.find(f => f.direction === RouteDirection.Inbound);

            if (inboundFlight!.id !== inboundRouteId) return false;

            const outboundFlight = flight.transport.routes.find(f => f.direction === RouteDirection.Outbound);

            return outboundFlight!.id === outboundRouteId;
        });
    }

    return matchingOffer ?? [...alternativeFlights].sort((a, b) => a.price - b.price)[0];
};
