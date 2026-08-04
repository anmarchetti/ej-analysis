import { mockValidatedFlights } from 'frontend/__mocks__';
import { AlternativeFlightsSortBy } from 'models/enum/AlternativeFlightsSortBy';

import { checkForOrderIncorrect } from './AmendFlightsStore.utils';

describe('AmendFlightsStore.utils', () => {
    describe('checkForOrderIncorrect', () => {
        it('Should return false when order is correct', () => {
            const flights = [mockValidatedFlights.transports[0], mockValidatedFlights.transports[1]];
            const result = checkForOrderIncorrect(flights, AlternativeFlightsSortBy.PriceLowToHigh);

            expect(result).toBe(false);
        });

        it('Should return false when flights have no prices', () => {
            const flights = [{ ...mockValidatedFlights.transports[0] }, { ...mockValidatedFlights.transports[1] }];
            flights[0].amendmentCharges = undefined;
            flights[1].amendmentCharges = undefined;
            const result = checkForOrderIncorrect(flights, AlternativeFlightsSortBy.PriceLowToHigh);

            expect(result).toBe(false);
        });

        it('Should return false when flights length is one', () => {
            const flights = [mockValidatedFlights.transports[1]];
            const result = checkForOrderIncorrect(flights, AlternativeFlightsSortBy.PriceLowToHigh);

            expect(result).toBe(false);
        });

        it('Should return true when flights have incorrect price order', () => {
            const flights = [mockValidatedFlights.transports[1], mockValidatedFlights.transports[0]];
            const result = checkForOrderIncorrect(flights, AlternativeFlightsSortBy.PriceLowToHigh);

            expect(result).toBe(true);
        });

        it('Should return true when flights have incorrect price order with PriceHightToLow sort', () => {
            const flights = [mockValidatedFlights.transports[0], mockValidatedFlights.transports[1]];
            const result = checkForOrderIncorrect(flights, AlternativeFlightsSortBy.PriceHightToLow);

            expect(result).toBe(true);
        });
    });
});
