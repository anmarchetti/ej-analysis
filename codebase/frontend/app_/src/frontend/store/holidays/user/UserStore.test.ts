import { waitFor } from '@testing-library/dom';

import { logger } from 'frontend/services/logging';
import promocodeService from 'frontend/services/promocode.service';
import { UserService } from 'frontend/services/user.service';
import { isIE } from 'frontend/utils/browser.utils';
import { ILoginInfo } from 'models/data/ILoginInfo';
import { EventTypes } from 'models/enum/tracking/EventTypes';

import { UserStore } from './UserStore';
import MockedFn = jest.MockedFn;

import { userLoginMockInfo } from 'frontend/__mocks__';
import { ApiError } from 'models/data/ApiError';
import { ApiErrorMessage } from 'models/data/ApiErrorData';
import { ApiErrors } from 'models/enum/ApiErrors';
import { WebStorageKeys } from 'models/enum/WebStorageKeys';

jest.mock('frontend/services/logging');
jest.mock('frontend/utils/browser.utils');

Object.defineProperty(global, 'location', {
    value: {
        reload: jest.fn(),
    },
});

describe('<UserStore />', () => {
    const userData = {
        email: 'test',
        firstName: 'test',
        lastName: 'test',
        title: 'test',
        mobilePhone: 'test',
        birthDate: 'test',
        dialingCode: 'test',
        countryCode: 'test',
        address1: 'test',
        address2: 'test',
        city: 'test',
        postalCode: 'test',
        mailingsFlag: false,
        easyJetMailingsFlag: false,
    };
    const rootStore = {
        viewBookingStore: {
            clearGuestBookingInfo: jest.fn(),
        },
        trackingStore: {
            trackAccountEvent: jest.fn(),
        },
        guestDetailsStore: {
            removeGuestDetailsFromSessionStorage: jest.fn(),
        },
        routerStore: {
            isViewBookingPage: jest.fn(),
            isBookingConfirmationPage: jest.fn(),
            isViewBookingsPage: jest.fn(),
            isInDestinationPage: jest.fn(),
            isPostTravelPage: jest.fn(),
            isPreTravelPage: jest.fn(),
            redirectToHomePage: jest.fn(),
            redirectTo: jest.fn(),
            redirectToLoginPage: jest.fn(),
        },
        holidayCreditStore: {
            fetchMyCreditBalance: jest.fn(),
        },
        shortlistStore: {
            getShortlistStatus: jest.fn(),
            setShortlistedCount: jest.fn(),
        },
        reCaptchaStore: {
            executeReCaptcha: jest.fn().mockReturnValue('captcha'),
        },
        layoutStore: {
            isCancelledBookingPage: false,
            isExtrasPage: false,
            isGuestDetailsPage: true,
            isAmendBookingPage: false,
        },
        engageStore: { sendIdentityEvent: jest.fn(), sendCustomEvent: jest.fn() },
    } as any;

    const resetMocks = () => ({
        userData: { ...userLoginMockInfo },
        userDetailsReq: {
            ...userLoginMockInfo,
            email: 'email-userDetailsReq',
            firstName: 'firstName-userDetailsReq',
            lastName: 'lastName-userDetailsReq',
        },
    });

    let mocks = resetMocks();
    let mockUserStore: UserStore;

    beforeEach(() => {
        mocks = resetMocks();
        mockUserStore = new UserStore(rootStore);
    });

    describe('logoutIfNotSignedIn', () => {
        it('Should onLogout be called and redirect to login page when user is NOT logged in', async () => {
            UserService.getStatus = jest.fn().mockResolvedValue(false);
            mockUserStore.onLogout = jest.fn();

            await mockUserStore.logoutIfNotSignedIn();

            expect(mockUserStore.onLogout).toHaveBeenCalled();
            expect(mockUserStore.rootStore.routerStore.redirectToLoginPage).toHaveBeenCalledWith(true, undefined);
        });

        it('Should redirectToLoginPage in case of an error', async () => {
            UserService.getStatus = jest.fn().mockRejectedValue(new Error());
            mockUserStore.onLogout = jest.fn();

            await mockUserStore.logoutIfNotSignedIn();

            expect(mockUserStore.rootStore.routerStore.redirectToLoginPage).toHaveBeenCalledWith(true);
        });

        it('Should do nothing in case when user is logged in', async () => {
            UserService.getStatus = jest.fn().mockResolvedValue(true);
            mockUserStore.onLogout = jest.fn();

            await mockUserStore.logoutIfNotSignedIn();

            expect(mockUserStore.onLogout).not.toHaveBeenCalled();
            expect(mockUserStore.rootStore.routerStore.redirectToLoginPage).not.toHaveBeenCalled();
        });
    });

    describe('setUserLoggedIn', () => {
        it('should correctly set logging state', async () => {
            const mockResponse = {};

            const spy = jest.spyOn(mockUserStore, 'setIsLoggedIn');
            UserService.getStatus = jest.fn().mockResolvedValue(mockResponse);

            await mockUserStore.setUserLoggedIn();

            expect(spy).toHaveBeenCalledWith(mockResponse);
        });

        it('should NOT update user state when isLoggedIn is true', async () => {
            mockUserStore.isLoggedIn = true;

            UserService.getStatus = jest.fn();

            await mockUserStore.setUserLoggedIn();

            expect(UserService.getStatus).not.toHaveBeenCalled();
        });

        it('should NOT update user state in edit mode', async () => {
            mockUserStore = new UserStore({
                ...rootStore,
                layoutStore: { ...rootStore.layoutStore, isEditMode: true },
            });

            UserService.getStatus = jest.fn();

            await mockUserStore.setUserLoggedIn();

            expect(UserService.getStatus).not.toHaveBeenCalled();
        });

        it('should set getStatus response to logging state', async () => {
            const mockResponse = {};

            const spy = jest.spyOn(mockUserStore, 'setIsLoggedIn');
            UserService.getStatus = jest.fn().mockResolvedValue(mockResponse);

            await mockUserStore.setUserLoggedIn();

            expect(UserService.getStatus).toHaveBeenCalled();
            expect(spy).toHaveBeenCalledWith(mockResponse);
        });
    });

    describe('setIsRedirectPreventedAfterLogin', () => {
        it('Should assign passed value', () => {
            expect(mockUserStore.isRedirectPreventedAfterLogin).toBe(false);

            mockUserStore.setIsRedirectPreventedAfterLogin(true);

            expect(mockUserStore.isRedirectPreventedAfterLogin).toBe(true);
        });
    });

    describe('initializeCustomerLogin', () => {
        it('Should call onChangeLoggedEmail this email', () => {
            mockUserStore.userData = {
                email: 'email@gmail.com',
            } as UserStore['userData'];
            mockUserStore.customerLogin.onChangeLoggedEmail = jest.fn();

            mockUserStore.initializeCustomerLogin();

            expect(mockUserStore.customerLogin.onChangeLoggedEmail).toHaveBeenCalledWith('email@gmail.com');
        });
    });

    describe('rerenderForm', () => {
        it('should update formRerenderTrigger value', () => {
            const userStore = new UserStore(rootStore);

            userStore.rerenderForm();
            const formRerenderTrigger1 = userStore.formRerenderTrigger;

            userStore.rerenderForm();
            const formRerenderTrigger2 = userStore.formRerenderTrigger;

            expect(formRerenderTrigger1).not.toEqual(formRerenderTrigger2);
        });
    });

    describe('setRememberMe', () => {
        it('should set rememberMe from argument', () => {
            const userStore = new UserStore(rootStore);

            expect(userStore.rememberMe).toBeFalsy();

            userStore.setRememberMe(true);

            expect(userStore.rememberMe).toBeTruthy();
        });
    });

    describe('setUserData', () => {
        it('should set userData from argument', () => {
            const userStore = new UserStore(rootStore);

            expect(userStore.userData).not.toBeDefined();

            userStore.setUserData(userData);

            expect(userStore.userData).toEqual(userData);
        });
    });

    describe('Clear store', () => {
        it('It should clear store values', () => {
            const userStore = new UserStore(rootStore);
            userStore.setRememberMe(true);
            userStore.setUserData({} as any);
            userStore.setIsLoggedIn(true);

            jest.spyOn(userStore.customerLogin, 'cleanUpModel');
            jest.spyOn(userStore.rootStore.viewBookingStore, 'clearGuestBookingInfo');

            userStore.clearUserStore();

            expect(userStore.customerLogin.cleanUpModel).toHaveBeenCalled();
            expect(userStore.rootStore.viewBookingStore.clearGuestBookingInfo).toHaveBeenCalled();
            expect(userStore.rememberMe).toBeFalsy();
            expect(userStore.userData).toBeNull();
            expect(userStore.isLoggedIn).toBeFalsy();
        });
    });

    describe('onLogin', () => {
        it('Should global.location.reload to be called if IE is', async () => {
            const userStore = new UserStore({
                routerStore: { redirectTo: jest.fn() },
                ...rootStore,
            });
            (isIE as MockedFn<any>).mockImplementation(() => true);
            userStore.onLogout = jest.fn().mockReturnValue(Promise.resolve());
            userStore.signIn = jest.fn().mockReturnValue(Promise.resolve());
            userStore.isRedirectPreventedAfterLogin = false;

            await userStore.onLogin();

            await waitFor(() => {
                expect(global.location.reload).toHaveBeenCalled();
            });
        });

        it('should logout current user and log in new user', async () => {
            const userStore = new UserStore({
                routerStore: { redirectTo: jest.fn() },
                ...rootStore,
            });
            userStore.setIsLoggedIn(true);

            userStore.onLogout = jest.fn().mockReturnValue(Promise.resolve());
            userStore.signIn = jest.fn().mockReturnValue(Promise.resolve());
            jest.spyOn(userStore.rootStore.viewBookingStore, 'clearGuestBookingInfo');
            jest.spyOn(userStore.rootStore.routerStore, 'redirectTo');

            await userStore.onLogin();

            expect(userStore.onLogout).toHaveBeenCalled();
            expect(userStore.signIn).toHaveBeenCalled();
            expect(userStore.rootStore.viewBookingStore.clearGuestBookingInfo).toHaveBeenCalled();
            expect(userStore.rootStore.routerStore.redirectTo).toHaveBeenCalled();
        });

        it('should log in new user without logout current when logoutIfLoggedIn false', async () => {
            const userStore = new UserStore({
                routerStore: { redirectTo: jest.fn() },
                ...rootStore,
            });
            const logoutIfLoggedIn = false;

            userStore.setIsLoggedIn(true);

            userStore.onLogout = jest.fn().mockReturnValue(Promise.resolve());
            userStore.signIn = jest.fn().mockReturnValue(Promise.resolve());

            await userStore.onLogin(logoutIfLoggedIn);

            expect(userStore.onLogout).not.toHaveBeenCalled();
            expect(userStore.signIn).toHaveBeenCalled();
        });

        it('should log in user', async () => {
            const userStore = new UserStore({
                routerStore: { redirectTo: jest.fn() },
                ...rootStore,
            });

            userStore.onLogout = jest.fn().mockReturnValue(Promise.resolve());
            userStore.signIn = jest.fn().mockReturnValue(Promise.resolve());
            jest.spyOn(userStore.rootStore.viewBookingStore, 'clearGuestBookingInfo');
            jest.spyOn(userStore.rootStore.routerStore, 'redirectTo');

            await userStore.onLogin();

            expect(userStore.onLogout).not.toHaveBeenCalled();
            expect(userStore.signIn).toHaveBeenCalled();
            expect(userStore.rootStore.viewBookingStore.clearGuestBookingInfo).toHaveBeenCalled();
            expect(userStore.rootStore.routerStore.redirectTo).toHaveBeenCalled();
        });

        it('should set customer login error if some errors appear', async () => {
            const userStore = new UserStore({
                routerStore: { redirectTo: jest.fn() },
                ...rootStore,
            });

            userStore.onLogout = jest.fn().mockReturnValue(Promise.resolve());
            userStore.signIn = jest.fn().mockReturnValue(Promise.reject(e => e));
            jest.spyOn(userStore.rootStore.viewBookingStore, 'clearGuestBookingInfo');
            jest.spyOn(userStore.rootStore.routerStore, 'redirectTo');

            await userStore.onLogin();

            expect(userStore.onLogout).not.toHaveBeenCalled();
            expect(userStore.signIn).toHaveBeenCalled();
            expect(userStore.customerLogin.errors.length).toEqual(1);
            expect(userStore.customerLogin.errors[0].title).toEqual('Login.ErrorMessages.InvalidCredentials');
            expect(userStore.customerLogin.errors[0].description).toEqual(
                'Login.ErrorMessages.InvalidCredentialsDescription',
            );
        });

        it('should not redirect user when isRedirectPreventedAfterLogin true', async () => {
            const userStore = new UserStore({
                routerStore: { redirectTo: jest.fn() },
                ...rootStore,
            });

            userStore.isRedirectPreventedAfterLogin = true;
            userStore.onLogout = jest.fn().mockReturnValue(Promise.resolve());
            userStore.signIn = jest.fn().mockReturnValue(Promise.resolve());
            jest.spyOn(userStore.rootStore.viewBookingStore, 'clearGuestBookingInfo');
            jest.spyOn(userStore.rootStore.routerStore, 'redirectTo');

            await userStore.onLogin();

            expect(userStore.rootStore.viewBookingStore.clearGuestBookingInfo).not.toHaveBeenCalled();
            expect(userStore.rootStore.routerStore.redirectTo).not.toHaveBeenCalled();
        });
    });

    describe('signIn', () => {
        it('should sign in user', async () => {
            const userStore = new UserStore(rootStore);
            UserService.logIn = jest.fn().mockReturnValue(Promise.resolve(userData));

            await userStore.signIn('test', 'test', true);

            expect(UserService.logIn).toHaveBeenCalledWith('test', 'test', true, 'captcha');
            expect(userStore.isLoggedIn).toBeTruthy();
            expect(userStore.userData).toEqual(userData);
            expect(userStore.rootStore.trackingStore.trackAccountEvent).toHaveBeenCalledWith(
                EventTypes.SuccessfulLogin,
            );
            expect(userStore.rootStore.engageStore.sendCustomEvent).toHaveBeenCalledWith(EventTypes.LogIn);
        });

        it('should NOT sign in user when errors appear', async () => {
            const error = {
                response: {
                    data: {
                        code: 'API-ERR-000002',
                        message: 'some message',
                    },
                },
            };
            const userStore = new UserStore(rootStore);
            UserService.logIn = jest.fn().mockReturnValue(Promise.reject(error));

            try {
                await userStore.signIn('test', 'test', true);
            } catch (e) {
                expect(logger.error).toHaveBeenCalledWith({
                    e: error,
                    message: 'Failed to sign in',
                });
            }
        });
    });

    describe('register', () => {
        it('should register user', async () => {
            const userStore = new UserStore(rootStore);
            UserService.register = jest.fn().mockReturnValue(Promise.resolve(userData));

            await userStore.register({} as any, 'test', true);

            expect(UserService.register).toHaveBeenCalledWith({} as any, 'test', true);
            expect(userStore.isLoggedIn).toBeTruthy();
            expect(userStore.userData).toEqual(userData);
            expect(userStore.rootStore.trackingStore.trackAccountEvent).toHaveBeenCalledWith(
                EventTypes.SuccessfulRegistration,
            );
            expect(userStore.rootStore.engageStore.sendCustomEvent).toHaveBeenCalledWith(EventTypes.AccountCreated);
        });

        it('should register user without remembering', async () => {
            const userStore = new UserStore(rootStore);
            UserService.register = jest.fn().mockReturnValue(Promise.resolve(userData));

            await userStore.register({} as any, 'test');

            expect(UserService.register).toHaveBeenCalledWith({} as any, 'test', false);
        });

        it('should NOT register user when errors appear', async () => {
            const error = {
                response: {
                    data: {
                        code: 'API-ERR-000002',
                        message: 'some message',
                    },
                },
            };
            const userStore = new UserStore(rootStore);
            UserService.register = jest.fn().mockReturnValue(Promise.reject(error));

            try {
                await userStore.register({} as any, 'test', false);
            } catch (e) {
                expect(logger.error).toHaveBeenCalledWith({
                    e: error,
                    message: ApiErrorMessage.RegistrationFail,
                });
            }
        });

        describe('verifyEmail', () => {
            it('Should throw an error', async () => {
                UserService.verifyEmail = jest.fn().mockRejectedValue(Promise.resolve());

                try {
                    await mockUserStore.verifyEmail('test');
                } catch (e) {
                    expect(e instanceof ApiError).toBe(true);
                }
            });

            it('should do nothing if email has already verified', () => {
                const userStore = new UserStore(rootStore);
                userStore.isVerifyingEmail = true;
                UserService.verifyEmail = jest.fn().mockReturnValue(Promise.resolve());

                userStore.verifyEmail('test');

                expect(UserService.verifyEmail).not.toHaveBeenCalled();
            });

            it('should verify email', async () => {
                const userStore = new UserStore(rootStore);
                UserService.verifyEmail = jest.fn().mockReturnValue(Promise.resolve());

                const promise = userStore.verifyEmail('test');
                expect(userStore.isVerifyingEmail).toBeTruthy();

                await promise;

                expect(UserService.verifyEmail).toHaveBeenCalledWith('test');
                expect(userStore.isVerifyingEmail).toBeFalsy();
            });
        });
    });

    describe('resetPassword', () => {
        it('should reset password', async () => {
            const userStore = new UserStore(rootStore);
            UserService.resetPassword = jest.fn().mockReturnValue(Promise.resolve());

            await userStore.resetPassword(mocks.userData.email);

            expect(UserService.resetPassword).toHaveBeenCalledWith(mocks.userData.email);
        });

        it('should throw error on api error', async () => {
            const error = {
                message: 'test message',
                response: {
                    data: {
                        code: 'API-ERR-000002',
                        message: 'some message',
                    },
                },
            };
            const userStore = new UserStore(rootStore);
            UserService.resetPassword = jest.fn().mockReturnValue(Promise.reject(error));

            try {
                await userStore.resetPassword(mocks.userData.email);
            } catch (e) {
                expect(e.message).toBe(error.message);
            }
        });

        it('should handle errors inside HTTP 200', async () => {
            const error = {
                message: 'test message',
                response: {
                    data: {
                        code: ApiErrors.ResetPasswordError,
                        message: 'some message',
                    },
                },
            };
            const userStore = new UserStore(rootStore);
            UserService.resetPassword = jest.fn().mockReturnValue(Promise.resolve(error));

            try {
                await userStore.resetPassword(mocks.userData.email);
            } catch (e) {
                expect(e.message).toBe(error.message);
            }
        });

        it('should NOT call api because of existing request', async () => {
            const userStore = new UserStore(rootStore);
            userStore.isResettingPassword = true;
            UserService.resetPassword = jest.fn().mockReturnValue(Promise.resolve());

            await Promise.race([userStore.resetPassword(mocks.userData.email), Promise.resolve()]);

            expect(UserService.resetPassword).not.toHaveBeenCalled();
        });
    });

    describe('onLogout', () => {
        it('should correctly logout', async () => {
            const removeItemSpy = jest.spyOn(sessionStorage, 'removeItem');

            const userStore = new UserStore(rootStore);

            UserService.logOut = jest.fn().mockReturnValue(Promise.resolve());
            const spy = jest.spyOn(userStore, 'clearUserStore');

            await userStore.onLogout();

            expect(UserService.logOut).toHaveBeenCalled();
            expect(spy).toHaveBeenCalled();
            expect(rootStore.guestDetailsStore.removeGuestDetailsFromSessionStorage).toHaveBeenCalled();
            expect(removeItemSpy).toHaveBeenCalledWith('IsVoucherRedeemedBookingFlow');
            expect(removeItemSpy).toHaveBeenCalledWith('LatestConfirmedBooking');
        });

        it('should unset alreadyLoggedEmail when user log out', async () => {
            const userStore = new UserStore({
                routerStore: { redirectTo: jest.fn() },
                ...rootStore,
            });

            const spy = jest.spyOn(userStore.customerLogin, 'onChangeLoggedEmail');

            await userStore.onLogout();

            expect(spy).toHaveBeenCalled();
            expect(userStore.customerLogin.alreadyLoggedEmail).toBe('');
        });

        it('should redirect to home page because of API error', async () => {
            const userStore = new UserStore(rootStore);

            UserService.logOut = jest.fn().mockReturnValue(Promise.reject());

            try {
                await userStore.onLogout();
            } catch (e) {}

            expect(rootStore.routerStore.isViewBookingPage).toHaveBeenCalled();
            expect(rootStore.routerStore.isBookingConfirmationPage).toHaveBeenCalled();
            expect(rootStore.routerStore.isViewBookingsPage).toHaveBeenCalled();
        });

        it('should redirect to home page when it is NOT Soft Logout and it is Booking Confirmation page ', async () => {
            UserService.logOut = jest.fn().mockReturnValue(Promise.resolve());
            mockUserStore.rootStore.routerStore.isBookingConfirmationPage = jest.fn(() => true);

            await mockUserStore.onLogout();

            expect(mockUserStore.rootStore.routerStore.redirectToHomePage).toHaveBeenCalled();
        });

        it('should redirect to home page when it is NOT Soft Logout and it is View Bookings page ', async () => {
            UserService.logOut = jest.fn().mockReturnValue(Promise.resolve());
            mockUserStore.rootStore.routerStore.isViewBookingsPage = jest.fn(() => true);

            await mockUserStore.onLogout();

            expect(mockUserStore.rootStore.routerStore.redirectToHomePage).toHaveBeenCalled();
        });

        it('should redirect to home page when it is NOT Soft Logout and it is View Booking page ', async () => {
            UserService.logOut = jest.fn().mockReturnValue(Promise.resolve());
            mockUserStore.rootStore.routerStore.isViewBookingPage = jest.fn(() => true);

            await mockUserStore.onLogout();

            expect(mockUserStore.rootStore.routerStore.redirectToHomePage).toHaveBeenCalled();
        });

        it('should redirect to home page when it is NOT Soft Logout and it is In Destination page ', async () => {
            UserService.logOut = jest.fn().mockReturnValue(Promise.resolve());
            mockUserStore.rootStore.routerStore.isInDestinationPage = jest.fn(() => true);

            await mockUserStore.onLogout();

            expect(mockUserStore.rootStore.routerStore.redirectToHomePage).toHaveBeenCalled();
        });

        it('should redirect to home page when it is NOT Soft Logout and it is Post Travel page ', async () => {
            UserService.logOut = jest.fn().mockReturnValue(Promise.resolve());
            mockUserStore.rootStore.routerStore.isPostTravelPage = jest.fn(() => true);

            await mockUserStore.onLogout();

            expect(mockUserStore.rootStore.routerStore.redirectToHomePage).toHaveBeenCalled();
        });

        it('should redirect to home page when it is NOT Soft Logout and it is Pre Travel page ', async () => {
            UserService.logOut = jest.fn().mockReturnValue(Promise.resolve());
            mockUserStore.rootStore.routerStore.isPreTravelPage = jest.fn(() => true);

            await mockUserStore.onLogout();

            expect(mockUserStore.rootStore.routerStore.redirectToHomePage).toHaveBeenCalled();
        });

        it('should redirect to home page when it is NOT Soft Logout and it is Cancelled Booking page', async () => {
            UserService.logOut = jest.fn().mockReturnValue(Promise.resolve());
            rootStore.layoutStore.isCancelledBookingPage = true;

            await mockUserStore.onLogout();

            expect(mockUserStore.rootStore.routerStore.redirectToHomePage).toHaveBeenCalled();
        });

        it('should NOT call location.reload when isSoftLogout param is truthy', async () => {
            UserService.logOut = jest.fn().mockReturnValue(Promise.resolve());

            await mockUserStore.onLogout(true);

            expect(location.reload).not.toHaveBeenCalled();
        });
    });

    describe('customerErrorHandler', () => {
        it('Should return data with ApiErrors.AcountLockedBySitecoreSettings', () => {
            const result = mockUserStore.customerErrorHandler({
                errorCode: ApiErrors.AcountLockedBySitecoreSettings,
            } as ApiError);

            expect(result).toStrictEqual([
                {
                    title: 'GuestDetails.ErrorMessages.AccountLockedBySettings',
                    description: 'GuestDetails.ErrorMessages.AccountLockedBySettingsDescription',
                },
            ]);
        });

        it('Should return generic error in case when user is signed in', () => {
            const result = mockUserStore.customerErrorHandler(
                {
                    errorCode: 'Test',
                } as ApiError,
                true,
            );

            expect(result).toStrictEqual([
                {
                    title: 'Login.ErrorMessages.InvalidCredentials',
                    description: 'Login.ErrorMessages.InvalidCredentialsDescription',
                },
            ]);
        });

        describe('Inner errors', () => {
            it('Should return value with ApiErrors.AccountLockedOrInvalidPassword code', () => {
                const result = mockUserStore.customerErrorHandler({
                    innerErrors: [{ code: ApiErrors.AccountLockedOrInvalidPassword, message: 'message' }],
                } as ApiError);

                expect(result).toStrictEqual([
                    {
                        title: 'GuestDetails.ErrorMessages.PasswordOrAccountLocked',
                        description: 'GuestDetails.ErrorMessages.PasswordOrAccountLockedDescription',
                    },
                ]);
            });

            it('Should return value with ApiErrors.EmailDoesNotExists code', () => {
                const result = mockUserStore.customerErrorHandler({
                    innerErrors: [{ code: ApiErrors.EmailDoesNotExists, message: 'message' }],
                } as ApiError);

                expect(result).toStrictEqual([
                    {
                        title: 'GuestDetails.ErrorMessages.EmailDoesNotExists',
                        description: 'GuestDetails.ErrorMessages.EmailDoesNotExistsDescription',
                    },
                ]);
            });

            it('Should return value with ApiErrors.EmailAlreadyExists code', () => {
                const result = mockUserStore.customerErrorHandler({
                    innerErrors: [{ code: ApiErrors.EmailAlreadyExists, message: 'message' }],
                } as ApiError);

                expect(result).toStrictEqual([
                    {
                        title: 'GuestDetails.ErrorMessages.EmailExists',
                        description: 'GuestDetails.ErrorMessages.EmailExistsDescription',
                        isFatal: true,
                    },
                ]);
            });

            it('Should return generic value with ApiErrors.WrongDiscount code', () => {
                const result = mockUserStore.customerErrorHandler({
                    innerErrors: [{ code: ApiErrors.WrongDiscount, message: 'message' }],
                } as ApiError);

                expect(result).toStrictEqual([
                    {
                        title: 'GuestDetails.ErrorMessages.GenericCustomerError',
                        description: 'GuestDetails.ErrorMessages.GenericCustomerErrorDescription',
                    },
                ]);
            });

            it('Should return value when no inner errors', () => {
                const result = mockUserStore.customerErrorHandler({
                    errorCode: 'test',
                } as ApiError);

                expect(result).toStrictEqual([
                    {
                        title: 'GuestDetails.ErrorMessages.GenericCustomerError',
                        description: 'GuestDetails.ErrorMessages.GenericCustomerErrorDescription',
                    },
                ]);
            });
        });
    });

    describe('setUserDetails', () => {
        it('should setUserDetails be called once user logged in', async () => {
            mockUserStore.setUserDetails = jest.fn();

            expect(mockUserStore.isLoggedIn).toBe(false);

            mockUserStore.isLoggedIn = true;

            await waitFor(() => {
                expect(mockUserStore.setUserDetails).toHaveBeenCalled();
            });
        });

        it('should correctly set user details', async () => {
            const userStore = new UserStore(rootStore);
            const mocResponse = {};

            const userLoggedInSpy = jest.spyOn(userStore, 'setIsLoggedIn');
            const userDataSpy = jest.spyOn(userStore, 'setUserData');

            UserService.getUserDetails = jest.fn().mockReturnValue(Promise.resolve(mocResponse));

            await userStore.setUserDetails();

            expect(UserService.getUserDetails).toHaveBeenCalled();
            expect(userLoggedInSpy).toHaveBeenCalledWith(true);
            expect(userDataSpy).toHaveBeenCalledWith(mocResponse);
        });

        it('should NOT update user details', async () => {
            const userStore = new UserStore(rootStore);

            const userLoggedInSpy = jest.spyOn(userStore, 'setIsLoggedIn');
            const userDataSpy = jest.spyOn(userStore, 'setUserData');

            UserService.getUserDetails = jest.fn().mockReturnValue(Promise.resolve(null));

            await userStore.setUserDetails();

            expect(UserService.getUserDetails).toHaveBeenCalled();
            expect(userLoggedInSpy).not.toHaveBeenCalled();
            expect(userDataSpy).not.toHaveBeenCalled();
        });

        it('should NOT update user details because it is already exists', async () => {
            const userStore = new UserStore(rootStore);
            userStore.userData = {} as ILoginInfo;

            UserService.getUserDetails = jest.fn().mockReturnValue(Promise.resolve());

            await userStore.setUserDetails();

            expect(UserService.getUserDetails).not.toHaveBeenCalled();
        });
    });

    describe('setLoginTabActive', () => {
        it('should correctly logging tab activity', () => {
            const userStore = new UserStore(rootStore);

            userStore.setLoginTabActive(false);

            expect(userStore.isLoginTabActive).toBe(false);

            userStore.setLoginTabActive(true);

            expect(userStore.isLoginTabActive).toBe(true);
        });
    });

    describe('toggleLoginPopup', () => {
        it('should correctly toggle Login Popup', () => {
            const userStore = new UserStore(rootStore);

            expect(userStore.isLoginPopupShown).toBe(false);

            userStore.toggleLoginPopup();

            expect(userStore.isLoginPopupShown).toBe(true);
        });
    });

    describe('billingInfo', () => {
        it('should return billingInfo', () => {
            const userStore = new UserStore(rootStore);
            const billingInfo = {
                address1: 'address1',
                address2: 'address2',
                city: 'city',
                firstName: 'firstName',
                lastName: 'lastName',
                postalCode: 'postalCode',
            };
            userStore.setUserData(billingInfo as ILoginInfo);

            expect(userStore.billingInfo).toEqual({
                fullName: `${billingInfo.firstName} ${billingInfo.lastName}`,
                address: billingInfo.address1,
                address2: billingInfo.address2,
                city: billingInfo.city,
                postCode: billingInfo.postalCode,
            });
        });

        it('should return undefined if no user data', () => {
            const userStore = new UserStore(rootStore);

            expect(userStore.billingInfo).toBeUndefined();
        });
    });

    describe('getSingleUsePromoCode', () => {
        let userStore: UserStore;

        beforeEach(() => {
            userStore = new UserStore(rootStore);
        });

        it('should call promocode service and return promocode', async () => {
            const loginSpy = jest.spyOn(userStore as any, 'checkIfUserLoggedIn').mockResolvedValue(true);
            const spy = jest.spyOn(promocodeService, 'loadUserPromocode').mockResolvedValue('PROMO123');

            const result = await userStore.getSingleUsePromoCode('campaign-id');

            expect(loginSpy).toHaveBeenCalled();
            expect(spy).toHaveBeenCalledWith('campaign-id');
            expect(result).toBe('PROMO123');
        });

        it('should return null and not call promocode service when user is not logged in', async () => {
            const loginSpy = jest.spyOn(userStore as any, 'checkIfUserLoggedIn').mockResolvedValue(false);
            const promocodeSpy = jest.spyOn(promocodeService, 'loadUserPromocode').mockResolvedValue('PROMO123');

            const result = await userStore.getSingleUsePromoCode('campaign-id');

            expect(loginSpy).toHaveBeenCalled();
            expect(promocodeSpy).not.toHaveBeenCalled();
            expect(result).toBeNull();
        });

        it('should return null and not call promocode service when promo popup was already closed', async () => {
            const loginSpy = jest.spyOn(userStore as any, 'checkIfUserLoggedIn').mockResolvedValue(true);
            const sessionStorageGetItemSpy = jest
                .spyOn(globalThis.sessionStorage, 'getItem')
                .mockReturnValueOnce(JSON.stringify(true));
            const promocodeSpy = jest.spyOn(promocodeService, 'loadUserPromocode').mockResolvedValue('PROMO123');

            const result = await userStore.getSingleUsePromoCode('campaign-id');

            expect(loginSpy).toHaveBeenCalled();
            expect(sessionStorageGetItemSpy).toHaveBeenCalledWith(WebStorageKeys.IsUserPromoClosed);
            expect(promocodeSpy).not.toHaveBeenCalled();
            expect(result).toBeNull();

            sessionStorageGetItemSpy.mockRestore();
        });

        it('should check promo closed flag in sessionStorage when user is logged in', async () => {
            jest.spyOn(userStore as any, 'checkIfUserLoggedIn').mockResolvedValue(true);
            const sessionStorageGetItemSpy = jest.spyOn(globalThis.sessionStorage, 'getItem').mockReturnValueOnce(null);
            const promocodeSpy = jest.spyOn(promocodeService, 'loadUserPromocode').mockResolvedValue('PROMO123');

            const result = await userStore.getSingleUsePromoCode('campaign-id');

            expect(sessionStorageGetItemSpy).toHaveBeenCalledWith(WebStorageKeys.IsUserPromoClosed);
            expect(promocodeSpy).toHaveBeenCalledWith('campaign-id');
            expect(result).toBe('PROMO123');

            sessionStorageGetItemSpy.mockRestore();
        });

        it('should return null when user is logged in and promocode service returns null', async () => {
            jest.spyOn(userStore as any, 'checkIfUserLoggedIn').mockResolvedValue(true);
            jest.spyOn(promocodeService, 'loadUserPromocode').mockResolvedValue(null);

            const result = await userStore.getSingleUsePromoCode('campaign-id');

            expect(result).toBeNull();
        });
    });
});
