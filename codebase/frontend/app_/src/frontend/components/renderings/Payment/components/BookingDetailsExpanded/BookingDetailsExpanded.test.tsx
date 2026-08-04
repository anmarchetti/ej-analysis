import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores, guestsAmountByTypeMock } from 'frontend/__mocks__';
import { mockCabinBagsInfoFields } from 'frontend/__mocks__/cabinBags';
import { extraLuggageInfoMock } from 'frontend/__mocks__/extraLuggage';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { ITransport } from 'models/data/IOffer';

import BookingDetailsExpanded from './BookingDetailsExpanded';

jest.mock('next/dynamic', () => () => {
    const DynamicComponent = () => null;

    return DynamicComponent;
});

const createProps = () => ({
    isShown: true,
    transfer: null,
    transport: { routes: [{}, {}] } as ITransport,
    seatSelection: null,
    rooms: [],
    hotel: null,
    board: null,
    lateRoomCheckout: null,
    guestsAmountByType: guestsAmountByTypeMock,
    fields: {
        ...mockCabinBagsInfoFields,
        DepartureAirportText: mockSitecoreField('DepartureAirportText'),
        EmailInstruction: mockSitecoreField('EmailInstruction'),
        ParkingDates: mockSitecoreField('ParkingDates'),
        FastTrackLabel: mockSitecoreField('FastTrackLabel'),
        ServiceLineLabel: mockSitecoreField('ServiceLineLabel'),
    },
    onToggle: jest.fn(),
    extraLuggageItems: extraLuggageInfoMock.items,
    airportParking: null,
});

const createStores = () =>
    createMockStores({
        layoutStore: {
            isErrataEnabled: true,
            isTradePortal: false,
        },
        guestDetailsStore: {
            guestsDetails: [],
            leadPassenger: null,
        },
    });

let props;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockTransferAndBagsRow = jest.fn();
jest.mock('./components/TransferAndBagsRow/TransferAndBagsRow', () => ({
    __esModule: true,
    default: props => {
        mockTransferAndBagsRow(props);

        return <div data-tid='transfer-and-bags-row' />;
    },
}));

const mockSeatSelectionDesktop = jest.fn();
jest.mock('frontend/components/renderings/SeatAndBags/components/desktop/SeatSelectionDesktop', () => ({
    __esModule: true,
    default: props => {
        mockSeatSelectionDesktop(props);

        return <div data-tid='seat-selection-desktop'>SeatSelectionDesktop</div>;
    },
}));

const mockFlightsInfo = jest.fn();
jest.mock('./components/FlightsInfo/FlightsInfo', () => ({
    __esModule: true,
    default: props => {
        mockFlightsInfo(props);

        return <div data-tid='flights-info' />;
    },
}));

const mockAirportParkingInfo = jest.fn();
jest.mock('./components/AirportParkingInfo/AirportParkingInfo', () => ({
    __esModule: true,
    default: props => {
        mockAirportParkingInfo(props);

        return <div data-tid='airport-parking' />;
    },
}));

const mockFastTrackAndServiceLine = jest.fn();
jest.mock('./components/FastTrackAndServiceLine/TransferAndBagsRow/FastTrackAndServiceLine', () => ({
    __esModule: true,
    default: props => {
        mockFastTrackAndServiceLine(props);

        return <div data-tid='fast-track-and-service-line' />;
    },
}));

describe('BookingDetailsExpanded', () => {
    beforeEach(() => {
        props = createProps();
        mockStores = createStores();
    });

    it('should NOT render component when isShown is false', () => {
        props.isShown = false;

        const { container } = render(<BookingDetailsExpanded {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render component when isShown is true', () => {
        render(<BookingDetailsExpanded {...props} />);

        expect(screen.getByTestId('booking-details-expanded')).toBeInTheDocument();
        expect(screen.queryByTestId('fast-track-and-service-line')).not.toBeInTheDocument();
        expect(screen.queryByTestId('luxury-wrapper')).not.toBeInTheDocument();
    });

    it('should render component for trade portal', () => {
        mockStores.layoutStore.isTradePortal = true;
        props.isShown = false;

        render(<BookingDetailsExpanded {...props} />);
        expect(screen.getByTestId('booking-details-expanded')).toBeInTheDocument();
        expect(screen.queryByTestId('fast-track-and-service-line')).not.toBeInTheDocument();
        expect(screen.queryByTestId('luxury-wrapper')).not.toBeInTheDocument();
    });

    it('should render component with aditional info line when isLuxuryPackage is true', () => {
        props.isLuxuryPackage = true;

        render(<BookingDetailsExpanded {...props} />);

        expect(screen.getByTestId('fast-track-and-service-line')).toBeInTheDocument();
        expect(mockFastTrackAndServiceLine).toHaveBeenCalledWith({
            FastTrackLabel: props.fields.FastTrackLabel,
            ServiceLineLabel: props.fields.ServiceLineLabel,
        });
    });

    describe('rendering flights info', () => {
        it('should render flights info default', () => {
            const { SpeedyBoardingTooltip, ...cabinBagsInfoFields } = mockCabinBagsInfoFields;
            const cabinBagsMock = {
                fields: cabinBagsInfoFields,
                guestsAmountByType: guestsAmountByTypeMock,
            };
            props.transport = {
                routes: [
                    {
                        depDate: new Date('1995-12-15T03:24:00'),
                        arrDate: new Date('1995-12-15T03:24:00'),
                        depName: 'LGW',
                        arrName: 'LTN',
                    },
                    {
                        depDate: new Date('1995-12-17T03:24:00'),
                        arrDate: new Date('1995-12-17T03:24:00'),
                        depName: 'LTN',
                        arrName: 'LGW',
                    },
                ],
            };

            render(<BookingDetailsExpanded {...props} />);

            expect(screen.getByTestId('flights-info')).toBeInTheDocument();
            expect(mockFlightsInfo).toHaveBeenCalledWith({
                arrivalRouteInfo: {
                    cabinBags: cabinBagsMock,
                    flag: 'Arrival',
                    route: {
                        arrDate: new Date('1995-12-17T03:24:00'),
                        arrName: 'LGW',
                        depDate: new Date('1995-12-17T03:24:00'),
                        depName: 'LTN',
                    },
                    seatSelection: undefined,
                },
                departureRouteInfo: {
                    cabinBags: cabinBagsMock,
                    flag: 'Departure',
                    route: {
                        arrDate: new Date('1995-12-15T03:24:00'),
                        arrName: 'LTN',
                        depDate: new Date('1995-12-15T03:24:00'),
                        depName: 'LGW',
                    },
                    seatSelection: undefined,
                },
            });
        });
    });

    describe('rendering errata', () => {
        it('should NOT render ErrataFlightInfo when errataFlightInfo props is an empty array and isErrateEnabled is FALSE', () => {
            mockStores.layoutStore.isErrataEnabled = false;
            props.transport = { routes: [{}, {}], errataFlightInfo: [] };

            render(<BookingDetailsExpanded {...props} />);

            expect(screen.queryByTestId('flight-errata')).not.toBeInTheDocument();
        });

        it('should NOT render ErrataFlightInfo when errataFlightInfo props is an empty array and isErrateEnabled is TRUE', () => {
            mockStores.layoutStore.isErrataEnabled = true;
            props.transport = { routes: [{}, {}], errataFlightInfo: [] };

            render(<BookingDetailsExpanded {...props} />);

            expect(screen.queryByTestId('flight-errata')).not.toBeInTheDocument();
        });

        it('should NOT render ErrataFlightInfo when errataFlightInfo props is NOT an empty array and isErrateEnabled is FALSE', () => {
            mockStores.layoutStore.isErrataEnabled = false;
            props.transport = { routes: [{}, {}], errataFlightInfo: ['errata'] };

            render(<BookingDetailsExpanded {...props} />);

            expect(screen.queryByTestId('flight-errata')).not.toBeInTheDocument();
        });

        it('should render ErrataFlightInfo when errataFlightInfo props is NOT an empty array and isErrateEnabled is TRUE', () => {
            mockStores.layoutStore.isErrataEnabled = true;
            props.transport = { routes: [{}, {}], errataFlightInfo: ['errata'] };

            render(<BookingDetailsExpanded {...props} />);

            expect(screen.getByTestId('flight-errata')).toBeInTheDocument();
        });
    });

    it('should render TransferAndBagsRow', () => {
        render(<BookingDetailsExpanded {...props} />);

        expect(screen.getByTestId('transfer-and-bags-row')).toBeInTheDocument();
        expect(mockTransferAndBagsRow).toHaveBeenCalledWith({
            fields: props.fields,
            guestsAmountByType: props.guestsAmountByType,
            transfer: props.transfer,
            extraLuggageItems: props.extraLuggageItems,
        });
    });

    describe('rendering airport parking info', () => {
        it('should not render AirportParking', () => {
            render(<BookingDetailsExpanded {...props} />);

            expect(screen.queryByTestId('airport-parking')).not.toBeInTheDocument();
        });

        it('should render AirportParking', () => {
            props.airportParking = {
                title: 'test',
            };

            render(<BookingDetailsExpanded {...props} />);

            expect(screen.getByTestId('airport-parking')).toBeInTheDocument();
            expect(mockAirportParkingInfo).toHaveBeenCalledWith({
                airportParkingDetails: props.airportParking,
                fields: {
                    EmailInstruction: { value: 'EmailInstruction' },
                    DepartureAirportText: { value: 'DepartureAirportText' },
                    ParkingDates: { value: 'ParkingDates' },
                },
                transport: { routes: [{}, {}] },
            });
        });
    });
});
