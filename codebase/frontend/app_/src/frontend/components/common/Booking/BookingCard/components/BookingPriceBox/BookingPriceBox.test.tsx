import React from 'react';
import { render, screen } from '@testing-library/react';

import { CurrencyCode } from 'code/currency';
import { createMockStores } from 'frontend/__mocks__';
import { mockBooking } from 'frontend/__mocks__/booking';

import { BookingPriceBox, IBookingPriceBoxProps } from './BookingPriceBox';
import { IPreparedPriceBoxData } from './BookingPriceBox.utils';

jest.mock('frontend/components/renderings/ViewBookings/components/PillsBlock', () => ({
    __esModule: true,
    default: ({ children }) => <div data-tid='pills-block'>{children}</div>,
}));

jest.mock('frontend/components/icons-new/WarningFilled', () => ({
    __esModule: true,
    default: () => <div data-tid='svg-warning-filled' />,
}));

let mockStores;
jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockPriceBoxData: IPreparedPriceBoxData = {
    pills: { departureDate: null, remainingBalance: 0, dueDate: '2029-12-12', currency: CurrencyCode.GBP },
    isNullable: false,
    isCancelWarningDisplayed: true,
};
jest.mock('./BookingPriceBox.utils', () => ({
    __esModule: true,
    usePreparedBookingPriceBoxData: jest.fn(() => mockPriceBoxData),
}));

const createProps = (): IBookingPriceBoxProps => ({
    booking: mockBooking,
    isUpcoming: true,
});

let mockProps;

describe('<BookingPriceBox />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores();
    });

    it('should render PillsBlock ', () => {
        render(<BookingPriceBox {...mockProps} />);

        expect(screen.queryByTestId('pills-block')).toBeInTheDocument();
    });

    describe('warning', () => {
        it('should render warning when isWarningDisplayed is true', () => {
            render(<BookingPriceBox {...mockProps} />);

            expect(screen.getByTestId('credit-message')).toHaveClass('creditedMessage');
            expect(screen.queryByTestId('svg-warning-filled')).toBeInTheDocument();
        });

        describe('warning label', () => {
            it('should render ViewBookingsLabelsCanBeRefunded when  isEligibleForRefund is true', () => {
                render(<BookingPriceBox {...mockProps} />);

                expect(screen.getByTestId('credit-message')).toHaveTextContent('ViewBookings.Labels.CanBeRefunded');
            });

            it('should NOT render warning when isCancelWarningDisplayed is false', () => {
                mockPriceBoxData.isCancelWarningDisplayed = false;
                render(<BookingPriceBox {...mockProps} />);

                expect(screen.queryByTestId('credit-message')).not.toBeInTheDocument();
            });
        });
    });

    it('should NOT render when isNullable true', () => {
        mockPriceBoxData.isNullable = true;
        const { container } = render(<BookingPriceBox {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });
});
