import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import { mockLoginCustomer } from 'frontend/__mocks__/loginCustomer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { gaLoginSuccess } from 'frontend/components/renderings/Payment/GAPaymentEventHandlers';

import { EmailVerificationSignIn } from './EmailVerificationSignIn';

Object.defineProperties(window, {
    scrollTo: { value: jest.fn() },
});

const createStores = () =>
    createMockStores({
        appStore: {
            isScreenMedium: true,
        },
        guestDetailsStore: {
            toggleGuestDetailsPhase: jest.fn(),
            customerLogin: mockLoginCustomer,
            signIn: jest.fn(callback => callback()),
        },
        trackingStore: {
            trackAccountEvent: jest.fn(),
        },
    });

let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/hooks/useReCaptcha');

const mockPushTrackingEvent = jest.fn();

jest.mock('frontend/components/renderings/Payment/trackingHooks/usePaymentTracking', () => ({
    usePaymentTracking: () => ({
        pushTrackingEvent: mockPushTrackingEvent,
    }),
}));

const mockErrorMessageProps = jest.fn();
jest.mock('frontend/components/common/ErrorMessage', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        mockErrorMessageProps(props);

        return <div data-tid='error-message' />;
    },
}));

jest.mock('frontend/components/common/ResetPassword/ResetPassword', () => ({
    __esModule: true,
    default: props => <div data-tid='reset-password' onClick={props.afterReset('mail')} />,
}));

const mockButtonProps = jest.fn();
jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: props => {
        mockButtonProps(props);

        return <div data-tid={props.dataTid} aria-label={props} onClick={props.onClick} />;
    },
}));

const mockRadioButtonComponent = jest.fn();
jest.mock('frontend/components/common/RadioButton', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        mockRadioButtonComponent(props);

        return (
            <div>
                <input type='radio' aria-label={props.label} onChange={props.onChange} />
                {props.label}
                {children}
            </div>
        );
    },
}));

const mockValidatablePasswordFieldProps = jest.fn();
jest.mock('frontend/components/common/ValidatableField/ValidatableFieldNew', () => ({
    __esModule: true,
    default: props => {
        mockValidatablePasswordFieldProps(props);

        return (
            <div data-tid='validatable-password-field'>
                <input onChange={props.onChange('change email')} />
                {props.children}
            </div>
        );
    },
}));

jest.mock('frontend/components/common/Tooltip', () => ({
    __esModule: true,
    Tooltip: ({ children }: { children: React.ReactNode }) => <div data-tid='tooltip'>{children}</div>,
    TooltipTrigger: () => <div data-tid='tooltip-trigger' />,
    TooltipContent: ({ text }: { text: string }) => <div data-tid='tooltip-content'>{text}</div>,
}));

describe('<EmailVerificationSignIn />', () => {
    beforeEach(() => {
        mockStores = createStores();
    });

    it('should NOT render component if email is not validated', () => {
        mockStores = {
            ...mockStores,
            guestDetailsStore: {
                ...mockStores.guestDetailsStore,
                customerLogin: {
                    ...mockStores.guestDetailsStore.customerLogin,
                    isEmailValidated: false,
                },
            },
        };
        const { container } = render(<EmailVerificationSignIn />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render only two login options initially', () => {
        render(<EmailVerificationSignIn />);

        expect(screen.getAllByRole('radio')).toHaveLength(2);

        expect(screen.queryByTestId('validatable-password-field')).not.toBeInTheDocument();
        expect(screen.queryByTestId('forgot-password-link')).not.toBeInTheDocument();
        expect(screen.queryByTestId('sign-in-btn')).not.toBeInTheDocument();
        expect(screen.queryByTestId('reset-password')).not.toBeInTheDocument();
        expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
    });

    it('should render error message', async () => {
        mockStores = {
            ...mockStores,
            guestDetailsStore: {
                ...mockStores.guestDetailsStore,
                customerLogin: {
                    ...mockStores.guestDetailsStore.customerLogin,
                    firstError: {
                        title: 'title',
                        description: 'description',
                    },
                },
            },
        };
        render(<EmailVerificationSignIn />);

        const radio = screen.getByRole('radio', {
            name: SitecoreDictionary.GuestDetailsRadioButtonsSignInIntoYourAccount,
        });

        await userEvent.click(radio);

        expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });

    describe('Sign In options', () => {
        it("Should render password field, forget password and sign in buttons when 'Sign In' option is selected", async () => {
            render(<EmailVerificationSignIn />);
            const radio = screen.getByRole('radio', {
                name: SitecoreDictionary.GuestDetailsRadioButtonsSignInIntoYourAccount,
            });

            await userEvent.click(radio);

            expect(screen.getByTestId('validatable-password-field')).toBeInTheDocument();
            expect(mockValidatablePasswordFieldProps).toHaveBeenCalledWith({
                onChange: expect.any(Function),
                id: 'password',
                label: SitecoreDictionary.GuestDetailsLabelsPassword,
                value: mockStores.guestDetailsStore.customerLogin.password,
                errors: mockStores.guestDetailsStore.customerLogin.passwordErrors,
                children: expect.anything(),
                postfix: expect.anything(),
                type: 'password',
                vertical: true,
                autoComplete: 'current-password',
            });

            expect(screen.getByTestId('forgot-password-link')).toBeInTheDocument();
            expect(mockButtonProps).toHaveBeenNthCalledWith(1, {
                type: 'button',
                onClick: expect.any(Function),
                isLink: true,
                dataTid: 'forgot-password-link',
                children: SitecoreDictionary.GuestDetailsButtonsForgotYourPassword,
            });

            expect(screen.getByTestId('sign-in-btn')).toBeInTheDocument();
            expect(mockButtonProps).toHaveBeenNthCalledWith(2, {
                className: 'button',
                onClick: expect.any(Function),
                disabled: false,
                dataTid: 'sign-in-btn',
                children: SitecoreDictionary.GuestDetailsButtonsSignIn,
            });
        });

        it('Should render sign in button NOT near by password field on mobile', async () => {
            mockStores.appStore.isScreenMedium = false;
            render(<EmailVerificationSignIn />);

            const radio = screen.getByRole('radio', {
                name: SitecoreDictionary.GuestDetailsRadioButtonsSignInIntoYourAccount,
            });

            await userEvent.click(radio);

            expect(within(screen.getByTestId('signing-in')).queryByTestId('sign-in-btn')).not.toBeInTheDocument();
            expect(screen.getByTestId('sign-in-btn')).toBeInTheDocument();
        });

        it('Should continue without Sign In', async () => {
            render(<EmailVerificationSignIn />);
            const radio = screen.getByRole('radio', {
                name: SitecoreDictionary.GuestDetailsRadioButtonsContinueWithoutSingIn,
            });

            await userEvent.click(radio);

            expect(mockStores.guestDetailsStore.toggleGuestDetailsPhase).toHaveBeenCalled();
            expect(mockStores.trackingStore.trackAccountEvent).toHaveBeenCalled();
            expect(screen.queryByTestId('validatable-password-field')).not.toBeInTheDocument();
            expect(screen.queryByTestId('forgot-password-link')).not.toBeInTheDocument();
            expect(screen.queryByTestId('sign-in-btn')).not.toBeInTheDocument();
        });

        it('should call signIn guestDetailsStore function with GA event push when click on Sign In button', async () => {
            render(<EmailVerificationSignIn />);
            const radio = screen.getByRole('radio', {
                name: SitecoreDictionary.GuestDetailsRadioButtonsSignInIntoYourAccount,
            });
            mockStores.guestDetailsStore.customerLogin.password = 'testPassword';

            await userEvent.click(radio);
            await userEvent.click(screen.getByTestId('sign-in-btn'));

            expect(mockPushTrackingEvent).toHaveBeenCalledWith(gaLoginSuccess);
        });
    });

    describe('Reset Password', () => {
        const toggleRestPassword = async () => {
            const radio = screen.getByLabelText(SitecoreDictionary.GuestDetailsRadioButtonsSignInIntoYourAccount);
            await userEvent.click(radio);

            const link = screen.getByTestId('forgot-password-link');
            await userEvent.click(link);
        };

        it('Should render Reset Password popup on forgot password click', async () => {
            render(<EmailVerificationSignIn />);

            await toggleRestPassword();
            expect(screen.getByTestId('reset-password')).toBeInTheDocument();
        });

        it('Should handle reset function after password reset', async () => {
            render(<EmailVerificationSignIn />);

            await toggleRestPassword();
            await userEvent.click(screen.getByTestId('reset-password'));

            expect(mockStores.guestDetailsStore.customerLogin.onChangeEmail).toHaveBeenCalledWith('mail');
            expect(mockStores.guestDetailsStore.customerLogin.toggleEmailExists).toHaveBeenCalledWith(true);
            expect(mockStores.guestDetailsStore.customerLogin.toggleEmailValidated).toHaveBeenCalledWith(true);
            expect(mockStores.guestDetailsStore.customerLogin.cleanUpErrors).toHaveBeenCalled();
            expect(mockStores.guestDetailsStore.customerLogin.rerender).toHaveBeenCalled();
        });
    });

    describe('Tooltip', () => {
        it('should render tooltip when setting is provided', () => {
            mockStores.layoutStore.getPhrase.mockReturnValue('tooltip text');

            render(<EmailVerificationSignIn />);

            expect(screen.getByTestId('tooltip')).toBeInTheDocument();
        });

        it('should NOT render tooltip when setting is NOT provided', () => {
            mockStores.layoutStore.getPhrase.mockReturnValue('');

            render(<EmailVerificationSignIn />);

            expect(screen.queryByTestId('tooltip')).not.toBeInTheDocument();
        });
    });
});
