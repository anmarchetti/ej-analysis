import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { createMockStores, mockBooking } from 'frontend/__mocks__';

import itinerarySummaryFieldsMocks from './__mocks__/itinerarySummaryFields';
import ItinerarySummary, { TItinerarySummaryProps } from './ItinerarySummary';

const createProps = (): TItinerarySummaryProps => ({
    fields: itinerarySummaryFieldsMocks,
    params: {},
    rendering: {},
    wasRerendered: true,
});

let props: TItinerarySummaryProps;
let mockStores;

const mockItineraryAirport = jest.fn();
const mockItineraryFlight = jest.fn();
const mockItineraryTransfer = jest.fn();
const mockItineraryHotel = jest.fn();

jest.mock('./components/ItineraryAirport/ItineraryAirport', () => ({
    __esModule: true,
    default: props => {
        mockItineraryAirport(props);

        return <div data-tid='itinerary-airport' />;
    },
}));

jest.mock('./components/ItineraryFlight/ItineraryFlight', () => ({
    __esModule: true,
    default: props => {
        mockItineraryFlight(props);

        return <div data-tid='itinerary-flight' />;
    },
}));

jest.mock('./components/ItineraryTransfer/ItineraryTransfer', () => ({
    __esModule: true,
    default: props => {
        mockItineraryTransfer(props);

        return <div data-tid='itinerary-transfer' />;
    },
}));

jest.mock('./components/ItineraryHotel/ItineraryHotel', () => ({
    __esModule: true,
    default: props => {
        mockItineraryHotel(props);

        return <div data-tid='itinerary-hotel' />;
    },
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<ItinerarySummary />', () => {
    beforeEach(() => {
        props = createProps();
        mockStores = createMockStores({
            viewBookingStore: {
                booking: mockBooking,
                isLuxuryPackage: false,
                bookingTransfers: null,
            },
            appStore: {
                isScreenMedium: true,
            },
            layoutStore: {
                isBodyScrollLocked: false,
                setIsBodyScrollLocked: jest.fn(),
            },
        });
    });

    it('should NOT render when fields undefined', () => {
        props.fields = undefined;

        const { container } = render(<ItinerarySummary {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when booking undefined', () => {
        mockStores.viewBookingStore.booking = undefined;

        const { container } = render(<ItinerarySummary {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render itinerary items list', () => {
        render(<ItinerarySummary {...props} />);

        expect(screen.getByTestId('itinerary-container')).toBeInTheDocument();
        expect(screen.getAllByTestId('itinerary-flight')).toHaveLength(2);
        expect(screen.getAllByTestId('itinerary-transfer')).toHaveLength(2);
        expect(screen.getByTestId('itinerary-hotel')).toBeInTheDocument();
    });

    it('should render airport for luxury packages', () => {
        mockStores.viewBookingStore.isLuxuryPackage = true;

        render(<ItinerarySummary {...props} />);

        expect(screen.getByTestId('itinerary-airport')).toBeInTheDocument();
    });

    it('should render expand all button and toggle expansion', async () => {
        render(<ItinerarySummary {...props} />);

        const btn = screen.getByTestId('expand-all-button');

        expect(btn).toBeInTheDocument();
        expect(btn).toHaveTextContent('Expand all');

        expect(mockItineraryFlight).toHaveBeenCalledWith(
            expect.objectContaining({
                isExpanded: false,
            }),
        );

        await userEvent.click(btn);

        expect(mockItineraryFlight).toHaveBeenCalledWith(
            expect.objectContaining({
                isExpanded: true,
            }),
        );
        expect(btn).toHaveTextContent('Close all');

        await userEvent.click(btn);

        expect(mockItineraryFlight).toHaveBeenCalledWith(
            expect.objectContaining({
                isExpanded: false,
            }),
        );
        expect(btn).toHaveTextContent('Expand all');
    });

    it('should toggle individual item expansion via setExpanded', async () => {
        render(<ItinerarySummary {...props} />);

        const initialFlightCalls = mockItineraryFlight.mock.calls;

        expect(initialFlightCalls[0][0].isExpanded).toBe(false);

        await userEvent.click(screen.getByTestId('expand-all-button'));

        const expandedCalls = mockItineraryFlight.mock.calls;
        const lastInboundCall = expandedCalls[expandedCalls.length - 2][0];
        expect(lastInboundCall.isExpanded).toBe(true);

        act(() => {
            lastInboundCall.setExpanded();
        });

        const afterCollapseCalls = mockItineraryFlight.mock.calls;
        const lastCall = afterCollapseCalls[afterCollapseCalls.length - 2][0];
        expect(lastCall.isExpanded).toBe(false);
    });

    it('should pass isLess24HoursBeforeDeparture to inbound transfer', () => {
        render(<ItinerarySummary {...props} />);

        const inboundTransferCalls = mockItineraryTransfer.mock.calls.filter(
            ([callProps]) => callProps.isLess24HoursBeforeDeparture !== undefined,
        );

        expect(inboundTransferCalls.length).toBeGreaterThan(0);
        expect(inboundTransferCalls[0][0]).toHaveProperty('isLess24HoursBeforeDeparture');
    });
});
