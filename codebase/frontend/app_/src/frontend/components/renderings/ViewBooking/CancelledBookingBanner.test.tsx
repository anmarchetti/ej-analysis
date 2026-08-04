import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';

import CancelledBookingBanner from './CancelledBookingBanner';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/common/Link', () => ({
    __esModule: true,
    default: ({ children }) => <div>{children}</div>,
}));

jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: ({ children, ...props }) => <button {...props}>{children}</button>,
}));

const createStores = () =>
    createMockStores({
        holidayCreditStore: {
            isCreditBookingEnabled: true,
        },
        userStore: {
            isLoggedIn: true,
        },
        viewBookingStore: {
            isBookingCanceled: true,
        },
    });

let mockStores;

describe('<CancelledBookingBanner />', () => {
    beforeEach(() => {
        mockStores = createStores();
    });

    it('Should standard render', () => {
        const { container } = render(<CancelledBookingBanner />);

        expect(container).not.toBeEmptyDOMElement();
    });

    describe('Should NOT render CancelledBookingBanner', () => {
        it('Should NOT render if !isBookingCanceled and !wasCredited and !wasRefunded', () => {
            mockStores.viewBookingStore.isBookingCanceled = false;
            mockStores.viewBookingStore.booking.wasCredited = false;
            mockStores.viewBookingStore.booking.wasRefunded = false;
            const { container } = render(<CancelledBookingBanner />);

            expect(container).toBeEmptyDOMElement();
        });

        it('Should NOT render if no booking', () => {
            mockStores.viewBookingStore.booking = null;
            const { container } = render(<CancelledBookingBanner />);

            expect(container).toBeEmptyDOMElement();
        });
    });

    it('Should render btn as a Link if loggedIn', () => {
        render(<CancelledBookingBanner />);

        expect(screen.getByTestId('back-to-bookings-btn')).toBeInTheDocument();
    });

    it('Should render button if not loggedIn and call toggleLoginPopup on click', () => {
        mockStores.userStore.isLoggedIn = false;
        render(<CancelledBookingBanner />);

        const loginButton = screen.getByTestId('login-btn');
        expect(loginButton).toBeInTheDocument();

        fireEvent.click(loginButton);

        expect(mockStores.userStore.toggleLoginPopup).toHaveBeenCalled();
    });
});
