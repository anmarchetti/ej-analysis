import { renderHook } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';

import { usePriceJumpPopupTracking } from './usePriceJumpPopupTracking';

let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('usePriceJumpPopupTracking', () => {
    beforeEach(() => {
        mockStores = createMockStores({
            layoutStore: {
                isAmendHotelSummaryPage: false,
            },
            trackingStore: {
                changeHotel: {
                    priceJumpPopupAppearEvent: jest.fn(),
                    priceJumpPopupInteractionEvent: jest.fn(),
                },
            },
        });
    });

    it('should render component when isAmendHotelSummaryPage is true', () => {
        mockStores.layoutStore.isAmendHotelSummaryPage = true;

        const { result } = renderHook(usePriceJumpPopupTracking);

        expect(result.current.trackInteraction).toBe(
            mockStores.trackingStore.changeHotel.priceJumpPopupInteractionEvent,
        );
        expect(result.current.trackAppear).toBe(mockStores.trackingStore.changeHotel.priceJumpPopupAppearEvent);
    });

    it('should return default values when no any criteria match', () => {
        const { result } = renderHook(usePriceJumpPopupTracking);

        expect(result.current.trackInteraction).toStrictEqual(expect.any(Function));
        expect(result.current.trackAppear).toStrictEqual(expect.any(Function));
    });
});
