import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { createMockStores, mockAmendRoomAndBoardStore, mockBooking } from 'frontend/__mocks__';
import { GuestType } from 'models/enum/GuestType';

import AmendPaymentRoomAndBoardDetails from './AmendPaymentRoomAndBoardDetails';

expect.extend(toHaveNoViolations);

const mockHolidaySummaryPlainOptionsProps = jest.fn();
jest.mock('frontend/components/common/HolidaySummaryPlainOptions/HolidaySummaryPlainOptions', () => ({
    __esModule: true,
    default: props => {
        mockHolidaySummaryPlainOptionsProps(props);

        return <div data-tid='holiday-summary-plain-options' />;
    },
}));

const mockHolidaySummaryRoomAndBoardProps = jest.fn();
jest.mock('frontend/components/common/HolidaySummaryRoomAndBoard/HolidaySummaryRoomAndBoard', () => ({
    __esModule: true,
    default: props => {
        mockHolidaySummaryRoomAndBoardProps(props);

        return <div data-tid='holiday-summary-room-and-board' />;
    },
}));

let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<AmendPaymentRoomAndBoardDetails />', () => {
    beforeEach(() => {
        mockStores = createMockStores({
            amendRoomAndBoardStore: mockAmendRoomAndBoardStore,
            amendPaymentStore: {
                booking: mockBooking,
            },
        });
    });

    it('Should render component', () => {
        render(<AmendPaymentRoomAndBoardDetails />);

        expect(screen.getByTestId('holiday-summary-room-and-board')).toBeInTheDocument();
        expect(screen.getByTestId('amend-paymentRoom-and-board-details')).toBeInTheDocument();
        expect(mockHolidaySummaryRoomAndBoardProps).toHaveBeenCalledWith({
            units: mockStores.amendRoomAndBoardStore.chosenRoomVariant.units,
            hotel: {
                resort: {
                    name: 'Resort Example',
                    region: 'package-region',
                },
                name: 'Hotel Example',
            },
            accom: mockBooking.package.accom,
        });

        expect(screen.getByTestId('holiday-summary-plain-options')).toBeInTheDocument();
        expect(mockHolidaySummaryPlainOptionsProps).toHaveBeenCalledWith({
            guestsCount: {
                [GuestType.Adult]: 2,
                [GuestType.Child]: 4,
                [GuestType.Infant]: 2,
            },
        });
    });

    it("Should render AmendPaymentRoomsAndBoards components with an empty string as a hotel's name when that name is undefined", () => {
        mockStores.amendPaymentStore.booking.hotel.name = undefined;
        render(<AmendPaymentRoomAndBoardDetails />);

        expect(mockHolidaySummaryRoomAndBoardProps).toHaveBeenCalledWith({
            hotel: {
                resort: {
                    name: 'Resort Example',
                    region: 'package-region',
                },
                name: '',
            },
            units: mockStores.amendRoomAndBoardStore.chosenRoomVariant.units,
            accom: mockBooking.package.accom,
        });
    });

    it('should render SummaryRoomAndBoard with empty booking.hotel', () => {
        mockStores.amendPaymentStore.booking.hotel = null;
        render(<AmendPaymentRoomAndBoardDetails />);

        expect(mockHolidaySummaryRoomAndBoardProps).toHaveBeenCalledWith({
            hotel: {
                resort: {
                    name: '',
                    region: 'package-region',
                },
                name: '',
            },
            units: mockStores.amendRoomAndBoardStore.chosenRoomVariant.units,
            accom: mockBooking.package.accom,
        });
    });

    it('Should render nothing when booking has not been provided', () => {
        mockStores.amendPaymentStore.booking = null;
        const { container } = render(<AmendPaymentRoomAndBoardDetails />);

        expect(container).toBeEmptyDOMElement();
    });

    it('Should render nothing when chosenRoomVariant has not been assigned', () => {
        mockStores.amendRoomAndBoardStore.chosenRoomVariant = null;
        const { container } = render(<AmendPaymentRoomAndBoardDetails />);

        expect(container).toBeEmptyDOMElement();
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<AmendPaymentRoomAndBoardDetails />);
            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });
});
