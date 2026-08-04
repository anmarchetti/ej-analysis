import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError } from 'axios';

import { createMockStores } from 'frontend/__mocks__';
import { mockLoginCustomer } from 'frontend/__mocks__/loginCustomer';
import { ApiError } from 'models/data/ApiError';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { EventTypes } from 'models/enum/tracking/EventTypes';

import { IResetPasswordProps, ResetPassword } from './ResetPassword';

let mockCustomer = mockLoginCustomer;
jest.mock('models/data/LoginCustomer', () => ({
    LoginCustomer: jest.fn().mockImplementation(() => mockCustomer),
}));

const createProps = (): IResetPasswordProps => ({
    afterReset: jest.fn(),
    onCancelClick: jest.fn(),
});

const createStores = () =>
    createMockStores({
        layoutStore: {
            lang: 'en',
            isCIAMFunctionalityEnabled: false,
            isCIAMForgetPasswordFormEnabled: false,
        },
        trackingStore: {
            trackAccountEvent: jest.fn(),
            trackCustomError: jest.fn(),
        },
    });

let mockStores = createStores();
let mockProps = createProps();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockAfterResetMessageProps = jest.fn();
jest.mock('./components/AfterResetMessage/AfterResetMessage', () => ({
    __esModule: true,
    default: props => {
        mockAfterResetMessageProps(props);

        return <div data-tid='after-reset-message' />;
    },
}));

const mockPopupComponent = jest.fn();
jest.mock('frontend/components/common/Popup', () => ({
    __esModule: true,
    Popup: props => {
        mockPopupComponent(props);

        return (
            <div data-tid='popup'>
                <div data-tid='popup-title'>{props.title}</div>
                <div data-tid='children'>{props.children}</div>
                <div data-tid='footer-content'>{props.footerContent}</div>
            </div>
        );
    },
}));

const mockButtonProps = jest.fn();
jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        mockButtonProps(props);

        return (
            <div data-tid={props.dataTid} onClick={props.onClick}>
                {children}
            </div>
        );
    },
}));

const mockResetPasswordFormProps = jest.fn();
jest.mock('./components/ResetPasswordForm/ResetPasswordForm', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        mockResetPasswordFormProps(props);

        return <div data-tid='reset-password-form' />;
    },
}));

const mockErrorPopup = jest.fn();
jest.mock(
    'frontend/components/common/ResetPassword/components/ResetPasswordErrorPopup/ResetPasswordErrorPopup',
    () => ({
        __esModule: true,
        default: props => {
            mockErrorPopup(props);

            return <div data-tid='error-popup' onClick={props.onClose} />;
        },
    }),
);

describe('<ResetPassword />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
        mockCustomer = mockLoginCustomer;
    });

    it('should render component with ProvideEmail phase', () => {
        render(<ResetPassword {...mockProps} />);

        expect(mockStores.trackingStore.trackAccountEvent).toHaveBeenCalledWith(EventTypes.PasswordReset);
        expect(mockStores.trackingStore.trackAccountEvent).toHaveBeenCalledTimes(1);

        expect(screen.getByTestId('popup')).toBeInTheDocument();
        expect(mockPopupComponent).toHaveBeenCalledWith({
            onClose: expect.any(Function),
            containerClass: 'forgotPasswordPopup',
            bodyClass: 'popupBody',
            title: SitecoreDictionary.LoginTitlesResetYourPassword,
            footerContent: expect.anything(),
            children: expect.anything(),
        });

        expect(screen.getByTestId('reset-password-form')).toBeInTheDocument();
        expect(mockResetPasswordFormProps).toHaveBeenCalledWith({
            customerLogin: mockLoginCustomer,
            isCIAMEnabled: false,
        });

        expect(screen.getByTestId('cancel-button')).toBeInTheDocument();
        expect(mockButtonProps).toHaveBeenNthCalledWith(1, {
            isTransparent: true,
            onClick: expect.any(Function),
            dataTid: 'cancel-button',
        });

        expect(screen.getByTestId('confirm-button')).toBeInTheDocument();
        expect(mockButtonProps).toHaveBeenNthCalledWith(2, {
            disabled: false,
            isMedium: true,
            onClick: expect.any(Function),
            dataTid: 'confirm-button',
        });
    });

    it('should render component with PasswordReset', async () => {
        render(<ResetPassword {...mockProps} />);

        await userEvent.click(screen.getByTestId('confirm-button'));

        expect(mockPopupComponent).toHaveBeenCalledWith({
            onClose: expect.any(Function),
            containerClass: 'forgotPasswordPopup',
            bodyClass: 'popupBody',
            title: SitecoreDictionary.LoginTitlesWeSentYouEmail,
            footerContent: undefined,
            children: expect.anything(),
        });

        expect(screen.getByTestId('after-reset-message')).toBeInTheDocument();
        expect(mockAfterResetMessageProps).toHaveBeenCalledWith({
            afterReset: mockProps.afterReset,
            email: mockLoginCustomer.email,
            onClosePopup: expect.any(Function),
        });
        expect(screen.queryByTestId('cancel-button')).not.toBeInTheDocument();
        expect(screen.queryByTestId('confirm-button')).not.toBeInTheDocument();
    });

    it('should set default email on mount when it is provided', async () => {
        mockProps.defaultEmail = 'test@gmail.com';
        render(<ResetPassword {...mockProps} />);

        expect(mockCustomer.onChangeEmail).toHaveBeenCalledWith(mockProps.defaultEmail);
    });

    describe('Confirm handler', () => {
        it('should call resetPassword', async () => {
            render(<ResetPassword {...mockProps} />);

            const confirmButton = screen.getByTestId('confirm-button');
            await userEvent.click(confirmButton);

            expect(mockStores.trackingStore.trackAccountEvent).toHaveBeenCalledWith(EventTypes.ConfirmPasswordReset);
            expect(mockStores.userStore.resetPassword).toHaveBeenCalled();
        });

        it('should catch NON Api Error and does NOT toggle PasswordReset phase', async () => {
            mockStores.userStore.resetPassword = jest.fn().mockRejectedValueOnce(new Error('Error'));
            render(<ResetPassword {...mockProps} />);

            const confirmButton = screen.getByTestId('confirm-button');
            await userEvent.click(confirmButton);

            expect(screen.queryByTestId('password-reset-popup')).not.toBeInTheDocument();
        });

        it('should catch ApiError and does NOT toggle PasswordReset phase', async () => {
            const apiError = new ApiError(new AxiosError('Error'));
            mockStores.userStore.resetPassword = jest.fn().mockRejectedValueOnce(apiError);
            render(<ResetPassword {...mockProps} />);

            const confirmButton = screen.getByTestId('confirm-button');
            await userEvent.click(confirmButton);

            expect(mockStores.userStore.customerErrorHandler).toHaveBeenCalled();
            expect(screen.queryByTestId('password-reset-popup')).not.toBeInTheDocument();
        });

        it('should NOT call resetPassword when email errors exist', async () => {
            mockCustomer.errors = [{ title: 'error' }];
            render(<ResetPassword {...mockProps} />);

            expect(mockErrorPopup).not.toHaveBeenCalled();
            expect(mockPopupComponent).toHaveBeenCalledWith(expect.objectContaining({ bodyClass: 'popupBody' }));

            const confirmButton = screen.getByTestId('confirm-button');
            await userEvent.click(confirmButton);

            expect(mockStores.trackingStore.trackAccountEvent).not.toHaveBeenCalledWith(
                EventTypes.ConfirmPasswordReset,
            );
            expect(mockStores.userStore.resetPassword).not.toHaveBeenCalled();
        });
    });

    it('should close popup when cancel button is clicked', async () => {
        render(<ResetPassword {...mockProps} />);

        await userEvent.click(screen.getByTestId('cancel-button'));

        expect(mockProps.onCancelClick).toHaveBeenCalled();
        expect(mockStores.userStore.rerenderForm).toHaveBeenCalled();
    });

    describe('CIAM Forget Password component', () => {
        beforeEach(() => {
            mockStores.layoutStore.isCIAMForgetPasswordFormEnabled = true;
            mockStores.layoutStore.isCIAMFunctionalityEnabled = true;
        });

        it('should NOT render CIAM forget password component when whole CIAM functionality is disabled', () => {
            mockStores.layoutStore.isCIAMForgetPasswordFormEnabled = true;
            mockStores.layoutStore.isCIAMFunctionalityEnabled = false;
            render(<ResetPassword {...mockProps} />);

            expect(mockResetPasswordFormProps).toHaveBeenCalledWith({
                customerLogin: expect.anything(),
                isCIAMEnabled: false,
            });
        });

        it('should render CIAM forget password component', () => {
            mockCustomer.errors = [];
            render(<ResetPassword {...mockProps} />);

            expect(mockResetPasswordFormProps).toHaveBeenCalledWith({
                customerLogin: expect.anything(),
                isCIAMEnabled: true,
            });
        });

        it('should handle CIAM event listeners correctly', () => {
            const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
            const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

            const { unmount } = render(<ResetPassword {...mockProps} />);

            expect(addEventListenerSpy).toHaveBeenCalledWith(
                'ciam:forgotten-password:cancel-click',
                expect.any(Function),
            );
            expect(addEventListenerSpy).toHaveBeenCalledWith('ciam:forgotten-password:success', expect.any(Function));
            expect(addEventListenerSpy).toHaveBeenCalledWith('ciam:forgotten-password:error', expect.any(Function));

            unmount();

            expect(removeEventListenerSpy).toHaveBeenCalledWith(
                'ciam:forgotten-password:cancel-click',
                expect.any(Function),
            );
            expect(removeEventListenerSpy).toHaveBeenCalledWith(
                'ciam:forgotten-password:success',
                expect.any(Function),
            );
            expect(removeEventListenerSpy).toHaveBeenCalledWith('ciam:forgotten-password:error', expect.any(Function));
        });

        it('should call onClosePopup when ciam:forgotten-password:cancel-click event is triggered', () => {
            render(<ResetPassword {...mockProps} />);

            const event = new CustomEvent('ciam:forgotten-password:cancel-click');
            window.dispatchEvent(event);

            expect(mockProps.onCancelClick).toHaveBeenCalled();
            expect(mockStores.userStore.rerenderForm).toHaveBeenCalled();
        });

        it('should call onSuccessSubmit and transitions to PasswordReset phase when ciam:forgotten-password:success event is triggered', () => {
            mockCustomer.errors = [];
            render(<ResetPassword {...mockProps} />);

            const testEmail = 'success@email.com';
            const successEvent = new CustomEvent('ciam:forgotten-password:success', {
                detail: { email: testEmail },
            });
            act(() => {
                window.dispatchEvent(successEvent);
            });

            expect(mockStores.trackingStore.trackAccountEvent).toHaveBeenCalledWith(EventTypes.ConfirmPasswordReset);
            expect(screen.getByTestId('after-reset-message')).toBeInTheDocument();
            expect(mockAfterResetMessageProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    email: testEmail,
                }),
            );
        });

        it('should call onErrorHandler and renders error popup msg when ciam:forgotten-password:error event is triggered', async () => {
            const { rerender } = render(<ResetPassword {...mockProps} />);

            const errorEvent = new CustomEvent('ciam:forgotten-password:error');
            window.dispatchEvent(errorEvent);

            expect(mockStores.trackingStore.trackCustomError).toHaveBeenCalledWith(
                SitecoreDictionary.LoginErrorMessagesNetworkError,
                SitecoreDictionary.LoginErrorMessagesNetworkError,
            );
            expect(mockCustomer.errors).toEqual([
                {
                    title: SitecoreDictionary.GuestDetailsErrorMessagesGenericCustomerError,
                    description: SitecoreDictionary.GuestDetailsErrorMessagesGenericCustomerErrorDescription,
                },
            ]);
            rerender(<ResetPassword {...mockProps} />);
            expect(mockErrorPopup).toHaveBeenCalledWith({
                onClose: expect.any(Function),
            });
            expect(screen.queryByTestId('popup')).not.toBeInTheDocument();

            const popup = screen.getByTestId('error-popup');
            fireEvent.click(popup);
            expect(mockProps.onCancelClick).toHaveBeenCalled();
            expect(mockCustomer.cleanUpErrors).toHaveBeenCalled();
        });
    });
});
