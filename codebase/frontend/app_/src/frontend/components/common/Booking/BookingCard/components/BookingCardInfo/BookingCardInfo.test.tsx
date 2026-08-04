import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores, userLoginMockInfo } from 'frontend/__mocks__';
import { mockBooking } from 'frontend/__mocks__/booking';
import { goPayRemainingBalance } from 'frontend/utils/payment.utls';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { BookingCardInfo, IBookingCardInfoProps } from './BookingCardInfo';

jest.mock('frontend/utils/payment.utls', () => ({
    __esModule: true,
    goPayRemainingBalance: jest.fn(),
}));

jest.mock(
    'frontend/components/common/Booking/BookingCard/components/BookingCanceledStatusInfo/BookingCanceledStatusInfo',
    () => ({
        __esModule: true,
        default: () => <div data-tid='canceled-status-info' />,
    }),
);

const mockRemainingBalanceReminder = jest.fn();
jest.mock('frontend/components/common/Booking/RemainingBalanceReminder/RemainingBalanceReminder', () => ({
    __esModule: true,
    default: props => {
        mockRemainingBalanceReminder(props);

        return <div data-tid='remaining-balance' />;
    },
}));

const mockBookingPriceBox = jest.fn();
jest.mock('frontend/components/common/Booking/BookingCard/components/BookingPriceBox/BookingPriceBox', () => ({
    __esModule: true,
    default: props => {
        mockBookingPriceBox(props);

        return <div data-tid='price-box' />;
    },
}));

const mockBookingInfoData = {
    isCanceled: true,
    isCheckInButtonDisplayed: true,
    checkInLink: 'link',
};
jest.mock('./BookingCardInfo.utils', () => ({
    __esModule: true,
    usePreparedBookingInfoData: jest.fn(() => mockBookingInfoData),
}));

const createProps = (): IBookingCardInfoProps => ({
    isUpcoming: true,
    booking: mockBooking,
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<BookingCardInfo />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores({
            userStore: {
                userData: userLoginMockInfo,
            },
            layoutStore: {
                basePath: 'holidays',
            },
            bookingStore: {
                isPaymentReminderVisible: jest.fn(() => true),
                isCheckInAvailable: jest.fn(() => true),
            },
            viewBookingStore: {
                showBooking: jest.fn(),
            },
        });
    });

    describe('view booking button', () => {
        it('should render button', () => {
            render(<BookingCardInfo {...mockProps} />);

            expect(screen.getByTestId('view-booking')).toHaveTextContent(
                SitecoreDictionary.ViewBookingsButtonsViewBooking,
            );
        });

        it('should call showBooking on button click', async () => {
            render(<BookingCardInfo {...mockProps} />);

            await userEvent.click(screen.getByTestId('view-booking'));

            expect(mockStores.viewBookingStore.showBooking).toHaveBeenCalledWith(mockBooking);
        });
    });

    describe('BookingCanceledStatusInfo', () => {
        it('should render BookingCanceledStatusInfo when isCanceled = true', () => {
            render(<BookingCardInfo {...mockProps} />);

            expect(screen.getByTestId('canceled-status-info')).toBeInTheDocument();
        });

        it('should NOT render BookingCanceledStatusInfo when isCanceled = false', () => {
            mockBookingInfoData.isCanceled = false;
            render(<BookingCardInfo {...mockProps} />);

            expect(screen.queryByTestId('canceled-status-info')).not.toBeInTheDocument();
        });
    });

    describe('RemainingBalanceReminder', () => {
        it('should render RemainingBalanceReminder when isPaymentReminderVisible returns true', () => {
            render(<BookingCardInfo {...mockProps} />);

            expect(mockStores.bookingStore.isPaymentReminderVisible).toHaveBeenCalledWith(mockBooking);
            expect(mockRemainingBalanceReminder).toHaveBeenCalledWith({
                booking: mockBooking,
            });
            expect(screen.getByTestId('remaining-balance')).toBeInTheDocument();
            expect(screen.getByTestId('pay-remaining-balance-btn')).toHaveTextContent(
                SitecoreDictionary.BookingPaymentButtonsPayBalance,
            );
        });

        it('should call goPayRemainingBalance when click on button', async () => {
            render(<BookingCardInfo {...mockProps} />);

            await userEvent.click(
                screen.getByRole('button', { name: SitecoreDictionary.BookingPaymentButtonsPayBalance }),
            );

            expect(goPayRemainingBalance).toHaveBeenCalledWith(
                mockBooking,
                mockStores.userStore.userData,
                mockStores.layoutStore.basePath,
            );
        });

        it('should NOT render RemainingBalanceReminder when isPaymentReminderVisible returns false', () => {
            jest.spyOn(mockStores.bookingStore, 'isPaymentReminderVisible').mockReturnValueOnce(false);
            render(<BookingCardInfo {...mockProps} />);

            expect(mockStores.bookingStore.isPaymentReminderVisible).toHaveBeenCalledWith(mockBooking);
            expect(mockRemainingBalanceReminder).not.toHaveBeenCalled();
            expect(screen.queryByTestId('remaining-balance')).not.toBeInTheDocument();
        });
    });

    describe('BookingPriceBox', () => {
        it('should render BookingPriceBox when isPaymentReminderVisible returns false', () => {
            jest.spyOn(mockStores.bookingStore, 'isPaymentReminderVisible').mockReturnValue(false);
            render(<BookingCardInfo {...mockProps} />);

            expect(mockBookingPriceBox).toHaveBeenCalledWith({
                booking: mockBooking,
                isUpcoming: mockProps.isUpcoming,
            });
            expect(screen.getByTestId('price-box')).toBeInTheDocument();
        });

        it('should NOT render BookingPriceBox when isPaymentReminderVisible returns true', () => {
            render(<BookingCardInfo {...mockProps} />);

            expect(mockBookingPriceBox).not.toHaveBeenCalled();
            expect(screen.queryByTestId('price-box')).not.toBeInTheDocument();
        });
    });

    describe('check in link', () => {
        it('should render check in link', () => {
            render(<BookingCardInfo {...mockProps} />);

            expect(screen.getByTestId('check-in-link')).toHaveTextContent(SitecoreDictionary.GlobalsButtonsCheckIn);
        });

        it('should NOT render when isUpcoming = false', () => {
            mockProps.isUpcoming = false;

            render(<BookingCardInfo {...mockProps} />);

            expect(screen.queryByTestId('check-in-link')).not.toBeInTheDocument();
        });

        it('should NOT render when isCheckInAvailable returns false', () => {
            jest.spyOn(mockStores.bookingStore, 'isCheckInAvailable').mockReturnValueOnce(false);

            render(<BookingCardInfo {...mockProps} />);

            expect(screen.queryByTestId('check-in-link')).not.toBeInTheDocument();
        });

        it('should NOT render when isCheckInButtonDisplayed is false', () => {
            mockBookingInfoData.isCheckInButtonDisplayed = false;

            render(<BookingCardInfo {...mockProps} />);

            expect(screen.queryByTestId('check-in-link')).not.toBeInTheDocument();
        });
    });
});
