import * as React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import { mockLoginCustomer } from 'frontend/__mocks__/loginCustomer';
import useReCaptcha from 'frontend/hooks/useReCaptcha';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SitePath from 'models/enum/SitePath';

import { SingIn } from './SingInSection';

const createStores = () =>
    createMockStores({
        userStore: {
            customerLogin: mockLoginCustomer,
            rememberMe: false,
        },
        shortlistStore: {
            setNeedShowBookingInShortlistModal: jest.fn(),
        },
        trackingStore: {
            trackValidation: jest.fn(),
        },
        queryParamStore: {
            viewMyBooking: jest.fn(() => false),
            myBookings: jest.fn(() => false),
        },
    });

let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));
jest.mock('frontend/hooks/useReCaptcha');

Object.defineProperties(window, {
    scrollTo: { value: jest.fn() },
});

const mockResetPasswordProps = jest.fn();
jest.mock('frontend/components/common/ResetPassword/ResetPassword', () => ({
    __esModule: true,
    default: props => {
        mockResetPasswordProps(props);

        return <div data-tid='reset-password' onClick={props.afterReset('mail')} />;
    },
}));

const mockCreateAccountSectionProps = jest.fn();
jest.mock('frontend/components/renderings/LoginForm/components/CreateAccountSection', () => ({
    __esModule: true,
    default: props => {
        mockCreateAccountSectionProps(props);

        return <div data-tid='create-account-section' />;
    },
}));

describe('<SignInSection />', () => {
    beforeEach(() => {
        mockStores = createStores();
    });

    it('should render active Sign in button when there are NO errors', () => {
        render(<SingIn />);

        expect(useReCaptcha).toHaveBeenCalled();
        expect(screen.getByRole('button', { name: SitecoreDictionary.LoginButtonsSignIn })).not.toBeDisabled();
    });

    it('should be disabled Sign in button when there are email errors', () => {
        mockStores = {
            ...mockStores,
            userStore: {
                ...mockStores.userStore,
                customerLogin: {
                    ...mockStores.userStore.customerLogin,
                    emailErrors: ['error'],
                },
            },
        };
        render(<SingIn />);

        expect(screen.getByRole('button', { name: SitecoreDictionary.LoginButtonsSignIn })).toBeDisabled();
    });

    it('should be disabled Sign in button when there are password errors', () => {
        mockStores = {
            ...mockStores,
            userStore: {
                ...mockStores.userStore,
                customerLogin: {
                    ...mockStores.userStore.customerLogin,
                    passwordErrors: ['error'],
                },
            },
        };
        render(<SingIn />);

        expect(screen.getByRole('button', { name: SitecoreDictionary.LoginButtonsSignIn })).toBeDisabled();
    });

    it('should NOT render Sign in button when CTA is hidden', () => {
        render(<SingIn isCtaHidden />);

        expect(screen.queryByRole('button', { name: SitecoreDictionary.LoginButtonsSignIn })).not.toBeInTheDocument();
    });

    it('should log in on submit', async () => {
        render(<SingIn />);

        const submitButton = screen.getByRole('button', { name: SitecoreDictionary.LoginButtonsSignIn }) as Element;

        await userEvent.click(submitButton);

        expect(mockStores.userStore.onLogin).toHaveBeenCalled();
    });

    it('should add to shortlist on submit', async () => {
        render(<SingIn isLoginToAddShortlist />);

        const submitButton = screen.getByRole('button', { name: SitecoreDictionary.LoginButtonsSignIn }) as Element;

        await userEvent.click(submitButton);

        expect(mockStores.shortlistStore.setNeedShowBookingInShortlistModal).toBeCalled();
    });

    it('should change data when email input changes', async () => {
        render(<SingIn />);

        const input = screen.getByLabelText(SitecoreDictionary.LoginLabelsEmailAddress) as Element;

        await userEvent.type(input, 'E');

        expect(mockStores.userStore.customerLogin.onChangeEmail).toHaveBeenCalled();
        expect(mockStores.userStore.customerLogin.cleanUpErrors).toHaveBeenCalled();
    });

    it('should change data when password input changes', async () => {
        render(<SingIn />);

        const input = screen.getByLabelText(SitecoreDictionary.LoginLabelsPassword) as Element;

        await userEvent.type(input, 'P');

        expect(mockStores.userStore.customerLogin.onChangePassword).toHaveBeenCalled();
        expect(mockStores.userStore.customerLogin.cleanUpErrors).toHaveBeenCalled();
    });

    it('should set rememberMe on checkbox change', async () => {
        render(<SingIn />);

        await userEvent.click(screen.getByRole('checkbox') as Element);

        expect(mockStores.userStore.setRememberMe).toHaveBeenCalledWith(true);
    });

    it('should NOT render rememberMe checkbox', () => {
        render(<SingIn isHideRememberMe />);

        expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    });

    it('should render ErrorMessage when customerLogin has errors', () => {
        mockStores.userStore.customerLogin.errors = [{ title: 'error title', description: 'error description' }];

        render(<SingIn />);

        expect(screen.getByText('error title')).toBeInTheDocument();
        expect(screen.getByText('error description')).toBeInTheDocument();
    });

    it('should cleanUp customerLogin on unmount', () => {
        const { unmount } = render(<SingIn />);

        unmount();

        expect(mockStores.userStore.customerLogin.cleanUpModel).toHaveBeenCalled();
    });

    it('should NOT call setRedirectUrl when viewMyBooking and myBookings returns false', async () => {
        render(<SingIn />);

        const submitButton = screen.getByRole('button', { name: SitecoreDictionary.LoginButtonsSignIn }) as Element;

        await userEvent.click(submitButton);

        expect(mockStores.userStore.setRedirectUrl).not.toHaveBeenCalled();
    });

    it('should call setRedirectUrl with ViewBookings path when viewMyBooking returns true', async () => {
        mockStores.queryParamStore.viewMyBooking = jest.fn(() => true);

        render(<SingIn />);

        const submitButton = screen.getByRole('button', { name: SitecoreDictionary.LoginButtonsSignIn }) as Element;

        await userEvent.click(submitButton);

        expect(mockStores.userStore.setRedirectUrl).toHaveBeenCalledWith(SitePath.ViewBookings);
    });

    it('should call setRedirectUrl when myBookings returns true', async () => {
        mockStores.queryParamStore.myBookings = jest.fn(() => true);

        render(<SingIn />);

        const submitButton = screen.getByRole('button', { name: SitecoreDictionary.LoginButtonsSignIn }) as Element;

        await userEvent.click(submitButton);

        expect(mockStores.userStore.setRedirectUrl).toHaveBeenCalledWith(SitePath.ViewBookings);
    });

    it('should render ResetPassword popup when forgot password button is clicked and hideResetPasswordPopup is false', async () => {
        render(<SingIn hideResetPasswordPopup={false} />);

        await userEvent.click(screen.getByTestId('forgot-password-link'));

        expect(screen.getByTestId('reset-password')).toBeInTheDocument();
    });

    it('should handle reset after password reset', async () => {
        render(<SingIn hideResetPasswordPopup={false} />);

        await userEvent.click(screen.getByTestId('forgot-password-link'));
        await userEvent.click(screen.getByTestId('reset-password'));

        expect(mockStores.userStore.customerLogin.onChangeEmail).toHaveBeenCalledWith('mail');
        expect(mockStores.userStore.customerLogin.cleanUpErrors).toHaveBeenCalled();
    });

    it('should NOT render ResetPassword popup when forgot password button is clicked and hideResetPasswordPopup is false', async () => {
        render(<SingIn hideResetPasswordPopup={true} />);

        await userEvent.click(screen.getByTestId('forgot-password-link'));

        expect(screen.queryByTestId('reset-password')).not.toBeInTheDocument();
    });

    it('should render CreateAccountSection when isCreateAccountSectionShown is true', async () => {
        render(<SingIn isCreateAccountSectionShown />);

        expect(screen.getByTestId('create-account-section')).toBeInTheDocument();
    });

    it('should focus email field when reset password popup is closed and email is NOT empty', async () => {
        const focus = jest.fn();
        const blur = jest.fn();
        jest.spyOn(React, 'useRef').mockReturnValueOnce({ current: { focus, blur } });
        mockStores = {
            ...mockStores,
            userStore: {
                ...mockStores.userStore,
                customerLogin: {
                    ...mockStores.userStore.customerLogin,
                    email: 'email@email.com',
                },
            },
        };

        render(<SingIn />);

        waitFor(() => {
            expect(blur).toHaveBeenCalled();
            expect(focus).toHaveBeenCalled();
        });
    });

    it('should focus email field when reset password popup is closed is false and email is NOT empty', async () => {
        const focus = jest.fn();
        const blur = jest.fn();
        jest.spyOn(React, 'useRef').mockReturnValueOnce({ current: { focus, blur } });
        mockStores = {
            ...mockStores,
            userStore: {
                ...mockStores.userStore,
                customerLogin: {
                    ...mockStores.userStore.customerLogin,
                    password: 'password',
                },
            },
        };

        render(<SingIn />);

        waitFor(() => {
            expect(blur).toHaveBeenCalled();
            expect(focus).toHaveBeenCalled();
        });
    });
});
