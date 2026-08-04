import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockCabinBagsInfoFields } from 'frontend/__mocks__/cabinBags';
import { IRoute } from 'models/data/IRoute';
import { DestinationRouteFlag } from 'models/enum/DestinationRouteFlag';

import RouteInfo, { IRouteInfoProps } from './RouteInfo';

const createProps = (): IRouteInfoProps => ({
    route: {
        depName: 'LAX',
        arrName: 'JFK',
        depDate: new Date('2023-08-30T10:00:00').toString(),
        arrDate: new Date('2023-08-30T18:00:00').toString(),
    } as IRoute,
    flag: DestinationRouteFlag.Departure,
    cabinBags: {
        fields: mockCabinBagsInfoFields,
        guestsAmountByType: {
            adults: 2,
            children: 0,
            infants: 0,
        },
    },
    seatSelection: [
        { seatNumber: '1A', paxIndex: 0 },
        { seatNumber: '1B', paxIndex: 1 },
    ],
    seatSummaryText: 'Seats selected: {number}',
});

const createStores = () => ({
    layoutStore: { isTradePortal: false },
    bookingStore: {
        extraLuggage: { LCBCount: 2 },
    },
});

let mockProps = createProps();
let mockStores;

jest.mock(
    'frontend/components/renderings/Payment/components/BookingDetailsExpanded/components/SeatsInfo/SeatsInfo',
    () => ({
        __esModule: true,
        default: () => <div data-tid='seats-info-component' />,
    }),
);

const mockCabinBagsInfoComponent = jest.fn();

jest.mock('frontend/components/common/Booking/CabinBagsInfo/CabinBagsInfo', () => ({
    __esModule: true,
    default: props => {
        mockCabinBagsInfoComponent(props);

        return <div data-tid='cabin-bags-info' />;
    },
}));

jest.mock('frontend/utils/route.utils', () => ({
    getFlightNumberWithCarNumber: () => '1234',
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<RouteInfo />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render route info', () => {
        render(<RouteInfo {...mockProps} />);

        expect(screen.getByTestId('route-container')).toHaveTextContent('LAX - JFK');
        expect(screen.getByTestId('flight-time')).toHaveTextContent('Wed 30th Aug 2023 10:00 - 18:00');
        expect(mockCabinBagsInfoComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                fields: mockProps.cabinBags?.fields,
                guestsAmountByType: mockProps.cabinBags?.guestsAmountByType,
                LCBCount: mockStores.bookingStore.extraLuggage.LCBCount,
            }),
        );
    });

    it('should render SeatsInfo when hideSeatsDetails is false', () => {
        render(<RouteInfo {...mockProps} />);

        expect(screen.getByTestId('seats-info-component')).toBeInTheDocument();
    });

    it('should not render SeatsInfo when isPrintPreview is true', () => {
        mockProps.isPrintPreview = true;
        render(<RouteInfo {...mockProps} />);

        expect(screen.queryByTestId('seats-info-component')).not.toBeInTheDocument();
    });

    it('should render SeatsInfo with No seats selected info when seatSelection is undefined', () => {
        mockProps.seatSelection = undefined;
        render(<RouteInfo {...mockProps} />);

        expect(screen.getByTestId('seats-info-component')).toBeInTheDocument();
    });

    it('should show flight number and date section in that order when isPrintPreview is true', () => {
        mockProps.isPrintPreview = true;
        mockStores.layoutStore.isTradePortal = true;
        render(<RouteInfo {...mockProps} />);

        const flightNumber = screen.getByTestId('flight-number');
        const flightTime = screen.getByTestId('flight-time');
        expect(flightNumber.compareDocumentPosition(flightTime)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    });

    it('should show date section and flight number in that order when isPrintPreview is false', () => {
        mockStores.layoutStore.isTradePortal = true;
        render(<RouteInfo {...mockProps} />);

        const flightNumber = screen.getByTestId('flight-number');
        const flightTime = screen.getByTestId('flight-time');
        expect(flightTime.compareDocumentPosition(flightNumber)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    });

    it('should NOT show seat summary if seatSelection is not provided', () => {
        mockProps.seatSelection = undefined;
        mockStores.layoutStore.isTradePortal = true;

        render(<RouteInfo {...mockProps} />);

        expect(screen.queryByTestId('seat-summary')).not.toBeInTheDocument();
    });

    it('should NOT show seat summary when seatSummaryLabel is not provided', () => {
        mockProps.isPrintPreview = true;
        mockProps.seatSummaryText = '';
        render(<RouteInfo {...mockProps} />);

        expect(screen.queryByTestId('seat-summary')).not.toBeInTheDocument();
    });

    it('should show seat summary when isPrintPreview is true and seatSummaryLabel is provided', () => {
        mockProps.isPrintPreview = true;
        render(<RouteInfo {...mockProps} />);
        expect(screen.getByTestId('seat-summary')).toBeInTheDocument();
    });

    it('should show date section in format "depDate depTime - arrDate arrTime" when depDate is NOT equal to arrDate', () => {
        mockProps.route.arrDate = new Date('2023-08-31T18:00:00').toString();

        render(<RouteInfo {...mockProps} />);

        expect(screen.getByTestId('flight-time')).toHaveTextContent(
            'Wed 30th Aug 2023 10:00 - Thu 31st Aug 2023 18:00',
        );
    });

    it('should show date section in format "depDate depTime - arrTime" when depDate is equal to arrDate', () => {
        render(<RouteInfo {...mockProps} />);
        expect(screen.getByTestId('flight-time')).toHaveTextContent('Wed 30th Aug 2023 10:00 - 18:00');
    });

    describe('Flight number', () => {
        beforeEach(() => {
            mockProps.route.fltNo = '1234';
        });

        it('should not show flight number when it is NOT set', () => {
            mockProps.route.fltNo = '';

            render(<RouteInfo {...mockProps} />);

            expect(screen.queryByTestId('flight-number')).not.toBeInTheDocument();
        });

        it('should not show flight number when is NOT trade portal', () => {
            render(<RouteInfo {...mockProps} />);

            expect(screen.queryByTestId('flight-number')).not.toBeInTheDocument();
        });

        it('should show flight number when is trade portal', () => {
            mockStores.layoutStore.isTradePortal = true;

            render(<RouteInfo {...mockProps} />);

            expect(screen.getByTestId('flight-number')).toBeInTheDocument();
        });

        it('should NOT show cabin bags info when cabinBag props is not provided', () => {
            render(<RouteInfo {...mockProps} cabinBags={undefined} />);

            expect(mockCabinBagsInfoComponent).not.toHaveBeenCalled();
        });
    });
});
