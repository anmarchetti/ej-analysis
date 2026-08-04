import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { createMockStores, mockGuests, mockInboundFlight, mockOutboundFlight } from 'frontend/__mocks__';
import { mockSitecoreField } from 'frontend/utils/tests.utils';

import { PassengerDetails } from './PassengerDetails';

let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockPassengerProps = jest.fn();
jest.mock('../Passenger/Passenger', () => ({
    __esModule: true,
    default: props => {
        mockPassengerProps(props);

        return <div data-tid='passenger'>{props.passenger?.firstName}</div>;
    },
}));

const mockViewBookingComponentWrapperProps = jest.fn();
jest.mock('frontend/components/common/ViewBookingComponentWrapper/ViewBookingComponentWrapper', () => ({
    __esModule: true,
    default: ({ dataTid, Title, Subtitle, children, id }) => {
        mockViewBookingComponentWrapperProps({ dataTid, Title, Subtitle, children, id });

        return (
            <div data-tid={dataTid} id={id}>
                {children}
            </div>
        );
    },
}));

jest.mock('frontend/components/common/Booking/BookingRefs/ReferenceItem/ReferenceItem', () => ({
    __esModule: true,
    default: (props: any) => (
        <div data-tid={props.dataTid}>
            <span data-tid='ref-title'>{props.title}</span>
            {props.referenceNumber && (
                <button data-tid='ref-button' onClick={props.onClick}>
                    {props.referenceNumber}
                </button>
            )}
        </div>
    ),
}));

const mockCopyToClipboard = jest.fn();
jest.mock('frontend/utils/clipboard.utils', () => ({
    copyToClipboard: (...args: any[]) => mockCopyToClipboard(...args),
}));

jest.mock('./PassengerDetailsAction/PassengerDetailsAction', () => ({
    __esModule: true,
    default: ({ onClick, className }) => <button data-tid='details-action' onClick={onClick} className={className} />,
}));

describe('<PassengerDetails />', () => {
    const createProps = () => ({
        guests: [mockGuests[0], mockGuests[1]],
        leadPassenger: mockGuests[0] as any,
        flights: [mockOutboundFlight, mockInboundFlight],
        isExternalAgency: false,
        isCheckInAvailable: true,
        isBookingCanceled: false,
        onAmendPassengerClick: jest.fn(),
    });

    let mockProps = createProps();

    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores({
            amendPassengerStore: {
                isAmendCTAVisible: false,
            },
            tracking: {
                clickToAmendPassengerPageLink: jest.fn(),
            },
        });
        mockCopyToClipboard.mockClear();
        mockPassengerProps.mockClear();
    });

    it('should render two passenger', () => {
        render(<PassengerDetails {...mockProps} />);

        expect(mockViewBookingComponentWrapperProps).toHaveBeenCalledWith(
            expect.objectContaining({
                dataTid: 'booking-confirmation-info',
                Title: mockSitecoreField('BookingPassengers.Labels.Title'),
                Subtitle: undefined,
                id: 'booking-passengers',
            }),
        );
        expect(screen.getAllByTestId('passenger')).toHaveLength(2);
    });

    it('should render lead passenger separately with full props and non-leads with minimal props', () => {
        render(<PassengerDetails {...mockProps} />);

        // With 2 guests, soloPassenger should NOT be applied
        expect(mockPassengerProps).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({
                passenger: mockProps.guests[0],
                isLeadLoggedIn: undefined,
                isExternalAgency: false,
                className: 'leadPassenger',
            }),
        );

        expect(mockPassengerProps).toHaveBeenNthCalledWith(
            2,
            expect.objectContaining({
                passenger: mockProps.guests[1],
                isExternalAgency: false,
            }),
        );
        expect(mockPassengerProps.mock.calls[1][0]).not.toHaveProperty('isLeadLoggedIn');
        expect(mockPassengerProps.mock.calls[1][0]).not.toHaveProperty('showFlightLabel');
    });

    it('should apply soloPassenger className when only one passenger in group', () => {
        mockProps.guests = [mockProps.guests[0]];
        render(<PassengerDetails {...mockProps} />);

        expect(mockPassengerProps).toHaveBeenCalledWith(
            expect.objectContaining({
                className: 'leadPassenger soloPassenger',
            }),
        );
    });

    it('should render flight reference items when hasMultipleFlightsRefs is true', () => {
        mockProps.flights = [
            { ...mockOutboundFlight, extRefId: 'REF1', paxs: [{ paxId: '1' }] },
            { ...mockOutboundFlight, extRefId: 'REF2', paxs: [{ paxId: '2' }] },
        ];

        render(<PassengerDetails {...mockProps} />);

        expect(screen.getAllByTestId('flight-ref')).toHaveLength(2);
        expect(screen.getAllByTestId('ref-title')[0]).toHaveTextContent('BookingHeader.Labels.FlightReference');
    });

    it('should pass Subtitle when hasMultipleFlightsRefs is true', () => {
        mockProps.flights = [
            { ...mockOutboundFlight, extRefId: 'REF1', paxs: [{ paxId: '1' }] },
            { ...mockOutboundFlight, extRefId: 'REF2', paxs: [{ paxId: '2' }] },
        ];

        render(<PassengerDetails {...mockProps} />);

        expect(mockViewBookingComponentWrapperProps).toHaveBeenCalledWith(
            expect.objectContaining({
                Subtitle: mockSitecoreField('BookingPassengers.Labels.MultipleFlightsTextHTML'),
            }),
        );
    });

    it('should copy flight reference to clipboard on click', () => {
        mockProps.flights = [
            { ...mockOutboundFlight, extRefId: 'REF1', paxs: [{ paxId: '1' }] },
            { ...mockOutboundFlight, extRefId: 'REF2', paxs: [{ paxId: '2' }] },
        ];

        render(<PassengerDetails {...mockProps} />);

        fireEvent.click(screen.getAllByTestId('ref-button')[0]);

        expect(mockCopyToClipboard).toHaveBeenCalledWith('REF1');
    });

    it('should render flight reference item even when only one flight ref', () => {
        mockProps.flights = [{ ...mockOutboundFlight, extRefId: 'REF1', paxs: [{ paxId: '1' }, { paxId: '2' }] }];

        render(<PassengerDetails {...mockProps} />);

        expect(screen.getByTestId('flight-ref-wrapper')).toBeInTheDocument();
        expect(screen.getByTestId('ref-title')).toHaveTextContent('BookingHeader.Labels.FlightReference');
    });

    it('should render divider between lead and non-lead passengers when multiple passengers', () => {
        render(<PassengerDetails {...mockProps} />);

        const { container } = render(<PassengerDetails {...mockProps} />);
        expect(container.querySelector('.divider')).toBeInTheDocument();
    });

    it('should NOT render divider when only one passenger in group', () => {
        mockProps.guests = [mockProps.guests[0]];
        const { container } = render(<PassengerDetails {...mockProps} />);

        expect(container.querySelector('.divider')).not.toBeInTheDocument();
    });

    it('should NOT render flight reference item when flightRef is null', () => {
        mockProps.flights = [{ ...mockOutboundFlight, extRefId: undefined, paxs: [{ paxId: '1' }, { paxId: '2' }] }];

        render(<PassengerDetails {...mockProps} />);

        expect(screen.queryByTestId('flight-ref-wrapper')).not.toBeInTheDocument();
    });

    describe('PassengerDetailsAction', () => {
        it('should render amend passenger button', () => {
            mockStores.amendPassengerStore.isAmendCTAVisible = true;
            render(<PassengerDetails {...mockProps} />);

            expect(screen.getByTestId('details-action')).toHaveClass('amendCTA');
        });

        it('should fire tracking event and onAmendPassengerClick props be called when click is happen', () => {
            mockStores.amendPassengerStore.isAmendCTAVisible = true;
            render(<PassengerDetails {...mockProps} />);

            fireEvent.click(screen.getByTestId('details-action'));

            expect(mockStores.tracking.clickToAmendPassengerPageLink).toHaveBeenCalledWith('bookingReference');
            expect(mockProps.onAmendPassengerClick).toHaveBeenCalled();
        });

        it('Should PassengerDetailsAction be hidden when no any reason to be shown is present', () => {
            mockStores.amendPassengerStore.isAmendCTAVisible = false;

            render(<PassengerDetails {...mockProps} />);

            expect(screen.queryByTestId('details-action')).not.toBeInTheDocument();
        });

        it('Should not render button if isTradePortal', () => {
            mockStores.layoutStore.isTradePortal = true;
            mockStores.amendPassengerStore.isAmendCTAVisible = true;

            render(<PassengerDetails {...mockProps} />);

            expect(screen.queryByTestId('details-action')).not.toBeInTheDocument();
        });
    });
});
