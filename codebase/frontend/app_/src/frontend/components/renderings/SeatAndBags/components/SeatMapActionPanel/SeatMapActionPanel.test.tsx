import React from 'react';
import { render, screen } from '@testing-library/react';

import { IFlightPassenger, IPassengerFlights } from 'models/data/AncillariesInfo';
import { ISeat, ISeatMapRow } from 'models/data/ISeatMapStore';
import { SeatType } from 'models/enum/SeatType';
import { mockSeatsAndBagsFields } from 'frontend/components/renderings/SeatAndBags/__mocks__/mockSeatAndBagsFields';

import { ISeatMapActionPanelProps, SeatMapActionPanel } from './SeatMapActionPanel';

const createProps = (): ISeatMapActionPanelProps => ({
    fields: mockSeatsAndBagsFields,
    passengers: [
        {
            outboundPassenger: {
                seat: { seatNumber: 's1o', priceBand: SeatType.Standard },
            },
            inboundPassenger: {},
        },
        {
            outboundPassenger: {
                seat: { seatNumber: 's2o', priceBand: SeatType.ExtraLegroom },
            },
            inboundPassenger: {
                seat: { seatNumber: 's2i', priceBand: SeatType.ExtraLegroom },
            },
        },
    ] as IPassengerFlights[],
    handleBookSeatsClick: jest.fn(),
});

const createStores = () => ({
    marketStore: { formatMoney: jest.fn(a => `+£${a}`) },
    seatMapStore: {
        rowsDeparture: [
            {
                blocks: [
                    {
                        seats: [{ isAvailable: true, priceBand: SeatType.ExtraLegroom, price: 10 }],
                    },
                ] as ISeat[],
            },
        ] as ISeatMapRow[],
        rowsReturn: [
            {
                blocks: [
                    {
                        seats: [{ isAvailable: true, priceBand: SeatType.Standard, price: 20 }],
                    },
                ] as ISeat[],
            },
        ] as ISeatMapRow[],
        availableDepartureSeats: 1,
        availableReturnSeats: 5,
        isSeatDataLoaded: true,
        currency: 'GBP',
        haveOutboundSelectedSeats: false,
        haveInboundSelectedSeats: false,
        isAllSelectedSeatsPremium: false,
        haveSelectedSeats: false,
    },
    layoutStore: {
        isPricesHidden: false,
        isViewBookingPage: false,
        isTradePortal: false,
        getPhrase: jest.fn(p => p),
    },
    viewBookingStore: {
        booking: {},
        isLuxuryPackage: false,
    },
    bookingStore: {
        isLuxuryPackage: false,
    },
    trackingStore: {
        trackUrgencyMessageTileImpression: jest.fn(),
    },
});

let mockProps = createProps();
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockButton = jest.fn();

jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        mockButton(props);

        return <div {...props}>{children}</div>;
    },
}));

const mockUrgencyMessageProps = jest.fn();
jest.mock('frontend/components/common/UrgencyMessage/UrgencyMessage', () => ({
    __esModule: true,
    default: props => {
        mockUrgencyMessageProps(props);

        return <div data-tid='urgency-message' />;
    },
}));

const mockSetWebStorageItem = jest.fn();
jest.mock('frontend/utils/webStorage.utils', () => ({
    __esModule: true,
    setWebStorageItem: () => mockSetWebStorageItem(),
}));

describe('<SeatMapPricePanel />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    const {
        SeatDescription,
        SeatDescriptionLux,
        LegRoomDescription,
        BtnBookSeats,
        BtnChangeSeats,
        BtnReturnSeats,
        BtnOutboundSeats,
    } = mockProps.fields;

    it('should render default', () => {
        render(<SeatMapActionPanel {...mockProps} />);

        const wrapper = screen.getByTestId('action-panel-wrapper');
        expect(wrapper).toHaveClass('wrapper d-print-none');
        expect(wrapper).not.toHaveClass('altWrapper');

        const cheapestSeatsPrice = screen.getByTestId('cheapest-seats-price');
        expect(cheapestSeatsPrice).toHaveTextContent(SeatDescription.value);
        expect(cheapestSeatsPrice).not.toHaveClass('altSeatDescription');

        const cheapestExtraLegRoomPrice = screen.getByTestId('cheapest-extra-leg-room-price');
        expect(cheapestExtraLegRoomPrice).toHaveTextContent(LegRoomDescription.value);

        const actionPanelButton = screen.getByTestId('action-panel-button');
        expect(actionPanelButton).toHaveClass('button');
        expect(actionPanelButton).not.toHaveClass('altButton');

        const actionPanelButtonText = screen.getByTestId('action-panel-button-text');
        expect(actionPanelButtonText).toHaveTextContent(BtnBookSeats.value);
        expect(actionPanelButtonText).not.toHaveClass('altButtonText');

        expect(mockButton).toHaveBeenCalledWith({
            onClick: mockProps.handleBookSeatsClick,
            isOutlined: false,
            className: 'button',
            ['data-tid']: 'action-panel-button',
        });
    });

    it('should render SeatDescriptionLuxury when luxury package is selected', () => {
        mockStores.bookingStore.isLuxuryPackage = true;

        render(<SeatMapActionPanel {...mockProps} />);

        expect(screen.getByTestId('cheapest-seats-price')).toHaveTextContent(SeatDescriptionLux.value);
    });

    describe('Cheapest seats and leg room seats', () => {
        it('should NOT render cheapest seats price if all passengers are seated', () => {
            mockProps.passengers[0].inboundPassenger = {
                seat: { seatNumber: 's1i', priceBand: SeatType.Standard },
            } as IFlightPassenger;

            render(<SeatMapActionPanel {...mockProps} />);

            expect(screen.queryByTestId('cheapest-seats-price')).not.toBeInTheDocument();
        });

        it('should NOT render leg room seats price if seats cannot be upgraded', () => {
            mockProps.passengers[0] = {
                inboundPassenger: {
                    seat: { seatNumber: 's1i', priceBand: SeatType.ExtraLegroom },
                },
                outboundPassenger: {
                    seat: { seatNumber: 's1i', priceBand: SeatType.ExtraLegroom },
                },
            } as IPassengerFlights;

            render(<SeatMapActionPanel {...mockProps} />);

            expect(screen.queryByTestId('cheapest-extra-leg-room-price')).not.toBeInTheDocument();
        });

        it('should NOT render leg room seats price nor cheapest seats price if NO info is provided', () => {
            mockProps.passengers = [];

            render(<SeatMapActionPanel {...mockProps} />);

            expect(screen.queryByTestId('cheapest-extra-leg-room-price')).not.toBeInTheDocument();
            expect(screen.queryByTestId('cheapest-seats-price')).not.toBeInTheDocument();
        });
    });

    describe('Button', () => {
        it('should be outlined when all seats are selected', () => {
            mockStores.seatMapStore.haveInboundSelectedSeats = true;
            mockStores.seatMapStore.haveOutboundSelectedSeats = true;

            render(<SeatMapActionPanel {...mockProps} />);

            expect(mockButton).toHaveBeenCalledWith({
                onClick: mockProps.handleBookSeatsClick,
                isOutlined: true,
                className: 'button',
                ['data-tid']: 'action-panel-button',
            });
        });
    });

    describe('Button text', () => {
        it('should render change seats label when all seats are selected', () => {
            mockStores.seatMapStore.haveInboundSelectedSeats = true;
            mockStores.seatMapStore.haveOutboundSelectedSeats = true;

            render(<SeatMapActionPanel {...mockProps} />);

            expect(screen.getByTestId('action-panel-button-text')).toHaveTextContent(BtnChangeSeats.value);
        });

        it('should render select return seats label when only outbound seats are selected', () => {
            mockStores.seatMapStore.haveOutboundSelectedSeats = true;

            render(<SeatMapActionPanel {...mockProps} />);

            expect(screen.getByTestId('action-panel-button-text')).toHaveTextContent(BtnReturnSeats.value);
        });

        it('should render select outbound seats label when only return seats are selected', () => {
            mockStores.seatMapStore.haveInboundSelectedSeats = true;

            render(<SeatMapActionPanel {...mockProps} />);

            expect(screen.getByTestId('action-panel-button-text')).toHaveTextContent(BtnOutboundSeats.value);
        });
    });

    describe('View booking page', () => {
        beforeEach(() => {
            mockStores.layoutStore.isViewBookingPage = true;
        });

        it('should render default', () => {
            render(<SeatMapActionPanel {...mockProps} />);

            expect(screen.getByTestId('action-panel-wrapper')).toHaveClass('wrapper');

            const cheapestSeatsPrice = screen.getByTestId('cheapest-seats-price');
            expect(cheapestSeatsPrice).toHaveClass('altSeatDescription');

            expect(screen.getByTestId('action-panel-button')).toHaveClass('altButton');
            expect(screen.getByTestId('action-panel-button-text')).toHaveClass('altButtonText');
        });

        it('should NOT render seat price message', () => {
            mockStores.layoutStore.isPricesHidden = true;
            mockStores.layoutStore.isTradePortal = true;

            render(<SeatMapActionPanel {...mockProps} />);

            expect(screen.queryByTestId('cheapest-seats-price')).not.toBeInTheDocument();
        });

        it('should NOT render seat price message on lux', () => {
            mockStores.seatMapStore.haveSelectedSeats = true;
            mockStores.seatMapStore.isAllSelectedSeatsPremium = false;
            mockStores.seatMapStore.haveOutboundSelectedSeats = true;
            mockStores.seatMapStore.haveInboundSelectedSeats = true;
            mockStores.viewBookingStore.isLuxuryPackage = true;

            render(<SeatMapActionPanel {...mockProps} />);

            expect(screen.queryByTestId('cheapest-seats-price')).not.toBeInTheDocument();
        });

        it('should render included standard seats message when no seats on luxury', () => {
            mockStores.seatMapStore.haveSelectedSeats = false;
            mockStores.seatMapStore.haveOutboundSelectedSeats = true;
            mockStores.seatMapStore.isAllSelectedSeatsPremium = false;
            mockStores.viewBookingStore.isLuxuryPackage = true;

            render(<SeatMapActionPanel {...mockProps} />);

            const cheapestSeatsPrice = screen.getByTestId('cheapest-seats-price');
            expect(cheapestSeatsPrice).toHaveTextContent(mockProps.fields.SeatDescriptionLux.value);
        });

        it('should render included standard seats message when no outbound seats on luxury', () => {
            mockStores.seatMapStore.haveSelectedSeats = true;
            mockStores.seatMapStore.isAllSelectedSeatsPremium = false;
            mockStores.seatMapStore.haveOutboundSelectedSeats = false;
            mockStores.viewBookingStore.isLuxuryPackage = true;

            render(<SeatMapActionPanel {...mockProps} />);

            expect(screen.getByTestId('cheapest-seats-price')).toHaveTextContent(
                mockProps.fields.SeatDescriptionLux.value,
            );
        });

        it('should render included standard seats message when no inbound seats on luxury', () => {
            mockStores.seatMapStore.haveSelectedSeats = true;
            mockStores.seatMapStore.isAllSelectedSeatsPremium = false;
            mockStores.seatMapStore.haveOutboundSelectedSeats = true;
            mockStores.seatMapStore.haveInboundSelectedSeats = false;
            mockStores.viewBookingStore.isLuxuryPackage = true;

            render(<SeatMapActionPanel {...mockProps} />);

            expect(screen.getByTestId('cheapest-seats-price')).toHaveTextContent(
                mockProps.fields.SeatDescriptionLux.value,
            );
        });

        it('should render included standard seats message when all seats are premium on luxury', () => {
            mockStores.seatMapStore.haveSelectedSeats = true;
            mockStores.seatMapStore.isAllSelectedSeatsPremium = true;
            mockStores.seatMapStore.haveOutboundSelectedSeats = true;
            mockStores.viewBookingStore.isLuxuryPackage = true;

            render(<SeatMapActionPanel {...mockProps} />);

            expect(screen.getByTestId('cheapest-seats-price')).toHaveTextContent(
                mockProps.fields.SeatDescriptionLux.value,
            );
        });
    });

    describe('urgent message', () => {
        it('should render urgency message when departure seats are under the show message threshold', () => {
            mockStores.seatMapStore.availableDepartureSeats = mockProps.fields.UrgencyMessageSeatsThreshold.value - 1;
            mockStores.seatMapStore.availableReturnSeats = mockProps.fields.UrgencyMessageSeatsThreshold.value + 1;

            render(<SeatMapActionPanel {...mockProps} />);

            expect(screen.queryByTestId('urgency-message')).toBeInTheDocument();
        });

        it('should render urgency message when return seats are under the show message threshold', () => {
            mockStores.seatMapStore.availableDepartureSeats = mockProps.fields.UrgencyMessageSeatsThreshold.value + 1;
            mockStores.seatMapStore.availableReturnSeats = mockProps.fields.UrgencyMessageSeatsThreshold.value - 1;

            render(<SeatMapActionPanel {...mockProps} />);

            expect(screen.queryByTestId('urgency-message')).toBeInTheDocument();
        });

        it('should render urgency message when both departure and arrival seats are under the show message threshold', () => {
            const seatsAmount = mockProps.fields.UrgencyMessageSeatsThreshold.value - 1;
            mockStores.seatMapStore.availableDepartureSeats = seatsAmount;
            mockStores.seatMapStore.availableReturnSeats = seatsAmount;

            render(<SeatMapActionPanel {...mockProps} />);

            expect(screen.queryByTestId('urgency-message')).toBeInTheDocument();
        });

        it('should render urgency message when seats are equal to the show message threshold', () => {
            mockStores.seatMapStore.availableDepartureSeats = mockProps.fields.UrgencyMessageSeatsThreshold.value;

            render(<SeatMapActionPanel {...mockProps} />);

            expect(screen.queryByTestId('urgency-message')).toBeInTheDocument();
        });

        it('should NOT render urgency message when seat data has not been loaded yet', () => {
            mockStores.seatMapStore.isSeatDataLoaded = false;

            render(<SeatMapActionPanel {...mockProps} />);

            expect(screen.queryByTestId('urgency-message')).not.toBeInTheDocument();
        });

        it('should NOT render urgency message when both departure and arrival seats are over the show message threshold', () => {
            const seatsAmount = mockProps.fields.UrgencyMessageSeatsThreshold.value + 1;
            mockStores.seatMapStore.availableDepartureSeats = seatsAmount;
            mockStores.seatMapStore.availableReturnSeats = seatsAmount;

            render(<SeatMapActionPanel {...mockProps} />);

            expect(screen.queryByTestId('urgency-message')).not.toBeInTheDocument();
        });

        it('should render urgency message when the threshold is met and the user has not selected any seat', () => {
            const seatsAmount = mockProps.fields.UrgencyMessageSeatsThreshold.value - 1;
            mockStores.seatMapStore.availableDepartureSeats = seatsAmount;
            mockStores.seatMapStore.availableReturnSeats = seatsAmount;

            render(<SeatMapActionPanel {...mockProps} />);

            expect(screen.queryByTestId('urgency-message')).toBeInTheDocument();
        });

        it('should NOT render urgency message when the threshold is met and the user has selected an inbound set', () => {
            const seatsAmount = mockProps.fields.UrgencyMessageSeatsThreshold.value - 1;
            mockStores.seatMapStore.availableDepartureSeats = seatsAmount;
            mockStores.seatMapStore.availableReturnSeats = seatsAmount;
            mockStores.seatMapStore.haveInboundSelectedSeats = true;

            render(<SeatMapActionPanel {...mockProps} />);

            expect(screen.queryByTestId('urgency-message')).not.toBeInTheDocument();
        });

        it('should NOT render urgency message when the threshold is met and the user has selected an outbound set', () => {
            const seatsAmount = mockProps.fields.UrgencyMessageSeatsThreshold.value - 1;
            mockStores.seatMapStore.availableDepartureSeats = seatsAmount;
            mockStores.seatMapStore.availableReturnSeats = seatsAmount;
            mockStores.seatMapStore.haveOutboundSelectedSeats = true;

            render(<SeatMapActionPanel {...mockProps} />);

            expect(screen.queryByTestId('urgency-message')).not.toBeInTheDocument();
        });

        it('should store the urgency message content when it is displayed', () => {
            mockStores.seatMapStore.isSeatDataLoaded = true;

            render(<SeatMapActionPanel {...mockProps} />);

            expect(mockSetWebStorageItem).toHaveBeenCalledTimes(1);
        });

        it('should not store the urgency message content when it is not displayed', () => {
            mockStores.seatMapStore.isSeatDataLoaded = false;

            render(<SeatMapActionPanel {...mockProps} />);

            expect(mockSetWebStorageItem).not.toHaveBeenCalled();
        });

        it('should track the urgency message if the page is "My Booking" and there is a urgency message', () => {
            const seatsAmount = mockProps.fields.UrgencyMessageSeatsThreshold.value - 1;
            mockStores.seatMapStore.availableDepartureSeats = seatsAmount;
            mockStores.seatMapStore.availableReturnSeats = seatsAmount;
            mockStores.layoutStore.isViewBookingPage = true;

            render(<SeatMapActionPanel {...mockProps} />);

            expect(mockStores.trackingStore.trackUrgencyMessageTileImpression).toHaveBeenCalledTimes(1);
        });

        it('should NOT track the urgency message if the page is NOT "My Booking" and there is a urgency message', () => {
            const seatsAmount = mockProps.fields.UrgencyMessageSeatsThreshold.value - 1;
            mockStores.seatMapStore.availableDepartureSeats = seatsAmount;
            mockStores.seatMapStore.availableReturnSeats = seatsAmount;
            mockStores.layoutStore.isViewBookingPage = false;

            render(<SeatMapActionPanel {...mockProps} />);

            expect(mockStores.trackingStore.trackUrgencyMessageTileImpression).not.toHaveBeenCalled();
        });
    });
});
