import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

import { createMockStores, mockBooking, mockHotel, mockTransfer } from 'frontend/__mocks__';

import StickyHeader, { IStickyHeaderProps } from './StickyHeader';

const createMockProps = (): IStickyHeaderProps => ({
    dataTid: 'sticky-header',
    tooltipLabel: 'tooltip label',
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockHotelDetailsProps = jest.fn();
jest.mock('frontend/components/common/AmendHotelStickyHeader/components/HotelDetails/HotelDetails', () => ({
    __esModule: true,
    default: props => {
        mockHotelDetailsProps(props);

        return <div data-tid='hotel-details' />;
    },
}));

const mockRatingsDetailsProps = jest.fn();
jest.mock('frontend/components/common/AmendHotelStickyHeader/components/RatingsDetails/RatingsDetails', () => ({
    __esModule: true,
    default: props => {
        mockRatingsDetailsProps(props);

        return <div data-tid='ratings-details' />;
    },
}));

const mockDatesDetailsProps = jest.fn();
jest.mock('frontend/components/common/AmendHotelStickyHeader/components/DatesDetails/DatesDetails', () => ({
    __esModule: true,
    default: props => {
        mockDatesDetailsProps(props);

        return <div data-tid='dates-details' />;
    },
}));

const mockRoomDetailsProps = jest.fn();
jest.mock('frontend/components/common/AmendHotelStickyHeader/components/RoomDetails/RoomDetails', () => ({
    __esModule: true,
    default: props => {
        mockRoomDetailsProps(props);

        return <div data-tid='room-details' />;
    },
}));

const mockBoardDetailsProps = jest.fn();
jest.mock('frontend/components/common/AmendHotelStickyHeader//components/BoardDetails/BoardDetails', () => ({
    __esModule: true,
    default: props => {
        mockBoardDetailsProps(props);

        return <div data-tid='board-details' />;
    },
}));

const mockTransferDetailsProps = jest.fn();
jest.mock('frontend/components/common/AmendHotelStickyHeader/components/TransferDetails/TransferDetails', () => ({
    __esModule: true,
    default: props => {
        mockTransferDetailsProps(props);

        return <div data-tid='transfer-details' />;
    },
}));

const mockTotalPriceProps = jest.fn();
jest.mock('frontend/components/common/AmendHotelStickyHeader/components/TotalPrice/TotalPrice', () => ({
    __esModule: true,
    default: props => {
        mockTotalPriceProps(props);

        return <div data-tid='total-price' />;
    },
}));

const mockHotelConfirmationCTAProps = jest.fn();
jest.mock(
    'frontend/components/common/AmendHotelStickyHeader/components/HotelConfirmationCTA/HotelConfirmationCTA',
    () => ({
        __esModule: true,
        default: props => {
            mockHotelConfirmationCTAProps(props);

            return <div data-tid='hotel-confirmation-cta' />;
        },
    }),
);

jest.mock('frontend/components/renderings/static/ComponentWrapper', () => ({
    __esModule: true,
    default: ({ children }) => <div data-tid='component-wrapper'>{children}</div>,
}));

const mockGetHotelChangeInfoResult = {
    transfer: mockTransfer,
    startDate: '2029-06-19',
    endDate: '2029-07-19',
    roomType: 'Double Room',
    boardType: 'All Inclusive',
    hotel: mockHotel,
    location: { city: 'Barcelona', country: 'Spain', region: 'package-region' },
    hasSelectedNewHotel: false,
};
jest.mock('frontend/components/renderings/AmendHotel/AmendHotel.utils', () => ({
    __esModule: true,
    getHotelChangeInfo: jest.fn().mockImplementation(() => mockGetHotelChangeInfoResult),
}));

describe('<StickyHeader />', () => {
    beforeEach(() => {
        mockStores = createMockStores();
        mockProps = createMockProps();
    });

    it('Should render the component', () => {
        render(<StickyHeader {...mockProps} />);

        expect(screen.getByTestId('sticky-header')).toBeInTheDocument();
        expect(screen.getByTestId('hotel-details')).toBeInTheDocument();
        expect(mockHotelDetailsProps).toHaveBeenCalledWith(
            expect.objectContaining({
                name: mockHotel.name,
                location: mockGetHotelChangeInfoResult.location,
                dataTid: 'sticky-header-hotel',
                className: 'row',
            }),
        );

        expect(screen.getByTestId('ratings-details')).toBeInTheDocument();
        expect(mockRatingsDetailsProps).toHaveBeenCalledWith(
            expect.objectContaining({
                dataTid: 'sticky-header-ratings',
                className: 'row',
                ...mockBooking.hotel,
            }),
        );

        expect(screen.getByTestId('dates-details')).toBeInTheDocument();
        expect(mockDatesDetailsProps).toHaveBeenCalledWith(
            expect.objectContaining({
                dataTid: 'sticky-header-dates',
                className: 'row',
                startDate: '2029-06-19',
                endDate: '2029-07-19',
            }),
        );

        expect(screen.getByTestId('room-details')).toBeInTheDocument();
        expect(mockRoomDetailsProps).toHaveBeenCalledWith(
            expect.objectContaining({
                dataTid: 'sticky-header-room',
                className: 'row',
                roomType: mockGetHotelChangeInfoResult.roomType,
            }),
        );

        expect(screen.getByTestId('board-details')).toBeInTheDocument();
        expect(mockBoardDetailsProps).toHaveBeenCalledWith(
            expect.objectContaining({
                dataTid: 'sticky-header-board',
                className: 'row',
                boardType: mockGetHotelChangeInfoResult.boardType,
            }),
        );

        expect(screen.getByTestId('transfer-details')).toBeInTheDocument();
        expect(mockTransferDetailsProps).toHaveBeenCalledWith(
            expect.objectContaining({
                dataTid: 'sticky-header-transfer',
                className: 'row',
                transfer: mockTransfer,
            }),
        );

        expect(screen.queryByTestId('total-price')).not.toBeInTheDocument();
        expect(screen.queryByTestId('hotel-confirmation-cta')).not.toBeInTheDocument();
    });

    it('Should render dataTid if provided', () => {
        render(<StickyHeader {...mockProps} />);

        expect(screen.getByTestId('sticky-header')).toBeInTheDocument();
    });

    it('Should return null if no booking', () => {
        mockStores.viewBookingStore.booking = null;

        const { container } = render(<StickyHeader {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('Should return total price and Hotel Selection CTA when hasSelectedNewHotel is true', () => {
        mockGetHotelChangeInfoResult.hasSelectedNewHotel = true;
        render(<StickyHeader {...mockProps} />);

        expect(screen.getByTestId('hotel-confirmation-cta')).toBeInTheDocument();
        expect(screen.getByTestId('total-price')).toBeInTheDocument();
        expect(mockTotalPriceProps).toHaveBeenCalledWith({
            dataTid: 'sticky-header-total-price',
            tooltipLabel: mockProps.tooltipLabel,
        });
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<StickyHeader {...mockProps} />);
            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });
});
