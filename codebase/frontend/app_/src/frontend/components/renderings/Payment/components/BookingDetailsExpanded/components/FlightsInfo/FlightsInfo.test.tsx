import * as React from 'react';
import { render, screen } from '@testing-library/react';

import { IRouteInfoProps } from 'frontend/components/renderings/Payment/components/BookingDetailsExpanded/components/RouteInfo/RouteInfo';

import FlightsInfo, { IFlightsInfoProps } from './FlightsInfo';

jest.mock('frontend/components/icons/PlainDeparture', () => ({
    __esModule: true,
    default: () => <div data-tid='departure-icon'>Departure Icon</div>,
}));

jest.mock(
    'frontend/components/renderings/Payment/components/BookingDetailsExpanded/components/RouteInfo/RouteInfo',
    () => ({
        __esModule: true,
        default: () => <div data-tid='route-info' />,
    }),
);

const createProps = (): IFlightsInfoProps => ({
    departureRouteInfo: {} as IRouteInfoProps,
    arrivalRouteInfo: {} as IRouteInfoProps,
});

let mockProps = createProps();

describe('<FlightsInfo />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should render both departure and arrival information when provided', () => {
        render(<FlightsInfo {...mockProps} />);

        expect(screen.getByTestId('outbound-flight')).toBeInTheDocument();
        expect(screen.getByTestId('inbound-flight')).toBeInTheDocument();
    });

    it('should render only departure information when arrival is not provided', () => {
        mockProps.arrivalRouteInfo = null;

        render(<FlightsInfo {...mockProps} />);

        expect(screen.getByTestId('outbound-flight')).toBeInTheDocument();
        expect(screen.queryByTestId('inbound-flight')).toBeNull();
    });

    it('should render only arrival information when departure is not provided', () => {
        mockProps.departureRouteInfo = null;

        render(<FlightsInfo {...mockProps} />);

        expect(screen.queryByTestId('outbound-flight')).toBeNull();
        expect(screen.getByTestId('inbound-flight')).toBeInTheDocument();
    });

    it('should return null when both departure and arrival are not provided', () => {
        mockProps.departureRouteInfo = null;
        mockProps.arrivalRouteInfo = null;

        const { container } = render(<FlightsInfo {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });
});
