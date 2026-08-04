import React from 'react';

import { createMockStores, mockPassengersFlights } from 'frontend/__mocks__';

import { usePricePanelInfo } from './usePricePanelInfo';

jest.mock('frontend/components/renderings/SeatAndBags/components/SeatMapPricePanel/SeatMapPricePanel', () => ({
    __esModule: true,
    default: () => <div data-tid='seat-map-price' />,
}));

let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('usePricePanelInfo', () => {
    beforeEach(() => {
        mockStores = createMockStores({
            seatMapStore: {
                haveOutboundSelectedSeats: true,
                haveInboundSelectedSeats: true,
            },
            layoutStore: {
                isViewBookingPage: false,
                isConfirmationPage: false,
            },
            flightsPassengersStore: {
                passengersByQueue: mockPassengersFlights,
            },
        });
    });

    it('Should return outbound case and inbound case', () => {
        const result = usePricePanelInfo(true);

        expect(result).toStrictEqual({
            inboundPricePanels: expect.any(Array<React.ReactNode>),
            outboundPricePanels: expect.any(Array<React.ReactNode>),
        });
    });

    it('Should return null when outbound and it forbidden ', () => {
        mockStores.seatMapStore.haveOutboundSelectedSeats = false;
        mockStores.appStore.isScreenLessMedium = true;
        mockStores.layoutStore.isViewBookingPage = true;

        const result = usePricePanelInfo(true);

        expect(result).toStrictEqual({
            inboundPricePanels: expect.any(Array<React.ReactNode>),
            outboundPricePanels: null,
        });
    });

    it('Should return null when inbound and it forbidden ', () => {
        mockStores.seatMapStore.haveInboundSelectedSeats = false;
        mockStores.appStore.isScreenLessMedium = true;
        mockStores.layoutStore.isViewBookingPage = true;

        const result = usePricePanelInfo(true);

        expect(result).toStrictEqual({
            inboundPricePanels: null,
            outboundPricePanels: expect.any(Array<React.ReactNode>),
        });
    });
});
