import { UserService } from 'frontend/services/user.service';
import { CustomerDetails } from 'models/data/CustomerDetails';
import { LoginCustomer } from 'models/data/LoginCustomer';

import { CreateAccountStore } from './CreateAccountStore';

const mockCustomerDetails = {
    formData: 'customerData',
    email: 'customer@email.com',
    password: 'password',
    isFieldValid: jest.fn(),
    onChangeField: jest.fn(),
    validateField: jest.fn(),
    resetFields: jest.fn(),
    setPasswordValidationRules: jest.fn(),
};
const mockLoginCustomer = {
    email: 'login@email.com',
    password: 'login-password',
    cleanUpModel: jest.fn(),
    onChangeEmail: jest.fn(),
    toggleEmailValidated: jest.fn(),
    toggleEmailExists: jest.fn(),
};

jest.mock('models/data/CustomerDetails', () => ({
    CustomerDetails: jest.fn().mockImplementation(() => mockCustomerDetails),
}));
jest.mock('models/data/LoginCustomer', () => ({
    LoginCustomer: jest.fn().mockImplementation(() => mockLoginCustomer),
}));

describe('CreateAccountStore', () => {
    const createRoorStore = () =>
        ({
            layoutStore: {
                getSetting: jest.fn(),
                passwordProhibitedWords: ['password'],
            },
            routerStore: {
                redirectToHomePage: jest.fn(),
                redirectToViewBookingsPage: jest.fn(),
            },
            userStore: {
                checkIfUserLoggedIn: jest.fn().mockResolvedValue(false),
                customerErrorHandler: jest.fn().mockReturnValue(['error-1', 'error-2']),
            },
            appCatalogStore: {
                countries: { fetchData: jest.fn() },
                dialingCodes: { fetchData: jest.fn() },
            },
        } as any);
    let rootStore = {} as any;

    beforeEach(() => {
        rootStore = createRoorStore();
        (CustomerDetails as any).mockClear();
        (LoginCustomer as any).mockClear();
    });

    describe('initialize()', () => {
        it('should redirect to HomePage if user is logged in', async () => {
            rootStore.userStore.checkIfUserLoggedIn.mockResolvedValueOnce(true);
            const store = new CreateAccountStore(rootStore);
            await store.initialize();

            expect(rootStore.routerStore.redirectToHomePage).toBeCalled();
        });

        it('should init data if user is NOT logged in', async () => {
            rootStore.layoutStore.getSetting = jest.fn(() => 'testCode');
            const store = new CreateAccountStore(rootStore);

            await store.initialize();

            expect(rootStore.routerStore.redirectToHomePage).not.toBeCalled();
            expect(rootStore.appCatalogStore.countries.fetchData).toBeCalled();
            expect(rootStore.appCatalogStore.dialingCodes.fetchData).toBeCalled();
            expect(mockCustomerDetails.onChangeField).toBeCalledWith('countryCode', 'testCode');
            expect(mockCustomerDetails.onChangeField).toBeCalledWith('dialingCode', 'testCode');
            expect(mockCustomerDetails.setPasswordValidationRules).toBeCalledWith(
                rootStore.layoutStore.passwordProhibitedWords,
            );
        });
    });

    describe('isCreateAccountForbidden', () => {
        it("should be forbidden to create account if it's already exists", () => {
            (LoginCustomer as any).mockImplementationOnce(() => ({
                isEmailExists: true,
            }));
            const store = new CreateAccountStore(rootStore);

            expect(store.isCreateAccountForbidden).toBeTruthy();
        });

        it('should be forbidden to create account if acount has not validated', () => {
            (LoginCustomer as any).mockImplementationOnce(() => ({
                isEmailValidated: false,
            }));
            const store = new CreateAccountStore(rootStore);

            expect(store.isCreateAccountForbidden).toBeTruthy();
        });

        it("should be possible to create account if acount has been validated and doesn't exist", () => {
            (LoginCustomer as any).mockImplementationOnce(() => ({
                isEmailValidated: true,
                isEmailExists: false,
            }));
            const store = new CreateAccountStore(rootStore);

            expect(store.isCreateAccountForbidden).toBeFalsy();
        });
    });

    describe('isFormValid', () => {
        it('should be valid if customer detials valid', () => {
            (CustomerDetails as any).mockImplementationOnce(() => ({
                isValid: true,
            }));
            const store = new CreateAccountStore(rootStore);

            expect(store.isFormValid).toBeTruthy();
        });

        it('should be NOT valid if customer detials NOT valid', () => {
            (CustomerDetails as any).mockImplementationOnce(() => ({
                isValid: false,
            }));
            const store = new CreateAccountStore(rootStore);

            expect(store.isFormValid).toBeFalsy();
        });
    });

    describe('changeEmail()', () => {
        it('should change and validate email', () => {
            const store = new CreateAccountStore(rootStore);
            const validateEmailDebounceSpy = jest.spyOn(store, 'validateEmailDebounce');

            store.changeEmail('test@email.com');

            expect(mockLoginCustomer.cleanUpModel).toBeCalled();
            expect(mockCustomerDetails.onChangeField).toBeCalledWith('email', 'test@email.com');
            expect(validateEmailDebounceSpy).toBeCalled();
        });
    });

    describe('validateEmail()', () => {
        beforeEach(() => {
            mockCustomerDetails.isFieldValid.mockReturnValue(true);
            UserService.verifyEmail = jest.fn().mockResolvedValue(true);
        });

        it('should not verify email if field is invalid', async () => {
            mockCustomerDetails.isFieldValid.mockReturnValueOnce(false);
            const store = new CreateAccountStore(rootStore);

            await store.validateEmail();

            expect(UserService.verifyEmail).not.toBeCalled();
        });

        it('should verify that email exists', async () => {
            const store = new CreateAccountStore(rootStore);

            await store.validateEmail();

            expect(UserService.verifyEmail).toBeCalled();
            expect(mockLoginCustomer.onChangeEmail).toBeCalledWith(mockCustomerDetails.email);
            expect(mockLoginCustomer.toggleEmailValidated).toBeCalledWith(true);
            expect(mockLoginCustomer.toggleEmailExists).toBeCalledWith(true);
        });

        it('should failed verify email', async () => {
            UserService.verifyEmail = jest.fn().mockRejectedValue(null);
            const store = new CreateAccountStore(rootStore);

            await store.validateEmail();

            expect(UserService.verifyEmail).toBeCalled();
            expect(mockLoginCustomer.toggleEmailValidated).toBeCalledWith(false);
            expect(mockLoginCustomer.toggleEmailExists).toBeCalledWith(false);
        });
    });

    describe('createAccount()', () => {
        it('should be successful user registration and redirect to Home Page', async () => {
            rootStore.userStore.register = jest.fn().mockResolvedValue({});
            const store = new CreateAccountStore(rootStore);
            const toggleSuccessPopupSpy = jest.spyOn(store, 'toggleSuccessPopup');

            await store.createAccount();

            expect(rootStore.userStore.register).toBeCalledWith(
                mockCustomerDetails.formData,
                mockCustomerDetails.password,
            );
            expect(mockLoginCustomer.onChangeEmail).toBeCalledWith(mockCustomerDetails.email);
            expect(rootStore.routerStore.redirectToHomePage).toBeCalled();
            expect(toggleSuccessPopupSpy).toBeCalled();
            expect(store.createAccountErrors).toEqual([]);
        });

        it('should be failed user registration', async () => {
            rootStore.userStore.register = jest.fn().mockRejectedValueOnce('error');
            rootStore.userStore.customerErrorHandler = jest.fn().mockReturnValue(['error-1', 'error-2']);
            const store = new CreateAccountStore(rootStore);
            const toggleSuccessPopupSpy = jest.spyOn(store, 'toggleSuccessPopup');

            await store.createAccount();

            expect(rootStore.userStore.register).toBeCalledWith(
                mockCustomerDetails.formData,
                mockCustomerDetails.password,
            );
            expect(toggleSuccessPopupSpy).not.toBeCalled();
            expect(store.createAccountErrors).toEqual(['error-1', 'error-2']);
        });
    });

    describe('signIn()', () => {
        it('should be successful sign in and redirect to View Bookings Page', async () => {
            rootStore.userStore.signIn = jest.fn().mockResolvedValue({});
            const store = new CreateAccountStore(rootStore);

            await store.signIn();

            expect(rootStore.userStore.signIn).toBeCalledWith(mockLoginCustomer.email, mockLoginCustomer.password);
            expect(rootStore.routerStore.redirectToViewBookingsPage).toBeCalled();
        });

        it('should be failed sign in', async () => {
            rootStore.userStore.signIn = jest.fn().mockRejectedValueOnce('error');
            const store = new CreateAccountStore(rootStore);

            await store.signIn();

            expect(rootStore.userStore.signIn).toBeCalledWith(mockLoginCustomer.email, mockLoginCustomer.password);
            expect(rootStore.routerStore.redirectToViewBookingsPage).not.toBeCalled();
            expect(store.customerLogin.errors).toEqual(['error-1', 'error-2']);
        });
    });

    describe('toggleForceErrors()', () => {
        it('should set true forceErrors', () => {
            const store = new CreateAccountStore(rootStore);

            store.toggleForceErrors(true);

            expect(store.forceErrors).toBeTruthy();
        });

        it('should set false forceErrors', () => {
            const store = new CreateAccountStore(rootStore);

            store.toggleForceErrors(false);

            expect(store.forceErrors).toBeFalsy();
        });
    });

    describe('toggleSignInState()', () => {
        it('should enable signIn state and reset customer details', () => {
            const store = new CreateAccountStore(rootStore);
            const resetMock = jest.spyOn(store, 'resetCustomerDetails');

            store.toggleSignInState(true);

            expect(store.isSignInState).toBeTruthy();
            expect(resetMock).toBeCalled();
        });

        it('should disable signIn state and set customer email', () => {
            const store = new CreateAccountStore(rootStore);

            store.toggleSignInState(false);

            expect(store.isSignInState).toBeFalsy();
            expect(mockCustomerDetails.onChangeField).toBeCalledWith('email', mockLoginCustomer.email);
        });
    });
});
