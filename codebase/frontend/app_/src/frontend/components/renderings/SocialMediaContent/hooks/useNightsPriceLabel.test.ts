import { renderHook } from '@testing-library/react';

import { createMockStores, mockFlightsOffers } from 'frontend/__mocks__';

import { useNightsPriceLabel } from './useNightsPriceLabel';

const createStores = () =>
    createMockStores({
        amendPaymentStore: { currency: 'currency' },
        bookingStore: { totalPricePPWithTouristTax: 150 },
    });
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('useNightsPriceLabel', () => {
    mockStores = createStores();

    it('should return correct values', () => {
        const { result } = renderHook(() => useNightsPriceLabel(mockFlightsOffers[0]));

        expect(result.current).toEqual([
            '5 Globals.Labels.NightsPlural',
            'Globals.PriceLabels.PerPersonFrom£150undefined',
        ]);
    });

    it('should return empty strings when offer undefined', () => {
        mockStores.bookingStore.totalPricePPWithTouristTax = null;

        const { result } = renderHook(() => useNightsPriceLabel(null));

        expect(result.current).toEqual(['', '']);
    });
});
