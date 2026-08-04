import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { createMockStores, mockPassenger } from 'frontend/__mocks__';
import { getRouteByDirection } from 'frontend/utils/airports.utils';
import { getPassengersWithInfants } from 'frontend/utils/seatAndBags.utils';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';

import AmendDatesSummarySeatMap from './AmendDatesSummarySeatMap';

expect.extend(toHaveNoViolations);

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockPlaceholderProps = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Placeholder: props => {
        mockPlaceholderProps(props);

        return <div data-tid='placeholder' />;
    },
}));

jest.mock('frontend/utils/airports.utils');
jest.mock('frontend/utils/seatAndBags.utils');

describe('<AmendDatesSummarySeatMap />', () => {
    beforeEach(() => {
        mockStores = createMockStores();
        mockProps = {
            rendering: 'rendering',
            onClose: jest.fn(),
        };

        jest.mocked(getRouteByDirection).mockImplementation(routes => ({
            inbound: routes[0],
            outbound: routes[1],
        }));
        jest.mocked(getPassengersWithInfants).mockImplementation(() => [mockPassenger]);
    });

    it('Should render component with seat map placeholder', () => {
        render(<AmendDatesSummarySeatMap {...mockProps} />);

        expect(screen.getByTestId('placeholder')).toBeInTheDocument();
        expect(mockPlaceholderProps).toHaveBeenCalledWith(
            expect.objectContaining({
                name: PlaceholderNames.SeatMap,
                rendering: 'rendering',
                props: {
                    isPostBooking: true,
                    adultsCount: 2,
                    childrenCount: 1,
                    adultsWithInfantsCount: 0,
                    depAirportCodeOut: 'PMI',
                    arrAirportCodeOut: 'BRS',
                    depDateOut: '2023-08-31',
                    flightNumberOut: '2712',
                    depAirportCodeIn: 'BRS',
                    arrAirportCodeIn: 'PMI',
                    depDateIn: '2023-08-26',
                    flightNumberIn: '2711',
                },
                onClose: mockProps.onClose,
            }),
        );
    });

    it('Should render seat-map placeholder with the correct props without inbound flight', () => {
        jest.mocked(getRouteByDirection).mockImplementation(routes => ({
            inbound: undefined,
            outbound: routes[1],
        }));

        render(<AmendDatesSummarySeatMap {...mockProps} />);
        expect(mockPlaceholderProps).toHaveBeenCalledWith(
            expect.objectContaining({
                props: {
                    isPostBooking: true,
                    adultsCount: 2,
                    childrenCount: 1,
                    adultsWithInfantsCount: 0,
                    depAirportCodeOut: 'PMI',
                    arrAirportCodeOut: 'BRS',
                    depDateOut: '2023-08-31',
                    flightNumberOut: '2712',
                },
            }),
        );
    });

    it('Should render seat-map placeholder with the correct props with infant', () => {
        jest.mocked(getPassengersWithInfants).mockImplementation(() => [{ ...mockPassenger, withInfant: true }]);

        render(<AmendDatesSummarySeatMap {...mockProps} />);

        expect(mockPlaceholderProps).toHaveBeenCalledWith(
            expect.objectContaining({
                props: {
                    isPostBooking: true,
                    adultsCount: 2,
                    childrenCount: 1,
                    adultsWithInfantsCount: 1,
                    depAirportCodeOut: 'PMI',
                    arrAirportCodeOut: 'BRS',
                    depDateOut: '2023-08-31',
                    flightNumberOut: '2712',
                    depAirportCodeIn: 'BRS',
                    arrAirportCodeIn: 'PMI',
                    depDateIn: '2023-08-26',
                    flightNumberIn: '2711',
                },
            }),
        );
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<AmendDatesSummarySeatMap {...mockProps} />);
            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });
});
