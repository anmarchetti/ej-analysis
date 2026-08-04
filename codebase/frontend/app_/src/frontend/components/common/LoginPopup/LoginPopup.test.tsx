import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import { mockLoginCustomer } from 'frontend/__mocks__/loginCustomer';

import { ILoginPopupProps, LoginPopup } from './LoginPopup';

const createProps = (): ILoginPopupProps => ({
    title: 'title',
    description: 'description',
    onClose: jest.fn(),
    popupClass: 'popupClass',
});

const createStores = () =>
    createMockStores({
        userStore: {
            customerLogin: mockLoginCustomer,
        },
    });

let mockProps = createProps();
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockResetPasswordProps = jest.fn();
jest.mock('frontend/components/common/ResetPassword/ResetPassword', () => ({
    __esModule: true,
    default: props => {
        mockResetPasswordProps(props);

        return <div data-tid='reset-password' onClick={props.afterReset('mail')} />;
    },
}));

const mockPopupProps = jest.fn();
jest.mock('frontend/components/common/Popup', () => ({
    __esModule: true,
    Popup: props => {
        mockPopupProps(props);

        return <div data-tid='popup'>{props.children}</div>;
    },
}));

const mockSingInSectionProps = jest.fn();
jest.mock('frontend/components/renderings/LoginForm/components/SingInSection', () => ({
    __esModule: true,
    default: props => {
        mockSingInSectionProps(props);

        return (
            <div data-tid='sign-in-section'>
                <button data-tid='forget-password-btn' onClick={props.setParentResetPasswordVisible} />
            </div>
        );
    },
}));

describe('<LoginPopup />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('renders login popup', () => {
        render(<LoginPopup {...mockProps} />);

        expect(screen.getByTestId('popup')).toBeInTheDocument();
        expect(mockPopupProps).toHaveBeenCalledWith({
            containerClass: 'login-popup popupClass',
            dialogClass: 'popupDialog',
            bodyClass: 'popupBody',
            showCloseButton: true,
            onClose: expect.any(Function),
            children: expect.anything(),
        });

        expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(mockProps.title);
        expect(screen.getByTestId('login-popup-description')).toHaveTextContent(mockProps.description);

        expect(screen.getByTestId('sign-in-section')).toBeInTheDocument();
        expect(mockSingInSectionProps).toHaveBeenCalledWith({
            hideResetPasswordPopup: true,
            disableCleanUpOnUnmount: true,
            createAccountClassName: 'createAccount',
            setParentResetPasswordVisible: expect.any(Function),
        });
    });

    it('renders reset password popup and does NOT render login popup ', async () => {
        render(<LoginPopup {...mockProps} />);

        await userEvent.click(screen.getByTestId('forget-password-btn'));

        expect(screen.queryByTestId('popup')).not.toBeInTheDocument();
        expect(screen.getByTestId('reset-password')).toBeInTheDocument();
        expect(mockResetPasswordProps).toHaveBeenCalled();
    });

    it('should handle after reset password function', async () => {
        render(<LoginPopup {...mockProps} />);

        await userEvent.click(screen.getByTestId('forget-password-btn'));
        await userEvent.click(screen.getByTestId('reset-password'));

        expect(mockStores.userStore.customerLogin.onChangeEmail).toHaveBeenCalledWith('mail');
        expect(mockStores.userStore.customerLogin.cleanUpErrors).toHaveBeenCalled();
    });

    it('calls on unmount', () => {
        const { unmount } = render(<LoginPopup {...mockProps} />);

        unmount();

        expect(mockStores.userStore.customerLogin.cleanUpModel).toHaveBeenCalled();
    });
});
