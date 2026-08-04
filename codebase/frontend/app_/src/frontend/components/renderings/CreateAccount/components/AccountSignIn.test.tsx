import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import { mockLoginCustomer } from 'frontend/__mocks__/loginCustomer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { AccountSignIn, TAccountSignInType } from './AccountSignIn';
jest.mock('frontend/hooks/useReCaptcha');

const createProps = (): TAccountSignInType => ({
    customerLogin: mockLoginCustomer,
    onSignIn: jest.fn(),
    changeEmail: jest.fn(),
});

let mockStores = createMockStores();
let mockProps = createProps();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockValidatableFieldProps = jest.fn();
jest.mock('frontend/components/common/ValidatableField/ValidatableField', () => ({
    __esModule: true,
    default: props => {
        mockValidatableFieldProps(props);

        return <input data-tid={props.id} onChange={props.onChange} />;
    },
}));

const mockValidatablePasswordFieldProps = jest.fn();
jest.mock('frontend/components/common/ValidatablePasswordField', () => ({
    __esModule: true,
    default: props => {
        mockValidatablePasswordFieldProps(props);

        return (
            <div data-tid={props.id}>
                <input onChange={props.onChange('change email')} />
            </div>
        );
    },
}));

const mockResetPasswordProps = jest.fn();
jest.mock('frontend/components/common/ResetPassword/ResetPassword', () => ({
    __esModule: true,
    default: props => {
        mockResetPasswordProps(props);

        return <div data-tid='reset-password' onClick={props.afterReset('mail')} />;
    },
}));

const mockButtonProps = jest.fn();
jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: props => {
        mockButtonProps(props);

        return <div data-tid={props.dataTid} onClick={props.onClick} />;
    },
}));

const mockErrorMessageProps = jest.fn();
jest.mock('frontend/components/common/ErrorMessage', () => ({
    __esModule: true,
    default: props => {
        mockErrorMessageProps(props);

        return <div data-tid='error-message' />;
    },
}));

describe('<AccountSignIn />', () => {
    beforeEach(() => {
        mockStores = createMockStores();
        mockProps = createProps();
    });

    it('should render component', () => {
        render(<AccountSignIn {...mockProps} />);

        expect(screen.getByTestId('account-sign-in')).toBeInTheDocument();

        expect(screen.getByTestId('customer-login-email')).toBeInTheDocument();
        expect(mockValidatableFieldProps).toHaveBeenCalledWith({
            onChange: expect.any(Function),
            id: 'customer-login-email',
            label: SitecoreDictionary.GuestDetailsLabelsEmail,
            value: mockProps.customerLogin.email,
            errors: [],
            isVertical: true,
            hasGroup: false,
            disabled: true,
            required: true,
            hasDisabledFieldClass: true,
        });

        expect(screen.getByTestId('customer-login-password')).toBeInTheDocument();
        expect(mockValidatablePasswordFieldProps).toHaveBeenCalledWith({
            onChange: expect.any(Function),
            id: 'customer-login-password',
            label: SitecoreDictionary.GuestDetailsLabelsPassword,
            srLabel: SitecoreDictionary.GuestDetailsLabelsPassword,
            value: mockProps.customerLogin.password,
            errors: mockProps.customerLogin.passwordErrors,
            isVertical: true,
            hasGroup: false,
            required: true,
        });

        expect(screen.getByTestId('change-email-btn')).toBeInTheDocument();
        expect(mockButtonProps).toHaveBeenNthCalledWith(1, {
            type: 'button',
            id: 'changeEmailBtn',
            dataTid: 'change-email-btn',
            isLink: true,
            onClick: expect.any(Function),
            children: SitecoreDictionary.GuestDetailsButtonsChange,
        });

        expect(screen.getByTestId('forgot-password-link')).toBeInTheDocument();
        expect(mockButtonProps).toHaveBeenNthCalledWith(2, {
            type: 'button',
            id: 'forgotPasswordBtn',
            dataTid: 'forgot-password-link',
            isLink: true,
            onClick: expect.any(Function),
            children: SitecoreDictionary.GuestDetailsButtonsForgotYourPassword,
        });

        expect(screen.getByTestId('login-in-btn')).toBeInTheDocument();
        expect(mockButtonProps).toHaveBeenNthCalledWith(3, {
            type: 'button',
            isFullWidth: true,
            className: 'guest-login__btn',
            disabled: false,
            dataTid: 'login-in-btn',
            onClick: expect.any(Function),
            children: SitecoreDictionary.GuestDetailsButtonsSignIn,
        });

        expect(screen.getByTestId('error-message')).toBeInTheDocument();
        expect(mockErrorMessageProps).toHaveBeenCalledWith({
            message: SitecoreDictionary.CreateAccountErrorsAccountExist,
            description: SitecoreDictionary.CreateAccountErrorsAccountExistDescription,
            IsNotification: true,
            icon: expect.anything(),
        });
    });

    it('should render error message', () => {
        mockProps.customerLogin.errors = [
            {
                title: 'title',
                description: 'description',
            },
        ];
        render(<AccountSignIn {...mockProps} />);

        expect(screen.getAllByTestId('error-message')).toHaveLength(2);
        expect(mockErrorMessageProps).toHaveBeenNthCalledWith(2, {
            message: mockProps.customerLogin.firstError.title,
            description: mockProps.customerLogin.firstError.description,
            errorMessageClass: 'error-container',
            icon: expect.anything(),
        });
    });

    it('should render reset password popup and pass after reset function', async () => {
        render(<AccountSignIn {...mockProps} />);

        await userEvent.click(screen.getByTestId('forgot-password-link'));
        await userEvent.click(screen.getByTestId('reset-password'));

        expect(mockResetPasswordProps).toHaveBeenCalledWith({
            afterReset: expect.any(Function),
            defaultEmail: mockProps.customerLogin.email,
            onCancelClick: expect.any(Function),
        });

        expect(mockProps.customerLogin.onChangeEmail).toHaveBeenCalledWith('mail');
        expect(mockProps.customerLogin.toggleEmailExists).toHaveBeenCalledWith(true);
        expect(mockProps.customerLogin.toggleEmailValidated).toHaveBeenCalledWith(true);
        expect(mockProps.customerLogin.cleanUpErrors).toHaveBeenCalled();
        expect(mockProps.customerLogin.rerender).toHaveBeenCalled();
    });

    it('should handle password change event when field is changed', async () => {
        render(<AccountSignIn {...mockProps} />);

        const messages = screen.getByTestId('customer-login-password');
        const input = within(messages).getByRole('textbox');
        await userEvent.type(input, 'change email');

        expect(mockProps.customerLogin.onChangePassword).toHaveBeenCalledWith('change email');
        expect(mockProps.customerLogin.cleanUpErrors).toHaveBeenCalled();
    });

    it('should call changeEmail prop when change email button is clicked', async () => {
        render(<AccountSignIn {...mockProps} />);

        await userEvent.click(screen.getByTestId('change-email-btn'));

        expect(mockProps.changeEmail).toHaveBeenCalled();
    });

    it('should handle input change', async () => {
        render(<AccountSignIn {...mockProps} />);

        await userEvent.type(screen.getByTestId('customer-login-email'), 'E');

        expect(mockProps.changeEmail).toHaveBeenCalled();
    });
});
