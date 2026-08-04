import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockFlightsRoutes, mockPassenger } from 'frontend/__mocks__';

import HolidaySummaryFlights from './HolidaySummaryFlights';

const createProps = () => ({
    flights: {
        routes: mockFlightsRoutes,
    },
    passengers: [mockPassenger],
    fastTrackInfoFields: {
        FastTrackLabel: { value: '{count} x Fast track' },
        FastTrackLogo: { value: { src: '/logo.svg', alt: 'Fast Track logo' } },
    },
});

let mockProps;

const outboundSeatsValue = 'outboundSelectedSeats';
const inboundSeatsValue = 'inboundSelectedSeats';
const getPassengerResult = 'getPassengersWithInfants';

const mockFlightsAndSeatsProps = jest.fn();
jest.mock('./components/HolidaySummaryFlightsItem/HolidaySummaryFlightsItem', () => ({
    __esModule: true,
    default: ({ dataTid, ...props }) => {
        mockFlightsAndSeatsProps(props);

        return <div data-tid={dataTid} />;
    },
}));
jest.mock(
    'frontend/components/renderings/AmendDatesSummary/components/AmendDatesSummarySeats/AmendDatesSummarySeats.utils',
    () => ({
        __esModule: true,
        getSelectedSeats: jest.fn(() => ({
            outboundSeats: outboundSeatsValue,
            inboundSeats: inboundSeatsValue,
        })),
    }),
);

jest.mock('frontend/utils/seatAndBags.utils', () => ({
    __esModule: true,
    getPassengersWithInfants: jest.fn(() => getPassengerResult),
}));

describe('<HolidaySummaryFlights />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should render 2 flight routes components ', () => {
        mockProps.isLuxuryPackage = false;
        render(<HolidaySummaryFlights {...mockProps} />);

        expect(screen.getByTestId('holiday-summary-flight-items-outbound')).toBeInTheDocument();
        expect(screen.getByTestId('holiday-summary-flight-items-inbound')).toBeInTheDocument();
        expect(mockFlightsAndSeatsProps).toHaveBeenCalledWith(
            expect.objectContaining({
                chosenSeats: outboundSeatsValue,
            }),
        );
        expect(mockFlightsAndSeatsProps).toHaveBeenCalledWith(
            expect.objectContaining({
                showSpeedyBoardingTooltip: false,
                chosenSeats: inboundSeatsValue,
            }),
        );
    });

    it('should pass fast track props only to the outbound flight when isLuxuryPackage is true', () => {
        mockProps.isLuxuryPackage = true;

        render(<HolidaySummaryFlights {...mockProps} />);

        expect(mockFlightsAndSeatsProps).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({
                includesFastTrack: true,
                fastTrackInfoFields: {
                    FastTrackLabel: { value: '{count} x Fast track' },
                    FastTrackLogo: mockProps.fastTrackInfoFields.FastTrackLogo,
                },
            }),
        );

        expect(mockFlightsAndSeatsProps).toHaveBeenNthCalledWith(
            2,
            expect.objectContaining({
                showSpeedyBoardingTooltip: true,
            }),
        );

        const inboundProps = mockFlightsAndSeatsProps.mock.calls[1][0];

        expect(inboundProps.includesFastTrack).toBeUndefined();
    });
});
