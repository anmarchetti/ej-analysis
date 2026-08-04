import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { envAll } from 'code/env';
import { createMockStores } from 'frontend/__mocks__';
import { mockLoginCustomer } from 'frontend/__mocks__/loginCustomer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import ResetPasswordForm, { IResetPasswordFormProps } from './ResetPasswordForm';

const createProps = (): IResetPasswordFormProps => ({
    customerLogin: mockLoginCustomer,
    isCIAMEnabled: false,
});

const createStores = () =>
    createMockStores({
        layoutStore: {
            lang: 'en',
            emailDomainsForgetPassword: ['@easyjet.com'],
        },
    });

let mockStores = createStores();
let mockProps = createProps();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockValidatableFieldProps = jest.fn();
jest.mock('frontend/components/common/ValidatableField/ValidatableFieldNew', () => ({
    __esModule: true,
    default: props => {
        mockValidatableFieldProps(props);

        return <div data-tid='validatable-field' onClick={() => props.onChange('email-value')} />;
    },
}));

const mockErrorMessageProps = jest.fn();
jest.mock('frontend/components/common/ErrorMessage', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        mockErrorMessageProps(props);

        return <div data-tid='error-message' />;
    },
}));

const mockEnvAll = jest.mocked(envAll);

describe('<ResetPassword />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
        mockEnvAll.CIAM_B2B_STREAM = 129;
        mockEnvAll.CIAM_API_URL = 'http://localhost:3000';
    });

    it('should render component with ProvideEmail phase', () => {
        render(<ResetPasswordForm {...mockProps} />);

        expect(screen.getByTestId('forget-password-title')).toHaveTextContent(
            SitecoreDictionary.LoginDescriptionsIsThisCorrectEmail,
        );

        expect(screen.getByTestId('validatable-field')).toBeInTheDocument();
        expect(mockValidatableFieldProps).toHaveBeenCalledWith({
            onChange: expect.any(Function),
            id: 'reset-email',
            label: SitecoreDictionary.LoginLabelsEmailAddress,
            value: mockProps.customerLogin.email,
            errors: mockProps.customerLogin.emailErrors,
            vertical: true,
            autoComplete: 'email',
            type: 'email',
        });

        expect(screen.getByTestId('forget-password-description')).toHaveTextContent(
            SitecoreDictionary.LoginDescriptionsIfNoEnterCorrectEmail,
        );
    });

    it('should call onChangeEmail while click on validatable-field', async () => {
        render(<ResetPasswordForm {...mockProps} />);

        const validateField = screen.getByTestId('validatable-field');
        await userEvent.click(validateField);

        expect(mockProps.customerLogin.onChangeEmail).toHaveBeenCalledWith('email-value');
        expect(mockProps.customerLogin.cleanUpErrors).toHaveBeenCalled();
    });

    it('should render ErrorMessage component when customerLogin has errors', () => {
        mockProps.customerLogin.errors = [
            {
                title: 'Error Title',
                description: 'Error Description',
            },
        ];
        render(<ResetPasswordForm {...mockProps} />);

        expect(screen.getByTestId('error-message')).toBeInTheDocument();
        expect(mockErrorMessageProps).toHaveBeenCalledWith({
            message: mockProps.customerLogin.firstError.title,
            description: mockProps.customerLogin.firstError.description,
            errorMessageClass: 'error-container error',
            icon: expect.anything(),
        });
    });

    describe('CIAM Forget Password component', () => {
        beforeEach(() => {
            mockProps.isCIAMEnabled = true;
        });

        it('should NOT render CIAM forget password component when isCIAMEnabled is false', () => {
            mockProps.isCIAMEnabled = false;
            render(<ResetPasswordForm {...mockProps} />);

            expect(screen.queryByTestId('ciam-forgotten-password')).not.toBeInTheDocument();
        });

        it('should render CIAM forget password component with holiday-out-funnel variant when it is NOT guest details page', () => {
            mockStores.layoutStore.isGuestDetailsPage = false;
            render(<ResetPasswordForm {...mockProps} />);

            const ciamForgottenPassword = screen.getByTestId('ciam-forgotten-password');

            expect(ciamForgottenPassword).toBeInTheDocument();
            expect(ciamForgottenPassword).toHaveAttribute('variant', 'holiday-out-funnel');
            expect(ciamForgottenPassword).toHaveAttribute('email', 'test@test.com');
            expect(screen.queryByTestId('validatable-field')).not.toBeInTheDocument();
            expect(screen.queryByTestId('cancel-button')).not.toBeInTheDocument();
            expect(screen.queryByTestId('confirm-button')).not.toBeInTheDocument();
            expect(ciamForgottenPassword).toHaveAttribute('env', '129');
        });

        it('should render CIAM forget password component with holiday-in-funnel variant when it is guest details page', () => {
            mockStores.layoutStore.isGuestDetailsPage = true;
            render(<ResetPasswordForm {...mockProps} />);

            const ciamForgottenPassword = screen.getByTestId('ciam-forgotten-password');

            expect(ciamForgottenPassword).toBeInTheDocument();
            expect(ciamForgottenPassword).toHaveAttribute('variant', 'holiday-in-funnel');
            expect(ciamForgottenPassword).toHaveAttribute('email', 'test@test.com');
            expect(ciamForgottenPassword).toHaveAttribute('env', '129');
        });

        it('should NOT pass env prop swhen CIAM_B2B_STREAM is null', () => {
            mockEnvAll.CIAM_B2B_STREAM = null;
            render(<ResetPasswordForm {...mockProps} />);

            const ciamForgottenPassword = screen.getByTestId('ciam-forgotten-password');

            expect(ciamForgottenPassword).not.toHaveAttribute('env');
        });
    });
});
