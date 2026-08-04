import { mockAmendDatesOfferWithPrice, mockBooking, mockFlightsOffers } from 'frontend/__mocks__';
import bookingService from 'frontend/services/booking.service';
import { checkForEqualTransports } from 'frontend/utils/route.utils';
import { IAmendTransport } from 'models/data/IAmendBookingFlights';

import AmendDatesFlights from './AmendDates.flights';
import MockedFn = jest.MockedFn;
import { deepClone } from 'frontend/utils/array.utils';

jest.mock('frontend/services/booking.service');
jest.mock('frontend/utils/route.utils', () => ({
    checkForEqualTransports: jest.fn(() => true),
}));

let amendDatesFlightsStore;

describe('AmendDatesStore.flights', () => {
    beforeEach(() => {
        amendDatesFlightsStore = new AmendDatesFlights({
            amendDatesStore: {
                booking: mockBooking,
                offerWithPrices: mockAmendDatesOfferWithPrice,
            },
            amendFlightsStore: {
                haveChosenSeatsBeenDropped: false,
            },
            routerStore: {
                redirectToAmendDatesSummaryPage: jest.fn(),
            },
        } as any);
        bookingService.getAmendDatesFlightsOptions = jest.fn(() => [mockAmendDatesOfferWithPrice]) as any;
    });

    describe('updateValidatedFlightOffers', () => {
        it('Should set previous offers that not exist in new offers passed as parameters', () => {
            amendDatesFlightsStore.validatedFlightOffers = [mockAmendDatesOfferWithPrice];

            const firstRouteId = 'firstRouteId';
            const secondRouteId = 'secondRouteId';

            const firstOffer = deepClone(mockAmendDatesOfferWithPrice);
            firstOffer.offer.transport.routes[0].id = firstRouteId;
            firstOffer.offer.transport.routes[1].id = secondRouteId;

            const firstDepName = 'firstDepName';
            const secondDepName = 'secondDepName';

            const secondOffer = deepClone(mockAmendDatesOfferWithPrice);
            secondOffer.offer.transport.routes[0].depName = firstDepName;
            secondOffer.offer.transport.routes[1].depName = secondDepName;

            amendDatesFlightsStore.updateValidatedFlightOffers([firstOffer, secondOffer]);

            const validatedOffer1 = amendDatesFlightsStore.validatedFlightOffers[0];
            const validatedOffer2 = amendDatesFlightsStore.validatedFlightOffers[1];

            expect(amendDatesFlightsStore.validatedFlightOffers.length).toBe(2);
            expect(validatedOffer1.offer.transport.routes[0].id).toBe(firstRouteId);
            expect(validatedOffer1.offer.transport.routes[1].id).toBe(secondRouteId);
            expect(validatedOffer2.offer.transport.routes[0].depName).toBe(firstDepName);
            expect(validatedOffer2.offer.transport.routes[1].depName).toBe(secondDepName);
        });
    });

    it('getAlternativeFlightsFromAmendDatesOffers', () => {
        const alternativeFlights = amendDatesFlightsStore.getAlternativeFlightsFromAmendDatesOffers([
            mockAmendDatesOfferWithPrice,
        ]);

        expect(alternativeFlights[0]).toEqual({
            amendmentCharges: mockAmendDatesOfferWithPrice.amendmentFlowCharges,
            routes: mockFlightsOffers[0].transport.routes,
            packagePrice: mockFlightsOffers[0].price,
            packagePricePP: mockFlightsOffers[0].pricePP,
            promoCodeBreakDown: mockAmendDatesOfferWithPrice.promoCodeBreakDown,
            errataFlightInfo: mockFlightsOffers[0].transport.errataFlightInfo,
        });
    });

    it('getAlternativeFlightFromAmendDatesOffer', () => {
        const alternativeFlight =
            amendDatesFlightsStore.getAlternativeFlightFromAmendDatesOffer(mockAmendDatesOfferWithPrice);
        expect(alternativeFlight).toEqual({
            promoCodeBreakDown: mockAmendDatesOfferWithPrice.promoCodeBreakDown,
            amendmentCharges: mockAmendDatesOfferWithPrice.amendmentFlowCharges,
            routes: mockFlightsOffers[0].transport.routes,
            packagePrice: mockFlightsOffers[0].price,
            packagePricePP: mockFlightsOffers[0].pricePP,
            errataFlightInfo: mockFlightsOffers[0].transport.errataFlightInfo,
        });
    });

    describe('getChangeDateAmendFlightsOffers', () => {
        it('Should return flight offer', async () => {
            const flightOffers = await amendDatesFlightsStore.getChangeDateAmendFlightsOffers();

            expect(amendDatesFlightsStore.flightOffers).toEqual([mockAmendDatesOfferWithPrice]);

            expect(flightOffers).toEqual([mockFlightsOffers[0]]);
        });

        it('Should return an empty array when no booking', async () => {
            amendDatesFlightsStore.rootStore.amendDatesStore.booking = null;
            const flightOffers = await amendDatesFlightsStore.getChangeDateAmendFlightsOffers();

            expect(Array.isArray(flightOffers)).toBe(true);
            expect(flightOffers.length).toBe(0);
        });

        it('Should return an empty array when no initial offerWithPrices', async () => {
            amendDatesFlightsStore.rootStore.amendDatesStore.offerWithPrices = null;
            const flightOffers = await amendDatesFlightsStore.getChangeDateAmendFlightsOffers();

            expect(Array.isArray(flightOffers)).toBe(true);
            expect(flightOffers.length).toBe(0);
        });

        it('Should return an empty array when http code is successful but no offers provided', async () => {
            bookingService.getAmendDatesFlightsOptions = jest.fn().mockReturnValue(undefined);
            const flightOffers = await amendDatesFlightsStore.getChangeDateAmendFlightsOffers();

            expect(Array.isArray(flightOffers)).toBe(true);
            expect(flightOffers.length).toBe(0);
        });
    });

    describe('submitFlightChangeSelection', () => {
        it('should redirect method be called', () => {
            const selectedFlight = mockFlightsOffers[0].transport;
            amendDatesFlightsStore.validatedFlightOffers = [mockAmendDatesOfferWithPrice];
            (checkForEqualTransports as MockedFn<any>).mockImplementation(() => true);

            amendDatesFlightsStore.submitFlightChangeSelection(selectedFlight as IAmendTransport);

            expect(amendDatesFlightsStore.rootStore.amendDatesStore.offerWithPrices).toEqual(
                mockAmendDatesOfferWithPrice,
            );
            expect(amendDatesFlightsStore.rootStore.routerStore.redirectToAmendDatesSummaryPage).toHaveBeenCalled();
        });

        it('should NOT redirect method be called when seats drop status be true', () => {
            const selectedFlight = mockFlightsOffers[0].transport;
            amendDatesFlightsStore.validatedFlightOffers = [mockAmendDatesOfferWithPrice];
            amendDatesFlightsStore.rootStore.amendFlightsStore.haveChosenSeatsBeenDropped = true;

            amendDatesFlightsStore.submitFlightChangeSelection(selectedFlight as IAmendTransport);

            expect(amendDatesFlightsStore.rootStore.routerStore.redirectToAmendDatesSummaryPage).not.toHaveBeenCalled();
        });

        it('Should return undefined when selectedOffer has NOT been found', () => {
            const selectedFlight = mockFlightsOffers[0].transport;
            selectedFlight.routes[0].id = 'TestID';
            amendDatesFlightsStore.validatedFlightOffers = [mockAmendDatesOfferWithPrice];

            const result = amendDatesFlightsStore.submitFlightChangeSelection(selectedFlight as IAmendTransport);

            expect(result).toBe(undefined);
        });
    });

    describe('clearStore', () => {
        it('Should set offers to initial state', () => {
            amendDatesFlightsStore.validatedFlightOffers = [mockAmendDatesOfferWithPrice];
            amendDatesFlightsStore.flightOffers = [mockAmendDatesOfferWithPrice];
            amendDatesFlightsStore.noAvailableFlightOffers = true;

            amendDatesFlightsStore.clearStore();

            expect(amendDatesFlightsStore.validatedFlightOffers.length).toBe(0);
            expect(amendDatesFlightsStore.flightOffers.length).toBe(0);
            expect(amendDatesFlightsStore.noAvailableFlightOffers).toBe(false);
        });
    });

    describe('setNoAvailableFlightOffers', () => {
        it('sets noAvailableFlightOffers', () => {
            expect(amendDatesFlightsStore.noAvailableFlightOffers).toBe(false);

            amendDatesFlightsStore.setNoAvailableFlightOffers(true);

            expect(amendDatesFlightsStore.noAvailableFlightOffers).toBe(true);
        });
    });
});
