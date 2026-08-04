import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CreateAccountSuccessPopup } from './CreateAccountSuccessPopup';

const mockPopupComponent = jest.fn();
jest.mock('frontend/components/common/Popup', () => ({
    __esModule: true,
    Popup: props => {
        mockPopupComponent(props);

        return (
            <div data-tid={props['data-tid'] || 'popup'}>
                <div data-tid='children'>{props.children}</div>
                <div data-tid='footer-content'>{props.footerContent}</div>
            </div>
        );
    },
}));

jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: ({ children, 'data-tid': dataTid, onClick }) => (
        <button data-tid={dataTid} onClick={onClick}>
            {children}
        </button>
    ),
}));

const createStores = () => ({
    createAccountStore: {
        customerLogin: { email: 'test@test.com' },
        toggleSuccessPopup: jest.fn(),
        isSuccessPopupShown: true,
    },
    layoutStore: {
        getPhrase: jest.fn(p => p),
    },
    routerStore: { redirectToLoginPage: jest.fn() },
    userStore: { isLoggedIn: false },
});
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<CreateAccountSuccessPopup />', () => {
    const user = userEvent.setup();

    beforeEach(() => {
        mockStores = createStores();
    });

    it('Should be empty render when popup is hidden', () => {
        mockStores.createAccountStore.isSuccessPopupShown = false;
        const { container } = render(<CreateAccountSuccessPopup />);
        expect(container).toBeEmptyDOMElement();
    });

    it('Should be standard render', () => {
        render(<CreateAccountSuccessPopup />);
        const popup = screen.getByTestId('success-popup');

        expect(popup).toBeInTheDocument();
        expect(mockPopupComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                containerClass: 'create-account-success-popup',
                isContentCentered: true,
                title: 'CreateAccount.SuccessPopup.AccountCreated',
            }),
        );
        expect(within(popup).getByTestId('children').children).toHaveLength(3);
        expect(within(screen.getByTestId('footer-content')).getAllByRole('button')).toHaveLength(2);
    });

    it('Should render only close button if user has already logged in', async () => {
        mockStores.userStore.isLoggedIn = true;
        render(<CreateAccountSuccessPopup />);
        const buttons = within(screen.getByTestId('footer-content')).getAllByRole('button');

        expect(buttons).toHaveLength(1);

        await user.click(screen.getByTestId('close-button'));

        expect(mockStores.createAccountStore.toggleSuccessPopup).toHaveBeenCalledWith(false);
    });

    it('Should close popup and redirect to Login Page on login click', async () => {
        render(<CreateAccountSuccessPopup />);

        await user.click(screen.getByTestId('login-button'));

        expect(mockStores.createAccountStore.toggleSuccessPopup).toHaveBeenCalledWith(false);
        expect(mockStores.routerStore.redirectToLoginPage).toHaveBeenCalled();
    });
});
