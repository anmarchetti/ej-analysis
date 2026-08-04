import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';

import LoginToViewBookingPopup from './LoginToViewBookingPopup';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/common/LoginPopup/LoginPopup', () => ({
    __esModule: true,
    default: props => (
        <div data-tid='login-popup'>
            <button onClick={props.afterLoginAction} />
        </div>
    ),
}));

jest.mock('./components/LoginDrawer/LoginDrawer', () => ({
    __esModule: true,
    default: () => <div data-tid='login-drawer' />,
}));

const createProps = () => ({
    categories: [{ id: '123' }],
    faqRatingFields: {
        RatingQuestion: { value: 'question?' },
        PositiveActiveIcon: { value: { src: 'img1' } },
        PositiveInactiveIcon: { value: { src: 'img2' } },
        NegativeActiveIcon: { value: { src: 'img3' } },
        NegativeInactiveIcon: { value: { src: 'img4' } },
    },
});

const createStores = () =>
    createMockStores({
        appStore: {
            isScreenLarge: true,
        },
        userStore: {
            isLoginPopupShown: true,
            onLogin: jest.fn(),
            loggedInUserData: { email: 'test@test.fr' },
            isLoggedIn: false,
            redirectUrlLocal: '',
            customerLogin: {
                onChangeEmail: jest.fn(),
                cleanUpErrors: jest.fn(),
                email: 'email',
                emailErrors: [],
                errors: [],
                firstError: false,
            },
        },
    });

let props;
let mockStores;

describe('<LoginToViewBookingPopup />', () => {
    beforeEach(() => {
        props = createProps();
        mockStores = createStores();
    });

    it('Should NOT render when isLoginPopupShown false', () => {
        mockStores.userStore.isLoginPopupShown = false;
        const { container } = render(<LoginToViewBookingPopup {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('Should standard render', () => {
        render(<LoginToViewBookingPopup {...props} />);

        expect(screen.getByTestId('login-popup')).toBeInTheDocument();
    });

    it('Should standard render', () => {
        mockStores.appStore.isScreenLarge = false;
        render(<LoginToViewBookingPopup {...props} />);

        expect(screen.getByTestId('login-drawer')).toBeInTheDocument();
    });

    it('Should handle afterLoginAction', async () => {
        window.scrollTo = jest.fn();
        render(<LoginToViewBookingPopup {...props} />);

        await userEvent.click(screen.getByRole('button'));

        expect(mockStores.userStore.toggleLoginPopup).toHaveBeenCalledTimes(1);
        expect(mockStores.viewBookingStore.loadBooking).toHaveBeenCalledWith(true);
        expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
    });
});
