import { IAlternativeOffer } from 'models/data/IAlternativeOffers';
import { RouteDirection } from 'models/enum/RouteDirection';

import { getNewOfferForPriceGraph } from './AlternativeFlights.utils';

describe('AlternativeFlights.utils', () => {
    describe('getNewOfferForPriceGraph', () => {
        const newOffer = {
            price: 100,
            pricePP: 100,
            transport: {
                routes: [
                    { direction: RouteDirection.Outbound, id: '2' },
                    { direction: RouteDirection.Inbound, id: '1' },
                ],
            },
        };

        const cheapestOffer = {
            price: 1,
            pricePP: 1,
            transport: {
                routes: [
                    { direction: RouteDirection.Outbound, id: '4' },
                    { direction: RouteDirection.Inbound, id: '3' },
                ],
            },
        };

        const alternativeFlights = [newOffer, cheapestOffer] as IAlternativeOffer[];

        it('should return the cheapest option when inbound flight is NOT provided', () => {
            const result = getNewOfferForPriceGraph(alternativeFlights, undefined, '2');

            expect(result).toBe(cheapestOffer);
        });

        it('should return the cheapest option when outbound flight is NOT provided', () => {
            const result = getNewOfferForPriceGraph(alternativeFlights, '1', undefined);

            expect(result).toBe(cheapestOffer);
        });

        it('should return the cheapest option when inbound flight is NOT in alternativeFlights', () => {
            const result = getNewOfferForPriceGraph(alternativeFlights, '10', '2');

            expect(result).toBe(cheapestOffer);
        });

        it('should return the cheapest option when outbound flight is NOT in alternativeFlights', () => {
            const result = getNewOfferForPriceGraph(alternativeFlights, '1', '10');

            expect(result).toBe(cheapestOffer);
        });

        it('should return the option with correct inbound and outbound flights', () => {
            const result = getNewOfferForPriceGraph(alternativeFlights, '1', '2');

            expect(result).toBe(newOffer);
        });
    });
});
