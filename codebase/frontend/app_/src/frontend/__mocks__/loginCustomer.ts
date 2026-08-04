import { LoginCustomer } from 'models/data/LoginCustomer';

export const mockLoginCustomer: LoginCustomer = {
    email: 'test@test.com',
    password: 'login-password',
    cleanUpModel: jest.fn(),
    onChangeEmail: jest.fn(),
    toggleEmailValidated: jest.fn(),
    toggleEmailExists: jest.fn(),
    emailErrors: [],
    cleanUpErrors: jest.fn(),
    errors: [],
    passwordErrors: [],
    rerender: jest.fn(),
    onChangePassword: jest.fn(),
    isEmailValidated: true,
    isEmailExists: true,
    isNewCustomer: false,
    alreadyLoggedEmail: '',
    passwordProhibitedWords: [],
    rerenderKey: 1,
    isEmailDisabled: false,
    forceErrors: false,
    onChangeLoggedEmail: jest.fn(),
    toggleEmailDisabled: jest.fn(),
    passwordValidationRules: [],
    setIsNewCustomer: jest.fn(),
    setPasswordProhibitedWords: jest.fn(),
    setForceErrors: jest.fn(),

    get firstError() {
        return this.errors[0];
    },
};
