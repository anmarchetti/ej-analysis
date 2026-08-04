import * as React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores, mockBoardType, mockHotel, mockTransfer } from 'frontend/__mocks__';
import { mockedTransport } from 'frontend/__mocks__/transport';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { BookingDetailsCollapsed, IBookingDetailsCollapsedProps } from './BookingDetailsCollapsed';

const createProps = (): IBookingDetailsCollapsedProps => ({
    board: mockBoardType,
    guestsAmount: 5,
    hotel: mockHotel,
    isShown: true,
    onToggle: jest.fn(),
    transfer: mockTransfer,
    transport: mockedTransport,
});

const createStores = () =>
    createMockStores({
        bookingStore: {
            isLuxuryPackage: false,
            extraLuggage: {
                totalHoldLuggageItemsNumber: 3,
            },
        },
        viewBookingStore: {
            extraLuggage: {
                totalHoldLuggageItemsNumber: 1,
            },
        },
    });

const mockProps = createProps();
const mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('BookingDetailsCollapsed', () => {
    it('should render all information', () => {
        render(<BookingDetailsCollapsed {...mockProps} />);

        const outbound = screen.getByTestId('outbound-flight');
        expect(outbound).toHaveTextContent(mockedTransport.routes[0].depPt);
        expect(outbound).toHaveTextContent('Sat 12th Sep 2020 - 07:25');

        const inbound = screen.getByTestId('inbound-flight');
        expect(inbound).toHaveTextContent(mockedTransport.routes[1].depPt);
        expect(inbound).toHaveTextContent('Sat 19th Sep 2020 - 19:10');

        expect(screen.getByTestId('booking-details-collapsed')).toHaveClass('header');
        expect(screen.getByTestId('hotel-name')).toBeInTheDocument();
        expect(screen.getByTestId('guests-and-board')).toHaveTextContent('5 Payment.Titles.GuestsPlural - Half Board');
        expect(screen.getByTestId('luggage-label')).toHaveTextContent(SitecoreDictionary.LuggageButtonsIncluded);
    });

    it('should render singular transfer label when on a non-luxury package', () => {
        mockStores.bookingStore.isLuxuryPackage = false;

        render(<BookingDetailsCollapsed {...mockProps} />);

        expect(screen.getByTestId('collapsed-transfer')).toHaveTextContent(
            SitecoreDictionary.TransferLabelsTitleTransferSingular,
        );
    });

    it('should render plural transfer label when on a luxury package', () => {
        mockStores.bookingStore.isLuxuryPackage = true;
        render(<BookingDetailsCollapsed {...mockProps} />);

        expect(screen.getByTestId('collapsed-transfer')).toHaveTextContent(
            SitecoreDictionary.TransferLabelsTitleTransfersPlural,
        );
    });

    it('should NOT render component when isShown is false', () => {
        mockProps.isShown = false;

        const { container } = render(<BookingDetailsCollapsed {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should not render hotelName, guest, board, transfer, bags and transport if they are not passed', () => {
        mockProps.hotel = undefined;
        mockProps.transport = undefined;
        mockProps.board = undefined;
        mockProps.guestsAmount = 0;
        mockProps.transfer = undefined;
        mockStores.bookingStore.extraLuggage.totalHoldLuggageItemsNumber = 0;
        mockStores.viewBookingStore.extraLuggage.totalHoldLuggageItemsNumber = 0;

        render(<BookingDetailsCollapsed {...mockProps} />);

        expect(screen.queryByTestId('hotel-name')).not.toBeInTheDocument();
        expect(screen.queryByTestId('guests-and-board')).not.toBeInTheDocument();
        expect(screen.queryByTestId('outbound-flight')).not.toBeInTheDocument();
        expect(screen.queryByTestId('inbound-flight')).not.toBeInTheDocument();
        expect(screen.queryByTestId('collapsed-transfer')).not.toBeInTheDocument();
        expect(screen.queryByTestId('collapsed-bags')).not.toBeInTheDocument();
    });

    it('should use totalHoldLuggageItemsNumber from viewBookingStore when there are no info in booking', () => {
        mockStores.bookingStore.extraLuggage.totalHoldLuggageItemsNumber = 0;

        render(<BookingDetailsCollapsed {...mockProps} />);

        expect(screen.queryByTestId('collapsed-bags')).not.toBeInTheDocument();
    });
});
