import { mockFlightsOffers } from 'frontend/__mocks__';
import { AlternativeFlightsSortBy } from 'models/enum/AlternativeFlightsSortBy';

import { AmendFlightsSortStore } from './AmendFlightsSortStore';

let mockStores;
let amendFlightsSortStore: AmendFlightsSortStore;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('AmendFlightsSortStore', () => {
    beforeEach(() => {
        amendFlightsSortStore = new AmendFlightsSortStore();
    });

    it('should have default sortBy', () => {
        expect(amendFlightsSortStore.sortBy).toBe(AlternativeFlightsSortBy.PriceLowToHigh);
    });

    describe('setSortByInitially', () => {
        it('should sort by passed value', () => {
            amendFlightsSortStore.setSortByInitially([], { fields: { Code: { value: 'value' } } } as any);

            expect(amendFlightsSortStore.sortBy).toBe('value');
        });

        it('should sort by default value', () => {
            amendFlightsSortStore.setSortByInitially([], { fields: { Code: { value: '' } } } as any);

            expect(amendFlightsSortStore.sortBy).toBe(AlternativeFlightsSortBy.OutboundEarliestDeparture);
        });
    });

    describe('getSortedOffers', () => {
        it('should sort by PriceLowToHigh', () => {
            amendFlightsSortStore.sortBy = AlternativeFlightsSortBy.PriceLowToHigh;
            const offers = amendFlightsSortStore.getSortedOffers(mockFlightsOffers);

            expect(offers[0].totalPrice).toBe(3963.16);
        });

        it('should sort by PriceHightToLow', () => {
            amendFlightsSortStore.sortBy = AlternativeFlightsSortBy.PriceHightToLow;
            const offers = amendFlightsSortStore.getSortedOffers(mockFlightsOffers);

            expect(offers[0].totalPrice).toBe(4317.16);
        });

        it('should sort by ReturningEarliestArrival', () => {
            amendFlightsSortStore.sortBy = AlternativeFlightsSortBy.ReturningEarliestArrival;
            const offers = amendFlightsSortStore.getSortedOffers(mockFlightsOffers);

            expect(offers[0].transport.routes[0].id).toBe('2179869764/755595');
        });

        it('should sort by OutboundEarliestDeparture', () => {
            amendFlightsSortStore.sortBy = AlternativeFlightsSortBy.OutboundEarliestDeparture;
            const offers = amendFlightsSortStore.getSortedOffers(mockFlightsOffers);

            expect(offers[0].transport.routes[0].id).toBe('2179873450/755956');
        });

        it('should sort by Nearest Airport', () => {
            amendFlightsSortStore.sortBy = AlternativeFlightsSortBy.NearestAirport;
            const offers = amendFlightsSortStore.getSortedOffers(mockFlightsOffers);

            expect(offers[0].distanceToOriginalAirport).toBeUndefined();
            expect(offers[1].distanceToOriginalAirport).toEqual(mockFlightsOffers[0].distanceToOriginalAirport);
        });

        it('should NOT filter', () => {
            amendFlightsSortStore.sortBy = 'Test_sort' as any;
            const offers = amendFlightsSortStore.getSortedOffers(mockFlightsOffers);

            expect(offers[0].transport.routes[0].id).toBe('2179873450/755956');
        });

        it('should return initial order', () => {
            const offers = [...mockFlightsOffers];
            offers[0].transport.routes[0].direction = 'Test_direction' as any;
            offers[0].transport.routes[1].direction = 'Test_direction' as any;
            offers[1].transport.routes[1].direction = 'Test_direction' as any;
            offers[1].transport.routes[0].direction = 'Test_direction' as any;
            amendFlightsSortStore.sortBy = AlternativeFlightsSortBy.OutboundEarliestDeparture;
            const result = amendFlightsSortStore.getSortedOffers(offers);

            expect(result[0].transport.routes[0].id).toBe('2179873450/755956');
        });
    });

    it('should set sort by prop', () => {
        amendFlightsSortStore.onChangeSortBy(AlternativeFlightsSortBy.OutboundEarliestDeparture);

        expect(amendFlightsSortStore.sortBy).toBe(AlternativeFlightsSortBy.OutboundEarliestDeparture);
    });

    it('selectedSortOption', () => {
        amendFlightsSortStore.sortOptions = [{ value: AlternativeFlightsSortBy.OutboundEarliestDeparture }] as any;
        amendFlightsSortStore.sortBy = AlternativeFlightsSortBy.OutboundEarliestDeparture;

        expect(amendFlightsSortStore.selectedSortOption?.value).toBe(
            AlternativeFlightsSortBy.OutboundEarliestDeparture,
        );
    });
});
