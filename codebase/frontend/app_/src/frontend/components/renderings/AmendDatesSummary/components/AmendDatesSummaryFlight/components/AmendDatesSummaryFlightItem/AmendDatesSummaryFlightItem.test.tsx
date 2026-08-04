import { render, screen } from '@testing-library/react';

import { mockOutboundFlight } from 'frontend/__mocks__';

import AmendDatesSummaryFlightItem from './AmendDatesSummaryFlightItem';

const createProps = () => ({
    route: mockOutboundFlight,
    previousRoute: {
        ...mockOutboundFlight,
        depDate: '2023-05-15T00:00:00',
        arrDate: '2023-05-15T04:15:00',
    },
});

let mockProps;

describe('<AmendDatesSummaryFlightItem />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('Render route and previous route info', () => {
        render(<AmendDatesSummaryFlightItem {...mockProps} />);

        expect(screen.getByText('Thursday 11 May 2023')).toBeInTheDocument();
        expect(screen.getByText('12:10 - 16:25')).toBeInTheDocument();
        expect(screen.getByText('London Gatwick (LGW) - (ACE)')).toBeInTheDocument();
        expect(screen.getByText('Monday 15 May 2023')).toBeInTheDocument();
        expect(screen.getByText('00:00 - 04:15')).toBeInTheDocument();
    });

    it('Should render departure dates, rather than arrival dates, in the case where arrival time is after midnight', () => {
        mockProps.route.depDate = '2023-05-11T23:15:00';
        mockProps.route.arrDate = '2023-05-12T00:00:00';
        mockProps.previousRoute.depDate = '2023-05-14T23:15:00';
        mockProps.previousRoute.arrDate = '2023-05-15T00:00:00';
        render(<AmendDatesSummaryFlightItem {...mockProps} />);

        expect(screen.getByTestId('flight-date')).toHaveTextContent('Thursday 11 May 2023');
        expect(screen.getByTestId('previous-flight-date')).toHaveTextContent('Sunday 14 May 2023');
    });
});
